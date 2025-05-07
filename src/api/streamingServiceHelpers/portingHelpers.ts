"use server";

import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";
import { streamingServiceType } from "@/types/streamingServices";
import {
  createPlaylistAndTransferSongsToYoutube,
  getYoutubePlaylistAllTracks,
} from "./streamingService/youtube";
import {
  createPlaylistAndTransferSongsToSpotify,
  getSpotifyPlaylistAllTracks,
} from "./streamingService/spotify";
import {
  getFromTransferList,
  updateTransferStateItems,
  updateTransferStateMeta,
} from "./transferTrackingHelper";

const portToPlaylistMap: Record<
  streamingServiceType,
  (
    playlistNmae: string,
    playlistTracks: beatHopDataResponse<beatHopTrackType>,
    transferId: string,
    signal: AbortSignal,
    update: (update: any) => void,
    continueFrom: number,
    toPlaylistId?: string,
    searchResults?: Array<beatHopDataResponse<beatHopTrackType>>
  ) => Promise<string>
> = {
  spotify: createPlaylistAndTransferSongsToSpotify,
  youtube: createPlaylistAndTransferSongsToYoutube,
};

const getServicePlaylistAllTracks: Record<
  streamingServiceType,
  (playlistId: string) => Promise<beatHopDataResponse<beatHopTrackType>>
> = {
  spotify: getSpotifyPlaylistAllTracks,
  youtube: getYoutubePlaylistAllTracks,
};

async function portPlaylistToService(
  tracks: beatHopDataResponse<beatHopTrackType>,
  playlistName: string,
  toStreamingService: streamingServiceType,
  transferId: string,
  signal: AbortSignal,
  update: (update: string) => void,
  continueFrom: number,
  toPlaylistId?: string,
  searchResults?: Array<beatHopDataResponse<beatHopTrackType>>
) {
  return await portToPlaylistMap[toStreamingService](
    playlistName,
    tracks,
    transferId,
    signal,
    update,
    continueFrom,
    toPlaylistId,
    searchResults
  );
}

export async function getAllConvertedPlaylistTracks(
  service: streamingServiceType,
  playlistId: string
) {
  return await getServicePlaylistAllTracks[service](playlistId);
}

export async function portToService(
  playlistName: string,
  playlistId: string,
  fromStreamingService: streamingServiceType,
  toStreamingService: streamingServiceType,
  transferId: string,
  update: (update: any) => void,
  signal: AbortSignal
) {
  let shouldStop = false;
  let canForceStop = true;

  // Handle graceful interruption
  signal.addEventListener("abort", () => {
    shouldStop = true;
    if (canForceStop) return;
  });

  // Load persisted state (if any)
  const [persisted] = await getFromTransferList(transferId);
  const persistedState = persisted?.transferItems;

  let continueFrom = 0;
  let playlistTracks: beatHopDataResponse<beatHopTrackType>;
  if (persistedState) {
    // Resume from saved state
    playlistTracks = persistedState;
    continueFrom = getTransferContinueFromIndex(playlistTracks);
  } else {
    // Start fresh
    playlistTracks = await getAllConvertedPlaylistTracks(
      fromStreamingService,
      playlistId
    );
    await updateTransferStateItems(transferId, playlistTracks);
  }

  update(playlistTracks);

  if (continueFrom == -1) {
    await updateTransferStateMeta(transferId, { transferStatus: "complete" });
    return;
  } else {
    await updateTransferStateMeta(transferId, {
      transferStatus: "in-progress",
    });
  }

  canForceStop = false;

  // Begin transfer
  await portPlaylistToService(
    playlistTracks,
    playlistName,
    toStreamingService,
    transferId,
    signal,
    update,
    continueFrom,
    persisted.toPlaylistId ?? undefined,
    persisted.transferSearchResults ?? undefined
  );
  await updateTransferStateMeta(transferId, { transferStatus: "complete" });
}

function getTransferContinueFromIndex(
  playlistTracks: beatHopDataResponse<beatHopTrackType>
): number {
  return playlistTracks.items.findIndex(
    (track) => track.transferStatus == "not-started"
  );
}
