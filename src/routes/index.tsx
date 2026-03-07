import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BarChart3,
	ChevronRight,
	Chrome,
	LayoutDashboard,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useI18n } from "#/lib/i18n";
import { sessionQueryOptions } from "#/lib/query-options";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const { t } = useI18n();
	const sessionQuery = useQuery(sessionQueryOptions());
	const authenticated = Boolean(sessionQuery.data?.user);
	const primaryTo = authenticated ? "/app" : "/login";
	const metricsPreview = [
		{ label: t("landing.metrics.roiReview"), value: "12.4%" },
		{ label: t("landing.metrics.yield"), value: "8.1%" },
		{ label: t("landing.metrics.winRate"), value: "56.8%" },
		{ label: t("landing.metrics.betsLogged"), value: "1,284" },
	];
	const featurePillars = [
		{
			title: t("landing.features.logFasterTitle"),
			description: t("landing.features.logFasterDescription"),
			icon: Chrome,
		},
		{
			title: t("landing.features.reviewDeeperTitle"),
			description: t("landing.features.reviewDeeperDescription"),
			icon: BarChart3,
		},
		{
			title: t("landing.features.operateClearlyTitle"),
			description: t("landing.features.operateClearlyDescription"),
			icon: ShieldCheck,
		},
	];
	const workflowSteps = [
		{
			step: "01",
			title: t("landing.workflow.logBetTitle"),
			description: t("landing.workflow.logBetDescription"),
		},
		{
			step: "02",
			title: t("landing.workflow.trackFlowTitle"),
			description: t("landing.workflow.trackFlowDescription"),
		},
		{
			step: "03",
			title: t("landing.workflow.reviewTitle"),
			description: t("landing.workflow.reviewDescription"),
		},
	];
	const faqs = [
		{
			question: t("landing.faqs.picksQuestion"),
			answer: t("landing.faqs.picksAnswer"),
		},
		{
			question: t("landing.faqs.extensionQuestion"),
			answer: t("landing.faqs.extensionAnswer"),
		},
		{
			question: t("landing.faqs.audienceQuestion"),
			answer: t("landing.faqs.audienceAnswer"),
		},
		{
			question: t("landing.faqs.bookmakersQuestion"),
			answer: t("landing.faqs.bookmakersAnswer"),
		},
	];
	const pricingTiers = [
		{
			name: t("landing.pricing.freeName"),
			price: "$0",
			kicker: t("landing.pricing.freeKicker"),
			features: [
				t("landing.pricing.freeFeature1"),
				t("landing.pricing.freeFeature2"),
				t("landing.pricing.freeFeature3"),
				t("landing.pricing.freeFeature4"),
			],
			cta: t("landing.pricing.freeCta"),
		},
		{
			name: t("landing.pricing.proName"),
			price: "$12",
			kicker: t("landing.pricing.proKicker"),
			features: [
				t("landing.pricing.proFeature1"),
				t("landing.pricing.proFeature2"),
				t("landing.pricing.proFeature3"),
				t("landing.pricing.proFeature4"),
			],
			cta: t("landing.pricing.proCta"),
			featured: true,
		},
		{
			name: t("landing.pricing.proPlusName"),
			price: "$29",
			kicker: t("landing.pricing.proPlusKicker"),
			features: [
				t("landing.pricing.proPlusFeature1"),
				t("landing.pricing.proPlusFeature2"),
				t("landing.pricing.proPlusFeature3"),
				t("landing.pricing.proPlusFeature4"),
			],
			cta: t("landing.pricing.proPlusCta"),
		},
	];

	return (
		<main className="landing-shell">
			<section className="landing-hero page-wrap">
				<div className="landing-copy">
					<div className="landing-kicker">
						<Sparkles className="size-3.5" />
						{t("landing.heroKicker")}
					</div>
					<h1 className="landing-title">
						{t("landing.heroTitle")}
					</h1>
					<p className="landing-lead">
						{t("landing.heroDescription")}
					</p>
					<div className="landing-actions">
						<Link to={primaryTo} className="cta-primary no-underline">
							{authenticated ? t("landing.openApp") : t("landing.startFree")}
							<ArrowRight className="size-4" />
						</Link>
						<a href="#extension" className="cta-secondary no-underline">
							{t("landing.getExtension")}
						</a>
					</div>
					<div className="landing-proof">
						<span>{t("landing.proofPrimary")}</span>
						<span>{t("landing.proofSecondary")}</span>
					</div>
				</div>

				<div className="landing-stage">
					<article className="dashboard-preview">
						<div className="preview-header">
							<div>
								<p className="preview-label">{t("landing.liveDesk")}</p>
								<h2>{t("landing.performanceTerminal")}</h2>
							</div>
							<div className="preview-chip">{t("landing.multiUser")}</div>
						</div>
						<div className="preview-metrics">
							{metricsPreview.map((metric) => (
								<div key={metric.label} className="preview-metric">
									<span>{metric.label}</span>
									<strong>{metric.value}</strong>
								</div>
							))}
						</div>
						<div className="preview-curve">
							<div className="curve-line" />
						</div>
						<div className="preview-rows">
							<div className="preview-row">
								<div>
									<p>Arsenal vs Liverpool</p>
									<span>Over 2.5 Goals</span>
								</div>
								<strong>+24.00</strong>
							</div>
							<div className="preview-row">
								<div>
									<p>Inter vs Grêmio</p>
									<span>BTTS Yes</span>
								</div>
								<strong>-18.00</strong>
							</div>
						</div>
					</article>

					<article className="extension-preview" id="extension">
						<div className="preview-header">
							<div>
								<p className="preview-label">{t("landing.chromeExtension")}</p>
								<h2>{t("landing.captureDraft")}</h2>
							</div>
							<Chrome className="size-5 text-amber-100" />
						</div>
						<div className="extension-fields">
							<div className="extension-field">
								<span>{t("landing.bookmaker")}</span>
								<strong>bet365</strong>
							</div>
							<div className="extension-field">
								<span>{t("landing.selection")}</span>
								<strong>Both Teams To Score: Yes</strong>
							</div>
							<div className="extension-grid">
								<div className="extension-field">
									<span>{t("landing.odds")}</span>
									<strong>1.83</strong>
								</div>
								<div className="extension-field">
									<span>{t("landing.stake")}</span>
									<strong>$30</strong>
								</div>
							</div>
						</div>
						<div className="extension-cta">
							<span>{t("landing.reviewBeforeSaving")}</span>
							<a href="#pricing" className="cta-secondary no-underline">
								{t("landing.viewPricing")}
							</a>
						</div>
					</article>
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="section-heading">
					<p className="section-kicker">{t("landing.whyKicker")}</p>
					<h2>{t("landing.whyTitle")}</h2>
					<p>{t("landing.whyDescription")}</p>
				</div>
				<div className="pillar-grid">
					{featurePillars.map(({ title, description, icon: Icon }) => (
						<article key={title} className="pillar-card">
							<div className="pillar-icon">
								<Icon className="size-5" />
							</div>
							<h3>{title}</h3>
							<p>{description}</p>
						</article>
					))}
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="analytics-band">
					<div className="section-heading">
						<p className="section-kicker">{t("landing.analyticsKicker")}</p>
						<h2>{t("landing.analyticsTitle")}</h2>
						<p>{t("landing.analyticsDescription")}</p>
					</div>
					<div className="analytics-list">
						<div className="analytics-item">
							<span>{t("landing.analyticsItems.bookmakerTitle")}</span>
							<strong>{t("landing.analyticsItems.bookmakerDescription")}</strong>
						</div>
						<div className="analytics-item">
							<span>{t("landing.analyticsItems.settlementTitle")}</span>
							<strong>{t("landing.analyticsItems.settlementDescription")}</strong>
						</div>
						<div className="analytics-item">
							<span>{t("landing.analyticsItems.timelineTitle")}</span>
							<strong>{t("landing.analyticsItems.timelineDescription")}</strong>
						</div>
					</div>
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="section-heading">
					<p className="section-kicker">{t("landing.realProductKicker")}</p>
					<h2>{t("landing.realProductTitle")}</h2>
					<p>{t("landing.realProductDescription")}</p>
				</div>
				<div className="product-proof">
					<div className="product-shot">
						<img
							src="/ledger-login.png"
							alt="Ledger login screen with product interface preview"
							className="product-image"
						/>
					</div>
					<div className="product-proof-copy">
						<div className="proof-bullet">
							<span className="proof-dot" />
							<div>
								<strong>{t("landing.productBullets.multiUserTitle")}</strong>
								<p>{t("landing.productBullets.multiUserDescription")}</p>
							</div>
						</div>
						<div className="proof-bullet">
							<span className="proof-dot" />
							<div>
								<strong>{t("landing.productBullets.settlementTitle")}</strong>
								<p>{t("landing.productBullets.settlementDescription")}</p>
							</div>
						</div>
						<div className="proof-bullet">
							<span className="proof-dot" />
							<div>
								<strong>{t("landing.productBullets.extensionTitle")}</strong>
								<p>{t("landing.productBullets.extensionDescription")}</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="section-heading">
					<p className="section-kicker">{t("landing.workflowKicker")}</p>
					<h2>{t("landing.workflowTitle")}</h2>
				</div>
				<div className="workflow-grid">
					{workflowSteps.map((item) => (
						<article key={item.step} className="workflow-card">
							<div className="workflow-step">{item.step}</div>
							<h3>{item.title}</h3>
							<p>{item.description}</p>
							<div className="workflow-link">
								<span>{t("landing.workflow.fromActionToRecord")}</span>
								<ChevronRight className="size-4" />
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="landing-section page-wrap" id="pricing">
				<div className="section-heading">
					<p className="section-kicker">{t("landing.pricingKicker")}</p>
					<h2>{t("landing.pricingTitle")}</h2>
					<p>{t("landing.pricingDescription")}</p>
				</div>
				<div className="pricing-grid">
					{pricingTiers.map((tier) => (
						<article
							key={tier.name}
							className={`pricing-card${tier.featured ? " pricing-card-featured" : ""}`}
						>
							<div className="pricing-topline">
								<span>{tier.kicker}</span>
								<h3>{tier.name}</h3>
							</div>
							<div className="pricing-price">
								<strong>{tier.price}</strong>
								{tier.price === "$0" ? (
									<span>{t("landing.pricing.forever")}</span>
								) : (
									<span>{t("landing.pricing.month")}</span>
								)}
							</div>
							<div className="pricing-features">
								{tier.features.map((feature) => (
									<div key={feature} className="pricing-feature">
										<span className="pricing-dot" />
										<span>{feature}</span>
									</div>
								))}
							</div>
							<Link to={primaryTo} className="cta-primary no-underline">
								{tier.cta}
							</Link>
						</article>
					))}
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="section-heading">
					<p className="section-kicker">{t("landing.faqKicker")}</p>
					<h2>{t("landing.faqTitle")}</h2>
				</div>
				<div className="faq-grid">
					{faqs.map((item) => (
						<article key={item.question} className="faq-card">
							<h3>{item.question}</h3>
							<p>{item.answer}</p>
						</article>
					))}
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="final-cta">
					<div>
						<p className="section-kicker">{t("landing.finalKicker")}</p>
						<h2>{t("landing.finalTitle")}</h2>
					</div>
					<div className="landing-actions">
						<Link to={primaryTo} className="cta-primary no-underline">
							{authenticated
								? t("landing.goToDashboard")
								: t("landing.createAccount")}
							<LayoutDashboard className="size-4" />
						</Link>
						<Link to="/login" className="cta-secondary no-underline">
							{t("landing.signIn")}
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
