import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { createDirectory, getFileUploadUrl } from "@/lib/pelican";
import AdmZip from "adm-zip";

interface MrpackFile {
  path: string;
  downloads: string[];
  fileSize: number;
  env?: { client?: string; server?: string };
}

interface MrpackIndex {
  formatVersion: number;
  game: string;
  versionId: string;
  name: string;
  files: MrpackFile[];
  dependencies: Record<string, string>;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const serverId = formData.get("serverId") as string;
    const file = formData.get("mrpack") as File;

    if (!serverId || !file) {
      return NextResponse.json({ error: "serverId and mrpack file required" }, { status: 400 });
    }

    // Verify the server belongs to this user
    const service = await prisma.service.findFirst({
      where: { externalServerId: serverId, userId: session.user.id },
    });
    if (!service) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Parse the .mrpack (it's a ZIP)
    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const indexEntry = zip.getEntry("modrinth.index.json");
    if (!indexEntry) {
      return NextResponse.json({ error: "Invalid mrpack: missing modrinth.index.json" }, { status: 400 });
    }

    const index: MrpackIndex = JSON.parse(indexEntry.getData().toString("utf8"));

    // Filter to server-side files only (skip client-only)
    const serverFiles = index.files.filter((f) => {
      const env = f.env?.server;
      return !env || env !== "unsupported";
    });

    // Ensure /mods directory exists
    try {
      await createDirectory(serverId, "/", "mods");
    } catch { /* already exists */ }

    // Get upload URL from Pelican
    const uploadUrl = await getFileUploadUrl(serverId);

    // Download each mod and upload to Pelican
    const results: { name: string; ok: boolean; error?: string }[] = [];

    for (const modFile of serverFiles) {
      const fileName = modFile.path.split("/").pop()!;
      const downloadUrl = modFile.downloads[0];
      if (!downloadUrl) continue;

      try {
        // Download the mod
        const modRes = await fetch(downloadUrl);
        if (!modRes.ok) throw new Error(`Download failed: ${modRes.status}`);
        const modBuffer = await modRes.arrayBuffer();

        // Upload to Pelican via signed URL
        const targetDir = modFile.path.includes("/") 
          ? "/" + modFile.path.split("/").slice(0, -1).join("/")
          : "/mods";
        
        const uploadWithDir = `${uploadUrl}&directory=${encodeURIComponent(targetDir)}`;
        const form = new FormData();
        form.append("files", new Blob([modBuffer]), fileName);

        const uploadRes = await fetch(uploadWithDir, {
          method: "POST",
          body: form,
        });

        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          throw new Error(`Upload failed: ${text}`);
        }

        results.push({ name: fileName, ok: true });
      } catch (err) {
        results.push({ name: fileName, ok: false, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    // Also extract any override files from the mrpack (overrides/ folder)
    const overrideEntries = zip.getEntries().filter(
      (e) => (e.entryName.startsWith("overrides/") || e.entryName.startsWith("server-overrides/")) && !e.isDirectory
    );

    for (const entry of overrideEntries) {
      const relativePath = entry.entryName.replace(/^(server-)?overrides\//, "");
      const fileName = relativePath.split("/").pop()!;
      const dir = "/" + relativePath.split("/").slice(0, -1).join("/");

      try {
        if (dir !== "/") {
          try { await createDirectory(serverId, "/", dir.replace(/^\//, "")); } catch { /* exists */ }
        }

        const uploadWithDir = `${uploadUrl}&directory=${encodeURIComponent(dir || "/")}`;
        const form = new FormData();
        form.append("files", new Blob([new Uint8Array(entry.getData())]), fileName);

        await fetch(uploadWithDir, { method: "POST", body: form });
        results.push({ name: `overrides/${relativePath}`, ok: true });
      } catch (err) {
        results.push({ name: `overrides/${relativePath}`, ok: false, error: err instanceof Error ? err.message : "Unknown" });
      }
    }

    const failed = results.filter((r) => !r.ok);
    const succeeded = results.filter((r) => r.ok);

    return NextResponse.json({
      ok: true,
      modpack: index.name,
      total: results.length,
      installed: succeeded.length,
      failed: failed.length,
      failures: failed,
    });
  } catch (err) {
    console.error("[install-mrpack]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to install modpack" },
      { status: 500 }
    );
  }
}
