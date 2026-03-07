import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { PasswordInput } from "#/components/ui/password-input";
import { formatCurrency } from "#/lib/money";
import {
	bankrollSummaryQueryOptions,
	sessionQueryOptions,
} from "#/lib/query-options";
import { authChangePassword, authSession } from "#/lib/server-functions";

export const Route = createFileRoute("/settings")({
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: SettingsPage,
});

function SettingsPage() {
	const sessionQuery = useQuery(sessionQueryOptions());
	const summaryQuery = useQuery(bankrollSummaryQueryOptions());
	const queryClient = useQueryClient();
	const [currentPassword, setCurrentPassword] = useState("");
	const [nextPassword, setNextPassword] = useState("");
	const [message, setMessage] = useState<string | null>(null);

	const passwordMutation = useMutation({
		mutationFn: authChangePassword,
		onSuccess: async () => {
			setCurrentPassword("");
			setNextPassword("");
			setMessage("Senha atualizada.");
			await queryClient.invalidateQueries({ queryKey: ["auth"] });
		},
		onError: (error) => {
			setMessage(error.message);
		},
	});

	return (
		<main className="page-wrap py-10">
			<section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
				<article className="panel-card space-y-4">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							Usuario
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
							Settings
						</h1>
					</div>
					<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
						<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
							Email
						</div>
						<div className="mt-2 text-xl font-semibold text-zinc-100">
							{sessionQuery.data?.user.email}
						</div>
					</div>
					<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
						<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
							Banca atual
						</div>
						<div className="mt-2 text-xl font-semibold text-zinc-100">
							{formatCurrency(summaryQuery.data?.account.currentBalance)}
						</div>
					</div>
				</article>

				<form
					className="panel-card space-y-5"
					onSubmit={async (event) => {
						event.preventDefault();
						setMessage(null);
						await passwordMutation.mutateAsync({
							data: { currentPassword, nextPassword },
						});
					}}
				>
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							Seguranca
						</p>
						<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
							Trocar senha
						</h2>
					</div>
					<PasswordInput
						autoComplete="current-password"
						value={currentPassword}
						onChange={(event) => setCurrentPassword(event.target.value)}
						placeholder="Senha atual"
					/>
					<PasswordInput
						autoComplete="new-password"
						value={nextPassword}
						onChange={(event) => setNextPassword(event.target.value)}
						placeholder="Nova senha"
					/>
					{message ? (
						<div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
							{message}
						</div>
					) : null}
					<Button disabled={passwordMutation.isPending}>
						{passwordMutation.isPending ? "Atualizando..." : "Atualizar senha"}
					</Button>
				</form>
			</section>
		</main>
	);
}
