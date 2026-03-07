import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { sessionQueryOptions } from "#/lib/query-options";
import { authLogout } from "#/lib/server-functions";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";

export default function Header() {
	const location = useLocation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const sessionQuery = useQuery(sessionQueryOptions());

	const logoutMutation = useMutation({
		mutationFn: () => authLogout(),
		onSuccess: async () => {
			await queryClient.invalidateQueries();
			navigate({ to: "/" });
		},
	});

	const authenticated = Boolean(sessionQuery.data?.user);
	const compact = location.pathname === "/login";
	const inProduct = authenticated && location.pathname !== "/";
	const homeTarget = authenticated ? "/app" : "/";

	return (
		<header className="sticky top-0 z-50 border-b border-white/6 bg-[rgba(8,9,12,0.84)] backdrop-blur-xl">
			<nav className="page-wrap flex flex-wrap items-center gap-3 py-4">
				<Link to={homeTarget} className="brand-lockup no-underline">
					<span className="brand-dot" />
					<div>
						<div className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							betting OS
						</div>
						<div className="text-sm font-semibold text-zinc-50">Ledger</div>
					</div>
				</Link>

				{!compact && inProduct ? (
					<div className="ml-auto flex flex-wrap items-center gap-2">
						<Link
							to="/app"
							className="nav-pill"
							activeProps={{ className: "nav-pill nav-pill-active" }}
						>
							Dashboard
						</Link>
						<Link
							to="/bets"
							className="nav-pill"
							activeProps={{ className: "nav-pill nav-pill-active" }}
						>
							Bets
						</Link>
						<Link
							to="/bankroll"
							className="nav-pill"
							activeProps={{ className: "nav-pill nav-pill-active" }}
						>
							Banca
						</Link>
						<Link
							to="/settings"
							className="nav-pill"
							activeProps={{ className: "nav-pill nav-pill-active" }}
						>
							Settings
						</Link>
					</div>
				) : null}

				{!compact && !authenticated ? (
					<div className="ml-auto hidden flex-wrap items-center gap-2 md:flex">
						<a href="/#extension" className="nav-pill">
							Extension
						</a>
						<a href="/#pricing" className="nav-pill">
							Pricing
						</a>
						<Link to="/login" className="nav-pill">
							Sign in
						</Link>
						<Link to="/login" className="cta-primary no-underline">
							Start free
						</Link>
					</div>
				) : null}

				<div className="ml-auto flex items-center gap-3">
					{!compact && inProduct && sessionQuery.data?.user ? (
						<div className="hidden text-right sm:block">
							<div className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								Active session
							</div>
							<div className="text-sm font-medium text-zinc-200">
								{sessionQuery.data.user.email}
							</div>
						</div>
					) : null}
					<ThemeToggle />
					{!compact && authenticated ? (
						<Button
							variant="outline"
							className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
							onClick={() => logoutMutation.mutate()}
						>
							Sign out
						</Button>
					) : null}
				</div>
			</nav>
		</header>
	);
}
