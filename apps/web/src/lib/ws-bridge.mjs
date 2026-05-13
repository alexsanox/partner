import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const WebSocket = require("ws");

const [, , socketUrl, token] = process.argv;
if (!socketUrl || !token) {
  process.stderr.write("Usage: ws-bridge <socket-url> <token>\n");
  process.exit(1);
}

const ws = new WebSocket(socketUrl, {
  headers: { Origin: "https://panel.novally.tech" },
  rejectUnauthorized: false,
});

ws.on("open", () => {
  ws.send(JSON.stringify({ event: "auth", args: [token] }));
  process.stdout.write(JSON.stringify({ type: "connected" }) + "\n");
});

ws.on("message", (raw) => {
  try {
    const msg = JSON.parse(raw.toString());
    process.stdout.write(JSON.stringify(msg) + "\n");

    if (msg.event === "auth success") {
      ws.send(JSON.stringify({ event: "send logs", args: [null] }));
    }
  } catch {
    // ignore
  }
});

ws.on("close", () => {
  process.stdout.write(JSON.stringify({ type: "disconnected" }) + "\n");
  process.exit(0);
});

ws.on("error", (err) => {
  process.stderr.write(`WS Error: ${err.message}\n`);
  process.exit(1);
});

process.stdin.on("data", (data) => {
  const line = data.toString().trim();
  if (line && ws.readyState === WebSocket.OPEN) {
    ws.send(line);
  }
});

// Die when parent process closes stdin (pipe broken / SSE disconnected)
process.stdin.on("end", () => { ws.close(); process.exit(0); });
process.stdin.on("error", () => { ws.close(); process.exit(0); });

function shutdown() { ws.close(); setTimeout(() => process.exit(0), 2000).unref(); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGHUP", shutdown);
