"use server";

import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";
import { grantType, TokenResponse } from "@/types/serviceAuthData";
import { streamingServiceType } from "@/types/streamingServices";
import {
  YoutubeDataResponse,
  YoutubePlaylist,
  YoutubeTrack,
  YoutubeSearchResult,
  YoutubeResourceId,
} from "@/types/youtubeData";
import { getStreamingServiceAccessTokenFromDB } from "../accessTokenHelpers";
import {
  youtubePlaylistsToBeathopData,
  youtubeTracksToBeatHopData,
  youtubeSearchResultToBeatHopData,
} from "../toBeatHopStructure";

const service: streamingServiceType = "youtube";

const itemLength = 50;

export async function getYoutubeAccessToken(
  grant_type: grantType,
  code: string
) {
  const tokenResponse = await fetch(`${process.env.YOUTUBE_ACCOUNT_ENDPOINT}`, {
    method: "POST",
    body: new URLSearchParams(
      grant_type == "authorization_code"
        ? {
            client_id: String(process.env.VITE_YOUTUBE_CLIENT_ID),
            client_secret: String(process.env.YOUTUBE_CLIENT_SECRET),
            grant_type,
            code,
            redirect_uri: String(process.env.VITE_YOUTUBE_REDIRECT_URL),
          }
        : {
            client_id: String(process.env.VITE_YOUTUBE_CLIENT_ID),
            client_secret: String(process.env.YOUTUBE_CLIENT_SECRET),
            grant_type,
            refresh_token: code,
          }
    ),
  });
  const response = await tokenResponse.json();
  response.expores_in = response.refresh_token_expires_in;
  return response as TokenResponse;
}

async function youtubeFetch(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: Object,
  fullUrl: boolean = false
) {
  const accessToken = await getStreamingServiceAccessTokenFromDB(
    getYoutubeAccessToken,
    service
  );
  return fetch(fullUrl ? path : process.env.YOUTUBE_API_ENDPOINT + path, {
    method,
    headers: {
      Authorization: "Bearer " + accessToken!.authCode,
      Accept: "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function getYoutubeCurrentUserPlaylists(): Promise<
  YoutubeDataResponse<YoutubePlaylist>
> {
  const playlistResponse = await youtubeFetch(
    "playlists?part=snippet,contentDetails&maxResults=25&mine=true"
  );
  const playlists = await playlistResponse.json();
  return playlists;
}

export async function getYoutubePlaylistTracks(
  playlistId: string
  // offset: number = 0
): Promise<YoutubeDataResponse<YoutubeTrack>> {
  const playlistTracksResponse = await youtubeFetch(
    `playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${itemLength}`
  );
  return await playlistTracksResponse.json();
}

export async function getConvertedYoutubeCurrentUserPlaylists() {
  return youtubePlaylistsToBeathopData(await getYoutubeCurrentUserPlaylists());
}

export async function getConvertedYoutubePlaylistTracks(playlistId: string) {
  return youtubeTracksToBeatHopData(await getYoutubePlaylistTracks(playlistId));
}

export async function createYoutubePlaylist(
  playlistName: string
): Promise<YoutubePlaylist> {
  const createdPlaylistResponse = await youtubeFetch(
    `playlists?part=snippet,contentDetails`,
    "POST",
    {
      snippet: { title: playlistName },
    }
  );
  return await createdPlaylistResponse.json();
}

export async function searchYoutubeForTrack(
  name: string,
  artist: string
): Promise<beatHopDataResponse<beatHopTrackType>> {
  const searchResult = (await (
    await youtubeFetch(
      `search?part=snippet&q=${name} ${artist}&type=video&maxResults=5`
    )
  ).json()) as YoutubeDataResponse<YoutubeSearchResult>;
  // console.log(searchResult);
  return await youtubeSearchResultToBeatHopData(searchResult);
}

export async function addToYoutubePlaylist(
  playlistId: string,
  resourceId: YoutubeResourceId
) {
  const res = await (
    await youtubeFetch(`playlistItems?part=snippet`, "POST", {
      snippet: {
        playlistId,
        resourceId,
      },
    })
  ).json();
  if (res.error) {
    console.log(JSON.stringify(res));
  }
  return res;
}

export async function addBulkToYoutubePlaylist(
  playlistId: string,
  playlistTracks: beatHopDataResponse<beatHopTrackType>
) {
  const youtubeSearchPromiseList = playlistTracks.items.map((track) => {
    return searchYoutubeForTrack(`${track.name}`, `${track.artists.join(" ")}`);
  });
  const youtubeTracks = await Promise.all(youtubeSearchPromiseList);
  for (const track of youtubeTracks) {
    await addToYoutubePlaylist(playlistId, track.items[0].resourceId!);
  }

  // FOR WHEN YOUTUBE LETS HIT ALL AT ONCE (not supported for now)
  // const youtubeInsertPromiseList = youtubeTracks.map((track) => {
  //   return addToYoutubePlaylist(playlistId, track.items[0].resourceId!);
  // });
  // await Promise.all(youtubeInsertPromiseList);
  // return;
}

// export async function getAllSpotifyPlaylistTracks(playlistId: string) {
//   const tracksPage0 = await getYoutubePlaylistTracks(playlistId);
//   const tracksPagesPromise = Array.from(
//     { length: Math.floor(tracksPage0.total / itemLength) },
//     (_, i) => getYoutubePlaylistTracks(playlistId, (i + 1) * itemLength)
//   );
//   const tracksPagesResult = await Promise.all(tracksPagesPromise);
//   const concatenatedTracks = {
//     href: tracksPage0.href,
//     limit: tracksPage0.limit,
//     next: tracksPage0.next,
//     offset: tracksPage0.offset,
//     previous: tracksPage0.previous,
//     total: tracksPage0.total,
//     items: [
//       ...tracksPage0.items,
//       ...tracksPagesResult.flatMap((page) => page.items),
//     ],
//   };
//   const data = youtubeTracksToBeatHopData(concatenatedTracks);
//   return data;
// }
