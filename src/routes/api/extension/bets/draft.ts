import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
	createDraftPreviewFromExtension,
	requireExtensionSessionFromRequest,
} from "#/lib/server/extension.server";

const draftSchema = z.object({
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

export const Route = createFileRoute("/api/extension/bets/draft")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const session = await requireExtensionSessionFromRequest(request);
					const payload = draftSchema.parse(await request.json());
					const draft = await createDraftPreviewFromExtension({
						userId: session.user.id,
						draft: payload,
					});
					return Response.json(draft);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Draft preview failed.";
					return Response.json({ error: message }, { status: 400 });
				}
			},
		},
	},
});
