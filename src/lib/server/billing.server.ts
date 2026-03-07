import { randomUUID } from "node:crypto";
import { and, count, eq, gte, lt } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "#/db";
import {
	bankrollAccounts,
	bets,
	billingSubscriptions,
	users,
} from "#/db/schema";
import { serverEnv } from "#/env.server";
import { nowIso } from "#/lib/auth";
import {
	type BillingFeatureKey,
	type BillingInterval,
	type BillingPlanKey,
	type RecurringBillingPlanKey,
	defaultBillingSummary,
	getEffectivePlanKey,
	hasBillingFeatureAccess,
	hasPaidAccess,
	resolvePlanFromPriceId,
} from "#/lib/billing";

let stripeClient: Stripe | null = null;
export const FREE_PLAN_MONTHLY_BET_LIMIT = 50;

function getStripeClient() {
	if (!serverEnv.STRIPE_SECRET_KEY) {
		throw new Error("Stripe billing is not configured.");
	}

	if (!stripeClient) {
		stripeClient = new Stripe(serverEnv.STRIPE_SECRET_KEY);
	}

	return stripeClient;
}

export function constructStripeWebhookEvent(
	payload: string,
	signature: string,
) {
	if (!serverEnv.STRIPE_SECRET_KEY || !serverEnv.STRIPE_WEBHOOK_SECRET) {
		throw new Error("Stripe webhook is not configured.");
	}

	const stripe = getStripeClient();
	return stripe.webhooks.constructEvent(
		payload,
		signature,
		serverEnv.STRIPE_WEBHOOK_SECRET,
	);
}

export function getBillingPriceCatalog() {
	return {
		pro: {
			month: serverEnv.STRIPE_PRO_MONTHLY_PRICE_ID ?? null,
			year: serverEnv.STRIPE_PRO_YEARLY_PRICE_ID ?? null,
		},
		pro_plus: {
			month: serverEnv.STRIPE_PRO_PLUS_MONTHLY_PRICE_ID ?? null,
			year: serverEnv.STRIPE_PRO_PLUS_YEARLY_PRICE_ID ?? null,
		},
	} as const;
}

export function isBillingConfigured() {
	const catalog = getBillingPriceCatalog();
	return Boolean(
		serverEnv.STRIPE_SECRET_KEY &&
			catalog.pro.month &&
			catalog.pro.year &&
			catalog.pro_plus.month &&
			catalog.pro_plus.year,
	);
}

export async function getBillingSummary(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: {
			billingSubscription: true,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	const usage = await getMonthlyBetUsage(userId);

	const subscription = user.billingSubscription;
	if (!subscription) {
		return {
			...defaultBillingSummary,
			stripeCustomerId: user.stripeCustomerId,
			isConfigured: isBillingConfigured(),
			canExportCsv: false,
			canUseExtensionCapture: false,
			monthlyBetLimit: FREE_PLAN_MONTHLY_BET_LIMIT,
			monthlyBetsUsed: usage,
			monthlyBetsRemaining: Math.max(FREE_PLAN_MONTHLY_BET_LIMIT - usage, 0),
		};
	}

	const isPremium = hasPaidAccess(
		subscription.planKey as BillingPlanKey,
		subscription.status,
	);
	const effectivePlanKey = getEffectivePlanKey(
		subscription.planKey as BillingPlanKey,
		subscription.status,
	);

	return {
		planKey: subscription.planKey as BillingPlanKey,
		effectivePlanKey,
		status: subscription.status,
		interval: subscription.interval as BillingInterval | null,
		cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
		currentPeriodEnd: subscription.currentPeriodEnd,
		stripeCustomerId: subscription.stripeCustomerId,
		stripeSubscriptionId: subscription.stripeSubscriptionId,
		isConfigured: isBillingConfigured(),
		isPremium,
		canExportCsv: hasBillingFeatureAccess(effectivePlanKey, "csv_export"),
		canUseExtensionCapture: hasBillingFeatureAccess(
			effectivePlanKey,
			"extension_capture",
		),
		monthlyBetLimit:
			effectivePlanKey === "free" ? FREE_PLAN_MONTHLY_BET_LIMIT : null,
		monthlyBetsUsed: usage,
		monthlyBetsRemaining:
			effectivePlanKey === "free"
				? Math.max(FREE_PLAN_MONTHLY_BET_LIMIT - usage, 0)
				: null,
	};
}

function getCurrentMonthWindowUtc() {
	const now = new Date();
	const start = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
	);
	const nextStart = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
	);

	return {
		startIso: start.toISOString(),
		nextStartIso: nextStart.toISOString(),
	};
}

