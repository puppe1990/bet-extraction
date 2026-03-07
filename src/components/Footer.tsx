import { useLocation } from "@tanstack/react-router";
import { useI18n } from "#/lib/i18n";

export default function Footer() {
	const { t } = useI18n();
	const location = useLocation();
	const inProduct =
		location.pathname === "/app" ||
		location.pathname.startsWith("/bets") ||
		location.pathname.startsWith("/bankroll") ||
		location.pathname.startsWith("/settings");

	return (
		<footer
			className={`border-t border-white/6 py-6 ${
				inProduct ? "max-md:hidden" : ""
			}`}
		>
			<div className="page-wrap flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
				<span>{t("footer.version")}</span>
				<span>{t("footer.tagline")}</span>
			</div>
		</footer>
	);
}
