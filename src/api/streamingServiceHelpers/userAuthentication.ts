export function authenticateWithSpotify() {
  window.open(
    `${
      import.meta.env.VITE_SPOTIFY_USER_AUTH_ENDPOINT
    }response_type=code&client_id=${
      import.meta.env.VITE_SPOTIFY_CLIENT_ID
    }&scope=playlist-read-private playlist-read-collaborative&redirect_uri=${
      import.meta.env.VITE_SPOTIFY_REDIRECT_URL
    }&show_dialog=true`,
    "_blank"
  );
}
export function authenticateWithYoutube() {
  window.open(
    `${
      import.meta.env.VITE_YOUTUBE_USER_AUTH_ENDPOINT
    }response_type=code&client_id=${
      import.meta.env.VITE_YOUTUBE_CLIENT_ID
    }&scope=https://www.googleapis.com/auth/youtube
      &redirect_uri=${
        import.meta.env.VITE_YOUTUBE_REDIRECT_URL
      }&access_type=offline`,
    "_blank"
  );
}
