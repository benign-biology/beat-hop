import { streamingServiceType } from "@/types/streamingServices";
import { addToSongAssetsList, getFromSongAssetsList } from "./songAssets";
import {
  beatHopDataResponse,
  beatHopTrackType,
} from "@/types/beatHopStructure";

export async function searchSong(
  name: string,
  artists: [string],
  streamingService: streamingServiceType,
  searchStreamingServiceForTrack: (
    name: string,
    artist: string
  ) => Promise<beatHopDataResponse<beatHopTrackType>>
) {
  const [searchResult] = await getFromSongAssetsList(
    name,
    artists,
    streamingService
  );
  if (!searchResult) {
    var apiSearchResult = (
      await searchStreamingServiceForTrack(name, artists.join(" "))
    ).items[0];
    await addToSongAssetsList(
      apiSearchResult.name,
      apiSearchResult.artists,
      streamingService,
      apiSearchResult.id
    );
  }
  return searchResult;
}
