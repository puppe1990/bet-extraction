import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Chrome, Download, LockKeyhole } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { PasswordInput } from "#/components/ui/password-input";
import { DateTimeText } from "#/lib/datetime";
import { useI18n } from "#/lib/i18n";
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
	const { t } = useI18n();
	const search = Route.useSearch();
	const sessionQuery = useQuery(sessionQueryOptions());
	const summaryQuery = useQuery(bankrollSummaryQueryOptions());
	const billingQuery = useQuery(billingSummaryQueryOptions());
	const queryClient = useQueryClient();
	const [currentPassword, setCurrentPassword] = useState("");
	const [nextPassword, setNextPassword] = useState("");
	const [message, setMessage] = useState<string | null>(null);
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
		t,
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
			setMessage(t("settings.passwordUpdated"));
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

	const billingNotice = getBillingNotice({
		t,
		checkoutState: search.billing,
		isActivePaidPlan,
		isCancelScheduled,
		hasExpiredPaidPlan,
		currentPeriodEnd: billingQuery.data?.currentPeriodEnd ?? null,
	});

	return (
		<main className="page-wrap py-10">
			<section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
				<article className="panel-card hidden space-y-4 md:grid">
					<div>
						<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							{t("settings.user")}
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
							{t("settings.title")}
						</h1>
					</div>
					<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
						<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
							{t("settings.email")}
						</div>
						<div className="mt-2 text-xl font-semibold text-zinc-100">
							{sessionQuery.data?.user.email}
						</div>
					</div>
					<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
						<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
							{t("settings.currentBankroll")}
						</div>
						<div className="mt-2 text-xl font-semibold text-zinc-100">
							{formatCurrency(summaryQuery.data?.account.currentBalance)}
						</div>
					</div>
					<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
						<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
							{t("settings.subscription")}
						</div>
						<div className="mt-2 flex items-center gap-3">
							<div className="text-xl font-semibold text-zinc-100">
								{getPlanLabel(currentPlanKey, t)}
							</div>
							{isActivePaidPlan ? (
								<div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
									{t("settings.active")}
								</div>
							) : null}
						</div>
						<div className="mt-2 text-sm text-zinc-400">
							{billingStatusLabel}
						</div>
						{hasExpiredPaidPlan ? (
							<div className="mt-3 rounded-2xl border border-amber-300/14 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
								{t("settings.paidAccessEnded")}
							</div>
						) : null}
						{effectivePlanKey === "free" &&
						billingQuery.data?.monthlyBetLimit != null ? (
							<div className="mt-3 text-sm text-zinc-400">
								{t("settings.betsUsedThisMonth", {
									used: billingQuery.data.monthlyBetsUsed,
									limit: billingQuery.data.monthlyBetLimit,
								})}
							</div>
						) : null}
					</div>
				</article>

				<div className="grid gap-4 md:hidden">
					<div className="panel-card gap-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
									{t("settings.user")}
								</p>
								<h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
									{t("settings.title")}
								</h1>
							</div>
							<div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-200">
								{getPlanLabel(effectivePlanKey, t)}
							</div>
						</div>
						<div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
							<div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
								{t("settings.email")}
							</div>
							<div className="mt-2 break-all text-base font-semibold text-zinc-100">
								{sessionQuery.data?.user.email}
							</div>
							<div className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">
								{t("settings.currentBankroll")}
							</div>
							<div className="mt-2 text-2xl font-semibold text-zinc-50">
								{formatCurrency(summaryQuery.data?.account.currentBalance)}
							</div>
						</div>
					</div>

					<MobileSettingsSection
						kicker={t("settings.billing")}
						title={t("settings.billingTitle")}
						defaultOpen
					>
						<div className="grid gap-4">
							{billingQuery.data && !billingQuery.data.isConfigured ? (
								<div className="rounded-2xl border border-amber-300/18 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
									{t("settings.stripeMissing")}
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
							<div className="grid gap-3 rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
								<div>
									<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
										{t("settings.accessNow")}
									</p>
									<p className="mt-2 text-2xl font-semibold text-zinc-50">
										{getPlanLabel(effectivePlanKey, t)}
									</p>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
											{t("settings.billingStatus")}
										</p>
										<p className="mt-2 text-sm font-medium text-zinc-200">
											{billingQuery.data?.status ?? t("settings.statusInactive")}
										</p>
									</div>
									<div>
										<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
											{t("settings.renewal")}
										</p>
										<div className="mt-2 text-sm font-medium text-zinc-200">
											{billingQuery.data?.currentPeriodEnd ? (
												<DateTimeText value={billingQuery.data.currentPeriodEnd} />
											) : (
												t("settings.notScheduled")
											)}
										</div>
									</div>
								</div>
							</div>
							<div className="grid gap-3">
								<PlanCard
									title="Pro"
									price="$12/mo"
									t={t}
									features={[
										t("landing.pricing.proFeature1"),
										t("landing.pricing.proFeature2"),
										t("landing.pricing.proFeature3"),
										t("landing.pricing.proFeature4"),
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
									t={t}
									features={[
										t("landing.pricing.proPlusFeature1"),
										t("landing.pricing.proPlusFeature2"),
										t("landing.pricing.proPlusFeature4"),
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
									title={t("settings.planLifetime")}
									price={t("settings.lifetimePrice")}
									t={t}
									features={[
										t("landing.pricing.proFeature1"),
										t("settings.extensionCaptureTitle"),
										t("landing.pricing.proFeature3"),
										t("landing.pricing.proFeature4"),
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
										? t("settings.openingPortal")
										: isLifetimePlan
											? t("settings.lifetimePlan")
											: hasExpiredPaidPlan
												? t("settings.reviewBillingHistory")
												: isActivePaidPlan
													? t("settings.manageSubscription")
													: t("settings.openCustomerPortal")}
								</Button>
							</div>
						</div>
					</MobileSettingsSection>

					<MobileSettingsSection
						kicker={t("settings.extension")}
						title={t("settings.extensionTitle")}
					>
						<div className="grid gap-4">
							<div className="grid gap-4">
								<FeatureGateCard
									icon={<Chrome className="size-5" />}
									title={t("settings.extensionCaptureTitle")}
									description={t("settings.extensionCaptureDescription")}
									enabled={Boolean(billingQuery.data?.canUseExtensionCapture)}
									enabledLabel={t("settings.featureIncluded")}
									lockedLabel={t("settings.proRequired")}
								/>
								<FeatureGateCard
									icon={<Download className="size-5" />}
									title={t("settings.csvTitle")}
									description={t("settings.csvDescription")}
									enabled={Boolean(billingQuery.data?.canExportCsv)}
									enabledLabel={t("settings.csvReady")}
									lockedLabel={t("settings.proRequired")}
								/>
							</div>
							<div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4 text-sm text-zinc-300">
								{billingQuery.data?.canUseExtensionCapture ? (
									<div className="space-y-4">
										<p>{t("settings.extensionDescription")}</p>
										<ol className="grid gap-2 text-sm text-zinc-300">
											<li>{t("settings.stepsOpenExtension")}</li>
											<li>{t("settings.stepsSignInExtension")}</li>
											<li>{t("settings.stepsExchangeToken")}</li>
										</ol>
									</div>
								) : (
									<p>{t("settings.extensionLocked")}</p>
								)}
							</div>
						</div>
					</MobileSettingsSection>

					<MobileSettingsSection
						kicker={t("settings.security")}
						title={t("settings.securityTitle")}
					>
						<form
							className="grid gap-4"
							onSubmit={async (event) => {
								event.preventDefault();
								setMessage(null);
								await passwordMutation.mutateAsync({
									data: { currentPassword, nextPassword },
								});
							}}
						>
							<PasswordInput
								autoComplete="current-password"
								value={currentPassword}
								onChange={(event) => setCurrentPassword(event.target.value)}
								placeholder={t("settings.currentPassword")}
							/>
							<PasswordInput
								autoComplete="new-password"
								value={nextPassword}
								onChange={(event) => setNextPassword(event.target.value)}
								placeholder={t("settings.newPassword")}
							/>
							{message ? (
								<div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
									{message}
								</div>
							) : null}
							<Button disabled={passwordMutation.isPending}>
								{passwordMutation.isPending
									? t("settings.updating")
									: t("settings.updatePassword")}
							</Button>
						</form>
					</MobileSettingsSection>
				</div>

				<div className="hidden gap-6 md:grid">
					<section className="panel-card space-y-5">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								{t("settings.billing")}
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
								{t("settings.billingTitle")}
							</h2>
						</div>
						{billingQuery.data && !billingQuery.data.isConfigured ? (
							<div className="rounded-2xl border border-amber-300/18 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">
								{t("settings.stripeMissing")}
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
									{t("settings.accessNow")}
								</p>
								<p className="mt-2 text-2xl font-semibold text-zinc-50">
									{getPlanLabel(effectivePlanKey, t)}
								</p>
							</div>
							<div>
								<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
									{t("settings.billingStatus")}
								</p>
								<p className="mt-2 text-base font-medium text-zinc-200">
									{billingQuery.data?.status ?? t("settings.statusInactive")}
								</p>
							</div>
							<div>
								<p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
									{t("settings.renewal")}
								</p>
								<div className="mt-2 text-base font-medium text-zinc-200">
									{billingQuery.data?.currentPeriodEnd ? (
										<DateTimeText value={billingQuery.data.currentPeriodEnd} />
									) : (
										t("settings.notScheduled")
									)}
								</div>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<PlanCard
								title="Pro"
								price="$12/mo"
								t={t}
								features={[
									t("landing.pricing.proFeature1"),
									t("landing.pricing.proFeature2"),
									t("landing.pricing.proFeature3"),
									t("landing.pricing.proFeature4"),
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
								t={t}
								features={[
									t("landing.pricing.proPlusFeature1"),
									t("landing.pricing.proPlusFeature2"),
									t("landing.pricing.proPlusFeature4"),
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
								title={t("settings.planLifetime")}
								price={t("settings.lifetimePrice")}
								t={t}
								features={[
									t("landing.pricing.proFeature1"),
									t("settings.extensionCaptureTitle"),
									t("landing.pricing.proFeature3"),
									t("landing.pricing.proFeature4"),
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
									? t("settings.openingPortal")
									: isLifetimePlan
										? t("settings.lifetimePlan")
									: hasExpiredPaidPlan
										? t("settings.reviewBillingHistory")
										: isActivePaidPlan
											? t("settings.manageSubscription")
											: t("settings.openCustomerPortal")}
							</Button>
							{billingQuery.data?.currentPeriodEnd ? (
								<div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
									{isCancelScheduled
										? t("settings.accessEndsAt")
										: t("settings.currentPeriodEndsAt")}
									<DateTimeText value={billingQuery.data.currentPeriodEnd} />
								</div>
							) : null}
						</div>
					</section>

					<section className="panel-card space-y-5" id="extension">
						<div>
							<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								{t("settings.extension")}
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
								{t("settings.extensionTitle")}
							</h2>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<FeatureGateCard
								icon={<Chrome className="size-5" />}
								title={t("settings.extensionCaptureTitle")}
								description={t("settings.extensionCaptureDescription")}
								enabled={Boolean(billingQuery.data?.canUseExtensionCapture)}
								enabledLabel={t("settings.featureIncluded")}
								lockedLabel={t("settings.proRequired")}
							/>
							<FeatureGateCard
								icon={<Download className="size-5" />}
								title={t("settings.csvTitle")}
								description={t("settings.csvDescription")}
								enabled={Boolean(billingQuery.data?.canExportCsv)}
								enabledLabel={t("settings.csvReady")}
								lockedLabel={t("settings.proRequired")}
							/>
						</div>
						<div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5 text-sm text-zinc-300">
							{billingQuery.data?.canUseExtensionCapture ? (
								<div className="space-y-4">
									<p>
										{t("settings.extensionDescription")}
									</p>
									<ol className="grid gap-2 text-sm text-zinc-300">
										<li>{t("settings.stepsOpenExtension")}</li>
										<li>{t("settings.stepsSignInExtension")}</li>
										<li>{t("settings.stepsExchangeToken")}</li>
									</ol>
								</div>
							) : (
								<p>
									{t("settings.extensionLocked")}
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
								{t("settings.security")}
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-zinc-50">
								{t("settings.securityTitle")}
							</h2>
						</div>
						<PasswordInput
							autoComplete="current-password"
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.target.value)}
							placeholder={t("settings.currentPassword")}
						/>
						<PasswordInput
							autoComplete="new-password"
							value={nextPassword}
							onChange={(event) => setNextPassword(event.target.value)}
							placeholder={t("settings.newPassword")}
						/>
						{message ? (
							<div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
								{message}
							</div>
						) : null}
						<Button disabled={passwordMutation.isPending}>
							{passwordMutation.isPending
								? t("settings.updating")
								: t("settings.updatePassword")}
						</Button>
					</form>
				</div>
			</section>
		</main>
	);
}

function MobileSettingsSection({
	kicker,
	title,
	defaultOpen = false,
	children,
}: {
	kicker: string;
	title: string;
	defaultOpen?: boolean;
	children: ReactNode;
}) {
	return (
		<details className="mobile-settings-section" open={defaultOpen}>
			<summary className="mobile-settings-section__summary">
				<div>
					<div className="mobile-settings-section__kicker">{kicker}</div>
					<div className="mobile-settings-section__title">{title}</div>
				</div>
				<div className="mobile-settings-section__chevron">+</div>
			</summary>
			<div className="mobile-settings-section__body">{children}</div>
		</details>
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
	t: (key: string, vars?: Record<string, string | number>) => string;
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
						{props.t("settings.active")}
					</div>
				) : (
					<div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
						{props.t("settings.planLifetime")}
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
				{props.t("settings.lifetimeDescription")}
			</div>
		</article>
	);
}

function getBillingStatusLabel(input: {
	t: (key: string, vars?: Record<string, string | number>) => string;
	planKey: string;
	effectivePlanKey: string;
	status?: string;
	cancelAtPeriodEnd?: boolean;
}) {
	if (!input.status || input.planKey === "free") {
		return input.t("settings.expiredSubscription");
	}

	if (input.planKey === "lifetime" && input.effectivePlanKey === "lifetime") {
		return input.t("settings.lifetimeStatus");
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
	t: (key: string, vars?: Record<string, string | number>) => string;
	checkoutState?: "success" | "canceled";
	isActivePaidPlan: boolean;
	isCancelScheduled: boolean;
	hasExpiredPaidPlan: boolean;
	currentPeriodEnd: string | null;
}) {
	if (input.checkoutState === "success") {
		return {
			tone: "success" as const,
			body: input.t("settings.checkoutSuccess"),
		};
	}

	if (input.isCancelScheduled && input.currentPeriodEnd) {
		return {
			tone: "warning" as const,
			body: input.t("settings.cancelScheduled"),
		};
	}

	if (input.hasExpiredPaidPlan) {
		return {
			tone: "neutral" as const,
			body: input.t("settings.expiredSubscription"),
		};
	}

	if (input.checkoutState === "canceled") {
		return {
			tone: "neutral" as const,
			body: input.t("settings.checkoutCanceled"),
		};
	}

	if (input.isActivePaidPlan) {
		return {
			tone: "success" as const,
			body: input.t("settings.activeSubscription"),
		};
	}

	return null;
}

function PlanCard(props: {
	title: string;
	price: string;
	features: string[];
	t: (key: string, vars?: Record<string, string | number>) => string;
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
						{props.t("settings.active")}
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
						? `Current monthly`
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

function getPlanLabel(
	planKey: string,
	t: (key: string, vars?: Record<string, string | number>) => string,
) {
	switch (planKey) {
		case "lifetime":
			return t("settings.planLifetime");
		case "pro_plus":
			return t("settings.planProPlus");
		case "pro":
			return t("settings.planPro");
		default:
			return t("settings.planFree");
	}
}
