import { NextRequest } from "next/server";
import { getWebSocketAuth } from "@/lib/pelican";
import { spawn, execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Resolve node binary once at module load time (not per-request)
const nodeBin = (() => {
  const check = (p: string) => {
    try { return fs.existsSync(p) && execSync(`"${p}" --version`, { encoding: "utf8", timeout: 500 }).trim().startsWith("v") ? p : null; } catch { return null; }
  };
  // Fast: check process.execPath first (works when running under node)
  if (check(process.execPath)) return process.execPath;
  // Fast: common system paths
  for (const p of ["/usr/bin/node", "/usr/local/bin/node"]) {
    if (check(p)) return p;
  }
  // Slower fallback: search HOME
  try {
    const found = execSync("find $HOME -maxdepth 5 -name node -type f -path '*/bin/*' ! -path '*/node_modules/*' 2>/dev/null | head -1", { encoding: "utf8", timeout: 2000 }).trim();
    if (found && check(found)) return found;
  } catch {}
  return "node";
})();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let wsAuth;
  try {
    wsAuth = await getWebSocketAuth(id);
  } catch (err) {
    // Return error as SSE so the client EventSource can handle it
    const errMsg = err instanceof Error ? err.message : "Auth failed";
    const body = `event: error\ndata: ${JSON.stringify(errMsg)}\n\n`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let closed = false;

  const send = (event: string, data: string) => {
    if (closed) return;
    writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`)).catch(() => {
      closed = true;
    });
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    writer.close().catch(() => {});
  };

  const bridgePath = path.resolve(process.cwd(), "src/lib/ws-bridge.mjs");
  const child = spawn(nodeBin, [bridgePath, wsAuth.socket, wsAuth.token], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, NODE_PATH: path.resolve(process.cwd(), "node_modules") },
  });

  let lineBuffer = "";

  child.stdout.on("data", (chunk: Buffer) => {
    lineBuffer += chunk.toString();
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);

        if (msg.type === "connected") {
          send("connected", "true");
          continue;
        }

        if (msg.type === "disconnected") {
          send("disconnected", "true");
          cleanup();
          continue;
        }

        if (msg.event === "auth success") {
          send("auth", "success");
        }

        if (msg.event === "console output") {
          send("output", JSON.stringify(msg.args));
        }

        if (msg.event === "status") {
          send("status", msg.args[0]);
        }

        if (msg.event === "stats") {
          send("stats", JSON.stringify(msg.args));
        }

        if (msg.event === "token expiring") {
          getWebSocketAuth(id)
            .then((newAuth) => {
              child.stdin.write(
                JSON.stringify({ event: "auth", args: [newAuth.token] }) + "\n"
              );
            })
            .catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  });

  child.stderr.on("data", (chunk: Buffer) => {
    console.error("[ws-bridge]", chunk.toString());
  });

  child.on("close", () => {
    send("disconnected", "true");
    cleanup();
  });

  req.signal.addEventListener("abort", () => {
    closed = true;
    try { child.stdin.end(); } catch {}
    child.kill("SIGTERM");
    // Force kill after 3s if still alive
    setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, 3000);
    writer.close().catch(() => {});
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
