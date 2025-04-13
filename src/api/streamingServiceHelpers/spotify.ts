"use server";

import {
  SpotifyDataResponse,
  SpotifyPlaylist,
  SpotifyTrack,
} from "~/types/spotifyData";
import { getStreamingServiceAccessTokenFromDB } from "./accessTokenHelpers";
import { grantType, tokenResponse } from "~/types/serviceAuthData";
import { streamingServiceType } from "~/types/streamingServices";
import {
  spotifyPlaylistsToBeathopData,
  spotifyTracksToBeatHopData,
} from "./toBeatHopStructure";

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
  return (await tokenResponse.json()) as tokenResponse;
}

async function spotifyFetch(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: [string, string][],
  fullUrl: boolean = false
) {
  const accessToken = await getStreamingServiceAccessTokenFromDB(
    getSpotifyAccessToken,
    service
  );
  return fetch(fullUrl ? path : process.env.SPOTIFY_API_ENDPOINT + path, {
    method,
    headers: {
      Authorization: "Bearer " + accessToken!.authCode,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(body ? { body: new URLSearchParams(body) } : {}),
  });
}

export async function getSpotifyCurrentUserPlaylists(): Promise<
  SpotifyDataResponse<SpotifyPlaylist>
> {
  const playlistResponse = await spotifyFetch(
    `me/playlists?limit=${itemLength}`
  );
  return await playlistResponse.json();
}

export async function getSpotifyPlaylistTracks(
  playlistId: string,
  offset: number = 0
): Promise<SpotifyDataResponse<SpotifyTrack>> {
  const playlistTracksResponse = await spotifyFetch(
    `playlists/${playlistId}/tracks?limit=${itemLength}&offset=${offset}`
  );
  return await playlistTracksResponse.json();
}

export async function getConvertedSpotifyCurrentUserPlaylists() {
  return spotifyPlaylistsToBeathopData(await getSpotifyCurrentUserPlaylists());
}

export async function getConvertedSpotifyPlaylistTracks(playlistId: string) {
  return spotifyTracksToBeatHopData(await getSpotifyPlaylistTracks(playlistId));
}

export async function getAllSpotifyPlaylistTracks(playlistId: string) {
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
