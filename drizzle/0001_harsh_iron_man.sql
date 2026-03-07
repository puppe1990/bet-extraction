CREATE TABLE `billing_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`stripe_subscription_id` text,
	`stripe_price_id` text,
	`stripe_product_id` text,
	`plan_key` text DEFAULT 'free' NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`interval` text,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_subscriptions_user_unique` ON `billing_subscriptions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_subscriptions_customer_unique` ON `billing_subscriptions` (`stripe_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_subscriptions_subscription_unique` ON `billing_subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_stripe_customer_unique` ON `users` (`stripe_customer_id`);