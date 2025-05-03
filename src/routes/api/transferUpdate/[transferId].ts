import { portToService } from "@/api/streamingServiceHelpers/portingHelpers";
import { getFromTransferList } from "@/api/streamingServiceHelpers/transferTrackingHelper";
import type { APIEvent } from "@solidjs/start/server";

export const GET = async ({ request, params, nativeEvent }: APIEvent) => {
  const transferId = params.transferId;

  const errorResponse = () => {
    return new Response("Missing ID", { status: 400 });
  };

  if (!transferId) errorResponse();
  const [transferState] = await getFromTransferList(transferId!);
  if (!transferState) errorResponse();

  // const test = new ReadableStream({
  //   start(controller) {
  //     let id = 0;

  //     const send = () => {
  //       id++;
  //       if (id >= 3) {
  //         clearInterval(interval);
  //         controller.close();
  //         return;
  //       }
  //       const message = `id: ${id}\ndata: Hello at ${new Date().toISOString()}\n\n`;
  //       controller.enqueue(new TextEncoder().encode(message));
  //     };

  //     const interval = setInterval(send, 2000);

  //     send(); // Send the first message immediately

  //     request.signal.addEventListener("abort", () => {
  //       clearInterval(interval);
  //       // return;
  //       // controller.close();
  //     });
  //   },
  // });

  const setOnHoldController = new AbortController();
  var abortRequested = false;

  const port = new ReadableStream({
    async start(controller) {
      const messageUpdate = (update: any) => {
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
      controller.close();
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
