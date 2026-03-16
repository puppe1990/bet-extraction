import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "#/db/index";
import { bankrollTransactions, bets, betTagLinks, betTags } from "#/db/schema";
import { nowIso } from "#/lib/auth";
import { calculateSettlementAmounts, parseTagInput } from "#/lib/bets";
import type { BetStatus } from "#/lib/domain";
import { fromCents, toCents } from "#/lib/money";
import { getPrimaryAccount } from "./bankroll.server";
import {
	assertBillingFeatureAccess,
	assertCanCreateBet,
} from "./billing.server";

type BetInput = {
	sport: string;
	market: string;
	eventName: string;
	selection: string;
	bookmaker: string;
	oddsDecimal: number;
	stakeAmount: number;
	placedAt: string;
	note?: string;
	tags?: string[];
};

type BetListFilters = {
	userId: string;
	status?: BetStatus | "all";
	sport?: string;
	bookmaker?: string;
	tag?: string;
	from?: string;
	to?: string;
};

async function attachTags(userId: string, betId: string, tagNames: string[]) {
	const normalized = [
		...new Set(tagNames.map((tag) => tag.trim()).filter(Boolean)),
	];
	if (normalized.length === 0) {
		return;
	}

	const existingTags = await db
		.select()
		.from(betTags)
		.where(and(eq(betTags.userId, userId), inArray(betTags.name, normalized)));

	const known = new Map(existingTags.map((tag) => [tag.name, tag.id]));
	const missing = normalized.filter((tag) => !known.has(tag));

	if (missing.length > 0) {
		await db.insert(betTags).values(
			missing.map((name) => ({
				id: randomUUID(),
				userId,
				name,
				createdAt: nowIso(),
			})),
		);
	}

	const allTags = await db
		.select()
		.from(betTags)
		.where(and(eq(betTags.userId, userId), inArray(betTags.name, normalized)));

	await db.insert(betTagLinks).values(
		allTags.map((tag) => ({
			betId,
			tagId: tag.id,
			createdAt: nowIso(),
		})),
	);
}

async function replaceTags(userId: string, betId: string, tagNames: string[]) {
	await db.delete(betTagLinks).where(eq(betTagLinks.betId, betId));
	await attachTags(userId, betId, tagNames);
}

export async function listTags(userId: string) {
	const tags = await db
		.select({
			id: betTags.id,
			name: betTags.name,
			usageCount: sql<number>`count(${betTagLinks.betId})`,
		})
		.from(betTags)
		.leftJoin(betTagLinks, eq(betTags.id, betTagLinks.tagId))
		.where(eq(betTags.userId, userId))
		.groupBy(betTags.id)
		.orderBy(betTags.name);

	return tags;
}

export async function createTag(userId: string, name: string) {
	const normalized = name.trim();
	const existing = await db.query.betTags.findFirst({
		where: and(eq(betTags.userId, userId), eq(betTags.name, normalized)),
	});

	if (existing) return existing;

	const created = {
		id: randomUUID(),
		userId,
		name: normalized,
		createdAt: nowIso(),
	};
	await db.insert(betTags).values(created);
	return created;
}

export async function createBet(userId: string, input: BetInput) {
	await assertCanCreateBet(userId);
	const account = await getPrimaryAccount(userId);
	const betId = randomUUID();
	const stakeAmountCents = toCents(input.stakeAmount);

	await db.transaction(async (tx) => {
		await tx.insert(bets).values({
			id: betId,
			accountId: account.id,
			status: "open",
			sport: input.sport.trim(),
			market: input.market.trim(),
			eventName: input.eventName.trim(),
			selection: input.selection.trim(),
			bookmaker: input.bookmaker.trim(),
			oddsDecimal: input.oddsDecimal,
			stakeAmount: stakeAmountCents,
			placedAt: input.placedAt,
			note: input.note?.trim() || null,
			createdAt: nowIso(),
		});

		await tx.insert(bankrollTransactions).values({
			id: randomUUID(),
			accountId: account.id,
			type: "bet_open",
			amount: -stakeAmountCents,
			occurredAt: input.placedAt,
			betId,
			note: `Entrada: ${input.eventName.trim()}`,
			createdAt: nowIso(),
		});
	});

	await attachTags(userId, betId, input.tags ?? []);
	return getBetById(userId, betId);
}

export async function importBets(
	userId: string,
	items: Array<
		BetInput & {
			status: BetStatus;
			settledAt?: string;
			grossReturnAmount?: number;
		}
	>,
) {
	for (const item of items) {
		const bet = await createBet(userId, item);

		if (item.status !== "open") {
			await settleBet(
				userId,
				bet.id,
				item.status,
				item.settledAt ?? item.placedAt,
				item.status === "cashout" ? item.grossReturnAmount : undefined,
			);
		}
	}

	return { importedCount: items.length };
}

