import { relations } from "drizzle-orm/relations";
import { users, authKeys } from "./schema";

export const authKeysRelations = relations(authKeys, ({one}) => ({
	user: one(users, {
		fields: [authKeys.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	authKeys: many(authKeys),
}));