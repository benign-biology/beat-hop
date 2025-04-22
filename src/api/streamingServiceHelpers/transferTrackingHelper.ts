"use server";

import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";
import { getUser } from "..";
import { Transfers } from "../../../drizzle/schema/transfers";
import { db } from "../db";
import { streamingServiceType } from "@/types/streamingServices";
import { and, eq } from "drizzle-orm";

export async function saveTransferState(
  playlistTracks: beatHopDataResponse<beatHopTrackType>,
  createdPlaylistId: string,
  fromStreamingService: streamingServiceType,
  toStreamingService: streamingServiceType
) {
  const user = await getUser();
  const transferId = crypto.randomUUID();
  await db.insert(Transfers).values({
    id: transferId,
    userId: user.id,
    transferItems: playlistTracks,
    createdPlaylistId,
    fromStreamingService,
    toStreamingService,
  });
  return transferId;
}

export async function getTransferState(transfrId: string) {
  const user = await getUser();
  return (
    await db
      .select()
      .from(Transfers)
      .where(and(eq(Transfers.userId, user.id), eq(Transfers.id, transfrId)))
  )[0].transferItems as string;
}

export async function updateTransferState(
  transferId: string,
  playlistTracks: beatHopDataResponse<beatHopTrackType>
) {
  const user = await getUser();
  return await db
    .update(Transfers)
    .set({ transferItems: playlistTracks })
    .where(eq(Transfers.id, transferId));
}
