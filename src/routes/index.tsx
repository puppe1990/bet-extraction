import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BarChart3,
	Chrome,
	ChevronRight,
	LayoutDashboard,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { sessionQueryOptions } from "#/lib/query-options";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

const metricsPreview = [
	{ label: "ROI review", value: "12.4%", tone: "up" },
	{ label: "Yield", value: "8.1%", tone: "up" },
	{ label: "Win rate", value: "56.8%", tone: "neutral" },
	{ label: "Bets logged", value: "1,284", tone: "neutral" },
];

const featurePillars = [
	{
		title: "Log faster",
		description:
			"Capture bets from the bookmaker page or enter them manually when you need full control.",
		icon: Chrome,
	},
	{
		title: "Review deeper",
		description:
			"Understand performance by bookmaker, market, sport, stake size and time period.",
		icon: BarChart3,
	},
	{
		title: "Operate clearly",
		description:
			"Track deposits, withdrawals, stake flow and bankroll movement without spreadsheet cleanup.",
		icon: ShieldCheck,
	},
];

const workflowSteps = [
	{
		step: "01",
		title: "Log the bet",
		description:
			"Enter bets manually or use the Chrome extension to capture the draft from the bookmaker page.",
	},
	{
		step: "02",
		title: "Track bankroll flow",
		description:
			"Stake, deposits, withdrawals and settlements keep bankroll movement accurate without direct balance edits.",
	},
	{
		step: "03",
		title: "Review performance",
		description:
			"Break down what works by bookmaker, market, sport and result type to tighten your process over time.",
	},
];

const faqs = [
	{
		question: "Is Ledger a picks app?",
		answer:
			"No. Ledger is a bet tracking and bankroll analytics product. It helps you review performance, not generate predictions.",
	},
	{
		question: "Do I need the Chrome extension?",
		answer:
			"No. The app works with manual bet entry. The extension is the speed layer for users who want to remove typing and reduce mistakes.",
	},
	{
		question: "Who is this for?",
		answer:
			"Serious sports bettors, traders and small betting operators who already care about record quality, bankroll discipline and review.",
	},
	{
		question: "Will more bookmakers be supported?",
		answer:
			"Yes. The rollout should start narrow with a few strong integrations, then expand sportsbook coverage without sacrificing reliability.",
	},
];

const pricingTiers = [
	{
		name: "Free",
		price: "$0",
		kicker: "Build the habit",
		features: [
			"1 bankroll",
			"Up to 50 bets per month",
			"Manual bet logging",
			"Basic dashboard",
		],
		cta: "Start free",
	},
	{
		name: "Pro",
		price: "$12",
		kicker: "Most popular",
		features: [
			"Unlimited bets",
			"Full Chrome extension capture",
			"Advanced analytics",
			"CSV export",
		],
		cta: "Upgrade to Pro",
		featured: true,
	},
	{
		name: "Pro+",
		price: "$29",
		kicker: "High-volume users",
		features: [
			"Everything in Pro",
			"Multiple bankrolls",
			"Advanced reports",
			"Automations",
		],
		cta: "Go Pro+",
	},
];

