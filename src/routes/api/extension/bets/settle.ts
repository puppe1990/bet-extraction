import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
	requireExtensionSessionFromRequest,
	settleBetFromExtension,
} from "#/lib/server/extension.server";

const settleSchema = z.object({
	betId: z.string().min(1),
	status: z.enum(["win", "loss", "void", "cashout", "half_win", "half_loss"]),
	customReturnAmount: z.number().nonnegative().optional(),
});

export const Route = createFileRoute("/api/extension/bets/settle")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const session = await requireExtensionSessionFromRequest(request);
					const payload = settleSchema.parse(await request.json());
					const bet = await settleBetFromExtension({
						userId: session.user.id,
						...payload,
					});
					return Response.json({ bet });
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Bet settlement failed.";
					return Response.json({ error: message }, { status: 400 });
				}
			},
		},
	},
});
