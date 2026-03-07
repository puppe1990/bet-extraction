import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "#/db/index";
import { bankrollAccounts, bankrollTransactions, bets } from "#/db/schema";
import { nowIso } from "#/lib/auth";
import type { BankrollTransactionType } from "#/lib/domain";
import { fromCents, toCents } from "#/lib/money";

export async function getPrimaryAccount(userId: string) {
	const account = await db.query.bankrollAccounts.findFirst({
		where: eq(bankrollAccounts.userId, userId),
	});

	if (!account) {
		throw new Error("Primary account not found.");
	}

	return account;
}

export async function addManualTransaction(input: {
	userId: string;
	type: Extract<BankrollTransactionType, "deposit" | "withdraw" | "adjustment">;
	amount: number;
	note?: string;
	occurredAt?: string;
}) {
	const account = await getPrimaryAccount(input.userId);
	const amountCents =
		input.type === "withdraw"
			? -Math.abs(toCents(input.amount))
			: toCents(input.amount);

	await db.insert(bankrollTransactions).values({
		id: randomUUID(),
		accountId: account.id,
		type: input.type,
		amount: amountCents,
		occurredAt: input.occurredAt ?? nowIso(),
		note: input.note?.trim() || null,
		createdAt: nowIso(),
	});

	return getBankrollSummary(input.userId);
}

export async function updateManualTransaction(input: {
	userId: string;
	transactionId: string;
	type: Extract<BankrollTransactionType, "deposit" | "withdraw" | "adjustment">;
	amount: number;
	note?: string;
	occurredAt?: string;
}) {
	const account = await getPrimaryAccount(input.userId);
	const transaction = await db.query.bankrollTransactions.findFirst({
		where: and(
			eq(bankrollTransactions.id, input.transactionId),
			eq(bankrollTransactions.accountId, account.id),
		),
	});

	if (!transaction) {
		throw new Error("Transaction not found.");
	}

	if (
		transaction.type !== "deposit" &&
		transaction.type !== "withdraw" &&
		transaction.type !== "adjustment"
	) {
		throw new Error("Only manual transactions can be edited.");
	}

	const amountCents =
		input.type === "withdraw"
			? -Math.abs(toCents(input.amount))
			: toCents(input.amount);

	await db
		.update(bankrollTransactions)
		.set({
			type: input.type,
			amount: amountCents,
			occurredAt: input.occurredAt ?? transaction.occurredAt,
			note: input.note?.trim() || null,
		})
		.where(eq(bankrollTransactions.id, transaction.id));

	return getBankrollSummary(input.userId);
}

export async function getBankrollSummary(userId: string) {
	const account = await getPrimaryAccount(userId);
	const totals = await db
		.select({
			balance: sql<number>`coalesce(sum(${bankrollTransactions.amount}), 0)`,
		})
		.from(bankrollTransactions)
		.where(eq(bankrollTransactions.accountId, account.id));

	const recentTransactions = await db
		.select({
			id: bankrollTransactions.id,
			type: bankrollTransactions.type,
			amount: bankrollTransactions.amount,
			occurredAt: bankrollTransactions.occurredAt,
			note: bankrollTransactions.note,
			betId: bankrollTransactions.betId,
			eventName: bets.eventName,
			status: bets.status,
		})
		.from(bankrollTransactions)
		.leftJoin(bets, eq(bankrollTransactions.betId, bets.id))
		.where(eq(bankrollTransactions.accountId, account.id))
		.orderBy(desc(bankrollTransactions.occurredAt))
		.limit(20);

	const currentBalance = account.initialBalance + (totals[0]?.balance ?? 0);

	return {
		account: {
			id: account.id,
			name: account.name,
			currency: account.currency,
			initialBalance: fromCents(account.initialBalance) ?? 0,
			currentBalance: fromCents(currentBalance) ?? 0,
		},
		recentTransactions: recentTransactions.map((transaction) => ({
			...transaction,
			amount: fromCents(transaction.amount) ?? 0,
		})),
	};
}

export async function getBankrollCurve(userId: string) {
	const account = await getPrimaryAccount(userId);
	const transactions = await db
		.select({
			occurredAt: bankrollTransactions.occurredAt,
			amount: bankrollTransactions.amount,
		})
		.from(bankrollTransactions)
		.where(eq(bankrollTransactions.accountId, account.id))
		.orderBy(asc(bankrollTransactions.occurredAt));

	let runningBalance = account.initialBalance;
	const grouped = new Map<string, number>();

	for (const transaction of transactions) {
		runningBalance += transaction.amount;
		grouped.set(transaction.occurredAt.slice(0, 10), runningBalance);
	}

	return [...grouped.entries()].map(([date, balance]) => ({
		date,
		balance: fromCents(balance) ?? 0,
	}));
}
