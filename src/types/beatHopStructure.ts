import { streamingServiceType } from "./streamingServices";
import { YoutubeResourceId } from "./youtubeData";

export type beatHopDataResponse<T> = {
  prev: string;
  next: string;
  items: Array<T>;
  name?: string;
};

export type beatHopPlaylistType = {
  image: string;
  name: string;
  id: string;
  album?: string;
  service?: streamingServiceType;
  tracks?: [beatHopTrackType];
  total: number;
};

export type beatHopTrackType = {
  image: string;
  name: string;
  artists: [string];
  album: string;
  id: string;
  resourceId?: YoutubeResourceId; // for youtube
  uri?: string; // for spotify
  ervice?: streamingServiceType;
  transferStatus?: transferStatusType;
};

export const transferStatuses = [
  "not-started",
  "in-progress",
  "complete",
] as const;
export type transferStatusType = (typeof transferStatuses)[number];