export async function getMonthlyBetUsage(userId: string) {
	const { startIso, nextStartIso } = getCurrentMonthWindowUtc();
	const [row] = await db
		.select({ value: count() })
		.from(bets)
		.innerJoin(bankrollAccounts, eq(bets.accountId, bankrollAccounts.id))
		.where(
			and(
				eq(bankrollAccounts.userId, userId),
				gte(bets.placedAt, startIso),
				lt(bets.placedAt, nextStartIso),
			),
		);

	return row?.value ?? 0;
}

export async function assertCanCreateBet(userId: string) {
	const billing = await getBillingSummary(userId);
	if (billing.isPremium) {
		return billing;
	}

	if (
		billing.effectivePlanKey === "free" &&
		billing.monthlyBetLimit != null &&
		billing.monthlyBetsUsed >= billing.monthlyBetLimit
	) {
		throw new Error(
			"Free plan limit reached. Upgrade to Pro to log unlimited bets this month.",
		);
	}

	return billing;
}

export async function assertBillingFeatureAccess(
	userId: string,
	feature: BillingFeatureKey,
) {
	const billing = await getBillingSummary(userId);
	const allowed = hasBillingFeatureAccess(billing.effectivePlanKey, feature);

	if (!allowed) {
		if (feature === "csv_export") {
			throw new Error("CSV export is available on Pro and Pro+ only.");
		}

		if (feature === "extension_capture") {
			throw new Error(
				"Chrome extension capture is available on Pro and Pro+ only.",
			);
		}
	}

	return billing;
}

async function ensureStripeCustomerForUser(userId: string, email: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		throw new Error("User not found.");
	}

	if (user.stripeCustomerId) {
		return user.stripeCustomerId;
	}

	const stripe = getStripeClient();
	const customer = await stripe.customers.create({
		email,
		metadata: {
			userId,
		},
	});

	await db
		.update(users)
		.set({ stripeCustomerId: customer.id })
		.where(eq(users.id, userId));

	return customer.id;
}

function getPriceIdForPlan(
	planKey: RecurringBillingPlanKey,
	interval: BillingInterval,
) {
	const catalog = getBillingPriceCatalog();
	const priceId = catalog[planKey][interval];

	if (!priceId) {
		throw new Error("This Stripe price is not configured.");
	}

	return priceId;
}

export async function createCheckoutSessionForUser(input: {
	userId: string;
	email: string;
	planKey: RecurringBillingPlanKey;
	interval: BillingInterval;
}) {
	if (!isBillingConfigured()) {
		throw new Error("Stripe billing is not configured.");
	}

	const stripe = getStripeClient();
	const priceId = getPriceIdForPlan(input.planKey, input.interval);
	const customerId = await ensureStripeCustomerForUser(
		input.userId,
		input.email,
	);
	const appUrl = serverEnv.APP_URL ?? "http://localhost:3000";

	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		customer: customerId,
		line_items: [
			{
				price: priceId,
				quantity: 1,
			},
		],
		success_url: `${appUrl}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${appUrl}/settings?billing=canceled`,
		allow_promotion_codes: true,
		client_reference_id: input.userId,
		metadata: {
			userId: input.userId,
			planKey: input.planKey,
			interval: input.interval,
		},
	});

	if (!session.url) {
		throw new Error("Stripe did not return a Checkout URL.");
	}

	return { url: session.url };
}

