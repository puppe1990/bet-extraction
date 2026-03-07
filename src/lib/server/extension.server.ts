import { createHash, randomUUID } from "node:crypto";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "#/db";
import {
	bankrollAccounts,
	extensionConnectionTokens,
	extensionTokens,
	users,
} from "#/db/schema";
import { hashPassword, nowIso, verifyPassword } from "#/lib/auth";
import type { BankrollTransactionType, BetStatus } from "#/lib/domain";
import { addManualTransaction, getBankrollSummary } from "./bankroll.server";
import { createBet } from "./bets.server";
import { assertBillingFeatureAccess } from "./billing.server";
import { getDashboardMetrics } from "./dashboard.server";
import { settleBet } from "./bets.server";

const CONNECTION_TOKEN_AGE_MS = 1000 * 60 * 10;
const EXTENSION_TOKEN_AGE_MS = 1000 * 60 * 60 * 24 * 90;

export type CapturedBetDraftInput = {
	sport: string;
	market: string;
	eventName: string;
	selection: string;
	bookmaker: string;
	oddsDecimal?: number;
	stakeAmount?: number;
	placedAt?: string;
	note?: string;
	tags?: string[];
	rawSourceUrl?: string;
	parserConfidence?: "high" | "medium" | "low";
};

function hashToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

function buildExtensionExpiry() {
	return new Date(Date.now() + EXTENSION_TOKEN_AGE_MS).toISOString();
}

function buildConnectionExpiry() {
	return new Date(Date.now() + CONNECTION_TOKEN_AGE_MS).toISOString();
}

function ensureFutureDate(value: string | null | undefined) {
	return !value || new Date(value).getTime() > Date.now();
}

function normalizeDraft(input: CapturedBetDraftInput) {
	return {
		sport: input.sport.trim() || "Sports",
		market: input.market.trim() || "Manual capture",
		eventName: input.eventName.trim() || "Untitled event",
		selection: input.selection.trim() || "Manual selection",
		bookmaker: input.bookmaker.trim() || "Unknown bookmaker",
		oddsDecimal:
			input.oddsDecimal && input.oddsDecimal > 0 ? input.oddsDecimal : 1,
		stakeAmount:
			input.stakeAmount && input.stakeAmount > 0 ? input.stakeAmount : 1,
		placedAt: input.placedAt ?? new Date().toISOString(),
		note:
			[
				input.note?.trim(),
				input.rawSourceUrl ? `Source: ${input.rawSourceUrl}` : null,
			]
				.filter(Boolean)
				.join("\n") || undefined,
		tags: input.tags ?? [],
	};
}

async function createExtensionAccessSession(input: {
	userId: string;
	name: string;
}) {
	const accessToken = randomUUID();
	const expiresAt = buildExtensionExpiry();

	await db.insert(extensionTokens).values({
		id: randomUUID(),
		userId: input.userId,
		name: input.name.trim() || "Ledger Chrome Extension",
		tokenHash: hashToken(accessToken),
		expiresAt,
		createdAt: nowIso(),
	});

	const user = await db.query.users.findFirst({
		where: eq(users.id, input.userId),
	});

	if (!user) {
		throw new Error("User not found.");
	}

	return {
		accessToken,
		expiresAt,
		user: {
			id: user.id,
			email: user.email,
		},
	};
}

export async function createExtensionConnectionToken(userId: string) {
	await assertBillingFeatureAccess(userId, "extension_capture");

	const token = randomUUID();
	const expiresAt = buildConnectionExpiry();
	await db.insert(extensionConnectionTokens).values({
		id: randomUUID(),
		userId,
		tokenHash: hashToken(token),
		expiresAt,
		createdAt: nowIso(),
	});

	return {
		token,
		expiresAt,
	};
}

export async function exchangeExtensionConnectionToken(input: {
	token: string;
	name: string;
}) {
	const tokenHash = hashToken(input.token);
	const connection = await db.query.extensionConnectionTokens.findFirst({
		where: eq(extensionConnectionTokens.tokenHash, tokenHash),
	});

	if (!connection) {
		throw new Error("Invalid connection token.");
	}

	if (connection.usedAt || !ensureFutureDate(connection.expiresAt)) {
		throw new Error(
			"Connection token expired. Generate a new one in Settings.",
		);
	}

	await assertBillingFeatureAccess(connection.userId, "extension_capture");

	await db.transaction(async (tx) => {
		await tx
			.update(extensionConnectionTokens)
			.set({ usedAt: nowIso() })
			.where(eq(extensionConnectionTokens.id, connection.id));
	});

	return createExtensionAccessSession({
		userId: connection.userId,
		name: input.name,
	});
}

