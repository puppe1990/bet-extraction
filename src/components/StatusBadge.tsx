import {
	type BetStatus,
	getOutcomeToneFromProfit,
	statusLabel,
} from "#/lib/domain";
import { cn } from "#/lib/utils";

export function StatusBadge({
	status,
	profitAmount,
}: {
	status: BetStatus;
	profitAmount?: number | null;
}) {
	const tone = getOutcomeToneFromProfit(status, profitAmount);

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
			{statusLabel(status)}
		</span>
	);
}
