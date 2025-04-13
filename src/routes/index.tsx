import {
  createAsync,
  useNavigate,
  type RouteDefinition,
} from "@solidjs/router";
import { For, Show } from "solid-js";
import { getUser, logout } from "~/api";
import { getRegisteredServices } from "~/api/streamingServiceHelpers/streamingServices";
import {
  streamingServices,
  streamingServiceType,
} from "~/types/streamingServices";

export const route = {
  preload() {
    getUser();
    getRegisteredServices();
  },
} satisfies RouteDefinition;

function authenticateWithSpotify() {
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
function authenticateWithYoutube() {
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

const serviceAuthenticationMap: Record<streamingServiceType, Function> = {
  spotify: authenticateWithSpotify,
  youtube: authenticateWithYoutube,
};

export default function Home() {
  const user = createAsync(async () => getUser(), { deferStream: true });
  const authorisedStreamingServices = createAsync(
    async () => getRegisteredServices(),
    {
      deferStream: true,
    }
  );
  const navigate = useNavigate();

  const showPlaylists = (service: streamingServiceType) => {
    navigate(`/${service}/playlists`);
  };
  return (
    <main class="w-full p-4 space-y-2">
      <h2 class="font-bold text-3xl">Hello {user()?.username}</h2>
      <h3 class="font-bold text-xl">Message board</h3>
      <form action={logout} method="post">
        <button name="logout" type="submit">
          Logout
        </button>
      </form>
      <For each={streamingServices}>
        {(service: streamingServiceType) => {
          return (
            <div>
              <Show
                when={!authorisedStreamingServices()?.includes(service)}
                fallback={
                  <button onClick={() => showPlaylists(service)}>
                    get {service} playlists
                  </button>
                }
              >
                {" "}
                <button onClick={() => serviceAuthenticationMap[service]()}>
                  Login to {service}
                </button>
              </Show>
            </div>
          );
        }}
      </For>
      {/* <Show
        when={!streamingServices()?.includes("spotify")}
        fallback={<button onClick={()=>showPlaylists('spotify')}>get playlists</button>}
      >
        {" "}
        <button onClick={authenticateWithSpotify}>Login to spotify</button>
      </Show>
      <Show
        when={!streamingServices()?.includes("youtube")}
        fallback={<button onClick={()=>showPlaylists("youtube")}>get playlists</button>}
      >
        {" "}
        <button onClick={authenticateWithYoutube}>Login to youtube</button>
      </Show> */}
    </main>
  );
}
