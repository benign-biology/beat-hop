import type { APIEvent } from "@solidjs/start/server";
import { SaveUserAccessToken } from "~/api/streamingServiceHelpers/accessTokenHelpers";
import { getSpotifyAccessToken } from "~/api/streamingServiceHelpers/spotify";
import { getYoutubeAccessToken } from "~/api/streamingServiceHelpers/youtube";
import { grantType, tokenResponse } from "~/types/serviceAuthData";
import { streamingServiceType } from "~/types/streamingServices";

const serviceRegistrationMap: Record<
  streamingServiceType,
  (grant_type: grantType, code: string) => Promise<tokenResponse>
> = { spotify: getSpotifyAccessToken, youtube: getYoutubeAccessToken };

export async function GET({ request, params }: APIEvent) {
  const searchParams = new URL(request.url).searchParams;
  const streamingService = params.service as streamingServiceType;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state"); //NEED TO IMPLEMENT STATE CHECK
  if (error) {
    return new Response("Access denied", { status: 400 });
  }

  if (code) {
    await SaveUserAccessToken(
      await serviceRegistrationMap[streamingService](
        "authorization_code",
        code
      ),
      streamingService
    );
    return new Response("All good", { status: 200 });
  }
}
