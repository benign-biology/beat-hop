/// <reference types="vinxi/types/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly VITE_SPOTIFY_REDIRECT_URL: string;
  readonly VITE_SPOTIFY_CLIENT_ID: string;
  readonly SPOTIFY_CLIENT_SECRET: string;
  readonly VITE_SPOTIFY_USER_AUTH_ENDPOINT: string;
  readonly SPOTIFY_ACCOUNT_ENDPOINT: string;
  readonly SPOTIFY_API_ENDPOINT: string;
  readonly VITE_YOUTUBE_REDIRECT_URL: string;
  readonly VITE_YOUTUBE_CLIENT_ID: string;
  readonly YOUTUBE_CLIENT_SECRET: string;
  readonly VITE_YOUTUBE_USER_AUTH_ENDPOINT: string;
  readonly YOUTUBE_ACCOUNT_ENDPOINT: string;
  readonly YOUTUBE_API_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
