import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { createDirectory, sendPowerAction } from "@/lib/pelican";
import AdmZip from "adm-zip";

const PELICAN_URL = process.env.PELICAN_URL!;
const PELICAN_CLIENT_KEY = process.env.PELICAN_CLIENT_KEY!;

async function writeFileToPelican(serverId: string, path: string, data: ArrayBuffer) {
  const res = await fetch(
    `${PELICAN_URL}/api/client/servers/${serverId}/files/write?file=${encodeURIComponent(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: data,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Write failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

export const maxDuration = 300;

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
  dependencies: Record<string, string> & {
    minecraft?: string;
    "fabric-loader"?: string;
    forge?: string;
    quilt?: string;
  };
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
    try { await createDirectory(serverId, "/", "mods"); } catch { /* already exists */ }

    const results: { name: string; ok: boolean; error?: string }[] = [];

    // Run tasks with a concurrency limit
    async function runConcurrent<T>(tasks: (() => Promise<T>)[], limit = 8): Promise<T[]> {
      const out: T[] = [];
      let i = 0;
      async function next(): Promise<void> {
        if (i >= tasks.length) return;
        const idx = i++;
        out[idx] = await tasks[idx]();
        await next();
      }
      await Promise.all(Array.from({ length: limit }, next));
      return out;
    }

    // Build mod install tasks
    const modTasks = serverFiles
      .filter((f) => f.downloads[0])
      .map((modFile) => async () => {
        const fileName = modFile.path.split("/").pop()!;
        const downloadUrl = modFile.downloads[0];
        const pathParts = modFile.path.split("/");
        const targetDir = pathParts.length > 1 ? "/" + pathParts.slice(0, -1).join("/") : "/mods";

        if (pathParts.length > 2) {
          try { await createDirectory(serverId, "/", pathParts.slice(0, -1).join("/")); } catch { /* exists */ }
        }

        try {
          const modRes = await fetch(downloadUrl);
          if (!modRes.ok) throw new Error(`Download failed: ${modRes.status}`);
          const modBuffer = await modRes.arrayBuffer();
          await writeFileToPelican(serverId, `${targetDir}/${fileName}`, modBuffer);
          results.push({ name: fileName, ok: true });
        } catch (err) {
          results.push({ name: fileName, ok: false, error: err instanceof Error ? err.message : "Unknown error" });
        }
      });

    await runConcurrent(modTasks, 8);

    // Extract override files from the mrpack (overrides/ folder)
    const overrideEntries = zip.getEntries().filter(
      (e) => (e.entryName.startsWith("overrides/") || e.entryName.startsWith("server-overrides/")) && !e.isDirectory
    );

    const overrideTasks = overrideEntries.map((entry) => async () => {
      const relativePath = entry.entryName.replace(/^(server-)?overrides\//, "");
      const fileName = relativePath.split("/").pop()!;
      const dirParts = relativePath.split("/").slice(0, -1);
      const dir = dirParts.length > 0 ? "/" + dirParts.join("/") : "/";

      try {
        if (dir !== "/") {
          try { await createDirectory(serverId, "/", dirParts.join("/")); } catch { /* exists */ }
        }
        await writeFileToPelican(serverId, `${dir}/${fileName}`, new Uint8Array(entry.getData()).buffer as ArrayBuffer);
        results.push({ name: `overrides/${relativePath}`, ok: true });
      } catch (err) {
        results.push({ name: `overrides/${relativePath}`, ok: false, error: err instanceof Error ? err.message : "Unknown" });
      }
    });

    await runConcurrent(overrideTasks, 6);

    // Restart the server so it picks up the new mods
    try { await sendPowerAction(serverId, "restart"); } catch { /* server may not be running yet */ }

    const failed = results.filter((r) => !r.ok);
    const succeeded = results.filter((r) => r.ok);

    return NextResponse.json({
      ok: true,
      modpack: index.name,
      mcVersion: index.dependencies?.minecraft ?? null,
      loaderVersion: index.dependencies?.["fabric-loader"] ?? index.dependencies?.forge ?? null,
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
