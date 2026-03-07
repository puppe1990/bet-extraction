import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { PasswordInput } from "#/components/ui/password-input";
import { formatCurrency } from "#/lib/money";
import {
	bankrollSummaryQueryOptions,
	billingSummaryQueryOptions,
	sessionQueryOptions,
} from "#/lib/query-options";
import {
	authChangePassword,
	authSession,
	billingCreateCheckoutSession,
	billingCreatePortalSession,
} from "#/lib/server-functions";

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
	const billingQuery = useQuery(billingSummaryQueryOptions());
	const queryClient = useQueryClient();
	const [currentPassword, setCurrentPassword] = useState("");
	const [nextPassword, setNextPassword] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const currentPlanKey = billingQuery.data?.planKey ?? "free";
	const currentInterval = billingQuery.data?.interval ?? null;
	const isActivePaidPlan =
		currentPlanKey !== "free" &&
		(billingQuery.data?.status === "active" ||
			billingQuery.data?.status === "trialing");

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

	const checkoutMutation = useMutation({
		mutationFn: billingCreateCheckoutSession,
		onSuccess: (result) => {
			window.location.href = result.url;
		},
		onError: (error) => {
			setMessage(error.message);
		},
	});

	const portalMutation = useMutation({
		mutationFn: () => billingCreatePortalSession(),
		onSuccess: (result) => {
			window.location.href = result.url;
		},
		onError: (error) => {
			setMessage(error.message);
		},
	});

	return (
		<main className="page-wrap py-10">
			<section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
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
					<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
						<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
							Plano
						</div>
						<div className="mt-2 flex items-center gap-3">
							<div className="text-xl font-semibold text-zinc-100">
								{currentPlanKey === "pro_plus"
									? "Pro+"
									: currentPlanKey === "pro"
										? "Pro"
										: "Free"}
							</div>
							{isActivePaidPlan ? (
								<div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
									Active
								</div>
							) : null}
						</div>
						<div className="mt-2 text-sm text-zinc-400">
							{billingQuery.data?.status
								? `Status: ${billingQuery.data.status}`
								: "Sem assinatura ativa."}
						</div>
						{billingQuery.data?.planKey === "free" &&
						billingQuery.data.monthlyBetLimit != null ? (
							<div className="mt-3 text-sm text-zinc-400">
								{billingQuery.data.monthlyBetsUsed}/
								{billingQuery.data.monthlyBetLimit} bets used this month
							</div>
						) : null}
					</div>
				</article>

				<div className="grid gap-6">
					<section className="panel-card space-y-5">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								Billing
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
								Upgrade and subscription control
							</h2>
						</div>
						{billingQuery.data && !billingQuery.data.isConfigured ? (
							<div className="rounded-2xl border border-amber-300/18 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
								Stripe ainda nao esta configurado neste ambiente. Adicione as
								chaves e price IDs para liberar Checkout e Customer Portal.
							</div>
						) : null}
						<div className="grid gap-4 md:grid-cols-2">
							<PlanCard
								title="Pro"
								price="$12/mo"
								features={[
									"Unlimited bets",
									"Full Chrome extension capture",
									"Advanced analytics",
									"CSV export",
								]}
								onMonthly={() =>
									checkoutMutation.mutate({
										data: { planKey: "pro", interval: "month" },
									})
								}
								onYearly={() =>
									checkoutMutation.mutate({
										data: { planKey: "pro", interval: "year" },
									})
								}
								activePlan={currentPlanKey === "pro"}
								activeInterval={currentPlanKey === "pro" ? currentInterval : null}
								disabled={
									!billingQuery.data?.isConfigured || checkoutMutation.isPending
								}
							/>
							<PlanCard
								title="Pro+"
								price="$29/mo"
								features={[
									"Everything in Pro",
									"Multiple bankrolls",
									"Automations",
									"Priority integrations",
								]}
								onMonthly={() =>
									checkoutMutation.mutate({
										data: { planKey: "pro_plus", interval: "month" },
									})
								}
								onYearly={() =>
									checkoutMutation.mutate({
										data: { planKey: "pro_plus", interval: "year" },
									})
								}
								activePlan={currentPlanKey === "pro_plus"}
								activeInterval={
									currentPlanKey === "pro_plus" ? currentInterval : null
								}
								disabled={
									!billingQuery.data?.isConfigured || checkoutMutation.isPending
								}
							/>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button
								variant="outline"
								disabled={
									!billingQuery.data?.stripeCustomerId || portalMutation.isPending
								}
								onClick={() => portalMutation.mutate()}
							>
								{portalMutation.isPending
									? "Opening portal..."
									: isActivePaidPlan
										? "Manage subscription"
										: "Open customer portal"}
							</Button>
							{billingQuery.data?.currentPeriodEnd ? (
								<div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
									Current period ends at {billingQuery.data.currentPeriodEnd}
								</div>
							) : null}
						</div>
					</section>

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
				</div>
			</section>
		</main>
	);
}

function PlanCard(props: {
	title: string;
	price: string;
	features: string[];
	onMonthly: () => void;
	onYearly: () => void;
	disabled: boolean;
	activePlan?: boolean;
	activeInterval?: "month" | "year" | null;
}) {
	return (
		<article
			className={`rounded-[28px] border bg-white/[0.03] p-5 ${
				props.activePlan
					? "border-emerald-400/20 shadow-[0_0_0_1px_rgba(74,222,128,0.06)]"
					: "border-white/6"
			}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
					{props.title}
				</div>
				{props.activePlan ? (
					<div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
						Current plan
					</div>
				) : null}
			</div>
			<div className="mt-2 text-3xl font-semibold text-zinc-50">
				{props.price}
			</div>
			<div className="mt-4 grid gap-2 text-sm text-zinc-300">
				{props.features.map((feature) => (
					<div key={feature}>{feature}</div>
				))}
			</div>
			<div className="mt-5 flex flex-wrap gap-3">
				<Button
					disabled={props.disabled || (props.activePlan && props.activeInterval === "month")}
					onClick={props.onMonthly}
					type="button"
				>
					{props.activePlan && props.activeInterval === "month"
						? "Current monthly"
						: "Monthly"}
				</Button>
				<Button
					variant="outline"
					disabled={props.disabled || (props.activePlan && props.activeInterval === "year")}
					onClick={props.onYearly}
					type="button"
				>
					{props.activePlan && props.activeInterval === "year"
						? "Current yearly"
						: "Yearly"}
				</Button>
			</div>
		</article>
	);
}
