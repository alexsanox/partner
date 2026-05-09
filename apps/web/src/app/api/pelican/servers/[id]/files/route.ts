import { NextRequest, NextResponse } from "next/server";
import { listFiles, getFileContent, writeFileContent, deleteFiles, renameFile, createDirectory } from "@/lib/pelican";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dir = req.nextUrl.searchParams.get("directory") || "/";
    const file = req.nextUrl.searchParams.get("file");

    if (file) {
      const content = await getFileContent(id, file);
      return new NextResponse(content, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const files = await listFiles(id, dir);
    return NextResponse.json(files);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list files" },
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

    if (body.action === "write") {
      await writeFileContent(id, body.file, body.content);
      return NextResponse.json({ success: true });
    }

    if (body.action === "delete") {
      await deleteFiles(id, body.root, body.files);
      return NextResponse.json({ success: true });
    }

    if (body.action === "rename") {
      await renameFile(id, body.root, body.from, body.to);
      return NextResponse.json({ success: true });
    }

    if (body.action === "create-folder") {
      await createDirectory(id, body.root, body.name);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "File operation failed" },
      { status: 500 }
    );
  }
}
