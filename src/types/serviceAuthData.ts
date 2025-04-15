const grantType = ["authorization_code", "refresh_token"] as const;
export type grantType = (typeof grantType)[number];

export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
};
