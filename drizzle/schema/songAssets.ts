import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { streamingServiceEnum } from "./transfers";

export const SongAssets = pgTable("song_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  artists: text("artists").array(),
  streamingService: streamingServiceEnum("streaming_service").notNull(),
  assetId: text("asset_id").notNull(),
});
