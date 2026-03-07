import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Download, LockKeyhole, Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "#/components/EmptyState";
import { StatusBadge } from "#/components/StatusBadge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { DateTimeText } from "#/lib/datetime";
import { formatCurrency, formatNumber } from "#/lib/money";
import {
	betsListQueryOptions,
	billingSummaryQueryOptions,
} from "#/lib/query-options";
import { authSession, betsExportCsv, betsSettle } from "#/lib/server-functions";

const searchSchema = {
	status: "all",
	sport: "",
	bookmaker: "",
	tag: "",
	from: "",
	to: "",
};

export const Route = createFileRoute("/bets/")({
	validateSearch: (search) => ({
		status:
			typeof search.status === "string" ? search.status : searchSchema.status,
		sport: typeof search.sport === "string" ? search.sport : searchSchema.sport,
		bookmaker:
			typeof search.bookmaker === "string"
				? search.bookmaker
				: searchSchema.bookmaker,
		tag: typeof search.tag === "string" ? search.tag : searchSchema.tag,
		from: typeof search.from === "string" ? search.from : searchSchema.from,
		to: typeof search.to === "string" ? search.to : searchSchema.to,
	}),
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: BetsPage,
});

function BetsPage() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const billingQuery = useQuery(billingSummaryQueryOptions());
	const betsQuery = useQuery(
		betsListQueryOptions({
			...search,
			status: search.status === "all" ? undefined : search.status,
			sport: search.sport || undefined,
			bookmaker: search.bookmaker || undefined,
			tag: search.tag || undefined,
			from: search.from || undefined,
			to: search.to || undefined,
		}),
	);

	const settleMutation = useMutation({
		mutationFn: (payload: { betId: string; status: "win" | "loss" | "void" }) =>
			betsSettle({
				data: { ...payload, settledAt: new Date().toISOString() },
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["bets"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["bankroll"] });
		},
	});

	const exportMutation = useMutation({
		mutationFn: () =>
			betsExportCsv({
				data: {
					...search,
					status: search.status === "all" ? undefined : search.status,
					sport: search.sport || undefined,
					bookmaker: search.bookmaker || undefined,
					tag: search.tag || undefined,
					from: search.from || undefined,
					to: search.to || undefined,
				},
			}),
		onSuccess: (csv) => {
			const blob = new Blob([csv], {
				type: "text/csv;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `ledger-bets-${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		},
	});

	const [statusDraft, setStatusDraft] = useState(search.status);

	const table = useReactTable({
		data: betsQuery.data ?? [],
		columns: [
			{
				header: "Evento",
				accessorKey: "eventName",
				cell: ({ row }) => (
					<div className="space-y-2">
						<Link
							to="/bets/$betId"
							params={{ betId: row.original.id }}
							className="text-base font-semibold text-zinc-100 underline-offset-4 hover:underline"
						>
							{row.original.eventName}
						</Link>
						<div className="text-sm text-zinc-400">
							{row.original.selection} · {row.original.market}
						</div>
					</div>
				),
			},
			{
				header: "Status",
				accessorKey: "status",
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
			{
				header: "Book",
				accessorKey: "bookmaker",
			},
			{
				header: "Stake",
				accessorKey: "stakeAmount",
				cell: ({ row }) => formatCurrency(row.original.stakeAmount),
			},
			{
				header: "Odd",
				accessorKey: "oddsDecimal",
				cell: ({ row }) => formatNumber(row.original.oddsDecimal),
			},
			{
				header: "P/L",
				accessorKey: "profitAmount",
				cell: ({ row }) =>
					row.original.profitAmount == null
						? "Em aberto"
						: formatCurrency(row.original.profitAmount),
			},
			{
				header: "Data",
				accessorKey: "placedAt",
				cell: ({ row }) => <DateTimeText value={row.original.placedAt} />,
			},
			{
				header: "Acoes",
				id: "actions",
				cell: ({ row }) => (
					<div className="flex flex-wrap gap-2">
						{row.original.status === "open" ? (
							<>
								<QuickSettleButton
									label="Win"
									onClick={() =>
										settleMutation.mutate({
											betId: row.original.id,
											status: "win",
										})
									}
								/>
								<QuickSettleButton
									label="Loss"
									onClick={() =>
										settleMutation.mutate({
											betId: row.original.id,
											status: "loss",
										})
									}
								/>
								<QuickSettleButton
									label="Void"
									onClick={() =>
										settleMutation.mutate({
											betId: row.original.id,
											status: "void",
										})
									}
								/>
							</>
						) : (
							<Button asChild size="sm" variant="outline">
								<Link to="/bets/$betId" params={{ betId: row.original.id }}>
									Detalhe
								</Link>
							</Button>
						)}
					</div>
				),
			},
		],
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<main className="page-wrap py-10">
			<section className="panel-card space-y-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							book
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
							Todas as bets
						</h1>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button
							variant="outline"
							className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
							disabled={
								!billingQuery.data?.canExportCsv || exportMutation.isPending
							}
							onClick={() => exportMutation.mutate()}
							type="button"
						>
							{billingQuery.data?.canExportCsv ? (
								<Download className="size-4" />
							) : (
								<LockKeyhole className="size-4" />
							)}
							{exportMutation.isPending ? "Exporting..." : "Export CSV"}
						</Button>
						<Button asChild>
							<Link to="/bets/new">
								<Plus className="size-4" />
								Nova bet
							</Link>
						</Button>
					</div>
				</div>
				{!billingQuery.data?.canExportCsv ? (
					<div className="rounded-2xl border border-amber-300/18 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
						CSV export is a Pro feature. Upgrade to export filtered bet history
						and bookmaker performance outside Ledger.{" "}
						<Link
							to="/settings"
							className="font-semibold text-white underline underline-offset-4"
						>
							See plans
						</Link>
						.
					</div>
				) : null}
				{exportMutation.error ? (
					<div className="rounded-2xl border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
						{exportMutation.error.message}
					</div>
				) : null}

				<div className="grid gap-3 md:grid-cols-5">
					<select
						className="field-input"
						value={statusDraft}
						onChange={(event) => setStatusDraft(event.target.value)}
					>
						<option value="all">Todos os status</option>
						<option value="open">Open</option>
						<option value="win">Win</option>
						<option value="loss">Loss</option>
						<option value="void">Void</option>
						<option value="half_win">Half win</option>
						<option value="half_loss">Half loss</option>
					</select>
					<Input
						value={search.sport}
						onChange={(event) =>
							navigate({
								search: (current) => ({
									...current,
									sport: event.target.value,
								}),
							})
						}
						placeholder="Filtrar por esporte"
					/>
					<Input
						value={search.bookmaker}
						onChange={(event) =>
							navigate({
								search: (current) => ({
									...current,
									bookmaker: event.target.value,
								}),
							})
						}
						placeholder="Filtrar por casa"
					/>
					<Input
						value={search.tag}
						onChange={(event) =>
							navigate({
								search: (current) => ({ ...current, tag: event.target.value }),
							})
						}
						placeholder="Filtrar por tag"
					/>
					<Button
						variant="outline"
						className="border-white/10 bg-white/5 text-zinc-50 hover:bg-white/10"
						onClick={() =>
							navigate({
								search: (current) => ({ ...current, status: statusDraft }),
							})
						}
					>
						Aplicar filtro
					</Button>
				</div>
			</section>

			<section className="mt-6 panel-card overflow-hidden">
				{!betsQuery.data || betsQuery.data.length === 0 ? (
					<EmptyState
						title="Nada por aqui ainda"
						description="Quando voce registrar as entradas, elas aparecem nesta mesa com filtros persistidos na URL."
						action={
							<Button asChild>
								<Link to="/bets/new">Criar primeira bet</Link>
							</Button>
						}
					/>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-y-3">
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												className="px-4 text-left text-[11px] uppercase tracking-[0.24em] text-zinc-500"
											>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody>
								{table.getRowModel().rows.map((row) => (
									<tr key={row.id} className="rounded-3xl bg-white/[0.03]">
										{row.getVisibleCells().map((cell) => (
											<td
												key={cell.id}
												className="px-4 py-4 align-top text-sm text-zinc-300 first:rounded-l-[28px] last:rounded-r-[28px]"
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</main>
	);
}

function QuickSettleButton({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<Button
			size="sm"
			variant="outline"
			className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
			onClick={onClick}
		>
			{label}
		</Button>
	);
}
