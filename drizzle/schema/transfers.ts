import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { Users } from "./user";

export const Transfers = sqliteTable("transfers", {
  id: text("id").primaryKey().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  transferItems: text("transfer_items", { mode: "json" }).notNull(),
  createdPlaylistId: text("created_playlist_id").notNull(),
  fromStreamingService: text("from_streaming_service").notNull().default(""),
  toStreamingService: text("to_streaming_service").notNull().default(""),
});
