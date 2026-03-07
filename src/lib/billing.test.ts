import { describe, expect, it } from "vitest";
import { hasPaidAccess, resolvePlanFromPriceId } from "./billing";

describe("resolvePlanFromPriceId", () => {
	it("maps Stripe price ids to local plans", () => {
		expect(
			resolvePlanFromPriceId("price_pro_monthly", {
				pro: {
					month: "price_pro_monthly",
					year: "price_pro_yearly",
				},
				pro_plus: {
					month: "price_plus_monthly",
					year: "price_plus_yearly",
				},
			}),
		).toEqual({
			planKey: "pro",
			interval: "month",
		});
	});

	it("falls back to free when a price id is unknown", () => {
		expect(
			resolvePlanFromPriceId("price_unknown", {
				pro: {
					month: "price_pro_monthly",
					year: "price_pro_yearly",
				},
				pro_plus: {
					month: "price_plus_monthly",
					year: "price_plus_yearly",
				},
			}),
		).toEqual({
			planKey: "free",
			interval: null,
		});
	});
});

describe("hasPaidAccess", () => {
	it("only grants premium access for active or trialing paid plans", () => {
		expect(hasPaidAccess("pro", "active")).toBe(true);
		expect(hasPaidAccess("pro_plus", "trialing")).toBe(true);
		expect(hasPaidAccess("pro", "past_due")).toBe(false);
		expect(hasPaidAccess("free", "active")).toBe(false);
	});
});
