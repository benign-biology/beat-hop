export default {
  dialect: "sqlite",
  schema: "./drizzle/schema",
  out: "./drizzle/migrations/",
  // driver: "better-sqlite",
  dbCredentials: {
    url: './drizzle/db.sqlite',
  },
};
