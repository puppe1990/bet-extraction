import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql/http";
import { serverEnv } from "#/env.server";
import * as schema from "./schema";

const client = createClient({
	url: serverEnv.TURSO_DATABASE_URL,
	authToken: serverEnv.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
