import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema",
  out: "./drizzle/migrations/",
  dbCredentials: {
    // url: "./drizzle/db.sqlite",
    url: process.env.DATABASE_URL!,
  },
});
