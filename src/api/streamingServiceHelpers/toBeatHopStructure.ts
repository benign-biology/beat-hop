import {
  beatHopDataResponse,
  beatHopPlaylistType,
  beatHopTrackType,
} from "~/types/beatHopStructure";
import {
  SpotifyDataResponse,
  SpotifyPlaylist,
  SpotifyTrack,
} from "~/types/spotifyData";
import {
  YoutubeDataResponse,
  YoutubePlaylist,
  YoutubeSearchResult,
  YoutubeTrack,
} from "~/types/youtubeData";

export function spotifyPlaylistsToBeathopData(
  spotifyPlaylists: SpotifyDataResponse<SpotifyPlaylist>
): beatHopDataResponse<beatHopPlaylistType> {
  return {
    items: spotifyPlaylists.items.map((playlist) => {
      return {
        image: playlist.images?.[0]?.url ?? "",
        name: playlist.name,
        id: playlist.id,
      };
    }) as [beatHopPlaylistType],
    prev: spotifyPlaylists.previous,
    next: spotifyPlaylists.next,
  };
}

export function spotifyTracksToBeatHopData(
  spotifyTracks: SpotifyDataResponse<SpotifyTrack>
): beatHopDataResponse<beatHopTrackType> {
  return {
    items: spotifyTracks.items.map((item) => {
      return {
        image: item.track.album.images?.[0]?.url ?? "",
        name: item.track.name,
        id: item.track.id,
        album: item.track.album.name,
        artists: item.track.artists.map((artist) => {
          return artist.name;
        }),
      };
    }) as [beatHopTrackType],
    prev: spotifyTracks.previous ?? "",
    next: spotifyTracks.next ?? "",
  };
}

export function youtubePlaylistsToBeathopData(
  youtubePlaylists: YoutubeDataResponse<YoutubePlaylist>
): beatHopDataResponse<beatHopPlaylistType> {
  return {
    items: youtubePlaylists.items.map((playlist) => {
      return {
        image: playlist.snippet.thumbnails.default.url,
        name: playlist.snippet.title,
        id: playlist.id,
      };
    }) as [beatHopPlaylistType],
    prev: youtubePlaylists.prevPageToken,
    next: youtubePlaylists.nextPageToken,
  };
}

export function youtubeTracksToBeatHopData(
  youtubeTracks: YoutubeDataResponse<YoutubeTrack>
): beatHopDataResponse<beatHopTrackType> {
  return {
    items: youtubeTracks.items.map((item) => {
      return {
        image: item.snippet.thumbnails.default?.url ?? "",
        name: item.snippet.title,
        id: item.id,
        // album: item.track.album.name,
        // artists: item.track.artists.map((artist) => {
        //   return artist.name;
        // }),
      };
    }) as [beatHopTrackType],
    prev: youtubeTracks.prevPageToken,
    next: youtubeTracks.nextPageToken,
  };
}

export function youtubeSearchResultToBeatHopData(
  youtubeTracks: YoutubeDataResponse<YoutubeSearchResult>
): beatHopDataResponse<beatHopTrackType> {
  return {
    items: youtubeTracks.items.map((item) => {
      return {
        image: item.snippet.thumbnails.default?.url ?? "",
        name: item.snippet.title,
        id: item.id.videoId,
        resourceId: {
          kind: item.id.kind,
          videoId: item.id.videoId,
        },
        // album: item.track.album.name,
        // artists: item.track.artists.map((artist) => {
        //   return artist.name;
        // }),
      };
    }) as [beatHopTrackType],
    prev: youtubeTracks.prevPageToken,
    next: youtubeTracks.nextPageToken,
  };
}
