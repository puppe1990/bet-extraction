import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BarChart3,
	Chrome,
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
