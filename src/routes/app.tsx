import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Gauge,
	LockKeyhole,
	Sparkles,
	TrendingUp,
} from "lucide-react";
import { BankrollChart } from "#/components/BankrollChart";
import { EmptyState } from "#/components/EmptyState";
import { StatCard } from "#/components/StatCard";
import { StatusBadge } from "#/components/StatusBadge";
import { DateTimeText } from "#/lib/datetime";
import { useI18n } from "#/lib/i18n";
import { formatCurrency, formatNumber } from "#/lib/money";
import {
	dashboardQueryOptions,
	sessionQueryOptions,
} from "#/lib/query-options";
import { authSession } from "#/lib/server-functions";

export const Route = createFileRoute("/app")({
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { t } = useI18n();
	const dashboardQuery = useQuery(dashboardQueryOptions());
	const session = useQuery(sessionQueryOptions());

	if (dashboardQuery.isLoading || !dashboardQuery.data) {
		return (
			<main className="page-wrap py-10">
				<div className="grid gap-4 lg:grid-cols-4">
					{["balance", "profit", "roi", "winrate"].map((key) => (
						<div
							key={key}
							className="panel-card h-40 animate-pulse bg-white/4"
						/>
					))}
				</div>
			</main>
		);
	}

	const metrics = dashboardQuery.data;

	return (
		<main className="page-wrap py-10">
			<section className="hero-panel">
				<div className="space-y-5">
					<div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-amber-100">
						<Sparkles className="size-3.5" />
						{t("app.activeAccount")}
					</div>
					<div className="max-w-3xl space-y-4">
						<h1 className="text-4xl leading-none font-semibold tracking-tight text-white sm:text-6xl">
							{t("app.title")}
						</h1>
						<p className="max-w-2xl text-base text-zinc-300 sm:text-lg">
							{t("app.description")}
						</p>
					</div>
				</div>
				<div className="hero-aside">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							{t("app.session")}
						</p>
						<p className="mt-2 text-lg font-semibold text-zinc-100">
							{session.data?.user.email}
						</p>
					</div>
					<div className="space-y-3">
						<Link to="/bets/new" className="cta-primary no-underline">
							{t("app.newBet")}
							<ArrowUpRight className="size-4" />
						</Link>
						<Link to="/bankroll" className="cta-secondary no-underline">
							{t("app.moveBankroll")}
						</Link>
					</div>
				</div>
			</section>

			<section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard label={t("app.currentBalance")} value={formatCurrency(metrics.balance)} />
				<StatCard
					label={t("app.netProfit")}
					value={formatCurrency(metrics.netProfit)}
					tone={metrics.netProfit >= 0 ? "green" : "red"}
				/>
				<StatCard
					label="ROI"
					value={`${formatNumber(metrics.roi * 100)}%`}
					caption={t("app.settledBets", { count: metrics.settledCount })}
				/>
				<StatCard
					label="Win rate"
					value={`${formatNumber(metrics.winRate * 100)}%`}
					caption={
						metrics.currentStreak
							? t("app.currentStreak", {
									count: metrics.currentStreak.length,
									tone: metrics.currentStreak.tone,
								})
							: t("app.noActiveStreak")
					}
				/>
			</section>

			{metrics.billing.effectivePlanKey === "free" ? (
				<section className="mt-8 rounded-[28px] border border-amber-300/16 bg-amber-300/8 p-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-amber-100/80">
								{t("app.freeUsage")}
							</p>
							<h2 className="mt-2 text-2xl font-semibold text-white">
								{t("app.betsUsedThisMonth", {
									used: metrics.billing.monthlyBetsUsed ?? 0,
									limit: metrics.billing.monthlyBetLimit ?? 0,
								})}
							</h2>
							<p className="mt-2 max-w-2xl text-sm text-zinc-300">
								{t("app.upgradeMessage")}
							</p>
						</div>
						<Link to="/settings" className="cta-primary no-underline">
							{t("app.upgradePlan")}
						</Link>
					</div>
				</section>
			) : null}

			<section className="mt-8 grid gap-4 xl:grid-cols-[1.5fr_0.95fr]">
				{metrics.premiumAnalyticsEnabled ? (
					<BankrollChart points={metrics.curve} />
				) : (
					<div className="panel-card place-items-center text-center">
						<div className="rounded-full border border-amber-300/18 bg-amber-300/8 p-4 text-amber-100">
							<LockKeyhole className="size-7" />
						</div>
						<div className="space-y-3">
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								{t("app.premiumAnalytics")}
							</p>
							<h2 className="text-3xl font-semibold text-white">
								{t("app.unlockCurve")}
							</h2>
							<p className="max-w-md text-sm text-zinc-400">
								{t("app.premiumMessage")}
							</p>
						</div>
						<Link to="/settings" className="cta-primary no-underline">
							{t("app.seePlans")}
						</Link>
					</div>
				)}

				<div className="panel-card space-y-5">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								{t("app.efficiency")}
							</p>
							<h2 className="mt-2 text-2xl font-semibold text-white">
								{t("app.operationalRead")}
							</h2>
						</div>
						<Gauge className="size-5 text-amber-200" />
					</div>
					{metrics.premiumAnalyticsEnabled ? (
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
									{t("app.yield")}
								</p>
								<div className="mt-2 text-3xl font-semibold text-zinc-50">
									{formatNumber(metrics.yield * 100)}%
								</div>
							</div>
							<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
									{t("app.bestGreen")}
								</p>
								<div className="mt-2 text-3xl font-semibold text-zinc-50">
									{metrics.bestStreaks.green}
								</div>
							</div>
							<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
									{t("app.bestRed")}
								</p>
								<div className="mt-2 text-3xl font-semibold text-zinc-50">
									{metrics.bestStreaks.red}
								</div>
							</div>
							<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
								<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
									{t("app.lastUpdate")}
								</p>
								<div className="mt-2 text-lg font-semibold text-zinc-50">
									{t("common.today")}
								</div>
							</div>
						</div>
					) : (
						<div className="rounded-3xl border border-white/6 bg-white/[0.03] p-5 text-sm text-zinc-300">
							{t("app.advancedAnalyticsLocked")}
						</div>
					)}
				</div>
			</section>

			<section className="mt-8 panel-card">
				<div className="mb-5 flex items-center justify-between">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							{t("app.recentActivity")}
						</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">
							{t("app.recentBets")}
						</h2>
					</div>
					<Link to="/bets" className="cta-secondary no-underline">
						{t("app.viewAll")}
					</Link>
				</div>

				{metrics.recentBets.length === 0 ? (
					<EmptyState
						title={t("app.noBetsTitle")}
						description={t("app.noBetsDescription")}
						action={
							<Link to="/bets/new" className="cta-primary no-underline">
								{t("app.createFirstBet")}
							</Link>
						}
					/>
				) : (
					<div className="grid gap-3">
						{metrics.recentBets.map((bet) => (
							<Link
								key={bet.id}
								to="/bets/$betId"
								params={{ betId: bet.id }}
								className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5 no-underline transition hover:border-white/14 hover:bg-white/[0.05]"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											<StatusBadge status={bet.status} />
											<span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
												{bet.bookmaker}
											</span>
										</div>
										<h3 className="text-xl font-semibold text-zinc-50">
											{bet.eventName}
										</h3>
										<p className="text-sm text-zinc-400">
											<DateTimeText value={bet.placedAt} />
										</p>
									</div>
									<div className="text-right">
										<div className="text-sm uppercase tracking-[0.24em] text-zinc-500">
											{t("app.stake")}
										</div>
										<div className="text-lg font-semibold text-zinc-100">
											{formatCurrency(bet.stakeAmount)}
										</div>
										<div className="mt-2 flex items-center justify-end gap-2 text-sm text-zinc-400">
											<TrendingUp className="size-4" />
											{bet.profitAmount == null
												? t("app.open")
												: formatCurrency(bet.profitAmount)}
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
