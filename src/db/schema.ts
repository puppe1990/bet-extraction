import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestampColumns = {
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable(
	"users",
	{
		id: text().primaryKey(),
		email: text().notNull(),
		passwordHash: text("password_hash").notNull(),
		stripeCustomerId: text("stripe_customer_id"),
		...timestampColumns,
	},
	(table) => [
		uniqueIndex("users_email_unique").on(table.email),
		uniqueIndex("users_stripe_customer_unique").on(table.stripeCustomerId),
	],
);

export const billingSubscriptions = sqliteTable(
	"billing_subscriptions",
	{
		id: text().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		stripeCustomerId: text("stripe_customer_id").notNull(),
		stripeSubscriptionId: text("stripe_subscription_id"),
		stripePriceId: text("stripe_price_id"),
		stripeProductId: text("stripe_product_id"),
		planKey: text("plan_key").notNull().default("free"),
		status: text().notNull().default("inactive"),
		interval: text(),
		currentPeriodEnd: text("current_period_end"),
		cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
			.notNull()
			.default(false),
		...timestampColumns,
	},
	(table) => [
		uniqueIndex("billing_subscriptions_user_unique").on(table.userId),
		uniqueIndex("billing_subscriptions_customer_unique").on(
			table.stripeCustomerId,
		),
		uniqueIndex("billing_subscriptions_subscription_unique").on(
			table.stripeSubscriptionId,
		),
	],
);

export const sessions = sqliteTable(
	"sessions",
	{
		id: text().primaryKey(),
		token: text().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: text("expires_at").notNull(),
		...timestampColumns,
	},
	(table) => [
		uniqueIndex("sessions_token_unique").on(table.token),
		index("sessions_user_idx").on(table.userId),
	],
);

export const extensionConnectionTokens = sqliteTable(
	"extension_connection_tokens",
	{
		id: text().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull(),
		expiresAt: text("expires_at").notNull(),
		usedAt: text("used_at"),
		...timestampColumns,
	},
	(table) => [
		uniqueIndex("extension_connection_tokens_hash_unique").on(table.tokenHash),
		index("extension_connection_tokens_user_idx").on(table.userId),
	],
);

export const extensionTokens = sqliteTable(
	"extension_tokens",
	{
		id: text().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text().notNull(),
		tokenHash: text("token_hash").notNull(),
		lastUsedAt: text("last_used_at"),
		expiresAt: text("expires_at"),
		revokedAt: text("revoked_at"),
		...timestampColumns,
	},
	(table) => [
		uniqueIndex("extension_tokens_hash_unique").on(table.tokenHash),
		index("extension_tokens_user_idx").on(table.userId),
	],
);

export const bankrollAccounts = sqliteTable(
	"bankroll_accounts",
	{
		id: text().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text().notNull(),
		currency: text().notNull().default("BRL"),
		initialBalance: integer("initial_balance").notNull().default(0),
		...timestampColumns,
	},
	(table) => [uniqueIndex("bankroll_accounts_user_unique").on(table.userId)],
);

export const bets = sqliteTable(
	"bets",
	{
		id: text().primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => bankrollAccounts.id, { onDelete: "cascade" }),
		status: text().notNull(),
		sport: text().notNull(),
		market: text().notNull(),
		eventName: text("event_name").notNull(),
		selection: text().notNull(),
		bookmaker: text().notNull(),
		oddsDecimal: real("odds_decimal").notNull(),
		stakeAmount: integer("stake_amount").notNull(),
		placedAt: text("placed_at").notNull(),
		settledAt: text("settled_at"),
		grossReturnAmount: integer("gross_return_amount"),
		profitAmount: integer("profit_amount"),
		note: text(),
		...timestampColumns,
	},
	(table) => [
		index("bets_account_idx").on(table.accountId),
		index("bets_status_idx").on(table.status),
		index("bets_placed_idx").on(table.placedAt),
	],
);

