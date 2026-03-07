import {
	type BetStatus,
	getOutcomeToneFromProfit,
} from "#/lib/domain";
import { useI18n } from "#/lib/i18n";
import { cn } from "#/lib/utils";

export function StatusBadge({
	status,
	profitAmount,
}: {
	status: BetStatus;
	profitAmount?: number | null;
}) {
	const { t } = useI18n();
	const tone = getOutcomeToneFromProfit(status, profitAmount);
	const label =
		status === "half_win"
			? t("locale.status.halfWin")
			: status === "half_loss"
				? t("locale.status.halfLoss")
				: t(`locale.status.${status}`);

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]",
				tone === "green" &&
					"bg-emerald-500/14 text-emerald-300 ring-1 ring-emerald-400/25",
				tone === "red" &&
					"bg-rose-500/14 text-rose-300 ring-1 ring-rose-400/25",
				tone === "neutral" &&
					"bg-slate-500/14 text-slate-300 ring-1 ring-slate-400/25",
				tone === "open" &&
					"bg-amber-500/14 text-amber-200 ring-1 ring-amber-400/25",
			)}
		>
			{label}
		</span>
	);
}
