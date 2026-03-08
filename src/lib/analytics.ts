export const productEventNames = [
	"landing_cta_clicked",
	"upgrade_cta_clicked",
	"signup_completed",
	"login_completed",
	"dashboard_viewed",
	"paywall_viewed",
	"premium_feature_blocked",
	"first_bet_created",
	"bet_created",
	"extension_login_success",
	"extension_signup_success",
	"extension_draft_captured",
	"extension_bet_saved",
	"upgrade_checkout_started",
	"checkout_completed",
	"checkout_canceled",
	"portal_opened",
] as const;

export type ProductEventName = (typeof productEventNames)[number];

export const productEventSources = ["web", "extension", "server"] as const;

export type ProductEventSource = (typeof productEventSources)[number];

export type ProductEventProperties = Record<
	string,
	string | number | boolean | null | undefined
>;

const ANONYMOUS_ID_KEY = "bankrollkit_anon_id";

export function getAnonymousAnalyticsId() {
	if (typeof window === "undefined") {
		return null;
	}

	const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
	if (existing) {
		return existing;
	}

	const created = window.crypto?.randomUUID?.() ?? `anon_${Date.now()}`;
	window.localStorage.setItem(ANONYMOUS_ID_KEY, created);
	return created;
}
