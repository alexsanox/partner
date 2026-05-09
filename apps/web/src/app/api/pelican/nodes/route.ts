import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getNodes } from "@/lib/pelican";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getNodes();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch nodes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
