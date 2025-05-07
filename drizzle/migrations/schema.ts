import { pgTable, uuid, text, uniqueIndex, foreignKey, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const streamingService = pgEnum("streaming_service", ['spotify', 'youtube'])
export const transferService = pgEnum("transfer_service", ['not-started', 'in-progress', 'complete'])


export const songAssets = pgTable("song_assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	artists: text(),
	streamingService: streamingService("streaming_service").notNull(),
	assetId: text("asset_id").notNull(),
});

export const authKeys = pgTable("auth-keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	authCode: text("auth_code").default(').notNull(),
	refreshCode: text("refresh_code").default(').notNull(),
	expiresIn: integer("expires_in").default(0).notNull(),
	streamingService: streamingService("streaming_service").notNull(),
}, (table) => [
	uniqueIndex("user_streaming_unique").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.streamingService.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth-keys_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const transfers = pgTable("transfers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	transferItems: text("transfer_items"),
	playlistName: text("playlist_name").default(').notNull(),
	toPlaylistId: text("to_playlist_id"),
	fromPlaylistId: text("from_playlist_id").default(').notNull(),
	fromStreamingService: streamingService("from_streaming_service").notNull(),
	toStreamingService: streamingService("to_streaming_service").notNull(),
	transferStatus: transferService("transfer_status").default('not-started').notNull(),
	transferSearchResults: text("transfer_search_results"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "transfers_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: text().default(').notNull(),
	password: text().default(').notNull(),
});
