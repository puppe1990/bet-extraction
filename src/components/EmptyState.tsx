export function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="panel-card flex min-h-60 flex-col items-center justify-center gap-4 text-center">
			<div className="space-y-2">
				<h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
				<p className="mx-auto max-w-md text-sm text-zinc-400">{description}</p>
			</div>
			{action}
		</div>
	);
}
