"use server";

import { sseClients } from "./sseStore";

const encoder = new TextEncoder();
const encode = (msg: string) => encoder.encode(msg);

export async function pushToClient(id: string, data: string) {
  const writer = sseClients.get(id);
  console.log(sseClients);
  console.log("writer reference", writer);
  if (!writer) return;

  const message = encode(`data: ${data}\n\n`);
  writer.write(message).catch(() => {
    console.log("deleting   ", id);
    // sseClients.delete(id);
  });
}

export function closeSSE(id: string) {
  console.log("closing writer", id);
  // sseClients.get(id)?.close();
  // sseClients.delete(id);
}
