import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	changePasswordForCurrentUser,
	getCurrentSession,
	loginWithPassword,
	logoutCurrentSession,
	requireCurrentSession,
	signupWithPassword,
} from "#/lib/server/auth.server";
import {
	addManualTransaction,
	getBankrollSummary,
} from "#/lib/server/bankroll.server";
import {
	createBillingPortalSessionForUser,
	createCheckoutSessionForUser,
	getBillingSummary,
} from "#/lib/server/billing.server";
import {
	createBet,
	createTag,
	deleteBet,
	getBetById,
	listBets,
	listTags,
	normalizeBetInput,
	reopenBet,
	settleBet,
	updateBet,
} from "#/lib/server/bets.server";
import { getDashboardMetrics } from "#/lib/server/dashboard.server";
import { billingIntervals, billingPlanKeys } from "./billing";
import { betStatuses } from "./domain";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

const signupSchema = loginSchema
	.extend({
		confirmPassword: z.string().min(8),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirmPassword) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["confirmPassword"],
				message: "As senhas precisam ser iguais.",
			});
		}
	});

const manualTransactionSchema = z.object({
	type: z.enum(["deposit", "withdraw", "adjustment"]),
	amount: z.number().positive(),
	note: z.string().max(240).optional(),
	occurredAt: z.string().optional(),
});

const betInputSchema = z.object({
	sport: z.string().min(1),
	market: z.string().min(1),
	eventName: z.string().min(1),
	selection: z.string().min(1),
	bookmaker: z.string().min(1),
	oddsDecimal: z.number().positive(),
	stakeAmount: z.number().positive(),
	placedAt: z.string().min(1),
	note: z.string().optional(),
	tags: z.array(z.string()).optional(),
	tagsText: z.string().optional(),
});

const betFiltersSchema = z.object({
	status: z.enum(["all", ...betStatuses]).optional(),
	sport: z.string().optional(),
	bookmaker: z.string().optional(),
	tag: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional(),
});

export const authSession = createServerFn({
	method: "GET",
}).handler(async () => {
	return getCurrentSession();
});

export const authLogin = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => loginSchema.parse(input))
	.handler(async ({ data }) => {
		const session = await loginWithPassword(data.email, data.password);
		if (!session) {
			throw new Error("Email ou senha invalidos.");
		}
		return session;
	});

export const authSignup = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => signupSchema.parse(input))
	.handler(async ({ data }) => {
		return signupWithPassword(data.email, data.password);
	});

export const authLogout = createServerFn({ method: "POST" }).handler(
	async () => {
		await logoutCurrentSession();
		return { success: true };
	},
);

export const bankrollGetSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await requireCurrentSession();
		return getBankrollSummary(session.user.id);
	},
);

export const bankrollAddTransaction = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => manualTransactionSchema.parse(input))
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return addManualTransaction({ ...data, userId: session.user.id });
	});

export const betsList = createServerFn({ method: "GET" })
	.inputValidator((input: unknown) => betFiltersSchema.parse(input ?? {}))
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return listBets({ ...data, userId: session.user.id });
	});

export const betsCreate = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) => betInputSchema.parse(input))
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return createBet(session.user.id, normalizeBetInput(data));
	});

export const betsUpdate = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) =>
		z
			.object({
				betId: z.string().uuid(),
				values: betInputSchema,
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return updateBet(
			session.user.id,
			data.betId,
			normalizeBetInput(data.values),
		);
	});

export const betsSettle = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) =>
		z
			.object({
				betId: z.string().uuid(),
				status: z.enum([
					"win",
					"loss",
					"void",
					"cashout",
					"half_win",
					"half_loss",
				]),
				settledAt: z.string(),
				customReturnAmount: z.number().min(0).optional(),
			})
			.superRefine((data, ctx) => {
				if (data.status === "cashout" && data.customReturnAmount == null) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["customReturnAmount"],
						message: "Informe o retorno do cashout.",
					});
				}
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return settleBet(
			session.user.id,
			data.betId,
			data.status,
			data.settledAt,
			data.customReturnAmount,
		);
	});

export const betsReopen = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) =>
		z.object({ betId: z.string().uuid() }).parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return reopenBet(session.user.id, data.betId);
	});

export const betsDelete = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) =>
		z.object({ betId: z.string().uuid() }).parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return deleteBet(session.user.id, data.betId);
	});

export const betsGetById = createServerFn({ method: "GET" })
	.inputValidator((input: unknown) =>
		z.object({ betId: z.string().uuid() }).parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return getBetById(session.user.id, data.betId);
	});

export const tagsList = createServerFn({ method: "GET" }).handler(async () => {
	const session = await requireCurrentSession();
	return listTags(session.user.id);
});

export const tagsCreate = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) =>
		z.object({ name: z.string().min(1) }).parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return createTag(session.user.id, data.name);
	});

export const dashboardGetMetrics = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await requireCurrentSession();
		return getDashboardMetrics(session.user.id);
	},
);

export const authChangePassword = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) =>
		z
			.object({
				currentPassword: z.string().min(8),
				nextPassword: z.string().min(8),
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		await changePasswordForCurrentUser(
			session.user.id,
			data.currentPassword,
			data.nextPassword,
		);
		return { success: true };
	});

export const billingGetSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await requireCurrentSession();
		return getBillingSummary(session.user.id);
	},
);

export const billingCreateCheckoutSession = createServerFn({ method: "POST" })
	.inputValidator((input: unknown) =>
		z
			.object({
				planKey: z.enum(
					billingPlanKeys.filter((planKey) => planKey !== "free") as [
						"pro",
						"pro_plus",
					],
				),
				interval: z.enum(billingIntervals),
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		const session = await requireCurrentSession();
		return createCheckoutSessionForUser({
			userId: session.user.id,
			email: session.user.email,
			planKey: data.planKey,
			interval: data.interval,
		});
	});

export const billingCreatePortalSession = createServerFn({
	method: "POST",
}).handler(async () => {
	const session = await requireCurrentSession();
	return createBillingPortalSessionForUser({
		userId: session.user.id,
		email: session.user.email,
	});
});
