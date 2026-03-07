import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { PasswordInput } from "#/components/ui/password-input";
import { authLogin, authSession, authSignup } from "#/lib/server-functions";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const session = await authSession();
		if (session) {
			throw redirect({ to: "/" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const loginMutation = useMutation({
		mutationFn: () => authLogin({ data: { email, password } }),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			navigate({ to: "/" });
		},
		onError: (error) => {
			setErrorMessage(error.message);
		},
	});

	const signupMutation = useMutation({
		mutationFn: () =>
			authSignup({
				data: {
					email,
					password,
					confirmPassword,
				},
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			navigate({ to: "/" });
		},
		onError: (error) => {
			setErrorMessage(error.message);
		},
	});

	const isBusy = loginMutation.isPending || signupMutation.isPending;
	const submitLabel =
		mode === "login"
			? loginMutation.isPending
				? "Entrando..."
				: "Entrar"
			: signupMutation.isPending
				? "Criando conta..."
				: "Criar conta";

	return (
		<main className="page-wrap grid min-h-[calc(100vh-190px)] place-items-center py-10">
			<section className="login-shell grid w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/8 lg:grid-cols-[1.2fr_0.8fr]">
				<div className="relative overflow-hidden border-b border-white/8 p-8 lg:border-b-0 lg:border-r lg:p-12">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,162,74,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(49,208,170,0.18),transparent_34%)]" />
					<div className="relative space-y-8">
						<div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-amber-100">
							bankroll control
						</div>
						<div className="space-y-5">
							<h1 className="max-w-2xl text-5xl leading-none font-semibold tracking-tight text-white">
								O painel que trata stake, retorno e caixa como um livro-razao.
							</h1>
							<p className="max-w-xl text-lg text-zinc-300">
								Entre ou crie sua conta para acompanhar suas apostas com banca,
								ROI e curva totalmente isolados dos demais usuarios.
							</p>
						</div>
						<div className="grid gap-4 md:grid-cols-3">
							{[
								["Banca isolada", "Cada conta nasce com uma banca propria."],
								[
									"Liquidacao rapida",
									"Win, loss, void e halfs sem recalculo manual.",
								],
								[
									"Sessao privada",
									"Cada usuario enxerga apenas as proprias bets e metricas.",
								],
							].map(([title, description]) => (
								<article
									key={title}
									className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5"
								>
									<h2 className="text-lg font-semibold text-zinc-100">
										{title}
									</h2>
									<p className="mt-3 text-sm text-zinc-400">{description}</p>
								</article>
							))}
						</div>
					</div>
				</div>

				<div className="bg-black/30 p-8 lg:p-12">
					<form
						className="panel-card h-full justify-center"
						onSubmit={async (event) => {
							event.preventDefault();
							setErrorMessage(null);
							if (mode === "login") {
								loginMutation.mutate();
								return;
							}
							signupMutation.mutate();
						}}
					>
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								Acesso
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
								{mode === "login" ? "Entrar na mesa" : "Abrir nova conta"}
							</h2>
						</div>
						<div className="grid grid-cols-2 gap-2 rounded-full border border-white/8 bg-white/[0.03] p-1">
							<button
								type="button"
								className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition ${
									mode === "login"
										? "bg-amber-300 text-black"
										: "text-zinc-400 hover:text-zinc-100"
								}`}
								onClick={() => {
									setErrorMessage(null);
									setMode("login");
								}}
							>
								Login
							</button>
							<button
								type="button"
								className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition ${
									mode === "signup"
										? "bg-amber-300 text-black"
										: "text-zinc-400 hover:text-zinc-100"
								}`}
								onClick={() => {
									setErrorMessage(null);
									setMode("signup");
								}}
							>
								Signup
							</button>
						</div>
						<div className="grid gap-2">
							<span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
								Email
							</span>
							<Input
								type="email"
								autoComplete="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="voce@dominio.com"
							/>
						</div>
						<div className="grid gap-2">
							<span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
								Senha
							</span>
							<PasswordInput
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="••••••••"
							/>
						</div>
						{mode === "signup" ? (
							<div className="grid gap-2">
								<span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
									Confirmar senha
								</span>
								<PasswordInput
									autoComplete="new-password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									placeholder="••••••••"
								/>
							</div>
						) : null}

						{errorMessage ? (
							<div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
								{errorMessage}
							</div>
						) : null}

						<Button className="w-full" disabled={isBusy}>
							{submitLabel}
						</Button>

						<p className="text-sm text-zinc-500">
							{mode === "login" ? (
								<>
									Login para contas existentes. Cada conta acessa apenas a
									propria banca.
								</>
							) : (
								<>
									O signup cria automaticamente um novo usuario com banca
									principal propria e saldo inicial zero.
								</>
							)}
						</p>
					</form>
				</div>
			</section>
		</main>
	);
}
