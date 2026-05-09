import { NextRequest, NextResponse } from "next/server";
import { getWebSocketAuth } from "@/lib/pelican";

const cache = new Map<string, { data: { token: string; socket: string }; expires: number }>();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cached = cache.get(id);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const wsAuth = await getWebSocketAuth(id);
    cache.set(id, { data: wsAuth, expires: Date.now() + 5 * 60 * 1000 });
    return NextResponse.json(wsAuth);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to get websocket auth";
    const status = msg.includes("429") ? 429 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