export const bankrollTransactions = sqliteTable(
	"bankroll_transactions",
	{
		id: text().primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => bankrollAccounts.id, { onDelete: "cascade" }),
		type: text().notNull(),
		amount: integer().notNull(),
		occurredAt: text("occurred_at").notNull(),
		note: text(),
		betId: text("bet_id").references(() => bets.id, { onDelete: "cascade" }),
		...timestampColumns,
	},
	(table) => [
		index("bankroll_transactions_account_idx").on(table.accountId),
		index("bankroll_transactions_bet_idx").on(table.betId),
		index("bankroll_transactions_occurred_idx").on(table.occurredAt),
	],
);

export const betTags = sqliteTable(
	"bet_tags",
	{
		id: text().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text().notNull(),
		...timestampColumns,
	},
	(table) => [
		uniqueIndex("bet_tags_user_name_unique").on(table.userId, table.name),
	],
);

export const betTagLinks = sqliteTable(
	"bet_tag_links",
	{
		betId: text("bet_id")
			.notNull()
			.references(() => bets.id, { onDelete: "cascade" }),
		tagId: text("tag_id")
			.notNull()
			.references(() => betTags.id, { onDelete: "cascade" }),
		...timestampColumns,
	},
	(table) => [primaryKey({ columns: [table.betId, table.tagId] })],
);

export const usersRelations = relations(users, ({ many, one }) => ({
	sessions: many(sessions),
	extensionConnectionTokens: many(extensionConnectionTokens),
	extensionTokens: many(extensionTokens),
	account: one(bankrollAccounts, {
		fields: [users.id],
		references: [bankrollAccounts.userId],
	}),
	tags: many(betTags),
	billingSubscription: one(billingSubscriptions, {
		fields: [users.id],
		references: [billingSubscriptions.userId],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const accountRelations = relations(
	bankrollAccounts,
	({ one, many }) => ({
		user: one(users, {
			fields: [bankrollAccounts.userId],
			references: [users.id],
		}),
		transactions: many(bankrollTransactions),
		bets: many(bets),
	}),
);

export const extensionConnectionTokensRelations = relations(
	extensionConnectionTokens,
	({ one }) => ({
		user: one(users, {
			fields: [extensionConnectionTokens.userId],
			references: [users.id],
		}),
	}),
);

export const extensionTokensRelations = relations(
	extensionTokens,
	({ one }) => ({
		user: one(users, {
			fields: [extensionTokens.userId],
			references: [users.id],
		}),
	}),
);

export const betsRelations = relations(bets, ({ one, many }) => ({
	account: one(bankrollAccounts, {
		fields: [bets.accountId],
		references: [bankrollAccounts.id],
	}),
	transactions: many(bankrollTransactions),
	tagLinks: many(betTagLinks),
}));

export const bankrollTransactionsRelations = relations(
	bankrollTransactions,
	({ one }) => ({
		account: one(bankrollAccounts, {
			fields: [bankrollTransactions.accountId],
			references: [bankrollAccounts.id],
		}),
		bet: one(bets, {
			fields: [bankrollTransactions.betId],
			references: [bets.id],
		}),
	}),
);

export const betTagsRelations = relations(betTags, ({ one, many }) => ({
	user: one(users, {
		fields: [betTags.userId],
		references: [users.id],
	}),
	links: many(betTagLinks),
}));

export const betTagLinksRelations = relations(betTagLinks, ({ one }) => ({
	bet: one(bets, {
		fields: [betTagLinks.betId],
		references: [bets.id],
	}),
	tag: one(betTags, {
		fields: [betTagLinks.tagId],
		references: [betTags.id],
	}),
}));

export const billingSubscriptionsRelations = relations(
	billingSubscriptions,
	({ one }) => ({
		user: one(users, {
			fields: [billingSubscriptions.userId],
			references: [users.id],
		}),
	}),
);
