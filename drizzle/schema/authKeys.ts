import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { Users } from "./user";

export const AuthKeys = sqliteTable(
  "auth-keys",
  {
    id: integer("id").primaryKey().unique().notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => Users.id, { onDelete: "cascade" }),
    authCode: text("auth_code").notNull().default(""),
    refreshCode: text("refresh_code").notNull().default(""),
    expiresIn: integer("expires_in").notNull().default(0),
    streamingService: text("streaming_service").notNull().default(""),
  },
  (table) => [
    uniqueIndex("user_streaming_unique").on(
      table.userId,
      table.streamingService
    ),
  ]
);
