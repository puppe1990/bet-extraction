import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { exchangeExtensionConnectionToken } from "#/lib/server/extension.server";

const exchangeSchema = z.object({
	token: z.string().min(1),
	name: z.string().min(1).max(120).default("BankrollKit Chrome Extension"),
});

export const Route = createFileRoute("/api/extension/session/exchange")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const payload = exchangeSchema.parse(await request.json());
					const result = await exchangeExtensionConnectionToken(payload);
					return Response.json(result);
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Extension exchange failed.";
					return Response.json({ error: message }, { status: 400 });
				}
			},
		},
	},
});
