export const sseClients = new Map<string, WritableStreamDefaultWriter>();

const encoder = new TextEncoder();
const encode = (msg: string) => encoder.encode(msg);

export async function pushToClient(id: string, data: string) {
  const writer = sseClients.get(id);
  if (!writer) return;

  const message = encode(`data: ${data}\n\n`);
  writer.write(message).catch(() => {
    sseClients.delete(id);
  });
}

export function closeSSE(id: string) {
  sseClients.get(id)?.close();
  sseClients.delete(id);
}
