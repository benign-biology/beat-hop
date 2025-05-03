import { getConvertedSpotifyCurrentUserPlaylists } from "@/api/streamingServiceHelpers/streamingService/spotify";
import { getConvertedYoutubeCurrentUserPlaylists } from "@/api/streamingServiceHelpers/streamingService/youtube";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuShortcut,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { DropdownMenuSubTriggerProps } from "@kobalte/core/dropdown-menu";
import {
  beatHopDataResponse,
  beatHopPlaylistType,
} from "@/types/beatHopStructure";
import { streamingServiceType } from "@/types/streamingServices";
import {
  A,
  AccessorWithLatest,
  createAsync,
  useNavigate,
  useParams,
} from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { addToTransferList } from "@/api/streamingServiceHelpers/transferTrackingHelper";

export const route = {
  preload() {
    (service: streamingServiceType) => getPlaylists(service);
  },
};

const getServicePlaylistsMap: Record<
  streamingServiceType,
  () => Promise<beatHopDataResponse<beatHopPlaylistType>>
> = {
  spotify: getConvertedSpotifyCurrentUserPlaylists,
  youtube: getConvertedYoutubeCurrentUserPlaylists,
};

async function getPlaylists(service: string) {
  return getServicePlaylistsMap[service as streamingServiceType]();
}

export default function Playlists() {
  const params = useParams();
  const playlists = createAsync(async () => getPlaylists(params.service));
  const navigate = useNavigate();

  // const [showStatusBar, setShowStatusBar] = createSignal<boolean>(true);
  // const [showActivityBar, setShowActivityBar] = createSignal<boolean>(false);
  // const [showPanel, setShowPanel] = createSignal<boolean>(false);
  return (
    <main class="w-full p-4 space-y-2">
      <h1>Service{params.service}</h1>
      {playlistTable(playlists)}
      <For each={playlists()?.items}>
        {(playlist) => (
          <div>
            {" "}
            <A href={`/${params.service}/playlist/${playlist.id}`}>
              {playlist.name}
            </A>
            <DropdownMenu placement="bottom">
              <DropdownMenuTrigger
                as={(props: DropdownMenuSubTriggerProps) => (
                  <button>Open</button>
                )}
              />
              <DropdownMenuContent class="w-56">
                <DropdownMenuItem>
                  <i class="i-lucide:user mr-2" />
                  <span>Profile</span>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i class="i-lucide:credit-card mr-2" />
                  <span>Billing</span>
                  <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i class="i-lucide:settings mr-2" />
                  <span>Settings</span>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Show when={params.service == "spotify"}>
              <button
                onClick={async () => {
                  navigate(
                    `/transfer/${
                      (
                        await addToTransferList(
                          "spotify",
                          playlist.id,
                          "youtube",
                          playlist.name
                        )
                      )[0].id
                    }`,
                    { replace: false }
                  );
                  // navigate(
                  //   `/transfer/${await portToService(
                  //     playlist.name,
                  //     playlist.id,
                  //     "spotify",
                  //     "youtube"
                  //   )}`,
                  //   { replace: false }
                  // );
                }}
              >
                Port to Youtube
              </button>
            </Show>
          </div>
        )}
      </For>{" "}
    </main>
  );
}

// const columns: ColumnDef<beatHopTrackType>[] = [
//   {
//     accessorKey: "code",
//     header: "Task",
//   },
//   {
//     accessorKey: "title",
//     header: "Title",
//   },
//   {
//     accessorKey: "status",
//     header: "Status",
//   },
// ];

const playlistTable = (
  data: AccessorWithLatest<beatHopDataResponse<beatHopPlaylistType> | undefined>
) => {
  const headers = ["name", "no of tracks"];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <For each={headers}>
            {(header) => <TableHead>{header}</TableHead>}
          </For>
          {/* <For each={headerGroup.headers}>
              {(header) => {
                return (
                  <TableHead>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              }}
            </For> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        <Show
          when={data()}
          fallback={
            <TableRow>
              <TableCell
                // colSpan={local.columns.length}
                class="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          }
        >
          <For each={data()?.items}>
            {(row) => (
              <TableRow>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.total}</TableCell>
              </TableRow>
            )}
          </For>
        </Show>
      </TableBody>
    </Table>
  );
};
