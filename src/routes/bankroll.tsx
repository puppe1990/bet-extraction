import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { DateTimeText } from "#/lib/datetime";
import { formatCurrency } from "#/lib/money";
import { bankrollSummaryQueryOptions } from "#/lib/query-options";
import { authSession, bankrollAddTransaction } from "#/lib/server-functions";

export const Route = createFileRoute("/bankroll")({
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: BankrollPage,
});

function BankrollPage() {
	const queryClient = useQueryClient();
	const summaryQuery = useQuery(bankrollSummaryQueryOptions());
	const [type, setType] = useState<"deposit" | "withdraw" | "adjustment">(
		"deposit",
	);
	const [amount, setAmount] = useState("100");
	const [note, setNote] = useState("");

	const transactionMutation = useMutation({
		mutationFn: bankrollAddTransaction,
		onSuccess: async () => {
			setAmount("100");
			setNote("");
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});

	return (
		<main className="page-wrap py-10">
			<section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
				<form
					className="panel-card space-y-5"
					onSubmit={async (event) => {
						event.preventDefault();
						await transactionMutation.mutateAsync({
							data: {
								type,
								amount: Number(amount),
								note,
								occurredAt: new Date().toISOString(),
							},
						});
					}}
				>
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							Caixa
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
							Movimentar banca
						</h1>
					</div>
					<select
						className="field-input"
						value={type}
						onChange={(event) =>
							setType(
								event.target.value as "deposit" | "withdraw" | "adjustment",
							)
						}
					>
						<option value="deposit">Deposito</option>
						<option value="withdraw">Saque</option>
						<option value="adjustment">Ajuste manual</option>
					</select>
					<Input
						type="number"
						min="0.01"
						step="0.01"
						value={amount}
						onChange={(event) => setAmount(event.target.value)}
						placeholder="Valor em BRL"
					/>
					<Input
						value={note}
						onChange={(event) => setNote(event.target.value)}
						placeholder="Motivo ou observacao"
					/>
					<Button disabled={transactionMutation.isPending}>
						{transactionMutation.isPending
							? "Lancando..."
							: "Registrar transacao"}
					</Button>
				</form>

				<section className="panel-card space-y-5">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							Saldo atual
						</p>
						<h2 className="mt-2 text-4xl font-semibold text-zinc-50">
							{formatCurrency(summaryQuery.data?.account.currentBalance)}
						</h2>
					</div>
					<div className="grid gap-3">
						{(summaryQuery.data?.recentTransactions ?? []).map(
							(transaction) => (
								<article
									key={transaction.id}
									className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5"
								>
									<div className="flex flex-wrap items-start justify-between gap-4">
										<div>
											<div className="text-sm uppercase tracking-[0.24em] text-zinc-500">
												{transaction.type}
											</div>
											<div className="mt-2 text-lg font-semibold text-zinc-100">
												{transaction.eventName ??
													transaction.note ??
													"Movimentacao"}
											</div>
											<div className="mt-1 text-sm text-zinc-400">
												<DateTimeText value={transaction.occurredAt} />
											</div>
										</div>
										<div className="text-right text-lg font-semibold text-zinc-50">
											{formatCurrency(transaction.amount)}
										</div>
									</div>
								</article>
							),
						)}
					</div>
				</section>
			</section>
		</main>
	);
}
