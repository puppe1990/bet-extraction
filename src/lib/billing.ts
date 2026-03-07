export const billingPlanKeys = ["free", "pro", "pro_plus", "lifetime"] as const;
export const recurringBillingPlanKeys = ["pro", "pro_plus"] as const;
export const billingIntervals = ["month", "year"] as const;
export const subscriptionStatuses = [
	"inactive",
	"trialing",
	"active",
	"past_due",
	"canceled",
	"unpaid",
	"incomplete",
	"incomplete_expired",
] as const;

export type BillingPlanKey = (typeof billingPlanKeys)[number];
export type RecurringBillingPlanKey = (typeof recurringBillingPlanKeys)[number];
export type BillingInterval = (typeof billingIntervals)[number];
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export type BillingPriceCatalog = Record<
	RecurringBillingPlanKey,
	Record<BillingInterval, string | null>
>;

export type BillingFeatureKey = "csv_export" | "extension_capture";

export const defaultBillingSummary = {
	planKey: "free" as BillingPlanKey,
	effectivePlanKey: "free" as BillingPlanKey,
	status: "inactive" as SubscriptionStatus,
	interval: null as BillingInterval | null,
	cancelAtPeriodEnd: false,
	currentPeriodEnd: null as string | null,
	stripeCustomerId: null as string | null,
	stripeSubscriptionId: null as string | null,
	isConfigured: false,
	isPremium: false,
};

export function resolvePlanFromPriceId(
	priceId: string | null | undefined,
	priceCatalog: BillingPriceCatalog,
): { planKey: BillingPlanKey; interval: BillingInterval | null } {
	if (!priceId) {
		return { planKey: "free", interval: null };
	}

	for (const [planKey, intervals] of Object.entries(priceCatalog) as Array<
		[keyof BillingPriceCatalog, BillingPriceCatalog[keyof BillingPriceCatalog]]
	>) {
		for (const [interval, configuredPriceId] of Object.entries(
			intervals,
		) as Array<[BillingInterval, string | null]>) {
			if (configuredPriceId === priceId) {
				return { planKey, interval };
			}
		}
	}

	return { planKey: "free", interval: null };
}

export function hasPaidAccess(
	planKey: BillingPlanKey,
	status: SubscriptionStatus,
): boolean {
	if (planKey === "free") {
		return false;
	}

	if (planKey === "lifetime") {
		return true;
	}

	return status === "active" || status === "trialing";
}

export function getEffectivePlanKey(
	planKey: BillingPlanKey,
	status: SubscriptionStatus,
): BillingPlanKey {
	return hasPaidAccess(planKey, status) ? planKey : "free";
}

export function hasBillingFeatureAccess(
	planKey: BillingPlanKey,
	feature: BillingFeatureKey,
): boolean {
	switch (feature) {
		case "csv_export":
		case "extension_capture":
			return (
				planKey === "pro" || planKey === "pro_plus" || planKey === "lifetime"
			);
		default:
			return false;
	}
}
