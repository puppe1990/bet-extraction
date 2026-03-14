import { build as bundle } from "esbuild";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(rootDir, "dist", "client");
const outputDir = path.join(rootDir, ".amplify-hosting");
const staticDir = path.join(outputDir, "static");
const computeDir = path.join(outputDir, "compute", "default");
const serverEntry = path.join(rootDir, "dist", "server", "server.js");

const wrapperSource = `
import http from "node:http";
import app from ${JSON.stringify(serverEntry)};

function toHeaders(nodeHeaders) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, String(item));
      }
      continue;
    }

    if (typeof value !== "undefined") {
      headers.set(key, String(value));
    }
  }

  return headers;
}

function hasRequestBody(method) {
  return !["GET", "HEAD"].includes((method || "GET").toUpperCase());
}

async function readBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

const server = http.createServer(async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", protocol + "://" + host);
    const body = hasRequestBody(req.method) ? await readBody(req) : undefined;
    const request = new Request(url, {
      method: req.method,
      headers: toHeaders(req.headers),
      body,
    });

    const response = await app.fetch(request);

    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!response.body) {
      res.end();
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Amplify server wrapper failed", error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, "0.0.0.0");
`;

const deployManifest = {
  version: 1,
  routes: [
    {
      path: "/*.*",
      target: { kind: "Static" },
      fallback: { kind: "Compute", src: "default" },
    },
    {
      path: "/*",
      target: { kind: "Compute", src: "default" },
    },
  ],
  computeResources: [
    {
      name: "default",
      runtime: "nodejs20.x",
      entrypoint: "server.cjs",
    },
  ],
  framework: {
    name: "tanstack-start",
    version: "1.0.0",
  },
};

await rm(outputDir, { recursive: true, force: true });
await mkdir(staticDir, { recursive: true });
await mkdir(computeDir, { recursive: true });
await cp(clientDir, staticDir, { recursive: true });

const tempEntryPath = path.join(tmpdir(), `bankrollkit-amplify-entry-${Date.now()}.mjs`);
await writeFile(tempEntryPath, wrapperSource, "utf8");

await bundle({
  entryPoints: [tempEntryPath],
  outfile: path.join(computeDir, "server.cjs"),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  sourcemap: false,
  minify: false,
});

await writeFile(path.join(outputDir, "deploy-manifest.json"), JSON.stringify(deployManifest, null, 2));
