import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import {
	BetForm,
	fromDatetimeLocal,
	toDatetimeLocal,
} from "#/components/BetForm";
import { StatusBadge } from "#/components/StatusBadge";
import { Button } from "#/components/ui/button";
import { formatCurrency } from "#/lib/money";
import { betByIdQueryOptions } from "#/lib/query-options";
import {
	authSession,
	betsDelete,
	betsReopen,
	betsSettle,
	betsUpdate,
} from "#/lib/server-functions";

export const Route = createFileRoute("/bets/$betId")({
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: BetDetailsPage,
});

function BetDetailsPage() {
	const { betId } = Route.useParams();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const betQuery = useQuery(betByIdQueryOptions(betId));
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [settlementStatus, setSettlementStatus] = useState<
		"win" | "loss" | "void" | "cashout" | "half_win" | "half_loss"
	>("win");
	const [customReturnAmount, setCustomReturnAmount] = useState(
		betQuery.data?.grossReturnAmount?.toString() ?? "",
	);

	const updateMutation = useMutation({
		mutationFn: betsUpdate,
		onSuccess: async () => {
			setErrorMessage(null);
			await queryClient.invalidateQueries({ queryKey: ["bets"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["bets", betId] });
		},
		onError: (error) => {
			setErrorMessage(error.message || "Nao foi possivel atualizar a bet.");
		},
	});

	const settleMutation = useMutation({
		mutationFn: betsSettle,
		onSuccess: async () => {
			setErrorMessage(null);
			await queryClient.invalidateQueries({ queryKey: ["bets"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["bets", betId] });
		},
		onError: (error) => {
			setErrorMessage(error.message || "Nao foi possivel liquidar a bet.");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: betsDelete,
		onSuccess: async () => {
			setErrorMessage(null);
			await queryClient.invalidateQueries({ queryKey: ["bets"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			navigate({ to: "/bets" });
		},
		onError: (error) => {
			setErrorMessage(error.message || "Nao foi possivel apagar a bet.");
		},
	});

	const reopenMutation = useMutation({
		mutationFn: betsReopen,
		onSuccess: async () => {
			setErrorMessage(null);
			await queryClient.invalidateQueries({ queryKey: ["bets"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["bets", betId] });
		},
		onError: (error) => {
			setErrorMessage(error.message || "Nao foi possivel reabrir a bet.");
		},
	});

	if (!betQuery.data) {
		return (
			<main className="page-wrap py-10">
				<div className="panel-card h-64 animate-pulse bg-white/4" />
			</main>
		);
	}

	const bet = betQuery.data;
	const tagsText = bet.tags.map((tag) => tag.name).join(", ");

	return (
		<main className="page-wrap py-10">
			<section className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
				<div className="panel-card space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								Bet
							</p>
							<h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
								{bet.eventName}
							</h1>
						</div>
						<StatusBadge status={bet.status} />
					</div>
					<div className="grid gap-3 sm:grid-cols-3">
						<KeyMetric label="Stake" value={formatCurrency(bet.stakeAmount)} />
						<KeyMetric
							label="Retorno"
							value={formatCurrency(bet.grossReturnAmount)}
						/>
						<KeyMetric label="Lucro" value={formatCurrency(bet.profitAmount)} />
					</div>
					<div className="flex flex-wrap gap-2">
						{bet.tags.map((tag) => (
							<span
								key={tag.id}
								className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-200"
							>
								{tag.name}
							</span>
						))}
					</div>
				</div>

				<section className="panel-card space-y-5">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							Liquidacao
						</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">
							Ajuste rapido
						</h2>
					</div>
					<select
						className="field-input"
						value={settlementStatus}
						onChange={(event) =>
							setSettlementStatus(
								event.target.value as
									| "win"
									| "loss"
									| "void"
									| "cashout"
									| "half_win"
									| "half_loss",
							)
						}
					>
						<option value="win">Win</option>
						<option value="loss">Loss</option>
						<option value="void">Void</option>
						<option value="cashout">Cashout</option>
						<option value="half_win">Half win</option>
						<option value="half_loss">Half loss</option>
					</select>
					{settlementStatus === "cashout" ? (
						<input
							type="number"
							min="0"
							step="0.01"
							className="field-input"
							value={customReturnAmount}
							onChange={(event) => setCustomReturnAmount(event.target.value)}
							placeholder="Retorno do cashout em BRL"
						/>
					) : null}
					<Button
						disabled={settleMutation.isPending}
						onClick={() =>
							settleMutation.mutate({
								data: {
									betId,
									status: settlementStatus,
									settledAt: new Date().toISOString(),
									customReturnAmount:
										settlementStatus === "cashout"
											? Number(customReturnAmount)
											: undefined,
								},
							})
						}
					>
						{bet.status === "open" ? "Liquidar agora" : "Recalcular liquidacao"}
					</Button>
					{bet.status !== "open" ? (
						<Button
							variant="outline"
							disabled={reopenMutation.isPending}
							onClick={() => reopenMutation.mutate({ data: { betId } })}
						>
							{reopenMutation.isPending ? "Reabrindo..." : "Reabrir bet"}
						</Button>
					) : null}
					<Button
						variant="outline"
						className="border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
						disabled={deleteMutation.isPending}
						onClick={() => deleteMutation.mutate({ data: { betId } })}
					>
						Apagar bet e transacoes vinculadas
					</Button>
					<Button asChild variant="outline">
						<Link to="/bets">Voltar para o book</Link>
					</Button>
				</section>
			</section>

			<BetForm
				mode="edit"
				busy={updateMutation.isPending}
				errorMessage={errorMessage}
				disableFinancialFields={bet.status !== "open"}
				defaultValues={{
					sport: bet.sport,
					market: bet.market,
					eventName: bet.eventName,
					selection: bet.selection,
					bookmaker: bet.bookmaker,
					oddsDecimal: bet.oddsDecimal,
					stakeAmount: bet.stakeAmount,
					placedAt: toDatetimeLocal(bet.placedAt),
					note: bet.note ?? "",
					tagsText,
				}}
				onSubmit={async (values) => {
					setErrorMessage(null);
					await updateMutation.mutateAsync({
						data: {
							betId,
							values: {
								...values,
								placedAt: fromDatetimeLocal(values.placedAt),
							},
						},
					});
				}}
			/>
		</main>
	);
}

function KeyMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
			<p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
				{label}
			</p>
			<div className="mt-2 text-2xl font-semibold text-zinc-50">{value}</div>
		</div>
	);
}
