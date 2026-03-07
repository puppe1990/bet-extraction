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
			navigate({ to: "/login" });
		},
	});

	const authenticated = Boolean(sessionQuery.data?.user);
	const compact = location.pathname === "/login";

	return (
		<header className="sticky top-0 z-50 border-b border-white/6 bg-[rgba(8,9,12,0.84)] backdrop-blur-xl">
			<nav className="page-wrap flex flex-wrap items-center gap-3 py-4">
				<Link to="/" className="brand-lockup no-underline">
					<span className="brand-dot" />
					<div>
						<div className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
							bankroll OS
						</div>
						<div className="text-sm font-semibold text-zinc-50">Ledger</div>
					</div>
				</Link>

				{!compact && authenticated ? (
					<div className="ml-auto flex flex-wrap items-center gap-2">
						<Link
							to="/"
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

				<div className="ml-auto flex items-center gap-3">
					{!compact && sessionQuery.data?.user ? (
						<div className="hidden text-right sm:block">
							<div className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
								Sessao ativa
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
							Sair
						</Button>
					) : null}
				</div>
			</nav>
		</header>
	);
}
