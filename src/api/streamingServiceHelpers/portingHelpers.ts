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

const portToPlaylistMap: Record<
  streamingServiceType,
  (
    playlistNmae: string,
    playlistTracks: beatHopDataResponse<beatHopTrackType>,
    fromStreamingService: streamingServiceType
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

export async function portPlaylistToService(
  tracks: Promise<beatHopDataResponse<beatHopTrackType>>,
  playlistName: string,
  fromStreamingService: streamingServiceType,
  toStreamingService: streamingServiceType
) {
  console.log("porting started");
  return await portToPlaylistMap[toStreamingService](
    playlistName,
    await tracks,
    fromStreamingService
  );
}

export async function getAllConvertedPlaylistTracks(
  service: streamingServiceType,
  playlistId: string
) {
  console.log(service, playlistId);
  return await getServicePlaylistAllTracks[service](playlistId);
}
