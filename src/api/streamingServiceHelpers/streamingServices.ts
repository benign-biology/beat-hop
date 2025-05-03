"use server";

import { eq } from "drizzle-orm";
import { AuthKeys } from "../../../drizzle/schema/authKeys";
import { db } from "../db";
import { getUser } from "../server";

export async function getRegisteredServices() {
  const user = await getUser();
  return (
    await db
      .select({ streamingService: AuthKeys.streamingService })
      .from(AuthKeys)
      .where(eq(AuthKeys.userId, user.id))
  ).map((row) => row.streamingService);
}
