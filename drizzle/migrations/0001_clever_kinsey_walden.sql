CREATE TABLE `auth-keys` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`auth_code` text DEFAULT '' NOT NULL,
	`refresh_code` text DEFAULT '' NOT NULL,
	`expires_in` integer DEFAULT 0 NOT NULL,
	`streaming_service` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth-keys_id_unique` ON `auth-keys` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth-keys_username_unique` ON `auth-keys` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_streaming_unique` ON `auth-keys` (`username`,`streaming_service`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text DEFAULT '' NOT NULL,
	`password` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);