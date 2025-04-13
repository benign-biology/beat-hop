import { A, createAsync, useParams } from "@solidjs/router";
import { For } from "solid-js";
import {
  getAllSpotifyPlaylistTracks,
  getConvertedSpotifyPlaylistTracks,
} from "~/api/streamingServiceHelpers/spotify";
import {
  addBulkToYoutubePlaylist,
  getConvertedYoutubePlaylistTracks,
} from "~/api/streamingServiceHelpers/youtube";
import {
  beatHopDataResponse,
  beatHopTrackType,
} from "~/types/beatHopStructure";
import { streamingServiceType } from "~/types/streamingServices";

export const route = {
  preload() {
    (service: string, playlistID: string) => getTracks(service, playlistID);
  },
};

const getServiceTracksMap: Record<
  streamingServiceType,
  (playlistID: string) => Promise<beatHopDataResponse<beatHopTrackType>>
> = {
  spotify: getConvertedSpotifyPlaylistTracks,
  youtube: getConvertedYoutubePlaylistTracks,
};

async function getTracks(service: string, playlistID: string) {
  "use server";
  return await getServiceTracksMap[service as streamingServiceType](playlistID);
}

export default function Playlists() {
  const params = useParams();
  const tracks = createAsync(async () =>
    getTracks(params.service, params.playlistID)
  );
  return (
    <main class="w-full p-4 space-y-2">
      <h1>Service {params.service}</h1>
      <For each={tracks()?.items}>
        {(track) => (
          <div>
            <A href={`/playlist/`}>{track.name}</A>
          </div>
        )}
      </For>{" "}
    </main>
  );
}
