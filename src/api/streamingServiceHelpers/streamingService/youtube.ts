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
import {
  updateTransferStateItems,
  updateTransferStateMeta,
} from "../transferTrackingHelper";

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
  const res = await fetch(
    fullUrl ? path : process.env.YOUTUBE_API_ENDPOINT + path,
    {
      method,
      headers: {
        Authorization: "Bearer " + accessToken!.authCode,
        Accept: "application/json",
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

export async function getYoutubeCurrentUserPlaylists(): Promise<
  YoutubeDataResponse<YoutubePlaylist>
> {
  return await youtubeFetch(
    "playlists?part=snippet,contentDetails&maxResults=25&mine=true"
  );
}

export async function getYoutubePlaylistTracks(
  playlistId: string,
  token?: string
): Promise<YoutubeDataResponse<YoutubeTrack>> {
  const pageToken = token ? `&pageToken=${token}` : "";
  return await youtubeFetch(
    `playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${itemLength}${pageToken}`
  );
}

export async function getConvertedYoutubeCurrentUserPlaylists() {
  return youtubePlaylistsToBeathopData(await getYoutubeCurrentUserPlaylists());
}

export async function getConvertedYoutubePlaylistTracks(playlistId: string) {
  return youtubeTracksToBeatHopData(await getYoutubePlaylistTracks(playlistId));
}

export async function getYoutubePlaylistAllTracks(playlistId: string) {
  const tracksPage0 = await getYoutubePlaylistTracks(playlistId);
  const tracksPagesResult = [tracksPage0];

  var nextPageToken = tracksPage0.nextPageToken;

  for (
    let page = 1;
    page < Math.floor(tracksPage0.pageInfo.totalResults / itemLength);
    page++
  ) {
    tracksPagesResult.push(
      await getYoutubePlaylistTracks(playlistId, nextPageToken)
    );
    nextPageToken =
      tracksPagesResult[tracksPagesResult.length - 1].nextPageToken;
  }
  return await youtubeTracksToBeatHopData({
    items: tracksPagesResult.flatMap((tracksList) => tracksList.items),
    nextPageToken: tracksPage0.nextPageToken,
    prevPageToken: tracksPage0.prevPageToken,
    kind: tracksPage0.kind,
    etag: tracksPage0.etag,
    pageInfo: tracksPage0.pageInfo,
  });

  // while (tracksPageResult[tracksPageResult.length-1].nextPageToken)
  // const tracksPagesPromise = Array.from(
  //   { length: Math.floor(tracksPage0.total / itemLength) },
  //   (_, i) => getYoutubePlaylistTracks(playlistId, (i + 1) * itemLength)
  // );
  // const tracksPagesResult = await Promise.all(tracksPagesPromise);
  // const concatenatedTracks = {
  //   href: tracksPage0.href,
  //   limit: tracksPage0.limit,
  //   next: tracksPage0.next,
  //   offset: tracksPage0.offset,
  //   previous: tracksPage0.previous,
  //   total: tracksPage0.total,
  //   items: [
  //     ...tracksPage0.items,
  //     ...tracksPagesResult.flatMap((page) => page.items),
  //   ],
  // };
  // const data = youtubeTracksToBeatHopData(concatenatedTracks);
  // return data;
}

export async function createYoutubePlaylist(
  playlistName: string
): Promise<YoutubePlaylist> {
  return await youtubeFetch(`playlists?part=snippet,contentDetails`, "POST", {
    snippet: { title: playlistName },
  });
}

export async function searchYoutubeForTrack(
  name: string,
  artist: string
): Promise<beatHopDataResponse<beatHopTrackType>> {
  const searchResult = (await youtubeFetch(
    `search?part=snippet&q=${name} ${artist}&type=video&maxResults=5`
  )) as YoutubeDataResponse<YoutubeSearchResult>;
  // console.log(searchResult);
  return await youtubeSearchResultToBeatHopData(searchResult);
}

export async function addToYoutubePlaylist(
  playlistId: string,
  resourceId: YoutubeResourceId
) {
  const res = await youtubeFetch(`playlistItems?part=snippet`, "POST", {
    snippet: {
      playlistId,
      resourceId,
    },
  });
  if (res.error) {
    console.log(JSON.stringify(res));
  }
  return res;
}

export async function addBulkToYoutubePlaylist(
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
    console.log("abort");
    shouldStop = true;
    if (canForceStop) return;
  });

  // Only search for tracks that haven't been processed yet
  const tracksToSearch = playlistTracks.items.slice(continueFrom);

  const youtubeTracks =
    searchResults ??
    (await Promise.all(
      tracksToSearch.map((track) => {
        return searchYoutubeForTrack(
          `${track.name}`,
          `${track.artists.join(" ")}`
        );
      })
    ));
  canForceStop = false;

  for (const [offset, track] of youtubeTracks.entries()) {
    const index = continueFrom + offset;
    await addToYoutubePlaylist(playlistId, track.items[0].resourceId!);
    playlistTracks.items[index].transferStatus = "complete";
    await updateTransferStateItems(transferId, playlistTracks);
    if (shouldStop) return;
    else {
      update(playlistTracks);
    }
  }

  // FOR WHEN YOUTUBE LETS HIT ALL AT ONCE (not supported for now)
  // const youtubeInsertPromiseList = youtubeTracks.map((track) => {
  //   return addToYoutubePlaylist(playlistId, track.items[0].resourceId!);
  // });
  // await Promise.all(youtubeInsertPromiseList);
  // return;
}

export async function createPlaylistAndTransferSongsToYoutube(
  playlistNmae: string,
  playlistTracks: beatHopDataResponse<beatHopTrackType>,
  transferId: string,
  signal: AbortSignal,
  update: (update: any) => void,
  continueFrom: number = 0,
  toPlaylistId?: string
) {
  if (!toPlaylistId) {
    toPlaylistId = (await createYoutubePlaylist(playlistNmae)).id;
    await updateTransferStateMeta(transferId, { toPlaylistId });
  }
  // const transferId = await saveTransferState(
  //   playlistTracks,
  //   createdPlaylist.id,
  //   fromStreamingService,
  //   "youtube"
  // );
  addBulkToYoutubePlaylist(
    toPlaylistId,
    playlistTracks,
    transferId,
    signal,
    update,
    continueFrom
  );
  return transferId;
}
