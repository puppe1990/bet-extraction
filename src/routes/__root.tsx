import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useLocation,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Footer from "../components/Footer";
import Header from "../components/Header";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import { I18nProvider } from "../lib/i18n";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "theme-color",
				content: "#0a1632",
			},
			{
				title: "Ledger",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "any",
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-emerald-400/20">
				<TanStackQueryProvider>
					<I18nProvider>
						<AppChrome>{children}</AppChrome>
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
					</I18nProvider>
				</TanStackQueryProvider>
				<Scripts />
			</body>
		</html>
	);
}

function AppChrome({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const isNavigating = useRouterState({
		select: (state) =>
			state.isLoading || state.matches.some((match) => match.status === "pending"),
	});
	const inProduct =
		location.pathname === "/app" ||
		location.pathname.startsWith("/bets") ||
		location.pathname.startsWith("/bankroll") ||
		location.pathname.startsWith("/settings");

	return (
		<div className={inProduct ? "app-shell-frame" : "marketing-shell-frame"}>
			<Header />
			<RouteSpinner visible={isNavigating} />
			<div className={inProduct ? "app-shell-content" : "marketing-shell-content"}>
				{children}
			</div>
			<Footer />
		</div>
	);
}

function RouteSpinner({ visible }: { visible: boolean }) {
	return (
		<div
			aria-hidden={!visible}
			className={`route-spinner-shell ${visible ? "route-spinner-shell--visible" : ""}`}
		>
			<div className="route-spinner-bar" />
			<div className="route-spinner-chip">
				<div className="route-spinner-ring" />
				<span>Syncing view</span>
			</div>
		</div>
	);
}
