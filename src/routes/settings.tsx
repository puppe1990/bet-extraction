import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Chrome, Download, LockKeyhole } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { PasswordInput } from "#/components/ui/password-input";
import { DateTimeText } from "#/lib/datetime";
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
	extensionCreateConnectionToken,
} from "#/lib/server-functions";

export const Route = createFileRoute("/settings")({
	validateSearch: (search) => ({
		billing:
			search.billing === "success" || search.billing === "canceled"
				? search.billing
				: undefined,
	}),
	beforeLoad: async () => {
		const session = await authSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: SettingsPage,
});

function SettingsPage() {
	const search = Route.useSearch();
	const sessionQuery = useQuery(sessionQueryOptions());
	const summaryQuery = useQuery(bankrollSummaryQueryOptions());
	const billingQuery = useQuery(billingSummaryQueryOptions());
	const queryClient = useQueryClient();
	const [currentPassword, setCurrentPassword] = useState("");
	const [nextPassword, setNextPassword] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [connectionToken, setConnectionToken] = useState<string | null>(null);
	const [connectionTokenExpiry, setConnectionTokenExpiry] = useState<
		string | null
	>(null);
	const currentPlanKey = billingQuery.data?.planKey ?? "free";
	const effectivePlanKey = billingQuery.data?.effectivePlanKey ?? "free";
	const currentInterval = billingQuery.data?.interval ?? null;
	const isLifetimePlan =
		currentPlanKey === "lifetime" && effectivePlanKey === "lifetime";
	const isActivePaidPlan =
		effectivePlanKey !== "free" &&
		(billingQuery.data?.status === "active" ||
			billingQuery.data?.status === "trialing");
	const isCancelScheduled =
		isActivePaidPlan && Boolean(billingQuery.data?.cancelAtPeriodEnd);
	const hasExpiredPaidPlan =
		currentPlanKey !== "free" && effectivePlanKey === "free";
	const billingStatusLabel = getBillingStatusLabel({
		planKey: currentPlanKey,
		effectivePlanKey,
		status: billingQuery.data?.status,
		cancelAtPeriodEnd: billingQuery.data?.cancelAtPeriodEnd,
	});

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

	const connectionTokenMutation = useMutation({
		mutationFn: () => extensionCreateConnectionToken(),
		onSuccess: (result) => {
			setConnectionToken(result.token);
			setConnectionTokenExpiry(result.expiresAt);
			setMessage(null);
		},
		onError: (error) => {
			setMessage(error.message);
		},
	});

	const billingNotice = getBillingNotice({
		checkoutState: search.billing,
		isActivePaidPlan,
		isCancelScheduled,
		hasExpiredPaidPlan,
		currentPeriodEnd: billingQuery.data?.currentPeriodEnd ?? null,
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
							Subscription
						</div>
						<div className="mt-2 flex items-center gap-3">
							<div className="text-xl font-semibold text-zinc-100">
								{currentPlanKey === "lifetime"
									? "Lifetime"
									: currentPlanKey === "pro_plus"
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
							{billingStatusLabel}
						</div>
						{hasExpiredPaidPlan ? (
							<div className="mt-3 rounded-2xl border border-amber-300/14 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
								Paid access ended. The account is back on Free entitlements.
							</div>
						) : null}
						{effectivePlanKey === "free" &&
						billingQuery.data?.monthlyBetLimit != null ? (
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
								Plan, upgrades and cancellation
							</h2>
						</div>
						{billingQuery.data && !billingQuery.data.isConfigured ? (
							<div className="rounded-2xl border border-amber-300/18 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
								Stripe ainda nao esta configurado neste ambiente. Adicione as
								chaves e price IDs para liberar Checkout e Customer Portal.
							</div>
						) : null}
						{billingNotice ? (
							<div
								className={`rounded-2xl border px-4 py-3 text-sm ${
									billingNotice.tone === "success"
										? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
										: billingNotice.tone === "warning"
											? "border-amber-300/18 bg-amber-300/8 text-amber-100"
											: "border-white/8 bg-white/[0.04] text-zinc-200"
								}`}
							>
								{billingNotice.body}
							</div>
						) : null}
						<div className="grid gap-3 rounded-[28px] border border-white/6 bg-white/[0.03] p-5 md:grid-cols-3">
							<div>
								<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
									Access now
								</p>
								<p className="mt-2 text-2xl font-semibold text-zinc-50">
									{effectivePlanKey === "lifetime"
										? "Lifetime"
										: effectivePlanKey === "pro_plus"
										? "Pro+"
										: effectivePlanKey === "pro"
											? "Pro"
											: "Free"}
								</p>
							</div>
							<div>
								<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
									Billing status
								</p>
								<p className="mt-2 text-base font-medium text-zinc-200">
									{billingQuery.data?.status ?? "inactive"}
								</p>
							</div>
							<div>
								<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
									Renewal
								</p>
								<div className="mt-2 text-base font-medium text-zinc-200">
									{billingQuery.data?.currentPeriodEnd ? (
										<DateTimeText value={billingQuery.data.currentPeriodEnd} />
									) : (
										"Not scheduled"
									)}
								</div>
							</div>
						</div>
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
								activeInterval={
									currentPlanKey === "pro" ? currentInterval : null
								}
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
							<ManualPlanCard
								title="Lifetime"
								price="Manual grant"
								features={[
									"Unlimited bets",
									"Extension capture",
									"Advanced analytics",
									"CSV export",
								]}
								activePlan={currentPlanKey === "lifetime"}
							/>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button
								variant="outline"
								disabled={
									isLifetimePlan ||
									!billingQuery.data?.stripeCustomerId ||
									portalMutation.isPending
								}
								onClick={() => portalMutation.mutate()}
							>
								{portalMutation.isPending
									? "Opening portal..."
									: isLifetimePlan
										? "Lifetime plan"
									: hasExpiredPaidPlan
										? "Review billing history"
										: isActivePaidPlan
											? "Manage subscription"
											: "Open customer portal"}
							</Button>
							{billingQuery.data?.currentPeriodEnd ? (
								<div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
									{isCancelScheduled
										? "Access ends at "
										: "Current period ends at "}
									<DateTimeText value={billingQuery.data.currentPeriodEnd} />
								</div>
							) : null}
						</div>
					</section>

					<section className="panel-card space-y-5" id="extension">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								Extension
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
								Capture and export access
							</h2>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<FeatureGateCard
								icon={<Chrome className="size-5" />}
								title="Chrome extension capture"
								description="Connect the extension, capture bets from bookmaker pages and push drafts into Ledger with less typing."
								enabled={Boolean(billingQuery.data?.canUseExtensionCapture)}
								enabledLabel="Included in your current access"
								lockedLabel="Pro required"
							/>
							<FeatureGateCard
								icon={<Download className="size-5" />}
								title="CSV export"
								description="Download filtered bet history for external reporting, tax workflows or deeper analysis outside the app."
								enabled={Boolean(billingQuery.data?.canExportCsv)}
								enabledLabel="Ready to use in Bets"
								lockedLabel="Pro required"
							/>
						</div>
						<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5 text-sm text-zinc-300">
							{billingQuery.data?.canUseExtensionCapture ? (
								<div className="space-y-4">
									<p>
										Your plan includes extension capture. Generate a one-time
										connection token here, then paste it into the Chrome
										extension popup to link this account.
									</p>
									<div className="flex flex-wrap gap-3">
										<Button
											disabled={connectionTokenMutation.isPending}
											onClick={() => connectionTokenMutation.mutate()}
											type="button"
										>
											{connectionTokenMutation.isPending
												? "Generating..."
												: "Connect Chrome extension"}
										</Button>
										{connectionToken ? (
											<div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-emerald-100 uppercase">
												Token ready
											</div>
										) : null}
									</div>
									{connectionToken ? (
										<div className="rounded-2xl border border-white/8 bg-[#0a1016] px-4 py-4">
											<div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
												One-time connection token
											</div>
											<div className="mt-3 break-all font-mono text-sm text-zinc-100">
												{connectionToken}
											</div>
											<div className="mt-3 text-xs text-zinc-400">
												Expires at{" "}
												{connectionTokenExpiry ? (
													<DateTimeText value={connectionTokenExpiry} />
												) : (
													"--"
												)}
											</div>
										</div>
									) : null}
									<ol className="grid gap-2 text-sm text-zinc-300">
										<li>1. Open the Chrome extension popup.</li>
										<li>2. Paste this token and confirm the app URL.</li>
										<li>
											3. The extension exchanges it for a persistent device
											token.
										</li>
									</ol>
								</div>
							) : (
								<p>
									Free accounts can log bets manually. Upgrade to Pro when you
									want CSV export and the Chrome extension capture workflow.
								</p>
							)}
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
							{passwordMutation.isPending
								? "Atualizando..."
								: "Atualizar senha"}
						</Button>
					</form>
				</div>
			</section>
		</main>
	);
}

function FeatureGateCard(props: {
	icon: ReactNode;
	title: string;
	description: string;
	enabled: boolean;
	enabledLabel: string;
	lockedLabel: string;
}) {
	return (
		<article
			className={`rounded-[28px] border p-5 ${
				props.enabled
					? "border-emerald-400/20 bg-emerald-400/10"
					: "border-white/6 bg-white/[0.03]"
			}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div
					className={`rounded-full border p-3 ${
						props.enabled
							? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
							: "border-white/8 bg-white/[0.04] text-zinc-200"
					}`}
				>
					{props.enabled ? props.icon : <LockKeyhole className="size-5" />}
				</div>
				<div
					className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
						props.enabled
							? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
							: "border border-amber-300/18 bg-amber-300/10 text-amber-100"
					}`}
				>
					{props.enabled ? props.enabledLabel : props.lockedLabel}
				</div>
			</div>
			<h3 className="mt-4 text-xl font-semibold text-zinc-50">{props.title}</h3>
			<p className="mt-2 text-sm text-zinc-300">{props.description}</p>
		</article>
	);
}

function ManualPlanCard(props: {
	title: string;
	price: string;
	features: string[];
	activePlan?: boolean;
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
				) : (
					<div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
						Internal grant
					</div>
				)}
			</div>
			<div className="mt-2 text-3xl font-semibold text-zinc-50">
				{props.price}
			</div>
			<div className="mt-4 grid gap-2 text-sm text-zinc-300">
				{props.features.map((feature) => (
					<div key={feature}>{feature}</div>
				))}
			</div>
			<div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
				Lifetime access is granted manually. It does not use Stripe Checkout or a recurring subscription.
			</div>
		</article>
	);
}

function getBillingStatusLabel(input: {
	planKey: string;
	effectivePlanKey: string;
	status?: string;
	cancelAtPeriodEnd?: boolean;
}) {
	if (!input.status || input.planKey === "free") {
		return "No paid subscription on file.";
	}

	if (input.planKey === "lifetime" && input.effectivePlanKey === "lifetime") {
		return "Status: active. Lifetime access is unlocked on this account.";
	}

	if (input.cancelAtPeriodEnd && input.effectivePlanKey !== "free") {
		return `Status: ${input.status}. Cancellation scheduled at period end.`;
	}

	if (input.effectivePlanKey === "free") {
		return `Status: ${input.status}. Paid access is no longer active.`;
	}

	return `Status: ${input.status}.`;
}

function getBillingNotice(input: {
	checkoutState?: "success" | "canceled";
	isActivePaidPlan: boolean;
	isCancelScheduled: boolean;
	hasExpiredPaidPlan: boolean;
	currentPeriodEnd: string | null;
}) {
	if (input.checkoutState === "success") {
		return {
			tone: "success" as const,
			body: "Checkout completed. If Stripe takes a few seconds to sync, refresh this page and the plan status will catch up.",
		};
	}

	if (input.isCancelScheduled && input.currentPeriodEnd) {
		return {
			tone: "warning" as const,
			body: "Cancellation is scheduled. Premium access stays active until the end of the current billing period.",
		};
	}

	if (input.hasExpiredPaidPlan) {
		return {
			tone: "neutral" as const,
			body: "This subscription already ended. Reactivate below to restore premium analytics and unlimited bet logging.",
		};
	}

	if (input.checkoutState === "canceled") {
		return {
			tone: "neutral" as const,
			body: "Checkout was canceled. No billing change was applied.",
		};
	}

	if (input.isActivePaidPlan) {
		return {
			tone: "success" as const,
			body: "Your paid plan is active. You can use the customer portal to switch plans, update payment details or cancel renewal.",
		};
	}

	return null;
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
					disabled={
						props.disabled ||
						(props.activePlan && props.activeInterval === "month")
					}
					onClick={props.onMonthly}
					type="button"
				>
					{props.activePlan && props.activeInterval === "month"
						? "Current monthly"
						: "Monthly"}
				</Button>
				<Button
					variant="outline"
					disabled={
						props.disabled ||
						(props.activePlan && props.activeInterval === "year")
					}
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
