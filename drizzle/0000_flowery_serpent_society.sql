CREATE TABLE `bankroll_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`initial_balance` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bankroll_accounts_user_unique` ON `bankroll_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `bankroll_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`occurred_at` text NOT NULL,
	`note` text,
	`bet_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `bankroll_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bet_id`) REFERENCES `bets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bankroll_transactions_account_idx` ON `bankroll_transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `bankroll_transactions_bet_idx` ON `bankroll_transactions` (`bet_id`);--> statement-breakpoint
CREATE INDEX `bankroll_transactions_occurred_idx` ON `bankroll_transactions` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `bet_tag_links` (
	`bet_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`bet_id`, `tag_id`),
	FOREIGN KEY (`bet_id`) REFERENCES `bets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `bet_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bet_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bet_tags_user_name_unique` ON `bet_tags` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `bets` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`status` text NOT NULL,
	`sport` text NOT NULL,
	`market` text NOT NULL,
	`event_name` text NOT NULL,
	`selection` text NOT NULL,
	`bookmaker` text NOT NULL,
	`odds_decimal` real NOT NULL,
	`stake_amount` integer NOT NULL,
	`placed_at` text NOT NULL,
	`settled_at` text,
	`gross_return_amount` integer,
	`profit_amount` integer,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `bankroll_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bets_account_idx` ON `bets` (`account_id`);--> statement-breakpoint
CREATE INDEX `bets_status_idx` ON `bets` (`status`);--> statement-breakpoint
CREATE INDEX `bets_placed_idx` ON `bets` (`placed_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);