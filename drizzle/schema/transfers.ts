import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { Users } from "./user";

export const Transfers = sqliteTable("transfers", {
  id: integer("id").primaryKey().unique().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  transferItems: text("transferItems", { mode: "json" }).notNull(),
});
