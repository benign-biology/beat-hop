"use server";

import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";
import { streamingServiceType } from "@/types/streamingServices";
import { Transfers } from "../../../drizzle/schema/transfers";
import { db } from "../db";
import { getUser } from "..";
import { eq, and } from "drizzle-orm";

export async function addToTransferList(
  fromStreamingService: streamingServiceType,
  fromPlaylistId: string,
  toStreamingService: streamingServiceType,
  playlistName: string,
  toPlaylistId: string | null = null
) {
  const user = await getUser();
  return await db
    .insert(Transfers)
    .values({
      userId: user.id,
      fromStreamingService,
      toStreamingService,
      fromPlaylistId,
      toPlaylistId,
      playlistName,
    })
    .returning();
}

export async function updateTransferStateItems(
  transferId: string,
  transferItems: beatHopDataResponse<beatHopTrackType>
) {
  const user = await getUser();
  return await db
    .update(Transfers)
    .set({ transferItems: JSON.stringify(transferItems) })
    .where(and(eq(Transfers.id, transferId), eq(Transfers.userId, user.id)));
}

export async function updateTransferStateMeta(transferId: string, meta: {}) {
  const user = await getUser();
  return await db
    .update(Transfers)
    .set(meta)
    .where(and(eq(Transfers.id, transferId), eq(Transfers.userId, user.id)));
}

export async function getFromTransferList(transferId: string) {
  const user = await getUser();
  return await db
    .select()
    .from(Transfers)
    .where(and(eq(Transfers.id, transferId), eq(Transfers.userId, user.id)));
}

export async function deleteFromTransferList(transferId: string) {
  return await db.delete(Transfers).where(eq(Transfers.id, transferId));
}
