import { NextRequest, NextResponse } from "next/server";
import { sendCommand } from "@/lib/pelican";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { command } = (await req.json()) as { command: string };

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Invalid command" }, { status: 400 });
    }

    await sendCommand(id, command);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send command" },
      { status: 500 }
    );
  }
}
