import { streamingServiceEnum } from "./transfers";
import { Users } from "./user";
import { integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const AuthKeys = pgTable(
  "auth-keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => Users.id, { onDelete: "cascade" }),
    authCode: text("auth_code").notNull().default(""),
    refreshCode: text("refresh_code").notNull().default(""),
    expiresIn: integer("expires_in").notNull().default(0),
    streamingService: streamingServiceEnum("streaming_service").notNull(),
  },
  (table) => [
    uniqueIndex("user_streaming_unique").on(
      table.userId,
      table.streamingService
    ),
  ]
);