export async function updateBet(
	userId: string,
	betId: string,
	input: BetInput,
) {
	const account = await getPrimaryAccount(userId);
	const bet = await db.query.bets.findFirst({
		where: and(eq(bets.id, betId), eq(bets.accountId, account.id)),
	});

	if (!bet) {
		throw new Error("Bet not found.");
	}

	if (bet.status !== "open") {
		await db
			.update(bets)
			.set({
				sport: input.sport.trim(),
				market: input.market.trim(),
				eventName: input.eventName.trim(),
				selection: input.selection.trim(),
				bookmaker: input.bookmaker.trim(),
				note: input.note?.trim() || null,
			})
			.where(eq(bets.id, betId));

		await replaceTags(userId, betId, input.tags ?? []);
		return getBetById(userId, betId);
	}

	const stakeAmountCents = toCents(input.stakeAmount);

	await db.transaction(async (tx) => {
		await tx
			.update(bets)
			.set({
				sport: input.sport.trim(),
				market: input.market.trim(),
				eventName: input.eventName.trim(),
				selection: input.selection.trim(),
				bookmaker: input.bookmaker.trim(),
				oddsDecimal: input.oddsDecimal,
				stakeAmount: stakeAmountCents,
				placedAt: input.placedAt,
				note: input.note?.trim() || null,
			})
			.where(eq(bets.id, betId));

		await tx
			.update(bankrollTransactions)
			.set({
				amount: -stakeAmountCents,
				occurredAt: input.placedAt,
				note: `Entrada: ${input.eventName.trim()}`,
			})
			.where(
				and(
					eq(bankrollTransactions.betId, betId),
					eq(bankrollTransactions.type, "bet_open"),
				),
			);
	});

	await replaceTags(userId, betId, input.tags ?? []);
	return getBetById(userId, betId);
}

export async function settleBet(
	userId: string,
	betId: string,
	status: Exclude<BetStatus, "open">,
	settledAt: string,
	customReturnAmount?: number,
) {
	const account = await getPrimaryAccount(userId);
	const bet = await db.query.bets.findFirst({
		where: and(eq(bets.id, betId), eq(bets.accountId, account.id)),
	});

	if (!bet) {
		throw new Error("Bet not found.");
	}

	const settlement = calculateSettlementAmounts(
		fromCents(bet.stakeAmount) ?? 0,
		bet.oddsDecimal,
		status,
		customReturnAmount,
	);
	const grossReturnCents = toCents(settlement.grossReturn);
	const profitCents = toCents(settlement.profit);

	await db.transaction(async (tx) => {
		await tx
			.update(bets)
			.set({
				status,
				settledAt,
				grossReturnAmount: grossReturnCents,
				profitAmount: profitCents,
			})
			.where(eq(bets.id, betId));

		const existingSettlement = await tx.query.bankrollTransactions.findFirst({
			where: and(
				eq(bankrollTransactions.betId, betId),
				eq(bankrollTransactions.type, "bet_settlement"),
			),
		});

		if (existingSettlement) {
			await tx
				.update(bankrollTransactions)
				.set({
					amount: grossReturnCents,
					occurredAt: settledAt,
					note: `Liquidacao: ${bet.eventName}`,
				})
				.where(eq(bankrollTransactions.id, existingSettlement.id));
		} else {
			await tx.insert(bankrollTransactions).values({
				id: randomUUID(),
				accountId: account.id,
				type: "bet_settlement",
				amount: grossReturnCents,
				occurredAt: settledAt,
				note: `Liquidacao: ${bet.eventName}`,
				betId,
				createdAt: nowIso(),
			});
		}
	});

	return getBetById(userId, betId);
}

export async function reopenBet(userId: string, betId: string) {
	const account = await getPrimaryAccount(userId);
	const bet = await db.query.bets.findFirst({
		where: and(eq(bets.id, betId), eq(bets.accountId, account.id)),
	});

	if (!bet) {
		throw new Error("Bet not found.");
	}

	if (bet.status === "open") {
		return getBetById(userId, betId);
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(bankrollTransactions)
			.where(
				and(
					eq(bankrollTransactions.betId, betId),
					eq(bankrollTransactions.type, "bet_settlement"),
				),
			);

		await tx
			.update(bets)
			.set({
				status: "open",
				settledAt: null,
				grossReturnAmount: null,
				profitAmount: null,
			})
			.where(eq(bets.id, betId));
	});

	return getBetById(userId, betId);
}

export async function deleteBet(userId: string, betId: string) {
	const account = await getPrimaryAccount(userId);
	const bet = await db.query.bets.findFirst({
		where: and(eq(bets.id, betId), eq(bets.accountId, account.id)),
	});

	if (!bet) {
		throw new Error("Bet not found.");
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(bankrollTransactions)
			.where(eq(bankrollTransactions.betId, betId));
		await tx.delete(betTagLinks).where(eq(betTagLinks.betId, betId));
		await tx.delete(bets).where(eq(bets.id, betId));
	});

	return { success: true };
}

