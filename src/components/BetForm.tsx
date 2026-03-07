import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { calculateSettlementAmounts } from "#/lib/bets";
import { useI18n } from "#/lib/i18n";
import { formatCurrency, formatNumber } from "#/lib/money";
import { FormField } from "./FormField";

export type BetFormValues = {
	sport: string;
	market: string;
	eventName: string;
	selection: string;
	bookmaker: string;
	oddsDecimal: number;
	stakeAmount: number;
	placedAt: string;
	note: string;
	tagsText: string;
};

type BetPreviewStatus = "win" | "loss" | "void" | "half_win" | "half_loss";

export function toDatetimeLocal(value?: string | null) {
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

export function fromDatetimeLocal(value: string) {
	return new Date(value).toISOString();
}

export function BetForm({
	defaultValues,
	mode,
	busy,
	errorMessage,
	disableFinancialFields = false,
	onSubmit,
}: {
	defaultValues: BetFormValues;
	mode: "create" | "edit";
	busy?: boolean;
	errorMessage?: string | null;
	disableFinancialFields?: boolean;
	onSubmit: (values: BetFormValues) => Promise<void> | void;
}) {
	const { t } = useI18n();
	const [values, setValues] = useState(defaultValues);
	const [previewStatus, setPreviewStatus] = useState<BetPreviewStatus>("win");

	const settlementPreview = useMemo(
		() =>
			calculateSettlementAmounts(
				Number(values.stakeAmount || 0),
				Number(values.oddsDecimal || 0),
				previewStatus,
			),
		[previewStatus, values.oddsDecimal, values.stakeAmount],
	);

	return (
		<form
			className="panel-card bet-form-shell grid gap-6"
			onSubmit={async (event) => {
				event.preventDefault();
				await onSubmit(values);
			}}
		>
			<div className="bet-form-header flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
						{mode === "create"
							? t("bets.createKicker")
							: t("bets.editKicker")}
					</p>
					<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
						{mode === "create"
							? t("bets.createTitle")
							: t("bets.editTitle")}
					</h2>
				</div>
				<Button asChild variant="outline">
					<Link to="/bets">{t("bets.backToBook")}</Link>
				</Button>
			</div>

			<div className="bet-form-mobile-summary md:hidden">
				<div className="bet-form-mobile-summary__metric">
					<span>{t("bets.bookmaker")}</span>
					<strong>{values.bookmaker || "--"}</strong>
				</div>
				<div className="bet-form-mobile-summary__metric">
					<span>{t("bets.odds")}</span>
					<strong>{formatNumber(values.oddsDecimal || 0)}</strong>
				</div>
				<div className="bet-form-mobile-summary__metric">
					<span>{t("bets.stake")}</span>
					<strong>{formatCurrency(values.stakeAmount || 0)}</strong>
				</div>
				<div className="bet-form-mobile-summary__metric">
					<span>{t("bets.placedAt")}</span>
					<strong>{values.placedAt ? values.placedAt.slice(5, 16).replace("T", " ") : "--"}</strong>
				</div>
			</div>

			{errorMessage ? (
				<div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
					{errorMessage}
				</div>
			) : null}

			<div className="grid gap-4 md:grid-cols-2">
				<FormField label={t("bets.sport")}>
					<Input
						required
						value={values.sport}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								sport: event.target.value,
							}))
						}
						placeholder={t("bets.sport")}
					/>
				</FormField>
				<FormField label={t("bets.bookmaker")}>
					<Input
						required
						value={values.bookmaker}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								bookmaker: event.target.value,
							}))
						}
						placeholder="Bet365"
					/>
				</FormField>
				<FormField label={t("bets.event")}>
					<Input
						required
						value={values.eventName}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								eventName: event.target.value,
							}))
						}
						placeholder="Palmeiras x Flamengo"
					/>
				</FormField>
				<FormField label={t("bets.market")}>
					<Input
						required
						value={values.market}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								market: event.target.value,
							}))
						}
						placeholder="Asian handicap"
					/>
				</FormField>
				<FormField label={t("bets.selection")}>
					<Input
						required
						value={values.selection}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								selection: event.target.value,
							}))
						}
						placeholder="Palmeiras -0.25"
					/>
				</FormField>
				<FormField label={t("bets.tags")} hint={t("bets.tagsHint")}>
					<Input
						value={values.tagsText}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								tagsText: event.target.value,
							}))
						}
						placeholder="live, asian, serie-a"
					/>
				</FormField>
				<FormField label={t("bets.odds")}>
					<Input
						type="number"
						step="0.01"
						min="1"
						required
						disabled={disableFinancialFields}
						value={values.oddsDecimal}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								oddsDecimal: Number(event.target.value),
							}))
						}
					/>
				</FormField>
				<FormField label="Stake (BRL)">
					<Input
						type="number"
						step="0.01"
						min="0.01"
						required
						disabled={disableFinancialFields}
						value={values.stakeAmount}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								stakeAmount: Number(event.target.value),
							}))
						}
					/>
				</FormField>
				<FormField label={t("bets.placedAt")}>
					<Input
						type="datetime-local"
						required
						disabled={disableFinancialFields}
						value={values.placedAt}
						onChange={(event) =>
							setValues((current) => ({
								...current,
								placedAt: event.target.value,
							}))
						}
					/>
				</FormField>
			</div>

			<FormField label={t("bets.note")}>
				<Textarea
					rows={5}
					value={values.note}
					onChange={(event) =>
						setValues((current) => ({ ...current, note: event.target.value }))
					}
					placeholder={t("bets.notePlaceholder")}
				/>
			</FormField>

			<section className="bet-form-preview grid gap-4 rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-5 md:grid-cols-[1fr_auto]">
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
					{(["win", "loss", "void", "half_win", "half_loss"] as const).map(
						(status) => {
							const preview = calculateSettlementAmounts(
								Number(values.stakeAmount || 0),
								Number(values.oddsDecimal || 0),
								status,
							);

							return (
								<button
									key={status}
									type="button"
									onClick={() => setPreviewStatus(status)}
									className={`rounded-2xl border px-4 py-3 text-left transition ${
										previewStatus === status
											? "border-emerald-400/40 bg-emerald-400/10"
											: "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
									}`}
								>
									<div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
										{status === "half_win"
											? t("locale.status.halfWin")
											: status === "half_loss"
												? t("locale.status.halfLoss")
												: t(`locale.status.${status}`)}
									</div>
									<div className="mt-3 text-sm text-zinc-300">
										{t("bets.returnLabel")}{" "}
										{formatCurrency(preview.grossReturn)}
									</div>
									<div className="text-lg font-semibold text-zinc-50">
										{formatCurrency(preview.profit)}
									</div>
								</button>
							);
						},
					)}
				</div>
				<div className="min-w-44 rounded-2xl border border-zinc-800 bg-black/30 p-4">
					<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
						{t("bets.previewTitle")}
					</p>
					<div className="mt-4 space-y-2">
						<div>
							<span className="text-xs text-zinc-500">{t("bets.status")}</span>
							<div className="text-lg font-semibold capitalize text-zinc-50">
								{previewStatus === "half_win"
									? t("locale.status.halfWin")
									: previewStatus === "half_loss"
										? t("locale.status.halfLoss")
										: t(`locale.status.${previewStatus}`)}
							</div>
						</div>
						<div>
							<span className="text-xs text-zinc-500">
								{t("bets.returnLabel")}
							</span>
							<div className="text-lg text-zinc-100">
								{formatCurrency(settlementPreview.grossReturn)}
							</div>
						</div>
						<div>
							<span className="text-xs text-zinc-500">
								{t("bets.profitLabel")}
							</span>
							<div className="text-lg text-zinc-100">
								{formatCurrency(settlementPreview.profit)}
							</div>
						</div>
						<div>
							<span className="text-xs text-zinc-500">Odd</span>
							<div className="text-lg text-zinc-100">
								{formatNumber(values.oddsDecimal)}
							</div>
						</div>
					</div>
				</div>
			</section>

			<div className="bet-form-submit-row flex justify-end">
				<Button className="bet-form-submit" disabled={busy}>
					{busy
						? `${t("common.save")}...`
						: t("common.save")}
				</Button>
			</div>
		</form>
	);
}
