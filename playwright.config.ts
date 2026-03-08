import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	timeout: 45_000,
	expect: {
		timeout: 10_000,
	},
	use: {
		baseURL: process.env.E2E_EXTENSION_APP_URL ?? "https://bankrollkit.netlify.app",
		trace: "retain-on-failure",
	},
});
