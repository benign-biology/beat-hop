"use server";

import { grantType, TokenResponse } from "@/types/serviceAuthData";
import {
  SpotifyDataResponse,
  SpotifyPlaylist,
  SpotifySearchResult,
  SpotifyTrack,
  SpotifyUser,
} from "@/types/spotifyData";
import { streamingServiceType } from "@/types/streamingServices";
import { getStreamingServiceAccessTokenFromDB } from "../accessTokenHelpers";
import {
  spotifyPlaylistsToBeathopData,
  spotifySearchResultToBeatHopData,
  spotifyTracksToBeatHopData,
} from "../toBeatHopStructure";
import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";
import {
  updateTransferStateItems,
  updateTransferStateMeta,
} from "../transferTrackingHelper";

const service: streamingServiceType = "spotify";

const itemLength = 50;

export async function getSpotifyAccessToken(
  grant_type: grantType,
  code: string
) {
  const tokenResponse = await fetch(`${process.env.SPOTIFY_ACCOUNT_ENDPOINT}`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        btoa(
          `${process.env.VITE_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(
      grant_type == "authorization_code"
        ? {
            grant_type,
            code,
            redirect_uri: process.env.VITE_SPOTIFY_REDIRECT_URL!,
          }
        : { grant_type, refresh_token: code }
    ),
  });
  return (await tokenResponse.json()) as TokenResponse;
}

async function spotifyFetch(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: Object,
  fullUrl: boolean = false
) {
  const accessToken = await getStreamingServiceAccessTokenFromDB(
    getSpotifyAccessToken,
    service
  );
  const res = await fetch(
    fullUrl ? path : process.env.SPOTIFY_API_ENDPOINT + path,
    {
      method,
      headers: {
        Authorization: "Bearer " + accessToken!.authCode,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }
  );
  const resJson = await res.json();
  if (res.status != 200) {
    console.log(resJson);
    throw new Error("error");
  }
  return resJson;
}

export async function getSpotifyCurrentUserPlaylists(): Promise<
  SpotifyDataResponse<SpotifyPlaylist>
> {
  return await spotifyFetch(`me/playlists?limit=${itemLength}`);
}

export async function getSpotifyPlaylistTracks(
  playlistId: string,
  offset: number = 0
): Promise<SpotifyDataResponse<SpotifyTrack>> {
  return await spotifyFetch(
    `playlists/${playlistId}/tracks?limit=${itemLength}&offset=${offset}`
  );
}

export async function getConvertedSpotifyCurrentUserPlaylists() {
  return spotifyPlaylistsToBeathopData(await getSpotifyCurrentUserPlaylists());
}

export async function getConvertedSpotifyPlaylistTracks(playlistId: string) {
  return spotifyTracksToBeatHopData(await getSpotifyPlaylistTracks(playlistId));
}

export async function getSpotifyPlaylistAllTracks(playlistId: string) {
  const tracksPage0 = await getSpotifyPlaylistTracks(playlistId);
  const tracksPagesPromise = Array.from(
    { length: Math.floor(tracksPage0.total / itemLength) },
    (_, i) => getSpotifyPlaylistTracks(playlistId, (i + 1) * itemLength)
  );
  const tracksPagesResult = await Promise.all(tracksPagesPromise);
  const concatenatedTracks = {
    href: tracksPage0.href,
    limit: tracksPage0.limit,
    next: tracksPage0.next,
    offset: tracksPage0.offset,
    previous: tracksPage0.previous,
    total: tracksPage0.total,
    items: [
      ...tracksPage0.items,
      ...tracksPagesResult.flatMap((page) => page.items),
    ],
  };
  const data = spotifyTracksToBeatHopData(concatenatedTracks);
  return data;
}

export async function getSpotifyUser(): Promise<SpotifyUser> {
  return await spotifyFetch(`me`, "GET");
}

export async function createSpotifyPlaylist(
  playlistName: string,
  spotifyUserId: string
): Promise<SpotifyPlaylist> {
  return await spotifyFetch(`users/${spotifyUserId}/playlists`, "POST", {
    name: playlistName,
    description: "Added by BeatHop",
  });
}

export async function searchSpotifyForTrack(
  name: string,
  artist: string
): Promise<beatHopDataResponse<beatHopTrackType>> {
  const searchResult = (await spotifyFetch(
    `search?q=track:${name} artist:${artist}&type="track"=5`
  )) as SpotifySearchResult;
  // console.log(searchResult);
  return await spotifySearchResultToBeatHopData(searchResult);
}

export async function addToSpotifyPlaylist(playlistId: string, uris: string[]) {
  return await spotifyFetch(`playlists/${playlistId}/tracks`, "POST", {
    uris,
  });
}

export async function addBulkToSpotifyPlaylist(
  playlistId: string,
  playlistTracks: beatHopDataResponse<beatHopTrackType>,
  transferId: string,
  signal: AbortSignal,
  update: (update: any) => void,
  continueFrom: number = 0,
  searchResults?: Array<beatHopDataResponse<beatHopTrackType>>
) {
  let shouldStop = false;
  let canForceStop = true;
  signal.addEventListener("abort", () => {
    shouldStop = true;
    if (canForceStop) return;
  });

  const tracksToSearch = playlistTracks.items.slice(continueFrom);

  const spotifyTracks =
    searchResults ??
    (await Promise.all(
      tracksToSearch.map((track) => {
        return searchSpotifyForTrack(
          `${track.name}`,
          `${track.artists.join(" ")}`
        );
      })
    ));

  const chunkSize = 100;
  const spotifyTracksChunks = Array.from({
    length: Math.ceil(spotifyTracks.length / chunkSize),
  }).map((_, chunkIndex) => {
    return spotifyTracks
      .slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize)
      .map((item, index) => item.items?.[0]?.uri ?? "");
  });
  canForceStop = false;

  for (const [chunkIndex, tracksChunk] of spotifyTracksChunks.entries()) {
    const startIndex = continueFrom + chunkIndex * chunkSize;
    const endIndex = startIndex + chunkSize;

    await addToSpotifyPlaylist(playlistId, tracksChunk);

    playlistTracks.items.slice(startIndex, endIndex).forEach((item) => {
      item.transferStatus = "complete";
    });

    await updateTransferStateItems(transferId, playlistTracks);

    if (shouldStop) return;
    else {
      update(playlistTracks);
    }
  }
}

export async function createPlaylistAndTransferSongsToSpotify(
  playlistNmae: string,
  playlistTracks: beatHopDataResponse<beatHopTrackType>,
  transferId: string,
  signal: AbortSignal,
  update: (update: any) => void,
  continueFrom: number = 0,
  toPlaylistId?: string
) {
  if (!toPlaylistId) {
    toPlaylistId = (
      await createSpotifyPlaylist(playlistNmae, (await getSpotifyUser()).id)
    ).id;
    await updateTransferStateMeta(transferId, { toPlaylistId });
  }
  // const transferId = await saveTransferState(
  //   playlistTracks,
  //   createdPlaylist.id,
  //   fromStreamingService,
  //   "spotify"
  // );
  await addBulkToSpotifyPlaylist(
    toPlaylistId,
    playlistTracks,
    transferId,
    signal,
    update,
    continueFrom
  );
  return transferId;
}
