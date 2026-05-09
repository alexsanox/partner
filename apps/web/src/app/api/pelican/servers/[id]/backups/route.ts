import { NextRequest, NextResponse } from "next/server";
import {
  listBackups,
  createBackup,
  deleteBackup,
  getBackupDownloadUrl,
  restoreBackup,
  toggleBackupLock,
} from "@/lib/pelican";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backups = await listBackups(id);
    return NextResponse.json(backups);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list backups" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "create") {
      const result = await createBackup(id, body.name);
      return NextResponse.json(result.attributes);
    }

    if (body.action === "delete") {
      await deleteBackup(id, body.uuid);
      return NextResponse.json({ success: true });
    }

    if (body.action === "download") {
      const url = await getBackupDownloadUrl(id, body.uuid);
      return NextResponse.json({ url });
    }

    if (body.action === "restore") {
      await restoreBackup(id, body.uuid, body.truncate ?? false);
      return NextResponse.json({ success: true });
    }

    if (body.action === "lock") {
      const result = await toggleBackupLock(id, body.uuid);
      return NextResponse.json(result.attributes);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backup operation failed" },
      { status: 500 }
    );
  }
}
