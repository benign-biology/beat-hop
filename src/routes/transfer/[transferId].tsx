import { pushToClient } from "@/api/streamingServiceHelpers/sse";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAsync, useParams } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

// export const route = {
//   preload() {
//     (transferId: string) => getTransferState(transferId);
//   },
// };

function test(transferId: string) {
  "use server";
  pushToClient(transferId, "weeee");
}

export default function Transfer() {
  const params = useParams();
  // const transfer = createAsync(async () => getTransferState(params.transferId));
  const [data, setData] = createSignal<Record<string, any> | undefined>(
    undefined
  );
  onMount(() => {
    const eventSource = new EventSource(
      `/api/transferUpdate/${params.transferId}`
    );

    eventSource.onmessage = (event) => {
      console.log(event.data);
      const msg = JSON.parse(event.data);
      setData(msg);
    };

    eventSource.onerror = () => {
      console.error("Connection error");
      eventSource.close();
    };

    onCleanup(() => {
      eventSource.close();
    });
  });

  const headers = ["name", "artists", "status"];
  return (
    <div>
      <button onClick={() => test(params.transferId)}>push event</button>
      <Table>
        <TableHeader>
          <TableRow>
            <For each={headers}>
              {(header) => <TableHead>{header}</TableHead>}
            </For>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Show
            when={data()}
            fallback={
              <TableRow>
                <TableCell class="h-24 text-center">No results.</TableCell>
              </TableRow>
            }
          >
            <For each={data()?.items}>
              {(row) => (
                <TableRow>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.artists.join(",")}</TableCell>
                  <TableCell>{row.transferStatus}</TableCell>
                </TableRow>
              )}
            </For>
          </Show>
        </TableBody>
      </Table>
    </div>
  );
}
