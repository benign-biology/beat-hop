import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const AuthKeys = sqliteTable(
  "auth-keys",
  {
    id: integer("id").primaryKey().unique().notNull(),
    username: text("username").notNull(),
    authCode: text("auth_code").notNull().default(""),
    refreshCode: text("refresh_code").notNull().default(""),
    expiresIn: integer("expires_in").notNull().default(0),
    streamingService: text("streaming_service").notNull().default(""),
  },
  (table) => [
    uniqueIndex("user_streaming_unique").on(
      table.username,
      table.streamingService
    ),
  ]
);
