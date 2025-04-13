import { streamingServiceType } from "./streamingServices";
import { YoutubeResourceId } from "./youtubeData";

export type beatHopDataResponse<T> = {
  prev: string;
  next: string;
  items: [T];
};

export type beatHopPlaylistType = {
  image: string;
  name: string;
  id: string;
  album?: string;
  service?: streamingServiceType;
  tracks?: [beatHopTrackType];
};

export type beatHopTrackType = {
  image: string;
  name: string;
  artists: [string];
  album: string;
  id: string;
  resourceId?: YoutubeResourceId;
  service?: streamingServiceType;
};
