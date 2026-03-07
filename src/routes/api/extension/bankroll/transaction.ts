import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
	addBankrollTransactionFromExtension,
	requireExtensionSessionFromRequest,
} from "#/lib/server/extension.server";

const transactionSchema = z.object({
	type: z.enum(["deposit", "withdraw", "adjustment"]),
	amount: z.number().positive(),
	note: z.string().optional(),
	occurredAt: z.string().optional(),
});

export const Route = createFileRoute("/api/extension/bankroll/transaction")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const session = await requireExtensionSessionFromRequest(request);
					const payload = transactionSchema.parse(await request.json());
					const summary = await addBankrollTransactionFromExtension({
						userId: session.user.id,
						...payload,
					});
					return Response.json({ summary });
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Bankroll transaction failed.";
					return Response.json({ error: message }, { status: 400 });
				}
			},
		},
	},
});
