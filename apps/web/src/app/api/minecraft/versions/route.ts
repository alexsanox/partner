import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json", {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    // Only release versions, sorted newest first
    const releases = (data.versions as { id: string; type: string }[])
      .filter((v) => v.type === "release")
      .map((v) => v.id);

    return NextResponse.json({ versions: releases });
  } catch {
    return NextResponse.json({ versions: [] });
  }
}
