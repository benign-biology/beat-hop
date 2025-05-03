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
} from "./transferTrackingHelper";

type PortFunction = (
  playlistName: string,
  playlistTracks: beatHopDataResponse<beatHopTrackType>,
  transferId: string,
  signal: AbortSignal
) => Promise<string>;

const portToPlaylistMap: Record<
  streamingServiceType,
  (
    playlistNmae: string,
    playlistTracks: beatHopDataResponse<beatHopTrackType>,
    transferId: string,
    signal: AbortSignal,
    update: (update: any) => void,
    continueFrom: number
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
  continueFrom: number
) {
  console.log("porting started");
  return await portToPlaylistMap[toStreamingService](
    playlistName,
    tracks,
    transferId,
    signal,
    update,
    continueFrom
  );
}

export async function getAllConvertedPlaylistTracks(
  service: streamingServiceType,
  playlistId: string
) {
  console.log(service, playlistId);
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
  console.log("port");

  let shouldStop = false;
  let canForceStop = true;

  // Handle graceful interruption
  signal.addEventListener("abort", () => {
    shouldStop = true;
    if (canForceStop) return;
  });

  // Load persisted state (if any)
  const persisted = await getFromTransferList(transferId);
  console.log(typeof persisted[0]?.transferItems);
  const persistedState = persisted[0]?.transferItems;

  let continueFrom = 0;
  let playlistTracks: beatHopDataResponse<beatHopTrackType>;
  if (persistedState) {
    // Resume from saved state
    playlistTracks = JSON.parse(persistedState);
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

  canForceStop = false;

  // Begin transfer
  await portPlaylistToService(
    playlistTracks,
    playlistName,
    toStreamingService,
    transferId,
    signal,
    update,
    continueFrom
  );
}

function getTransferContinueFromIndex(
  playlistTracks: beatHopDataResponse<beatHopTrackType>
): number {
  return playlistTracks.items.findIndex(
    (track) => track.transferStatus == "not-started"
  );
}
