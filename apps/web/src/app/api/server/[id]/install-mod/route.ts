import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id: serverId } = await params;
    const { fileUrl, filename, loaders = [] } = (await req.json()) as { fileUrl: string; filename: string; loaders?: string[] };

    if (!fileUrl || !filename) {
      return NextResponse.json({ error: "Missing fileUrl or filename" }, { status: 400 });
    }

    // Verify the server belongs to this user
    const service = await prisma.service.findFirst({
      where: { externalServerId: serverId, userId: session.user.id },
    });
    if (!service) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const PELICAN_URL = process.env.PELICAN_URL!;
    const PELICAN_CLIENT_KEY = process.env.PELICAN_CLIENT_KEY!;

    // Determine destination folder based on loaders, then fall back to extension
    const MOD_LOADERS = ["fabric", "forge", "neoforge", "quilt", "liteloader", "rift"];
    const lowerLoaders = loaders.map((l) => l.toLowerCase());
    const isMod = lowerLoaders.some((l) => MOD_LOADERS.includes(l));
    const folder = isMod ? "/mods" : "/plugins";

    // Download the file from Modrinth
    const fileRes = await fetch(fileUrl, { headers: { "User-Agent": "PartnerHosting/1.0" } });
    if (!fileRes.ok) {
      return NextResponse.json({ error: "Failed to download file from Modrinth" }, { status: 502 });
    }
    const fileBuffer = await fileRes.arrayBuffer();

    // Upload to server via Pelican client API
    const uploadRes = await fetch(
      `${PELICAN_URL}/api/client/servers/${serverId}/files/write?file=${encodeURIComponent(`${folder}/${filename}`)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      },
    );

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      // If folder doesn't exist, try root /mods or /plugins
      if (uploadRes.status === 404 || text.includes("not found") || text.includes("directory")) {
        // Try uploading to root instead
        const rootUpload = await fetch(
          `${PELICAN_URL}/api/client/servers/${serverId}/files/write?file=${encodeURIComponent(`/${filename}`)}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
              "Content-Type": "application/octet-stream",
            },
            body: fileBuffer,
          },
        );
        if (!rootUpload.ok) {
          return NextResponse.json({ error: `Upload failed: ${await rootUpload.text()}` }, { status: 502 });
        }
        return NextResponse.json({ ok: true, path: `/${filename}`, warning: "Uploaded to root (plugins/mods folder not found)" });
      }
      return NextResponse.json({ error: `Upload failed: ${text}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true, path: `${folder}/${filename}` });
  } catch (err) {
    console.error("[install-mod]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
