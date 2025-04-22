import { closeSSE, sseClients } from "@/api/streamingServiceHelpers/sse";
import { getTransferState } from "@/api/streamingServiceHelpers/transferTrackingHelper";
import type { APIEvent } from "@solidjs/start/server";

const encoder = new TextEncoder();
const encode = (msg: string) => encoder.encode(msg);

export const GET = async ({ request, params }: APIEvent) => {
  const id = params.transferId;

  const errorResponse = () => {
    return new Response("Missing ID", { status: 400 });
  };

  if (!id) errorResponse();
  // const transferState = await getTransferState(id!);
  // if (!transferState) errorResponse();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  sseClients.set(id!, writer);

  // Cleanup when client disconnects
  request.signal.addEventListener("abort", () => closeSSE(id!));

  writer.write(encode("weeee"));
  // writer.write(encode(JSON.stringify(transferState)));

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
