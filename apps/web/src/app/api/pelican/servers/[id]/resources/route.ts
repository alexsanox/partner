import { NextRequest, NextResponse } from "next/server";
import { getServerResources } from "@/lib/pelican";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resources = await getServerResources(id);
    return NextResponse.json(resources);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
