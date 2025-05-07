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
import {
  isStreamingServiceType,
  streamingServices,
  streamingServiceType,
} from "@/types/streamingServices";
import {
  A,
  AccessorWithLatest,
  createAsync,
  redirect,
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
import { Button } from "@kobalte/core/button";

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

  if (!isStreamingServiceType(params.service)) {
    redirect("/");
  }

  const getPortToServices = streamingServices.filter(
    (service) => service !== params.service
  );

  // const [showStatusBar, setShowStatusBar] = createSignal<boolean>(true);
  // const [showActivityBar, setShowActivityBar] = createSignal<boolean>(false);
  // const [showPanel, setShowPanel] = createSignal<boolean>(false);
  const playlistTable = (
    playlists: AccessorWithLatest<
      beatHopDataResponse<beatHopPlaylistType> | undefined
    >
  ) => {
    const headers = ["name", "", "no of tracks"];
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
            when={playlists()}
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
            <For each={playlists()?.items}>
              {(playlist) => (
                <TableRow>
                  <TableCell>
                    {" "}
                    <A href={`/${params.service}/playlist/${playlist.id}`}>
                      {playlist.name}
                    </A>
                  </TableCell>
                  <TableCell>
                    {" "}
                    <DropdownMenu placement="bottom">
                      <DropdownMenuTrigger
                        as={(props: DropdownMenuSubTriggerProps) => (
                          <Button {...props}>Transfer</Button>
                        )}
                      />
                      <DropdownMenuContent class="w-56">
                        <For each={getPortToServices}>
                          {(service) => (
                            <DropdownMenuItem
                              onClick={async () => {
                                navigate(
                                  `/transfer/${
                                    (
                                      await addToTransferList(
                                        params.service as streamingServiceType,
                                        playlist.id,
                                        service,
                                        playlist.name
                                      )
                                    )[0].id
                                  }`,
                                  { replace: false }
                                );
                              }}
                            >
                              <i class="i-lucide:user mr-2" />
                              <span>{service}</span>
                              {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
                            </DropdownMenuItem>
                          )}
                        </For>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{playlist.total}</TableCell>
                </TableRow>
              )}
            </For>
          </Show>
        </TableBody>
      </Table>
    );
  };

  return (
    <main class="w-full p-4 space-y-2">
      <h1>Service{params.service}</h1>
      {playlistTable(playlists)}
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
