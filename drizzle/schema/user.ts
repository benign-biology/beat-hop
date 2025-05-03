import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const Users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().default(""),
  password: text("password").notNull().default(""),
});
