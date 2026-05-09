import { NextRequest, NextResponse } from "next/server";
import { sendPowerAction, type PowerSignal } from "@/lib/pelican";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { signal } = (await req.json()) as { signal: PowerSignal };

    if (!["start", "stop", "restart", "kill"].includes(signal)) {
      return NextResponse.json({ error: "Invalid signal" }, { status: 400 });
    }

    await sendPowerAction(id, signal);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send power action" },
      { status: 500 }
    );
  }
}
