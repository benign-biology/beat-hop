import { streamingServiceType } from "@/types/streamingServices";
import { db } from "../db";
import { SongAssets } from "../../../drizzle/schema/songAssets";
import { and, arrayContained, eq } from "drizzle-orm";

export async function addToSongAssetsList(
  name: string,
  artists: [string],
  streamingService: streamingServiceType,
  assetId: string
) {
  return await db
    .insert(SongAssets)
    .values({
      name,
      artists: artists,
      streamingService,
      assetId,
    })
    .returning();
}

export async function getFromSongAssetsList(
  name: string,
  artists: [string],
  streamingService: streamingServiceType
) {
  return await db
    .select()
    .from(SongAssets)
    .where(
      and(
        eq(SongAssets.name, name),
        arrayContained(SongAssets.artists, artists),
        eq(SongAssets.streamingService, streamingService)
      )
    );
}
