import { portToService } from "@/api/streamingServiceHelpers/portingHelpers";
import { getFromTransferList } from "@/api/streamingServiceHelpers/transferTrackingHelper";
import type { APIEvent } from "@solidjs/start/server";
import { IncomingMessage } from "http";

const encoder = new TextEncoder();

export const GET = async ({ request, params, nativeEvent }: APIEvent) => {
  const transferId = params.transferId;

  const errorResponse = () => {
    return new Response("Missing ID", { status: 400 });
  };

  if (!transferId) errorResponse();
  const [transferState] = await getFromTransferList(transferId!);
  if (!transferState) errorResponse();

  // const stream = new TransformStream();
  // const writer = stream.writable.getWriter();
  // sseClients.set(id!, writer);
  // console.log(sseClients);

  // Cleanup when client disconnects
  // request.signal.addEventListener("abort", () => closeSSE(id!));

  // writer.write(encode("weeee\n\n"));
  // writer.write(encode(JSON.stringify(transferState)));
  console.log("responding");

  // const mes = (request: IncomingMessage, init: any) => {
  //   let cleanup: (() => void) | undefined;
  //   let closeStream: (() => void) | undefined;
  //   let onClientClose: (() => void) | undefined = () => {
  //     if (onClientClose) {
  //       request.removeListener("close", onClientClose);
  //       onClientClose = undefined;
  //     }
  //     closeStream?.();
  //   };
  //   request.addListener("close", onClientClose);

  //   return new ReadableStream({
  //     start(controller) {
  //       const encoder = new TextEncoder();
  //       const send = (data: string, id?: string) => {
  //         const payload =
  //           (id ? "id:" + id + "\ndata:" : "data:") + data + "\n\n";
  //         controller.enqueue(encoder.encode(payload));
  //       };

  //       closeStream = () => {
  //         if (!cleanup) return;

  //         cleanup();
  //         cleanup = undefined;
  //         controller.close();
  //       };
  //       cleanup = init({ send, close: closeStream });

  //       if (!onClientClose) {
  //         // client closed request early
  //         closeStream();
  //         return;
  //       }
  //     },
  //   });
  // };

  // const test = new ReadableStream({
  //   start(controller) {
  //     let id = 0;

  //     const send = () => {
  //       id++;
  //       if (id >= 3) {
  //         controller.close();
  //       }
  //       const message = `id: ${id}\ndata: Hello at ${new Date().toISOString()}\n\n`;
  //       controller.enqueue(new TextEncoder().encode(message));
  //     };

  //     const interval = setInterval(send, 2000);

  //     send(); // Send the first message immediately

  //     request.signal.addEventListener("abort", () => {
  //       clearInterval(interval);
  //       controller.close();
  //     });
  //   },
  // });

  const setOnHoldController = new AbortController();
  var abortRequested = false;

  const port = new ReadableStream({
    async start(controller) {
      const messageUpdate = (update: any) => {
        console.log(update);
        const message = `data: ${JSON.stringify(update)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      };
      request.signal.addEventListener("abort", () => {
        abortRequested = true;
        setOnHoldController.abort();
      });
      await portToService(
        transferState.playlistName,
        transferState.fromPlaylistId,
        transferState.fromStreamingService,
        transferState.toStreamingService,
        transferId,
        messageUpdate,
        setOnHoldController.signal
      );
      if (abortRequested) {
        controller.close();
      }
      // controller.close();
    },
  });

  return new Response(port, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
