import { getUser } from "..";
import { AuthKeys } from "../../../drizzle/schema/authKeys";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { getCurrentTime } from "../time";
import { grantType, TokenResponse } from "@/types/serviceAuthData";
import { streamingServiceType } from "@/types/streamingServices";

export async function SaveUserAccessToken(
  tokenResponse: TokenResponse,
  streamingService: streamingServiceType
) {
  const user = await getUser();
  const now = getCurrentTime();
  await db
    .insert(AuthKeys)
    .values({
      userId: user.id,
      authCode: tokenResponse.access_token,
      refreshCode: tokenResponse.refresh_token,
      expiresIn: now + tokenResponse.expires_in,
      streamingService: streamingService,
    })
    .onConflictDoUpdate({
      target: [AuthKeys.userId, AuthKeys.streamingService],
      set: {
        authCode: tokenResponse.access_token,
        refreshCode: tokenResponse.refresh_token,
        expiresIn: now + tokenResponse.expires_in,
      },
    });
  return tokenResponse;
}

export async function clearUserAccessToken(
  streamingService: streamingServiceType
) {
  const user = await getUser();
  await db
    .delete(AuthKeys)
    .where(
      and(
        eq(AuthKeys.userId, user.id),
        eq(AuthKeys.streamingService, streamingService)
      )
    );
}

export async function getStreamingServiceAccessTokenFromDB(
  getAccessTokenCallback: (
    grant_type: grantType,
    code: string
  ) => Promise<TokenResponse>,
  streamingService: streamingServiceType
) {
  const user = await getUser();
  var token = (
    await db
      .select()
      .from(AuthKeys)
      .where(
        and(
          eq(AuthKeys.userId, user.id),
          eq(AuthKeys.streamingService, streamingService)
        )
      )
  )[0];
  const now = getCurrentTime();
  if (token.expiresIn < now) {
    const newToken = await getAccessTokenCallback(
      "refresh_token",
      token!.refreshCode
    );
    await SaveUserAccessToken(newToken, streamingService);
    token.expiresIn = newToken.expires_in;
    token.authCode = newToken.access_token;
  }
  return token;
}
