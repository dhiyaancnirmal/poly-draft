"use server";

export const runtime = "edge";

/**
 * WebSocket proxy to Polymarket CLOB.
 * Browser connects to /api/polymarket/ws; this handler connects to the upstream
 * Polymarket WS and pipes messages both ways.
 */
export async function GET(req: Request) {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const { 0: client, 1: server } = new WebSocketPair();

  const upstream = new WebSocket("wss://ws-subscriptions-clob.polymarket.com/ws/");

  // When upstream opens, accept client
  upstream.addEventListener("open", () => {
    server.accept();
  });

  // Relay upstream -> client
  upstream.addEventListener("message", (event) => {
    try {
      server.send(event.data);
    } catch (err) {
      console.error("Proxy send to client failed", err);
    }
  });

  // Relay client -> upstream
  server.addEventListener("message", (event) => {
    try {
      upstream.send(event.data);
    } catch (err) {
      console.error("Proxy send to upstream failed", err);
    }
  });

  const closeBoth = (code?: number, reason?: string) => {
    try {
      server.close(code ?? 1000, reason);
    } catch {}
    try {
      upstream.close(code ?? 1000, reason);
    } catch {}
  };

  upstream.addEventListener("close", (event) => {
    closeBoth(event.code, event.reason);
  });

  server.addEventListener("close", (event) => {
    closeBoth(event.code, event.reason);
  });

  upstream.addEventListener("error", (event) => {
    console.error("Upstream WS error", event);
    closeBoth(1011, "Upstream error");
  });

  server.addEventListener("error", (event) => {
    console.error("Client WS error", event);
    closeBoth(1011, "Client error");
  });

  return new Response(null, { status: 101, webSocket: client });
}

