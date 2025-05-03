export const streamingServices = ["spotify", "youtube"] as const;
export type streamingServiceType = (typeof streamingServices)[number];

export function isStreamingServiceType(
  value: any
): value is streamingServiceType {
  return streamingServices.includes(value as streamingServiceType);
}
