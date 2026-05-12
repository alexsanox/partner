import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const PELICAN_URL = process.env.PELICAN_URL || "http://127.0.0.1:80";
const PELICAN_CLIENT_KEY = process.env.PELICAN_CLIENT_KEY || "";

async function pelicanClient<T>(uuid: string, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PELICAN_URL}/api/client/servers/${uuid}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pelican ${options.method ?? "GET"} ${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

async function getServerUuid(serverId: string, userId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serverId, userId },
  });
  if (!service?.externalServerId) throw new Error("Server not found");
  return service.externalServerId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const uuid = await getServerUuid(id, session.user.id);
    const data = await pelicanClient(uuid, "/databases?include=password");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list databases" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const uuid = await getServerUuid(id, session.user.id);
    const body = await req.json();

    if (body.action === "create") {
      const result = await pelicanClient(uuid, "/databases", {
        method: "POST",
        body: JSON.stringify({ database: body.database }),
      });
      return NextResponse.json(result);
    }

    if (body.action === "delete") {
      await pelicanClient(uuid, `/databases/${body.databaseId}`, { method: "DELETE" });
      return NextResponse.json({ success: true });
    }

    if (body.action === "rotate") {
      const result = await pelicanClient(uuid, `/databases/${body.databaseId}/rotate-password`, { method: "POST" });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database operation failed" },
      { status: 500 }
    );
  }
}
