import {
  getConvertedSpotifyCurrentUserPlaylists,
  getAllSpotifyPlaylistTracks,
} from "@/api/streamingServiceHelpers/streamingService/spotify";
import {
  getConvertedYoutubeCurrentUserPlaylists,
  createYoutubePlaylist,
  addBulkToYoutubePlaylist,
} from "@/api/streamingServiceHelpers/streamingService/youtube";
import {
  beatHopDataResponse,
  beatHopPlaylistType,
} from "@/types/beatHopStructure";
import { streamingServiceType } from "@/types/streamingServices";
import { A, createAsync, useParams } from "@solidjs/router";
import { For, Show } from "solid-js";

export const route = {
  preload() {
    (service: streamingServiceType) => getPlaylists(service);
  },
};

const getServicePlaylistsMap: Record<
  streamingServiceType,
  () => Promise<beatHopDataResponse<beatHopPlaylistType>>
> = {
  spotify: getConvertedSpotifyCurrentUserPlaylists,
  youtube: getConvertedYoutubeCurrentUserPlaylists,
};

async function getPlaylists(service: string) {
  "use server";
  return getServicePlaylistsMap[service as streamingServiceType]();
}

async function portToYoutube(playlistName: string, playlistId: string) {
  "use server";
  const newPlaylistId = await createYoutubePlaylist(playlistName);
  const playlistTracks = await getAllSpotifyPlaylistTracks(playlistId);
  await addBulkToYoutubePlaylist(newPlaylistId.id, playlistTracks);
  return;
}

export default function Playlists() {
  const params = useParams();
  const playlists = createAsync(async () => getPlaylists(params.service));
  return (
    <main class="w-full p-4 space-y-2">
      <h1>Service{params.service}</h1>
      <For each={playlists()?.items}>
        {(playlist) => (
          <div>
            {" "}
            <A href={`/${params.service}/playlist/${playlist.id}`}>
              {playlist.name}
            </A>
            <Show when={params.service == "spotify"}>
              <button
                onClick={() => {
                  portToYoutube(playlist.name, playlist.id);
                }}
              >
                Port to Youtube
              </button>
            </Show>
          </div>
        )}
      </For>{" "}
    </main>
  );
}
