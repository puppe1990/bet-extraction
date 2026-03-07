import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const clientEnv = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_APP_TITLE: z.string().min(1).default("Ledger"),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