export async function loginExtensionWithPassword(input: {
	email: string;
	password: string;
	name: string;
}) {
	const email = input.email.toLowerCase().trim();
	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
	});

	if (!user || !verifyPassword(input.password, user.passwordHash)) {
		throw new Error("Invalid email or password.");
	}

	return createExtensionAccessSession({
		userId: user.id,
		name: input.name,
	});
}

export async function signupExtensionWithPassword(input: {
	email: string;
	password: string;
	name: string;
}) {
	const email = input.email.toLowerCase().trim();
	const existing = await db.query.users.findFirst({
		where: eq(users.email, email),
	});

	if (existing) {
		throw new Error("An account with this email already exists.");
	}

	const userId = randomUUID();

	await db.transaction(async (tx) => {
		await tx.insert(users).values({
			id: userId,
			email,
			passwordHash: hashPassword(input.password),
			createdAt: nowIso(),
		});

		await tx.insert(bankrollAccounts).values({
			id: randomUUID(),
			userId,
			name: "Banca Principal",
			currency: "BRL",
			initialBalance: 0,
			createdAt: nowIso(),
		});
	});

	return createExtensionAccessSession({
		userId,
		name: input.name,
	});
}

export async function getExtensionSessionByAccessToken(token: string) {
	const tokenHash = hashToken(token);
	const session = await db.query.extensionTokens.findFirst({
		where: eq(extensionTokens.tokenHash, tokenHash),
	});

	if (!session) {
		return null;
	}

	if (session.revokedAt || !ensureFutureDate(session.expiresAt)) {
		return null;
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.userId),
		with: {
			billingSubscription: true,
		},
	});

	if (!user) {
		return null;
	}

	await db
		.update(extensionTokens)
		.set({ lastUsedAt: nowIso() })
		.where(eq(extensionTokens.id, session.id));

	return {
		id: session.id,
		name: session.name,
		expiresAt: session.expiresAt,
		user: {
			id: user.id,
			email: user.email,
		},
	};
}

export async function requireExtensionSessionFromRequest(request: Request) {
	const header = request.headers.get("authorization");
	if (!header?.startsWith("Bearer ")) {
		throw new Error("Missing extension bearer token.");
	}

	const token = header.slice("Bearer ".length).trim();
	const session = await getExtensionSessionByAccessToken(token);
	if (!session) {
		throw new Error("Invalid extension session.");
	}

	await assertBillingFeatureAccess(session.user.id, "extension_capture");
	return session;
}

export async function getExtensionMe(token: string) {
	const session = await getExtensionSessionByAccessToken(token);
	if (!session) {
		throw new Error("Invalid extension session.");
	}

	const [dashboard, bankroll] = await Promise.all([
		getDashboardMetrics(session.user.id),
		getBankrollSummary(session.user.id),
	]);

	return {
		...session,
		home: {
			balance: dashboard.balance,
			planKey: dashboard.billing.effectivePlanKey,
			billingStatus: dashboard.billing.status,
			monthlyBetsRemaining: dashboard.billing.monthlyBetsRemaining,
			recentBets: dashboard.recentBets.slice(0, 4),
			recentTransactions: bankroll.recentTransactions.slice(0, 5),
		},
	};
}

export async function createBetFromExtension(input: {
	userId: string;
	draft: CapturedBetDraftInput;
}) {
	await assertBillingFeatureAccess(input.userId, "extension_capture");
	return createBet(input.userId, normalizeDraft(input.draft));
}

export async function addBankrollTransactionFromExtension(input: {
	userId: string;
	type: Extract<BankrollTransactionType, "deposit" | "withdraw" | "adjustment">;
	amount: number;
	note?: string;
	occurredAt?: string;
}) {
	return addManualTransaction(input);
}

export async function settleBetFromExtension(input: {
	userId: string;
	betId: string;
	status: Exclude<BetStatus, "open">;
	customReturnAmount?: number;
}) {
	return settleBet(
		input.userId,
		input.betId,
		input.status,
		nowIso(),
		input.customReturnAmount,
	);
}

export async function createDraftPreviewFromExtension(input: {
	userId: string;
	draft: CapturedBetDraftInput;
}) {
	await assertBillingFeatureAccess(input.userId, "extension_capture");
	return {
		...normalizeDraft(input.draft),
		parserConfidence: input.draft.parserConfidence ?? "low",
		rawSourceUrl: input.draft.rawSourceUrl ?? null,
	};
}

export async function revokeExtensionTokensForUser(userId: string) {
	await db
		.update(extensionTokens)
		.set({ revokedAt: nowIso() })
		.where(
			and(
				eq(extensionTokens.userId, userId),
				or(
					isNull(extensionTokens.revokedAt),
					eq(extensionTokens.revokedAt, ""),
				),
			),
		);
}
