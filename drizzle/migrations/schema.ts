import { sqliteTable, AnySQLiteColumn, uniqueIndex, integer, text } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const authKeys = sqliteTable("auth-keys", {
	id: integer().primaryKey().notNull(),
	username: text().notNull(),
	authCode: text("auth_code").default("").notNull(),
	refreshCode: text("refresh_code").default("").notNull(),
	expiresIn: integer("expires_in").default(0).notNull(),
	streamingService: text("streaming_service").default("").notNull(),
},
(table) => [
	uniqueIndex("user_streaming_unique").on(table.username, table.streamingService),
	uniqueIndex("auth-keys_username_unique").on(table.username),
	uniqueIndex("auth-keys_id_unique").on(table.id),
]);

export const users = sqliteTable("users", {
	id: integer().primaryKey().notNull(),
	username: text().default("").notNull(),
	password: text().default("").notNull(),
},
(table) => [
	uniqueIndex("users_id_unique").on(table.id),
]);

