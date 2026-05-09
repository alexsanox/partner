import { NextRequest, NextResponse } from "next/server";
import { getClientServer } from "@/lib/pelican";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const server = await getClientServer(id);
    return NextResponse.json({
      is_installing: server.is_installing,
      status: server.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