export async function getBetById(userId: string, betId: string) {
	const account = await getPrimaryAccount(userId);
	const bet = await db.query.bets.findFirst({
		where: and(eq(bets.id, betId), eq(bets.accountId, account.id)),
	});
	if (!bet) {
		throw new Error("Bet not found.");
	}

	const tags = await db
		.select({
			id: betTags.id,
			name: betTags.name,
		})
		.from(betTagLinks)
		.innerJoin(betTags, eq(betTagLinks.tagId, betTags.id))
		.where(eq(betTagLinks.betId, betId));

	return {
		...bet,
		stakeAmount: fromCents(bet.stakeAmount) ?? 0,
		grossReturnAmount: fromCents(bet.grossReturnAmount),
		profitAmount: fromCents(bet.profitAmount),
		tags,
	};
}

export async function listBets(filters: BetListFilters) {
	const account = await getPrimaryAccount(filters.userId);
	const rows = await db
		.select({
			id: bets.id,
			status: bets.status,
			sport: bets.sport,
			market: bets.market,
			eventName: bets.eventName,
			selection: bets.selection,
			bookmaker: bets.bookmaker,
			oddsDecimal: bets.oddsDecimal,
			stakeAmount: bets.stakeAmount,
			placedAt: bets.placedAt,
			settledAt: bets.settledAt,
			grossReturnAmount: bets.grossReturnAmount,
			profitAmount: bets.profitAmount,
			note: bets.note,
		})
		.from(bets)
		.where(
			and(
				eq(bets.accountId, account.id),
				filters.status && filters.status !== "all"
					? eq(bets.status, filters.status)
					: undefined,
				filters.sport ? eq(bets.sport, filters.sport) : undefined,
				filters.bookmaker ? eq(bets.bookmaker, filters.bookmaker) : undefined,
				filters.from ? gte(bets.placedAt, filters.from) : undefined,
				filters.to ? lte(bets.placedAt, filters.to) : undefined,
			),
		)
		.orderBy(desc(bets.placedAt));

	const links = await db
		.select({
			betId: betTagLinks.betId,
			id: betTags.id,
			name: betTags.name,
		})
		.from(betTagLinks)
		.innerJoin(betTags, eq(betTagLinks.tagId, betTags.id))
		.where(inArray(betTagLinks.betId, rows.map((row) => row.id).concat("")));

	const tagsByBet = new Map<string, { id: string; name: string }[]>();
	for (const link of links) {
		const current = tagsByBet.get(link.betId) ?? [];
		current.push({ id: link.id, name: link.name });
		tagsByBet.set(link.betId, current);
	}

	const result = rows
		.map((row) => ({
			...row,
			stakeAmount: fromCents(row.stakeAmount) ?? 0,
			grossReturnAmount: fromCents(row.grossReturnAmount),
			profitAmount: fromCents(row.profitAmount),
			tags: tagsByBet.get(row.id) ?? [],
		}))
		.filter((bet) =>
			filters.tag ? bet.tags.some((tag) => tag.name === filters.tag) : true,
		);

	return result;
}

export async function listRecentBets(userId: string) {
	return listBets({ userId });
}

function escapeCsvCell(value: string | number | null | undefined) {
	if (value == null) {
		return "";
	}

	const normalized = String(value).replaceAll('"', '""');
	return `"${normalized}"`;
}

export async function exportBetsCsv(filters: BetListFilters) {
	await assertBillingFeatureAccess(filters.userId, "csv_export");
	const items = await listBets(filters);
	const header = [
		"event_name",
		"status",
		"sport",
		"market",
		"selection",
		"bookmaker",
		"odds_decimal",
		"stake_brl",
		"gross_return_brl",
		"profit_brl",
		"placed_at",
		"settled_at",
		"tags",
		"note",
	];

	const rows = items.map((bet) =>
		[
			bet.eventName,
			bet.status,
			bet.sport,
			bet.market,
			bet.selection,
			bet.bookmaker,
			bet.oddsDecimal,
			bet.stakeAmount,
			bet.grossReturnAmount,
			bet.profitAmount,
			bet.placedAt,
			bet.settledAt,
			bet.tags.map((tag) => tag.name).join(", "),
			bet.note,
		]
			.map((value) => escapeCsvCell(value))
			.join(","),
	);

	return [header.join(","), ...rows].join("\n");
}

export function normalizeBetInput(input: BetInput & { tagsText?: string }) {
	return {
		...input,
		tags: input.tags ?? parseTagInput(input.tagsText ?? ""),
	};
}