function LandingPage() {
	const sessionQuery = useQuery(sessionQueryOptions());
	const authenticated = Boolean(sessionQuery.data?.user);
	const primaryTo = authenticated ? "/app" : "/login";

	return (
		<main className="landing-shell">
			<section className="landing-hero page-wrap">
				<div className="landing-copy">
					<div className="landing-kicker">
						<Sparkles className="size-3.5" />
						Bet tracking + bankroll analytics
					</div>
					<h1 className="landing-title">Track every bet. Understand your edge.</h1>
					<p className="landing-lead">
						Ledger gives serious sports bettors one place to log bets, manage
						bankroll and review ROI, yield, streaks and future CLV without the
						spreadsheet tax.
					</p>
					<div className="landing-actions">
						<Link to={primaryTo} className="cta-primary no-underline">
							{authenticated ? "Open app" : "Start free"}
							<ArrowRight className="size-4" />
						</Link>
						<a href="#extension" className="cta-secondary no-underline">
							Get the Chrome extension
						</a>
					</div>
					<div className="landing-proof">
						<span>Built for bettors who outgrew spreadsheets.</span>
						<span>Manual logging when you want it. One-click capture when you don&apos;t.</span>
					</div>
				</div>

				<div className="landing-stage">
					<article className="dashboard-preview">
						<div className="preview-header">
							<div>
								<p className="preview-label">Live desk</p>
								<h2>Performance terminal</h2>
							</div>
							<div className="preview-chip">Multi-user</div>
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
								<p className="preview-label">Chrome extension</p>
								<h2>Capture bet draft</h2>
							</div>
							<Chrome className="size-5 text-amber-100" />
						</div>
						<div className="extension-fields">
							<div className="extension-field">
								<span>Bookmaker</span>
								<strong>bet365</strong>
							</div>
							<div className="extension-field">
								<span>Selection</span>
								<strong>Both Teams To Score: Yes</strong>
							</div>
							<div className="extension-grid">
								<div className="extension-field">
									<span>Odds</span>
									<strong>1.83</strong>
								</div>
								<div className="extension-field">
									<span>Stake</span>
									<strong>$30</strong>
								</div>
							</div>
						</div>
						<div className="extension-cta">
							<span>Review before saving. Sync instantly to Ledger.</span>
							<a href="#pricing" className="cta-secondary no-underline">
								View pricing
							</a>
						</div>
					</article>
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="section-heading">
					<p className="section-kicker">Why it wins</p>
					<h2>One operating layer for every bet you place</h2>
					<p>
						Bets are scattered, bankroll records drift and review gets skipped.
						Ledger brings execution and analysis into the same workflow.
					</p>
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
						<p className="section-kicker">Analytics</p>
						<h2>See where your edge actually is</h2>
						<p>
							Review bankroll curve, ROI, yield, bookmaker performance, market
							breakdowns and disciplined bet history in one place.
						</p>
					</div>
					<div className="analytics-list">
						<div className="analytics-item">
							<span>Bookmaker breakdowns</span>
							<strong>Know where you perform best.</strong>
						</div>
						<div className="analytics-item">
							<span>Flexible settlement</span>
							<strong>Win, loss, void, cashout and half results.</strong>
						</div>
						<div className="analytics-item">
							<span>Bankroll timeline</span>
							<strong>Every deposit, withdrawal and settlement accounted for.</strong>
						</div>
					</div>
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="section-heading">
					<p className="section-kicker">Real product</p>
					<h2>Not a concept page. A working interface.</h2>
					<p>
						The current product already handles multi-user auth, bankroll
						movements, settlement states and the full bet journal workflow.
					</p>
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
								<strong>Multi-user from the base layer</strong>
								<p>
									Each account gets isolated sessions, bets, tags, transactions
									and dashboard metrics.
								</p>
							</div>
						</div>
						<div className="proof-bullet">
							<span className="proof-dot" />
							<div>
								<strong>Flexible settlement model</strong>
								<p>
									Support for win, loss, void, half win, half loss and cashout
									without hacking balances.
								</p>
							</div>
						</div>
						<div className="proof-bullet">
							<span className="proof-dot" />
							<div>
								<strong>Built for extension sync</strong>
								<p>
									The ledger model already treats each bet as an auditable flow,
									which is the right shape for Chrome capture.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="landing-section page-wrap">
				<div className="section-heading">
					<p className="section-kicker">How it works</p>
					<h2>Three steps to turn noisy betting activity into usable intelligence</h2>
				</div>
				<div className="workflow-grid">
					{workflowSteps.map((item) => (
						<article key={item.step} className="workflow-card">
							<div className="workflow-step">{item.step}</div>
							<h3>{item.title}</h3>
							<p>{item.description}</p>
							<div className="workflow-link">
								<span>From action to record</span>
								<ChevronRight className="size-4" />
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="landing-section page-wrap" id="pricing">
				<div className="section-heading">
					<p className="section-kicker">Pricing</p>
					<h2>Start free. Upgrade when speed and analysis matter.</h2>
					<p>
						The free plan proves the workflow. Paid plans unlock extension
						capture, deeper analytics and high-volume tooling.
					</p>
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
								{tier.price === "$0" ? <span>/forever</span> : <span>/month</span>}
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
					<p className="section-kicker">FAQ</p>
					<h2>Questions a serious bettor will ask before signing up</h2>
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
						<p className="section-kicker">Ready to launch</p>
						<h2>Use Ledger as the operating system for your betting workflow.</h2>
					</div>
					<div className="landing-actions">
						<Link to={primaryTo} className="cta-primary no-underline">
							{authenticated ? "Go to dashboard" : "Create account"}
							<LayoutDashboard className="size-4" />
						</Link>
						<Link to="/login" className="cta-secondary no-underline">
							Sign in
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
