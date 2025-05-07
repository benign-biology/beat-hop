import { json, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { Users } from "./user";
import { streamingServices } from "@/types/streamingServices";
import {
  beatHopDataResponse,
  beatHopTrackType,
  transferStatuses,
} from "@/types/beatHopStructure";

export const streamingServiceEnum = pgEnum(
  "streaming_service",
  streamingServices
);

export const transferStatusEnum = pgEnum("transfer_service", transferStatuses);

export const Transfers = pgTable("transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  transferItems:
    json("transfer_items").$type<beatHopDataResponse<beatHopTrackType>>(),
  transferSearchResults: json("transfer_search_results").$type<
    Array<beatHopDataResponse<beatHopTrackType>>
  >(),
  playlistName: text("playlist_name").notNull().default(""),
  toPlaylistId: text("to_playlist_id"),
  fromPlaylistId: text("from_playlist_id").notNull().default(""),
  fromStreamingService: streamingServiceEnum(
    "from_streaming_service"
  ).notNull(),
  toStreamingService: streamingServiceEnum("to_streaming_service").notNull(),
  transferStatus: transferStatusEnum("transfer_status")
    .notNull()
    .default("not-started"),
});
