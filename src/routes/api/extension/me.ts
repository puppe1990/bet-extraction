import { createFileRoute } from "@tanstack/react-router";
import {
	getExtensionMe,
	requireExtensionSessionFromRequest,
} from "#/lib/server/extension.server";

export const Route = createFileRoute("/api/extension/me")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const session = await requireExtensionSessionFromRequest(request);
					const token = request.headers
						.get("authorization")
						?.replace("Bearer ", "")
						.trim();

					if (!token) {
						return Response.json(
							{ error: "Missing extension bearer token." },
							{ status: 401 },
						);
					}

					const me = await getExtensionMe(token);
					return Response.json({
						user: me.user,
						device: {
							id: session.id,
							name: session.name,
							expiresAt: session.expiresAt,
						},
					});
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Extension auth failed.";
					return Response.json({ error: message }, { status: 401 });
				}
			},
		},
	},
});
