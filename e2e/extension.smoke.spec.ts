import { chromium, expect, test } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const extensionPath = path.resolve(process.cwd(), "extension");
const appUrl = process.env.E2E_EXTENSION_APP_URL ?? "https://bet-extraction.netlify.app";

test("production healthcheck responds", async ({ request }) => {
	const response = await request.get(`${appUrl}/api/health`);
	expect(response.ok()).toBeTruthy();
});

test("extension popup login smoke", async () => {
	test.skip(
		!(
			process.env.E2E_EXTENSION_EMAIL &&
			process.env.E2E_EXTENSION_PASSWORD
		),
		"Set E2E_EXTENSION_EMAIL and E2E_EXTENSION_PASSWORD to run extension auth smoke.",
	);

	const userDataDir = mkdtempSync(path.join(os.tmpdir(), "ledger-extension-"));
	const context = await chromium.launchPersistentContext(userDataDir, {
		headless: false,
		args: [
			`--disable-extensions-except=${extensionPath}`,
			`--load-extension=${extensionPath}`,
		],
	});

	try {
		let [serviceWorker] = context.serviceWorkers();
		if (!serviceWorker) {
			serviceWorker = await context.waitForEvent("serviceworker");
		}

		const extensionId = serviceWorker.url().split("/")[2];
		const page = await context.newPage();
		await page.goto(`chrome-extension://${extensionId}/popup.html`);

		await page.getByLabel("Ledger app URL").fill(appUrl);
		await page.getByLabel("Email").fill(process.env.E2E_EXTENSION_EMAIL ?? "");
		await page.getByLabel("Password").fill(
			process.env.E2E_EXTENSION_PASSWORD ?? "",
		);
		await page.getByRole("button", { name: "Sign in" }).click();

		await expect(page.locator("#device-panel")).toBeVisible();
		await expect(page.locator("#home-balance")).not.toHaveText("-");
	} finally {
		await context.close();
		rmSync(userDataDir, { recursive: true, force: true });
	}
});
