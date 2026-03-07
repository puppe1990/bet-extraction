import { cn } from "#/lib/utils";

export function StatCard({
	label,
	value,
	caption,
	tone = "default",
}: {
	label: string;
	value: string;
	caption?: string;
	tone?: "default" | "green" | "red";
}) {
	return (
		<article
			className={cn(
				"panel-card space-y-3",
				tone === "green" && "panel-card-green",
				tone === "red" && "panel-card-red",
			)}
		>
			<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
				{label}
			</p>
			<div className="text-3xl font-semibold tracking-tight text-zinc-50">
				{value}
			</div>
			{caption ? <p className="text-sm text-zinc-400">{caption}</p> : null}
		</article>
	);
}
