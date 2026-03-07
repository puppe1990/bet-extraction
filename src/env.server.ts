import { config } from "dotenv";
import { z } from "zod";

config({ path: [".env.local", ".env"] });

const optionalNonEmptyString = z.preprocess(
	(value) => {
		if (typeof value === "string" && value.trim() === "") {
			return undefined;
		}

	return value;
	},
	z.string().min(1).optional(),
);

const optionalUrlString = z.preprocess(
	(value) => {
		if (typeof value === "string" && value.trim() === "") {
			return undefined;
		}

		return value;
	},
	z.string().url().optional(),
);

const serverEnvSchema = z
	.object({
		TURSO_DATABASE_URL: z.string().min(1).default("file:local.db"),
		TURSO_AUTH_TOKEN: optionalNonEmptyString,
		SESSION_COOKIE_SECRET: z.string().min(16).default(
			"dev-session-secret-1234",
		),
		BOOTSTRAP_EMAIL: z.string().email().optional(),
		BOOTSTRAP_PASSWORD: z.string().min(8).optional(),
		APP_URL: optionalUrlString.default("http://localhost:3000"),
		STRIPE_SECRET_KEY: optionalNonEmptyString,
		STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
		STRIPE_PRO_MONTHLY_PRICE_ID: optionalNonEmptyString,
		STRIPE_PRO_YEARLY_PRICE_ID: optionalNonEmptyString,
		STRIPE_PRO_PLUS_MONTHLY_PRICE_ID: optionalNonEmptyString,
		STRIPE_PRO_PLUS_YEARLY_PRICE_ID: optionalNonEmptyString,
	})
	.superRefine((env, ctx) => {
		if (
			!env.TURSO_DATABASE_URL.startsWith("file:") &&
			!env.TURSO_AUTH_TOKEN
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["TURSO_AUTH_TOKEN"],
				message: "TURSO_AUTH_TOKEN is required for remote Turso databases.",
			});
		}
	});

export const serverEnv = serverEnvSchema.parse(
	typeof process !== "undefined" ? process.env : {},
);
