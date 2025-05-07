import { relations } from "drizzle-orm/relations";
import { users, authKeys, transfers } from "./schema";

export const authKeysRelations = relations(authKeys, ({one}) => ({
	user: one(users, {
		fields: [authKeys.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	authKeys: many(authKeys),
	transfers: many(transfers),
}));

export const transfersRelations = relations(transfers, ({one}) => ({
	user: one(users, {
		fields: [transfers.userId],
		references: [users.id]
	}),
}));