import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getEgg, getNodes, getNodeAllocations, createAllocation, createServer } from "@/lib/pelican";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// POST /api/admin/services/free
// Body: { userId, planId, serverName, isTrial, trialDays, mcVersion, serverType }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const {
      userId, planId, serverName, isTrial, trialDays, mcVersion, serverType,
    } = await req.json() as {
      userId: string;
      planId: string;
      serverName: string;
      isTrial: boolean;
      trialDays: number;
      mcVersion?: string;
      serverType?: string;
    };

    if (!userId || !planId || !serverName) {
      return NextResponse.json({ error: "userId, planId, and serverName are required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Compute trial end date
    const trialEndsAt = isTrial && trialDays > 0
      ? new Date(Date.now() + trialDays * 86_400_000)
      : undefined;

    // ── Provision Pelican server ──────────────────────────────────────────
    const eggId = await resolveEggId(plan.type, serverType, plan.eggId);
    const egg = await getEgg(eggId);
    const dockerImages = Object.values(egg.docker_images ?? {});
    const dockerImage = dockerImages[dockerImages.length - 1] || dockerImages[0];

    const environment: Record<string, string> = {};
    if (egg.relationships?.variables?.data) {
      for (const v of egg.relationships.variables.data) {
        environment[v.attributes.env_variable] = v.attributes.default_value;
      }
    }

    if (plan.type === "MINECRAFT") {
      const version = mcVersion || "latest";
      for (const key of ["MC_VERSION", "VERSION", "MINECRAFT_VERSION", "GAME_VERSION", "SERVER_VERSION"]) {
        if (key in environment) environment[key] = version;
      }
      environment["EULA"] = "TRUE";
    }

    const nodesRes = await getNodes();
    const node = nodesRes.data.map((n) => n.attributes).find((n) => !n.maintenance_mode);
    if (!node) throw new Error("No available node");

    const allocRes = await getNodeAllocations(node.id);
    const allAllocs = allocRes.data.map((a) => a.attributes);
    const nodeIp = allAllocs[0]?.ip || "0.0.0.0";
    const usedPorts = allAllocs.map((a) => a.port);
    const nextPort = usedPorts.length > 0 ? Math.max(...usedPorts) + 1 : 25565;

    await createAllocation(node.id, nodeIp, [String(nextPort)]);

    const updatedAllocRes = await getNodeAllocations(node.id);
    const newAlloc = updatedAllocRes.data.find(
      (a) => a.attributes.port === nextPort && !a.attributes.assigned,
    );
    if (!newAlloc) throw new Error("Allocation not found after creation");

    const result = await createServer({
      name: serverName,
      user: 1,
      egg: eggId,
      docker_image: dockerImage,
      startup: egg.startup,
      environment,
      limits: { memory: plan.ramMb, swap: 0, disk: plan.diskMb, io: 500, cpu: plan.cpuPercent },
      feature_limits: { databases: plan.databaseLimit ?? 0, backups: plan.backupSlots ?? 1 },
      allocation: { default: newAlloc.attributes.id },
    });

    const externalServerId = result.attributes.identifier;
    const externalServerUuid = result.attributes.uuid;

    // ── Create Service record (no order needed) ──────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = await prisma.service.create({
      data: {
        userId,
        planId,
        name: serverName,
        status: "ACTIVE",
        isTrial: isTrial ?? false,
        isFree: !isTrial,
        trialEndsAt: trialEndsAt ?? null,
        externalServerId,
        externalServerUuid,
        ipAddress: nodeIp,
        port: nextPort,
      } as any,
    });

    return NextResponse.json({ success: true, service });
  } catch (err) {
    console.error("[admin/services/free]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

async function resolveEggId(planType: string, serverType: string | undefined, fallbackEggId: number | null): Promise<number> {
  if (planType === "DISCORD_BOT") {
    try {
      const { getEggs } = await import("@/lib/pelican");
      const res = await getEggs();
      const eggs = res.data.map((e: { attributes: { id: number; name: string } }) => ({ id: e.attributes.id, name: e.attributes.name.toLowerCase() }));
      const match = eggs.find((e: { id: number; name: string }) => e.name.includes("node") || e.name.includes("discord") || e.name.includes("bot"));
      if (match) return match.id;
    } catch { /* fall through */ }
    return fallbackEggId ?? 1;
  }

  try {
    const { getEggs } = await import("@/lib/pelican");
    const res = await getEggs();
    const eggs = res.data.map((e: { attributes: { id: number; name: string } }) => ({ id: e.attributes.id, name: e.attributes.name.toLowerCase() }));
    const typeKeywords: Record<string, string[]> = {
      paper: ["paper"], fabric: ["fabric"], forge: ["forge", "neoforge"],
      purpur: ["purpur"], bungeecord: ["bungeecord", "bungee"],
      velocity: ["velocity"], vanilla: ["vanilla", "minecraft"],
    };
    const keywords = typeKeywords[serverType ?? "paper"] ?? ["paper"];
    for (const kw of keywords) {
      const match = eggs.find((e: { id: number; name: string }) => e.name.includes(kw));
      if (match) return match.id;
    }
  } catch { /* fall through */ }

  return fallbackEggId ?? 1;
}
