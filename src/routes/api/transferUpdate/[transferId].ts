// src/routes/api/stream.ts
import type { APIEvent } from "@solidjs/start/server";

// Active client writers, keyed by client ID (e.g. user ID)
const clients = new Map<string, WritableStreamDefaultWriter>();

export const GET = async ({ request }: APIEvent) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id"); // e.g. ?id=user123

  if (!id) return new Response("Missing ID", { status: 400 });

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  clients.set(id, writer);

  // Cleanup when client disconnects
  request.signal.addEventListener("abort", () => {
    writer.close();
    clients.delete(id);
  });

  // Optional: initial message
  writer.write(encode(`data: connected to ${id}\n\n`));

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

const encoder = new TextEncoder();
const encode = (msg: string) => encoder.encode(msg);

// Function to push to a specific user/client
export function pushToClient(id: string, data: string) {
  const writer = clients.get(id);
  if (!writer) return;

  const message = encode(`data: ${data}\n\n`);
  writer.write(message).catch(() => {
    clients.delete(id);
  });
}
