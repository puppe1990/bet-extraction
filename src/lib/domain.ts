export const betStatuses = [
	"open",
	"win",
	"loss",
	"void",
	"cashout",
	"half_win",
	"half_loss",
] as const;

export type BetStatus = (typeof betStatuses)[number];

export const settledBetStatuses = betStatuses.filter(
	(status) => status !== "open",
) as Exclude<BetStatus, "open">[];

export const bankrollTransactionTypes = [
	"deposit",
	"withdraw",
	"adjustment",
	"bet_open",
	"bet_settlement",
] as const;

export type BankrollTransactionType = (typeof bankrollTransactionTypes)[number];

export type BetOutcomeTone = "green" | "red" | "neutral" | "open";

export function isSettledStatus(
	status: BetStatus,
): status is Exclude<BetStatus, "open"> {
	return status !== "open";
}

export function getOutcomeTone(status: BetStatus): BetOutcomeTone {
	return getOutcomeToneFromProfit(status);
}

export function getOutcomeToneFromProfit(
	status: BetStatus,
	profitAmount?: number | null,
): BetOutcomeTone {
	if (status === "open") return "open";
	if (status === "void") return "neutral";
	if (status === "cashout") {
		if (profitAmount == null || profitAmount === 0) return "neutral";
		return profitAmount > 0 ? "green" : "red";
	}
	if (status === "win" || status === "half_win") return "green";
	return "red";
}

export function statusLabel(status: BetStatus) {
	switch (status) {
		case "cashout":
			return "Cashout";
		case "half_win":
			return "Half win";
		case "half_loss":
			return "Half loss";
		default:
			return status;
	}
}
