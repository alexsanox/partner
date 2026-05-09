import { NextRequest, NextResponse } from "next/server";
import { updateStartupVariable, renameServer, reinstallServer } from "@/lib/pelican";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "update-variable") {
      const result = await updateStartupVariable(id, body.key, body.value);
      return NextResponse.json({ success: true, variable: result.attributes });
    }

    if (body.action === "rename") {
      await renameServer(id, body.name, body.description);
      return NextResponse.json({ success: true });
    }

    if (body.action === "reinstall") {
      await reinstallServer(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Settings update failed" },
      { status: 500 }
    );
  }
}
