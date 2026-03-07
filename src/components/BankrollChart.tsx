import { formatCurrency } from "#/lib/money";

export function BankrollChart({
	points,
}: {
	points: { date: string; balance: number }[];
}) {
	if (points.length === 0) {
		return (
			<div className="panel-card flex min-h-52 items-center justify-center text-sm text-zinc-400">
				A curva da banca aparece assim que voce registrar movimentacoes.
			</div>
		);
	}

	const width = 640;
	const height = 240;
	const values = points.map((point) => point.balance);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;

	const path = points
		.map((point, index) => {
			const x = (index / Math.max(points.length - 1, 1)) * width;
			const y = height - ((point.balance - min) / range) * (height - 24) - 12;
			return `${index === 0 ? "M" : "L"} ${x} ${y}`;
		})
		.join(" ");

	const final = points.at(-1);

	return (
		<div className="panel-card space-y-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
						Curva da banca
					</p>
					<h3 className="mt-2 text-2xl font-semibold text-zinc-50">
						{final ? formatCurrency(final.balance) : "--"}
					</h3>
				</div>
				<p className="max-w-xs text-right text-sm text-zinc-400">
					Saldo acumulado por dia, sempre derivado das transacoes.
				</p>
			</div>

			<svg
				viewBox={`0 0 ${width} ${height}`}
				className="h-60 w-full overflow-visible"
				role="img"
				aria-label="Curva da banca"
			>
				<defs>
					<linearGradient id="bankroll-line" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#d4a24a" />
						<stop offset="55%" stopColor="#7ef0b5" />
						<stop offset="100%" stopColor="#31d0aa" />
					</linearGradient>
				</defs>
				<path
					d={path}
					fill="none"
					stroke="url(#bankroll-line)"
					strokeWidth="4"
					strokeLinecap="round"
				/>
			</svg>

			<div className="flex flex-wrap gap-3 text-xs text-zinc-500">
				<span>Min: {formatCurrency(min)}</span>
				<span>Max: {formatCurrency(max)}</span>
				<span>Ultimo ponto: {final?.date ?? "--"}</span>
			</div>
		</div>
	);
}
