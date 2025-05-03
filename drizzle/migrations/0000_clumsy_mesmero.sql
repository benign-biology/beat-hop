CREATE TABLE "auth-keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"auth_code" text DEFAULT '' NOT NULL,
	"refresh_code" text DEFAULT '' NOT NULL,
	"expires_in" integer DEFAULT 0 NOT NULL,
	"streaming_service" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transfer_items" text NOT NULL,
	"created_playlist_id" text NOT NULL,
	"from_streaming_service" text DEFAULT '' NOT NULL,
	"to_streaming_service" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"password" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth-keys" ADD CONSTRAINT "auth-keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_streaming_unique" ON "auth-keys" USING btree ("user_id","streaming_service");