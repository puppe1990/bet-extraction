import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db/index";
import { sql } from "drizzle-orm";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				try {
					await db.run(sql`select 1`);
					return Response.json({
						ok: true,
						service: "ledger",
						timestamp: new Date().toISOString(),
					});
				} catch (error) {
					return Response.json(
						{
							ok: false,
							service: "ledger",
							timestamp: new Date().toISOString(),
							error:
								error instanceof Error ? error.message : "Healthcheck failed.",
						},
						{ status: 500 },
					);
				}
			},
		},
	},
});
