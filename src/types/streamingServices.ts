export const streamingServices = ["spotify", "youtube"] as const;
export type streamingServiceType = (typeof streamingServices)[number];
