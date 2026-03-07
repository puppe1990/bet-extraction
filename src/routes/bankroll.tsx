import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { DateTimeText } from "#/lib/datetime";
import { useI18n } from "#/lib/i18n";
import { formatCurrency } from "#/lib/money";
import { bankrollSummaryQueryOptions } from "#/lib/query-options";
import {
	authSession,
	bankrollAddTransaction,
	bankrollUpdateTransaction,
} from "#/lib/server-functions";

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
	const { t } = useI18n();
	const queryClient = useQueryClient();
	const summaryQuery = useQuery(bankrollSummaryQueryOptions());
	const [type, setType] = useState<"deposit" | "withdraw" | "adjustment">("deposit");
	const [amount, setAmount] = useState("100");
	const [note, setNote] = useState("");
	const [occurredAt, setOccurredAt] = useState(toDatetimeLocal());
	const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
		null,
	);

	const transactionMutation = useMutation({
		mutationFn: async () => {
			const values = {
				type,
				amount: Number(amount),
				note,
				occurredAt: fromDatetimeLocal(occurredAt),
			};

			if (editingTransactionId) {
				return bankrollUpdateTransaction({
					data: {
						transactionId: editingTransactionId,
						values,
					},
				});
			}

			return bankrollAddTransaction({
				data: values,
			});
		},
		onSuccess: async () => {
			resetForm();
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});

	function resetForm() {
		setType("deposit");
		setAmount("100");
		setNote("");
		setOccurredAt(toDatetimeLocal());
		setEditingTransactionId(null);
	}

	function startEditing(transaction: {
		id: string;
		type: string;
		amount: number;
		note: string | null;
		occurredAt: string;
	}) {
		const normalizedType = normalizeTransactionType(transaction.type);

		if (
			normalizedType !== "deposit" &&
			normalizedType !== "withdraw" &&
			normalizedType !== "adjustment"
		) {
			return;
		}

		setEditingTransactionId(transaction.id);
		setType(normalizedType);
		setAmount(String(Math.abs(transaction.amount)));
		setNote(transaction.note ?? "");
		setOccurredAt(toDatetimeLocal(transaction.occurredAt));
	}

	return (
		<main className="page-wrap py-10">
			<section className="mb-32 grid gap-6 xl:mb-0 xl:grid-cols-[0.9fr_1.1fr]">
				<form
					className="panel-card space-y-5"
					onSubmit={async (event) => {
						event.preventDefault();
						await transactionMutation.mutateAsync();
					}}
				>
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							{t("bankroll.kicker")}
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
							{editingTransactionId
								? t("bankroll.editTransaction")
								: t("bankroll.title")}
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
						<option value="deposit">{t("bankroll.deposit")}</option>
						<option value="withdraw">{t("bankroll.withdraw")}</option>
						<option value="adjustment">{t("bankroll.adjustment")}</option>
					</select>
					<Input
						type="number"
						min="0.01"
						step="0.01"
						value={amount}
						onChange={(event) => setAmount(event.target.value)}
						placeholder={t("bankroll.amountPlaceholder")}
					/>
					<Input
						type="datetime-local"
						value={occurredAt}
						onChange={(event) => setOccurredAt(event.target.value)}
						placeholder={t("bankroll.occurredAt")}
					/>
					<Input
						value={note}
						onChange={(event) => setNote(event.target.value)}
						placeholder={t("bankroll.notePlaceholder")}
					/>
					<div className="flex flex-wrap gap-3">
						<Button disabled={transactionMutation.isPending}>
							{transactionMutation.isPending
								? t("bankroll.submitting")
								: editingTransactionId
									? t("bankroll.editSubmit")
									: t("bankroll.submit")}
						</Button>
						{editingTransactionId ? (
							<Button
								type="button"
								variant="outline"
								onClick={resetForm}
							>
								{t("bankroll.cancelEdit")}
							</Button>
						) : null}
					</div>
				</form>

				<section className="panel-card space-y-5">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							{t("bankroll.currentBalance")}
						</p>
						<h2 className="mt-2 text-4xl font-semibold text-zinc-50">
							{formatCurrency(summaryQuery.data?.account.currentBalance)}
						</h2>
					</div>
					<div className="mobile-bankroll-summary md:hidden">
						<div className="mobile-bankroll-summary__item">
							<div className="mobile-bankroll-summary__label">
								{t("bankroll.deposit")}
							</div>
							<div className="mobile-bankroll-summary__value text-emerald-200">
								{
									formatCurrency(
										(summaryQuery.data?.recentTransactions ?? [])
											.filter(
												(transaction) =>
													normalizeTransactionType(transaction.type) ===
													"deposit",
											)
											.reduce((sum, transaction) => sum + transaction.amount, 0),
									)
								}
							</div>
						</div>
						<div className="mobile-bankroll-summary__item">
							<div className="mobile-bankroll-summary__label">
								{t("bankroll.withdraw")}
							</div>
							<div className="mobile-bankroll-summary__value text-rose-200">
								{
									formatCurrency(
										(summaryQuery.data?.recentTransactions ?? [])
											.filter(
												(transaction) =>
													normalizeTransactionType(transaction.type) ===
													"withdraw",
											)
											.reduce((sum, transaction) => sum + transaction.amount, 0),
									)
								}
							</div>
						</div>
					</div>
					<div className="grid gap-3">
						{(summaryQuery.data?.recentTransactions ?? []).map(
							(transaction) => {
								const normalizedType = normalizeTransactionType(transaction.type);
								const appearance = getTransactionAppearance(normalizedType);
								const title =
									transaction.eventName ??
									transaction.note ??
									t("bankroll.movementFallback");
								const detail =
									transaction.eventName && transaction.note
										? transaction.note
										: t(`bankroll.typeLabels.${normalizedType}`);

								return (
								<article
									key={transaction.id}
									className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5"
								>
									<div className="flex flex-wrap items-start justify-between gap-4">
										<div>
											<div
												className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${appearance.badgeClass}`}
											>
												{t(`bankroll.typeLabels.${normalizedType}`)}
											</div>
											<div className="mt-2 text-lg font-semibold text-zinc-100">
												{title}
											</div>
											<div className="mt-1 text-sm text-zinc-400">
												{detail}
											</div>
											<div className="mt-2 text-sm text-zinc-500">
												<DateTimeText value={transaction.occurredAt} />
											</div>
										</div>
										<div
											className={`text-right text-lg font-semibold ${appearance.amountClass}`}
										>
											{formatCurrency(transaction.amount)}
										</div>
									</div>
									{isEditableTransaction(normalizedType) ? (
										<div className="mt-4 flex justify-end border-t border-white/6 pt-4">
											<button
												type="button"
												className="flex min-h-11 items-center gap-2 rounded-full border border-amber-300/18 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/16"
												onClick={() => startEditing(transaction)}
											>
												<Pencil className="size-4" />
												{t("bankroll.editTransaction")}
											</button>
										</div>
									) : null}
								</article>
								);
							},
						)}
					</div>
				</section>
			</section>

		</main>
	);
}

function toDatetimeLocal(value?: string | null) {
	if (!value) {
		const now = new Date();
		const offset = now.getTimezoneOffset();
		return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
	}

	const parsed = new Date(value);
	const offset = parsed.getTimezoneOffset();
	return new Date(parsed.getTime() - offset * 60_000)
		.toISOString()
		.slice(0, 16);
}

function fromDatetimeLocal(value: string) {
	return new Date(value).toISOString();
}

function isEditableTransaction(type: string) {
	return type === "deposit" || type === "withdraw" || type === "adjustment";
}

function normalizeTransactionType(type: string) {
	return type.trim().toLowerCase();
}

function getTransactionAppearance(type: string) {
	switch (type) {
		case "deposit":
		case "bet_settlement":
			return {
				badgeClass:
					"border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
				amountClass: "text-emerald-200",
			};
		case "withdraw":
		case "bet_open":
			return {
				badgeClass: "border-rose-400/20 bg-rose-400/10 text-rose-100",
				amountClass: "text-rose-200",
			};
		default:
			return {
				badgeClass: "border-white/8 bg-white/[0.04] text-zinc-300",
				amountClass: "text-zinc-50",
			};
	}
}
