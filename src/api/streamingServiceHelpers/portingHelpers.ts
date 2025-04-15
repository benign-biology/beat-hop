"use server";

import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";
import { streamingServiceType } from "@/types/streamingServices";
import { addBulkToYoutubePlaylist } from "./streamingService/youtube";
import { addBulkToSpotifyPlaylist } from "./streamingService/spotify";

const portToPlaylistMap: Record<
  streamingServiceType,
  (
    playlistId: string,
    playlistTracks: beatHopDataResponse<beatHopTrackType>
  ) => Promise<void>
> = {
  spotify: addBulkToSpotifyPlaylist,
  youtube: addBulkToYoutubePlaylist,
};

export function portPlaylistToService(
  tracks: Promise<beatHopDataResponse<beatHopTrackType>>,
  service: streamingServiceType
) {}
