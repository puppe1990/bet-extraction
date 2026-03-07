export function FormField({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="grid gap-2">
			<span className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
				{label}
			</span>
			{children}
			{hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
		</div>
	);
}
