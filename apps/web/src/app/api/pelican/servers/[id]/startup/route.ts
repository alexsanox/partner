import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id: serverId } = await params;

    // Verify server belongs to user
    const service = await prisma.service.findFirst({
      where: { externalServerId: serverId, userId: session.user.id },
    });
    if (!service) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const PELICAN_URL = process.env.PELICAN_URL!;
    const PELICAN_CLIENT_KEY = process.env.PELICAN_CLIENT_KEY!;

    const res = await fetch(
      `${PELICAN_URL}/api/client/servers/${serverId}?include=variables`,
      {
        headers: {
          Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json({ variables: [] });
    }

    const data = await res.json();
    const variables = (data.attributes?.relationships?.variables?.data ?? []).map(
      (v: { attributes: { env_variable: string; server_value: string; default_value: string } }) => ({
        env_variable: v.attributes.env_variable,
        server_value: v.attributes.server_value,
        default_value: v.attributes.default_value,
      }),
    );

    return NextResponse.json({ variables });
  } catch (err) {
    console.error("[startup]", err);
    return NextResponse.json({ variables: [] });
  }
}
