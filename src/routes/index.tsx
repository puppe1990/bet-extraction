import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowUpRight, Gauge, Sparkles, TrendingUp } from "lucide-react";
import { BankrollChart } from "#/components/BankrollChart";
import { EmptyState } from "#/components/EmptyState";
import { StatCard } from "#/components/StatCard";
import { StatusBadge } from "#/components/StatusBadge";
import { DateTimeText } from "#/lib/datetime";
import { formatCurrency, formatNumber } from "#/lib/money";
import {
	dashboardQueryOptions,
	sessionQueryOptions,
} from "#/lib/query-options";
import { authSession } from "#/lib/server-functions";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: DashboardPage,
});

function DashboardPage() {
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
						Conta ativa
					</div>
					<div className="max-w-3xl space-y-4">
						<h1 className="text-4xl leading-none font-semibold tracking-tight text-white sm:text-6xl">
							Controle a banca como uma mesa de operacao.
						</h1>
						<p className="max-w-2xl text-base text-zinc-300 sm:text-lg">
							Cada usuario opera a propria banca, com sessao isolada, saldo
							separado e metricas independentes em tempo real.
						</p>
					</div>
				</div>
				<div className="hero-aside">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							Sessao
						</p>
						<p className="mt-2 text-lg font-semibold text-zinc-100">
							{session.data?.user.email}
						</p>
					</div>
					<div className="space-y-3">
						<Link to="/bets/new" className="cta-primary no-underline">
							Nova bet
							<ArrowUpRight className="size-4" />
						</Link>
						<Link to="/bankroll" className="cta-secondary no-underline">
							Movimentar banca
						</Link>
					</div>
				</div>
			</section>

			<section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard label="Saldo atual" value={formatCurrency(metrics.balance)} />
				<StatCard
					label="Lucro liquido"
					value={formatCurrency(metrics.netProfit)}
					tone={metrics.netProfit >= 0 ? "green" : "red"}
				/>
				<StatCard
					label="ROI"
					value={`${formatNumber(metrics.roi * 100)}%`}
					caption={`${metrics.settledCount} bets liquidadas`}
				/>
				<StatCard
					label="Win rate"
					value={`${formatNumber(metrics.winRate * 100)}%`}
					caption={
						metrics.currentStreak
							? `Streak atual: ${metrics.currentStreak.length} ${metrics.currentStreak.tone}`
							: "Sem streak ativa"
					}
				/>
			</section>

			<section className="mt-8 grid gap-4 xl:grid-cols-[1.5fr_0.95fr]">
				<BankrollChart points={metrics.curve} />

				<div className="panel-card space-y-5">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								Efetividade
							</p>
							<h2 className="mt-2 text-2xl font-semibold text-white">
								Leitura operacional
							</h2>
						</div>
						<Gauge className="size-5 text-amber-200" />
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
							<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
								Yield
							</p>
							<div className="mt-2 text-3xl font-semibold text-zinc-50">
								{formatNumber(metrics.yield * 100)}%
							</div>
						</div>
						<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
							<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
								Melhor green
							</p>
							<div className="mt-2 text-3xl font-semibold text-zinc-50">
								{metrics.bestStreaks.green}
							</div>
						</div>
						<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
							<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
								Melhor red
							</p>
							<div className="mt-2 text-3xl font-semibold text-zinc-50">
								{metrics.bestStreaks.red}
							</div>
						</div>
						<div className="rounded-3xl border border-white/6 bg-white/4 p-5">
							<p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
								Ultima atualizacao
							</p>
							<div className="mt-2 text-lg font-semibold text-zinc-50">
								Hoje
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="mt-8 panel-card">
				<div className="mb-5 flex items-center justify-between">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							Ultimas movimentacoes
						</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">
							Bets recentes
						</h2>
					</div>
					<Link to="/bets" className="cta-secondary no-underline">
						Ver todas
					</Link>
				</div>

				{metrics.recentBets.length === 0 ? (
					<EmptyState
						title="Nenhuma bet registrada"
						description="Comece registrando a primeira entrada para liberar saldo, curva e analiticos."
						action={
							<Link to="/bets/new" className="cta-primary no-underline">
								Criar primeira bet
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
											Stake
										</div>
										<div className="text-lg font-semibold text-zinc-100">
											{formatCurrency(bet.stakeAmount)}
										</div>
										<div className="mt-2 flex items-center justify-end gap-2 text-sm text-zinc-400">
											<TrendingUp className="size-4" />
											{bet.profitAmount == null
												? "Em aberto"
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
