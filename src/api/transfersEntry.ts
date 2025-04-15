"use server";

import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";
import { streamingServiceType } from "@/types/streamingServices";
import { Transfers } from "../../drizzle/schema/transfers";
import { db } from "./db";
import { getUser } from ".";
import { eq, and } from "drizzle-orm";

export async function addToTransferList(
  tracks: Promise<beatHopDataResponse<beatHopTrackType>>,
  service: streamingServiceType
) {
  const user = await getUser();
  return await db
    .insert(Transfers)
    .values({ transferItems: JSON.stringify(tracks), userId: user.id });
}

export async function getFromTransferList(transferId: number) {
  const user = await getUser();
  return await db
    .select()
    .from(Transfers)
    .where(and(eq(Transfers.id, transferId), eq(Transfers.userId, user.id)));
}

export async function deleteFromTransferList(transferId: number) {
  return await db.delete(Transfers).where(eq(Transfers.id, transferId));
}
