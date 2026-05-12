import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getEgg, getNodes, getNodeAllocations, createAllocation, createServer } from "@/lib/pelican";


export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { orderId, mcVersion, serverType } = (await req.json()) as {
      orderId: string;
      mcVersion: string;
      serverType: string;
    };

    if (!orderId || !mcVersion || !serverType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify order belongs to user and is paid but not yet provisioned
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id, status: "PAID" },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found or already provisioned" }, { status: 404 });
    }

    // Check no service exists yet for this order
    const existing = await prisma.service.findFirst({ where: { orderId } });
    if (existing?.externalServerId) {
      return NextResponse.json({ error: "Server already provisioned" }, { status: 409 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: order.planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // Resolve egg: find best matching egg for the server type
    const eggId = await resolveEggId(serverType, plan.eggId);
    const egg = await getEgg(eggId);

    const dockerImages = Object.values(egg.docker_images ?? {});
    const dockerImage = dockerImages[dockerImages.length - 1] || dockerImages[0];

    // Build environment from defaults, then override version-related vars
    const environment: Record<string, string> = {};
    if (egg.relationships?.variables?.data) {
      for (const v of egg.relationships.variables.data) {
        environment[v.attributes.env_variable] = v.attributes.default_value;
      }
    }
    // Set the MC version in all known version env vars
    for (const key of ["MC_VERSION", "VERSION", "MINECRAFT_VERSION", "GAME_VERSION", "SERVER_VERSION"]) {
      if (key in environment) environment[key] = mcVersion;
    }
    environment["EULA"] = "TRUE";

    // Pick node
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
    if (!newAlloc) throw new Error("Allocation not found");

    // Get server name from the stub service record created by webhook
    const stub = await prisma.service.findFirst({ where: { orderId } });
    const serverName = stub?.name ?? `${plan.name} Server`;

    const result = await createServer({
      name: serverName,
      user: 1,
      egg: eggId,
      docker_image: dockerImage,
      startup: egg.startup,
      environment,
      limits: {
        memory: plan.ramMb,
        swap: 0,
        disk: plan.diskMb,
        io: 500,
        cpu: plan.cpuPercent,
      },
      feature_limits: {
        databases: plan.databaseLimit ?? 0,
        backups: plan.backupSlots ?? 3,
      },
      allocation: { default: newAlloc.attributes.id },
    });

    const externalServerId = result.attributes.identifier;
    const externalServerUuid = result.attributes.uuid;

    // Update the stub service record (always created by webhook)
    if (stub) {
      await prisma.service.update({
        where: { id: stub.id },
        data: { status: "ACTIVE", externalServerId, externalServerUuid, ipAddress: nodeIp, port: nextPort },
      });
    } else {
      await prisma.service.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          orderId: order.id,
          name: serverName,
          status: "ACTIVE",
          externalServerId,
          externalServerUuid,
          ipAddress: nodeIp,
          port: nextPort,
          stripeSubscriptionId: order.stripeSubscriptionId ?? undefined,
        },
      });
    }

    // Mark order as provisioned
    // Use PAID as terminal provisioned state (PROVISIONED added to schema but requires client regen)
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });

    return NextResponse.json({ ok: true, serverId: externalServerId });
  } catch (err) {
    console.error("[provision]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Provisioning failed" }, { status: 500 });
  }
}

async function resolveEggId(serverType: string, fallbackEggId: number | null): Promise<number> {
  try {
    const { getEggs } = await import("@/lib/pelican");
    const res = await getEggs();
    const eggs = res.data.map((e: { attributes: { id: number; name: string } }) => ({
      id: e.attributes.id,
      name: e.attributes.name.toLowerCase(),
    }));

    const typeKeywords: Record<string, string[]> = {
      paper: ["paper"],
      fabric: ["fabric"],
      forge: ["forge", "neoforge"],
      purpur: ["purpur"],
      bungeecord: ["bungeecord", "bungee"],
      velocity: ["velocity"],
      vanilla: ["vanilla", "minecraft"],
    };

    const keywords = typeKeywords[serverType] ?? [serverType];
    for (const kw of keywords) {
      const match = eggs.find((e: { id: number; name: string }) => e.name.includes(kw));
      if (match) return match.id;
    }
  } catch { /* fall through */ }

  return fallbackEggId ?? 1;
}
