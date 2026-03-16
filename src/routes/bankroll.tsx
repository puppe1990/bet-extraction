import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Upload } from "lucide-react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { parseBankrollCsvImport } from "#/lib/csv-import";
import { DateTimeText } from "#/lib/datetime";
import { useI18n } from "#/lib/i18n";
import { formatCurrency } from "#/lib/money";
import { bankrollSummaryQueryOptions } from "#/lib/query-options";
import {
	authSession,
	bankrollAddTransaction,
	bankrollDeleteTransaction,
	bankrollImportCsv,
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
	const importInputRef = useRef<HTMLInputElement | null>(null);
	const [type, setType] = useState<"deposit" | "withdraw" | "adjustment">("deposit");
	const [amount, setAmount] = useState("100");
	const [note, setNote] = useState("");
	const [occurredAt, setOccurredAt] = useState(toDatetimeLocal());
	const [importFeedback, setImportFeedback] = useState<{
		tone: "success" | "error";
		message: string;
	} | null>(null);
	const [editingTransaction, setEditingTransaction] = useState<{
		id: string;
		type: "deposit" | "withdraw" | "adjustment";
		amount: string;
		note: string;
		occurredAt: string;
	} | null>(null);

	const createTransactionMutation = useMutation({
		mutationFn: async () => {
			return bankrollAddTransaction({
				data: {
					type,
					amount: Number(amount),
					note,
					occurredAt: fromDatetimeLocal(occurredAt),
				},
			});
		},
		onSuccess: async () => {
			resetCreateForm();
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});

	const editTransactionMutation = useMutation({
		mutationFn: async () => {
			if (!editingTransaction) {
				throw new Error("No transaction selected.");
			}

			return bankrollUpdateTransaction({
				data: {
					transactionId: editingTransaction.id,
					values: {
						type: editingTransaction.type,
						amount: Number(editingTransaction.amount),
						note: editingTransaction.note,
						occurredAt: fromDatetimeLocal(editingTransaction.occurredAt),
					},
				},
			});
		},
		onSuccess: async () => {
			closeEditModal();
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});

	const deleteTransactionMutation = useMutation({
		mutationFn: async (transactionId: string) => {
			return bankrollDeleteTransaction({
				data: {
					transactionId,
				},
			});
		},
		onSuccess: async () => {
			closeEditModal();
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});

	const importMutation = useMutation({
		mutationFn: async (file: File) => {
			const text = await file.text();
			const items = parseBankrollCsvImport(text);
			return bankrollImportCsv({
				data: { items },
			});
		},
		onSuccess: async (result) => {
			setImportFeedback({
				tone: "success",
				message: t("bankroll.importSuccess", { count: result.importedCount }),
			});
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
		onError: (error) => {
			setImportFeedback({
				tone: "error",
				message: error.message || t("bankroll.importError"),
			});
		},
	});

	function resetCreateForm() {
		setType("deposit");
		setAmount("100");
		setNote("");
		setOccurredAt(toDatetimeLocal());
	}

	const closeEditModal = useCallback(() => {
		setEditingTransaction(null);
	}, []);

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

		setEditingTransaction({
			id: transaction.id,
			type: normalizedType,
			amount: String(Math.abs(transaction.amount)),
			note: transaction.note ?? "",
			occurredAt: toDatetimeLocal(transaction.occurredAt),
		});
	}

	useEffect(() => {
		if (!editingTransaction) {
			return;
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				closeEditModal();
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [editingTransaction, closeEditModal]);

	return (
		<main className="page-wrap py-10">
			<input
				ref={importInputRef}
				type="file"
				accept=".csv,text/csv"
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0];
					event.target.value = "";
					if (!file) {
						return;
					}

					setImportFeedback(null);
					importMutation.mutate(file);
				}}
			/>
			<section className="mb-32 grid gap-6 xl:mb-0 xl:grid-cols-[0.9fr_1.1fr]">
				<form
					className="panel-card space-y-5"
					onSubmit={async (event) => {
						event.preventDefault();
						await createTransactionMutation.mutateAsync();
					}}
				>
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							{t("bankroll.kicker")}
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
							{t("bankroll.title")}
						</h1>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button
							type="button"
							variant="outline"
							className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
							disabled={importMutation.isPending}
							onClick={() => importInputRef.current?.click()}
						>
							<Upload className="size-4" />
							{importMutation.isPending
								? t("bankroll.importing")
								: t("bankroll.importCsv")}
						</Button>
					</div>
					<div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
						{t("bankroll.importHint")}
					</div>
					{importFeedback ? (
						<div
							className={
								importFeedback.tone === "success"
									? "rounded-2xl border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
									: "rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
							}
						>
							{importFeedback.message}
						</div>
					) : null}
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
						<Button disabled={createTransactionMutation.isPending}>
							{createTransactionMutation.isPending
								? t("bankroll.submitting")
								: t("bankroll.submit")}
						</Button>
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
										<div className="mt-4 flex justify-end gap-3 border-t border-white/6 pt-4">
											<button
												type="button"
												className="flex min-h-11 items-center gap-2 rounded-full border border-amber-300/18 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-300/16"
												onClick={() => startEditing(transaction)}
											>
												<Pencil className="size-4" />
												{t("bankroll.editTransaction")}
											</button>
											<button
												type="button"
												className="flex min-h-11 items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
												disabled={deleteTransactionMutation.isPending}
												onClick={() =>
													deleteTransactionMutation.mutate(transaction.id)
												}
											>
												<Trash2 className="size-4" />
												{deleteTransactionMutation.isPending
													? t("bankroll.deleting")
													: t("bankroll.deleteTransaction")}
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
				{editingTransaction ? (
					<div
						className="fixed inset-0 z-80 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
					>
						<button
							type="button"
							aria-label={t("bankroll.cancelEdit")}
							className="absolute inset-0"
							onClick={closeEditModal}
						/>
						<form
							className="panel-card relative z-10 w-full max-w-xl gap-5"
							onMouseDown={(event) => event.stopPropagation()}
							onSubmit={async (event) => {
								event.preventDefault();
							await editTransactionMutation.mutateAsync();
						}}
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
									{t("bankroll.kicker")}
								</p>
								<h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
									{t("bankroll.editTransaction")}
								</h2>
							</div>
							<Button type="button" variant="outline" onClick={closeEditModal}>
								{t("bankroll.cancelEdit")}
							</Button>
						</div>
						<select
							className="field-input"
							value={editingTransaction.type}
							onChange={(event) =>
								setEditingTransaction((current) =>
									current
										? {
												...current,
												type: event.target.value as
													| "deposit"
													| "withdraw"
													| "adjustment",
										  }
										: current,
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
							value={editingTransaction.amount}
							onChange={(event) =>
								setEditingTransaction((current) =>
									current ? { ...current, amount: event.target.value } : current,
								)
							}
							placeholder={t("bankroll.amountPlaceholder")}
						/>
						<Input
							type="datetime-local"
							value={editingTransaction.occurredAt}
							onChange={(event) =>
								setEditingTransaction((current) =>
									current
										? { ...current, occurredAt: event.target.value }
										: current,
								)
							}
							placeholder={t("bankroll.occurredAt")}
						/>
						<Input
							value={editingTransaction.note}
							onChange={(event) =>
								setEditingTransaction((current) =>
									current ? { ...current, note: event.target.value } : current,
								)
							}
							placeholder={t("bankroll.notePlaceholder")}
						/>
						<div className="flex flex-wrap justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								className="border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
								disabled={deleteTransactionMutation.isPending}
								onClick={() =>
									deleteTransactionMutation.mutate(editingTransaction.id)
								}
							>
								{deleteTransactionMutation.isPending
									? t("bankroll.deleting")
									: t("bankroll.deleteTransaction")}
							</Button>
							<Button type="button" variant="outline" onClick={closeEditModal}>
								{t("bankroll.cancelEdit")}
							</Button>
							<Button disabled={editTransactionMutation.isPending}>
								{editTransactionMutation.isPending
									? t("bankroll.submitting")
									: t("bankroll.editSubmit")}
							</Button>
						</div>
					</form>
				</div>
			) : null}
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
