import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { loginExtensionWithPassword } from "#/lib/server/extension.server";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().min(1).max(120).default("BankrollKit Chrome Extension"),
});

export const Route = createFileRoute("/api/extension/session/login")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const payload = loginSchema.parse(await request.json());
					const result = await loginExtensionWithPassword(payload);
					return Response.json(result);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Extension login failed.";
					const status = message === "Invalid email or password." ? 401 : 400;
					return Response.json({ error: message }, { status });
				}
			},
		},
	},
});
