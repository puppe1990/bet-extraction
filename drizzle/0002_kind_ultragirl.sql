CREATE TABLE `extension_connection_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extension_connection_tokens_hash_unique` ON `extension_connection_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `extension_connection_tokens_user_idx` ON `extension_connection_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `extension_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`last_used_at` text,
	`expires_at` text,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extension_tokens_hash_unique` ON `extension_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `extension_tokens_user_idx` ON `extension_tokens` (`user_id`);