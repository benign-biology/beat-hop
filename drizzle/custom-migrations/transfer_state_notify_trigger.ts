import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

export default async function () {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  await db.execute(sql`
    CREATE OR REPLACE FUNCTION notify_transfer_state_update() RETURNS trigger AS $$
    BEGIN
      PERFORM pg_notify('transfer_updates', NEW.id::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await db.execute(sql`
    CREATE TRIGGER transfer_state_update_trigger
    AFTER UPDATE ON transfers
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION notify_transfer_state_update();
  `);

  await client.end();
}