export async function createBillingPortalSessionForUser(input: {
	userId: string;
	email: string;
}) {
	if (!serverEnv.STRIPE_SECRET_KEY) {
		throw new Error("Stripe billing is not configured.");
	}

	const stripe = getStripeClient();
	const customerId = await ensureStripeCustomerForUser(
		input.userId,
		input.email,
	);
	const appUrl = serverEnv.APP_URL ?? "http://localhost:3000";
	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${appUrl}/settings`,
	});

	return { url: session.url };
}

type StripeSubscriptionLike = Pick<
	Stripe.Subscription,
	| "id"
	| "status"
	| "cancel_at_period_end"
	| "current_period_end"
	| "customer"
	| "items"
>;

export async function syncStripeSubscriptionToDatabase(input: {
	userId: string;
	customerId: string;
	subscription: StripeSubscriptionLike;
}) {
	const firstItem = input.subscription.items.data[0];
	const priceId = firstItem?.price?.id ?? null;
	const product =
		typeof firstItem?.price?.product === "string"
			? firstItem.price.product
			: (firstItem?.price?.product?.id ?? null);
	const resolved = resolvePlanFromPriceId(priceId, getBillingPriceCatalog());
	const existing = await db.query.billingSubscriptions.findFirst({
		where: eq(billingSubscriptions.userId, input.userId),
	});

	const payload = {
		userId: input.userId,
		stripeCustomerId: input.customerId,
		stripeSubscriptionId: input.subscription.id,
		stripePriceId: priceId,
		stripeProductId: product,
		planKey: resolved.planKey,
		status: input.subscription.status,
		interval: resolved.interval,
		currentPeriodEnd: input.subscription.current_period_end
			? new Date(input.subscription.current_period_end * 1000).toISOString()
			: null,
		cancelAtPeriodEnd: input.subscription.cancel_at_period_end,
		createdAt: nowIso(),
	};

	await db
		.update(users)
		.set({ stripeCustomerId: input.customerId })
		.where(eq(users.id, input.userId));

	if (existing) {
		await db
			.update(billingSubscriptions)
			.set(payload)
			.where(eq(billingSubscriptions.userId, input.userId));
		return;
	}

	await db.insert(billingSubscriptions).values({
		id: randomUUID(),
		...payload,
	});
}

export async function markBillingSubscriptionCanceled(
	customerId: string,
	subscriptionId: string,
) {
	const existing = await db.query.billingSubscriptions.findFirst({
		where: and(
			eq(billingSubscriptions.stripeCustomerId, customerId),
			eq(billingSubscriptions.stripeSubscriptionId, subscriptionId),
		),
	});

	if (!existing) {
		return;
	}

	await db
		.update(billingSubscriptions)
		.set({
			status: "canceled",
			cancelAtPeriodEnd: true,
			currentPeriodEnd: existing.currentPeriodEnd,
		})
		.where(eq(billingSubscriptions.id, existing.id));
}

export async function syncCheckoutSessionCompletion(
	session: Stripe.Checkout.Session,
) {
	const userId =
		typeof session.client_reference_id === "string"
			? session.client_reference_id
			: session.metadata?.userId;
	const customerId =
		typeof session.customer === "string"
			? session.customer
			: session.customer?.id;
	const subscriptionId =
		typeof session.subscription === "string"
			? session.subscription
			: session.subscription?.id;

	if (!userId || !customerId) {
		return;
	}

	await db
		.update(users)
		.set({ stripeCustomerId: customerId })
		.where(eq(users.id, userId));

	if (!subscriptionId) {
		return;
	}

	const stripe = getStripeClient();
	const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
		expand: ["items.data.price.product"],
	});

	await syncStripeSubscriptionToDatabase({
		userId,
		customerId,
		subscription,
	});
}

export async function findUserIdByStripeCustomerId(customerId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.stripeCustomerId, customerId),
	});

	return user?.id ?? null;
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
	switch (event.type) {
		case "checkout.session.completed": {
			await syncCheckoutSessionCompletion(
				event.data.object as Stripe.Checkout.Session,
			);
			return;
		}
		case "customer.subscription.created":
		case "customer.subscription.updated": {
			const subscription = event.data.object as Stripe.Subscription;
			const customerId =
				typeof subscription.customer === "string"
					? subscription.customer
					: subscription.customer.id;
			const userId = await findUserIdByStripeCustomerId(customerId);

			if (!userId) {
				return;
			}

			await syncStripeSubscriptionToDatabase({
				userId,
				customerId,
				subscription,
			});
			return;
		}
		case "customer.subscription.deleted": {
			const subscription = event.data.object as Stripe.Subscription;
			const customerId =
				typeof subscription.customer === "string"
					? subscription.customer
					: subscription.customer.id;
			await markBillingSubscriptionCanceled(customerId, subscription.id);
			return;
		}
		default:
			return;
	}
}
