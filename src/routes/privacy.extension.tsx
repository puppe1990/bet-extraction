import { createFileRoute, Link } from "@tanstack/react-router";

const sections = [
	{
		title: "What the extension accesses",
		items: [
			"Account email and password entered by the user in the extension popup.",
			"The active browser tab only when the user explicitly clicks capture.",
			"Bet draft information visible on the current sportsbook page, such as bookmaker, event, market, selection, odds and stake when available.",
			"Local extension state stored in Chrome, such as session token, connected user, saved draft preview and lightweight account snapshot.",
		],
	},
	{
		title: "How the data is used",
		items: [
			"Authenticate the user with the BankrollKit web application.",
			"Capture and normalize a draft bet from the current page.",
			"Send the draft to BankrollKit for preview or save.",
			"Show a compact account snapshot inside the extension popup.",
			"BankrollKit Capture does not use captured data for advertising.",
		],
	},
	{
		title: "Data storage",
		items: [
			"The extension stores a small amount of data locally in Chrome storage, including application URL, session token, connected user email, connected device metadata, latest draft capture and compact account summary returned by BankrollKit.",
			"This local data is used only to keep the extension signed in and usable between sessions.",
		],
	},
	{
		title: "Data sharing",
		items: [
			"The extension sends data only to the configured BankrollKit backend. The default backend is https://bankrollkit.netlify.app.",
			"Captured draft data is sent only when the user explicitly requests preview or save.",
			"The extension does not sell user data and does not share user data with third-party advertisers or data brokers.",
		],
	},
	{
		title: "Page access behavior",
		items: [
			"The extension does not continuously scrape every page.",
			"It injects the page parser only when the user clicks the capture action in the popup.",
		],
	},
	{
		title: "Third parties and security",
		items: [
			"The BankrollKit backend may rely on infrastructure providers required to operate the service, such as hosting, database and billing providers.",
			"We take reasonable steps to limit retained data inside the extension and to transmit requests only to the BankrollKit backend over HTTPS in production.",
		],
	},
	{
		title: "User choices",
		items: [
			"Disconnect the extension at any time.",
			"Remove the extension from Chrome.",
			"Clear local extension data by disconnecting or uninstalling the extension.",
		],
	},
];

export const Route = createFileRoute("/privacy/extension")({
	head: () => ({
		meta: [
			{
				title: "BankrollKit Capture Privacy Policy",
			},
			{
				name: "description",
				content:
					"Privacy policy for the BankrollKit Capture Chrome extension.",
			},
		],
	}),
	component: ExtensionPrivacyPage,
});

function ExtensionPrivacyPage() {
	return (
		<main className="page-wrap py-10">
			<section className="hero-panel">
				<div className="space-y-4">
					<div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-amber-100">
						BankrollKit Capture
					</div>
					<div className="max-w-3xl space-y-3">
						<h1 className="text-4xl leading-none font-semibold tracking-tight text-white sm:text-5xl">
							Privacy Policy
						</h1>
						<p className="max-w-2xl text-base text-zinc-300 sm:text-lg">
							Last updated: March 7, 2026. This page explains what the BankrollKit
							Capture Chrome extension accesses, stores and sends when a user
							signs in, captures a draft and syncs it to BankrollKit.
						</p>
					</div>
				</div>
			</section>

			<section className="mt-8 panel-card space-y-6">
				<p className="max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
					<code className="rounded bg-white/5 px-2 py-1 text-zinc-100">
						BankrollKit Capture
					</code>{" "}
					is a Chrome extension that lets users sign in to BankrollKit, capture
					sportsbook bet drafts from the active tab and send those drafts to
					the BankrollKit web application.
				</p>

				<div className="grid gap-4">
					{sections.map((section) => (
						<article
							key={section.title}
							className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5 sm:p-6"
						>
							<h2 className="text-xl font-semibold text-zinc-50">
								{section.title}
							</h2>
							<ul className="mt-4 grid gap-3 text-sm leading-7 text-zinc-300 sm:text-base">
								{section.items.map((item) => (
									<li key={item} className="flex gap-3">
										<span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-200" />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</article>
					))}
				</div>
			</section>

			<section className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
				<div className="panel-card">
					<p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
						Contact
					</p>
					<p className="mt-3 text-sm leading-7 text-zinc-300 sm:text-base">
						For privacy questions related to BankrollKit Capture, contact{" "}
						<a
							href="mailto:matheus.puppe@gmail.com"
							className="text-amber-100 underline decoration-amber-200/40 underline-offset-4"
						>
							matheus.puppe@gmail.com
						</a>
						.
					</p>
				</div>

				<div className="flex items-center">
					<Link to="/" className="cta-secondary no-underline">
						Back to BankrollKit
					</Link>
				</div>
			</section>
		</main>
	);
}
