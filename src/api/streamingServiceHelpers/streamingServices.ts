"use server";

import { eq } from "drizzle-orm";
import { getUser } from "..";
import { AuthKeys } from "../../../drizzle/schema/authKeys";
import { db } from "../db";

export async function getRegisteredServices() {
  const user = await getUser();
  return (
    await db
      .select({ streamingService: AuthKeys.streamingService })
      .from(AuthKeys)
      .where(eq(AuthKeys.userId, user.username))
  ).map((row) => row.streamingService);
}
