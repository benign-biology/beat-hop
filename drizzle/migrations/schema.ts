import { sqliteTable, AnySQLiteColumn, uniqueIndex, integer, text } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
	id: integer().primaryKey().notNull(),
	username: text().default("").notNull(),
	password: text().default("").notNull(),
},
(table) => [
	uniqueIndex("users_id_unique").on(table.id),
]);

