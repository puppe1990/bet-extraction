import type { BetStatus } from "./domain";
import { getOutcomeToneFromProfit } from "./domain";

export type BetSettlementPreview = {
	grossReturn: number;
	profit: number;
};

export function calculateSettlementAmounts(
	stake: number,
	oddsDecimal: number,
	status: Exclude<BetStatus, "open">,
	customReturnAmount?: number,
): BetSettlementPreview {
	switch (status) {
		case "win": {
			const grossReturn = stake * oddsDecimal;
			return {
				grossReturn,
				profit: grossReturn - stake,
			};
		}
		case "loss":
			return { grossReturn: 0, profit: -stake };
		case "void":
			return { grossReturn: stake, profit: 0 };
		case "cashout": {
			const grossReturn = customReturnAmount ?? 0;
			return { grossReturn, profit: grossReturn - stake };
		}
		case "half_win": {
			const grossReturn = (stake / 2) * oddsDecimal + stake / 2;
			return {
				grossReturn,
				profit: grossReturn - stake,
			};
		}
		case "half_loss":
			return { grossReturn: stake / 2, profit: -stake / 2 };
	}
}

type SettledMetricsInput = {
	status: Exclude<BetStatus, "open">;
	stake: number;
	profit: number;
	settledAt: string;
};

export function buildBetMetrics(bets: SettledMetricsInput[]) {
	const settledBets = [...bets].sort((a, b) =>
		a.settledAt.localeCompare(b.settledAt),
	);
	const totalProfit = settledBets.reduce((sum, bet) => sum + bet.profit, 0);
	const totalStake = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
	const roi = totalStake === 0 ? 0 : totalProfit / totalStake;
	const yieldValue = totalStake === 0 ? 0 : totalProfit / totalStake;

	let wins = 0;
	let currentStreak = 0;
	let bestGreenStreak = 0;
	let bestRedStreak = 0;
	let currentStreakTone: "green" | "red" | "neutral" | null = null;

	for (const bet of settledBets) {
		const tone = getOutcomeToneFromProfit(bet.status, bet.profit);
		if (tone === "green") wins += 1;
		if (tone === "neutral") {
			currentStreak = 0;
			currentStreakTone = null;
			continue;
		}

		if (currentStreakTone === tone) {
			currentStreak += 1;
		} else {
			currentStreak = 1;
			currentStreakTone = tone;
		}

		if (tone === "green") {
			bestGreenStreak = Math.max(bestGreenStreak, currentStreak);
		} else {
			bestRedStreak = Math.max(bestRedStreak, currentStreak);
		}
	}

	return {
		totalProfit,
		totalStake,
		winRate: settledBets.length === 0 ? 0 : wins / settledBets.length,
		roi,
		yield: yieldValue,
		settledCount: settledBets.length,
		currentStreak:
			currentStreakTone == null
				? null
				: { tone: currentStreakTone, length: currentStreak },
		bestStreaks: {
			green: bestGreenStreak,
			red: bestRedStreak,
		},
	};
}

export function parseTagInput(value: string) {
	return [
		...new Set(
			value
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean),
		),
	];
}
