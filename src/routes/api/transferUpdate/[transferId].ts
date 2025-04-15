// src/routes/api/stream.ts
import type { APIEvent } from "@solidjs/start/server";

// Store active connections
const clients = new Set<WritableStreamDefaultWriter>();

export const GET = async ({ request }: APIEvent) => {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  clients.add(writer);

  // Cleanup on disconnect
  request.signal.addEventListener("abort", () => {
    writer.close();
    clients.delete(writer);
  });

  // Optionally send an initial message
  writer.write(encode(`data: connected\n\n`));

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

// Util to encode strings to Uint8Array
const encoder = new TextEncoder();
const encode = (msg: string) => encoder.encode(msg);

// Function you can call from anywhere to push updates
export function pushUpdateToClient(data: string) {
  const message = encode(`data: ${data}\n\n`);
  for (const writer of clients) {
    writer.write(message).catch(() => {
      // If write fails (e.g., disconnected), remove the client
      clients.delete(writer);
    });
  }
}
