import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
	createBetFromExtension,
	requireExtensionSessionFromRequest,
} from "#/lib/server/extension.server";

const createSchema = z.object({
	sport: z.string().min(1),
	market: z.string().min(1),
	eventName: z.string().min(1),
	selection: z.string().min(1),
	bookmaker: z.string().min(1),
	oddsDecimal: z.number().positive().optional(),
	stakeAmount: z.number().positive().optional(),
	placedAt: z.string().optional(),
	note: z.string().optional(),
	tags: z.array(z.string()).optional(),
	rawSourceUrl: z.string().url().optional(),
	parserConfidence: z.enum(["high", "medium", "low"]).optional(),
});

export const Route = createFileRoute("/api/extension/bets/create")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const session = await requireExtensionSessionFromRequest(request);
					const payload = createSchema.parse(await request.json());
					const bet = await createBetFromExtension({
						userId: session.user.id,
						draft: payload,
					});
					return Response.json({ bet });
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Bet creation failed.";
					return Response.json({ error: message }, { status: 400 });
				}
			},
		},
	},
});
