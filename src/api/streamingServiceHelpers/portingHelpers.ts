"use server";

import {
  beatHopDataResponse,
  beatHopPlaylistType,
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

const portToPlaylistMap: Record<
  streamingServiceType,
  (
    playlistNmae: string,
    playlistTracks: beatHopDataResponse<beatHopTrackType>
  ) => Promise<void>
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

export async function portPlaylistToService(
  service: streamingServiceType,
  tracks: Promise<beatHopDataResponse<beatHopTrackType>>,
  playlistName: string
) {
  await portToPlaylistMap[service](playlistName, await tracks);
}

export async function getAllConvertedPlaylistTracks(
  service: streamingServiceType,
  playlistId: string
) {
  return await getServicePlaylistAllTracks[service](playlistId);
}
