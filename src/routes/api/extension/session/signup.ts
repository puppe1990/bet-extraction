import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { signupExtensionWithPassword } from "#/lib/server/extension.server";

const signupSchema = z
	.object({
		email: z.string().email(),
		password: z.string().min(8),
		confirmPassword: z.string().min(8),
		name: z.string().min(1).max(120).default("Ledger Chrome Extension"),
	})
	.refine((input) => input.password === input.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});

export const Route = createFileRoute("/api/extension/session/signup")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const payload = signupSchema.parse(await request.json());
					const result = await signupExtensionWithPassword(payload);
					return Response.json(result);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Extension signup failed.";
					return Response.json({ error: message }, { status: 400 });
				}
			},
		},
	},
});
