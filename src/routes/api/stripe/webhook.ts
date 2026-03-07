import { createFileRoute } from "@tanstack/react-router";
import {
	constructStripeWebhookEvent,
	processStripeWebhookEvent,
} from "#/lib/server/billing.server";

export const Route = createFileRoute("/api/stripe/webhook")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const signature = request.headers.get("stripe-signature");
				if (!signature) {
					return new Response("Missing Stripe signature.", { status: 400 });
				}

				const payload = await request.text();

				try {
					const event = constructStripeWebhookEvent(payload, signature);
					await processStripeWebhookEvent(event);
					return Response.json({ received: true });
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Webhook processing failed.";
					return new Response(message, { status: 400 });
				}
			},
		},
	},
});
