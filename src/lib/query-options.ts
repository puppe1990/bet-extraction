import { queryOptions } from "@tanstack/react-query";
import {
	authSession,
	bankrollGetSummary,
	betsGetById,
	betsList,
	billingGetSummary,
	dashboardGetMetrics,
	tagsList,
} from "./server-functions";

export const sessionQueryOptions = () =>
	queryOptions({
		queryKey: ["auth", "session"],
		queryFn: () => authSession(),
		staleTime: 30_000,
	});

export const dashboardQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard", "metrics"],
		queryFn: () => dashboardGetMetrics(),
	});

export const bankrollSummaryQueryOptions = () =>
	queryOptions({
		queryKey: ["bankroll", "summary"],
		queryFn: () => bankrollGetSummary(),
	});

export const billingSummaryQueryOptions = () =>
	queryOptions({
		queryKey: ["billing", "summary"],
		queryFn: () => billingGetSummary(),
	});

export const betsListQueryOptions = (filters: Record<string, unknown>) =>
	queryOptions({
		queryKey: ["bets", filters],
		queryFn: () => betsList({ data: filters }),
	});

export const betByIdQueryOptions = (betId: string) =>
	queryOptions({
		queryKey: ["bets", betId],
		queryFn: () => betsGetById({ data: { betId } }),
	});

export const tagsListQueryOptions = () =>
	queryOptions({
		queryKey: ["tags"],
		queryFn: () => tagsList(),
	});
