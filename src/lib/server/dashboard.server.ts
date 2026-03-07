import { buildBetMetrics } from "#/lib/bets";
import { getOutcomeToneFromProfit } from "#/lib/domain";
import { getBankrollCurve, getBankrollSummary } from "./bankroll.server";
import { listRecentBets } from "./bets.server";

export async function getDashboardMetrics(userId: string) {
	const [summary, bets, curve] = await Promise.all([
		getBankrollSummary(userId),
		listRecentBets(userId),
		getBankrollCurve(userId),
	]);

	const settled = bets
		.filter(
			(bet) =>
				bet.status !== "open" && bet.profitAmount != null && bet.settledAt,
		)
		.map((bet) => ({
			status: bet.status as Exclude<typeof bet.status, "open">,
			stake: bet.stakeAmount,
			profit: bet.profitAmount ?? 0,
			settledAt: bet.settledAt ?? bet.placedAt,
		}));

	const metrics = buildBetMetrics(settled);
	const recentBets = bets.slice(0, 6);

	return {
		balance: summary.account.currentBalance,
		netProfit: metrics.totalProfit,
		roi: metrics.roi,
		yield: metrics.yield,
		winRate: metrics.winRate,
		settledCount: metrics.settledCount,
		currentStreak: metrics.currentStreak,
		bestStreaks: metrics.bestStreaks,
		curve,
		recentBets: recentBets.map((bet) => ({
			id: bet.id,
			eventName: bet.eventName,
			bookmaker: bet.bookmaker,
			placedAt: bet.placedAt,
			status: bet.status,
			stakeAmount: bet.stakeAmount,
			profitAmount: bet.profitAmount,
			tone: getOutcomeToneFromProfit(bet.status, bet.profitAmount),
		})),
	};
}
