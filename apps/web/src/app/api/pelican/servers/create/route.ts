import { NextRequest, NextResponse } from "next/server";
import { createServer, getNodes, getNodeAllocations, createAllocation, getEgg } from "@/lib/pelican";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, eggId, userId } = body as {
      name: string;
      eggId: number;
      userId: number;
    };

    if (!name || !eggId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: name, eggId, userId" },
        { status: 400 }
      );
    }

    // 1. Fetch egg details to get startup command, docker image, and default env vars
    const egg = await getEgg(eggId);
    const dockerImages = Object.values(egg.docker_images);
    const dockerImage = dockerImages[dockerImages.length - 1] || dockerImages[0];
    const startup = egg.startup;

    // Build environment from egg variable defaults
    const environment: Record<string, string> = {};
    if (egg.relationships?.variables?.data) {
      for (const v of egg.relationships.variables.data) {
        environment[v.attributes.env_variable] = v.attributes.default_value;
      }
    }

    // 2. Pick a node (first non-maintenance)
    const nodesRes = await getNodes();
    const nodes = nodesRes.data.map((n) => n.attributes);
    const node = nodes.find((n) => !n.maintenance_mode);

    if (!node) {
      return NextResponse.json({ error: "No available node found." }, { status: 503 });
    }

    // 3. Get all existing allocations to find the next free port
    const allocRes = await getNodeAllocations(node.id);
    const allAllocs = allocRes.data.map((a) => a.attributes);

    // Find the IP from an existing allocation (or fallback)
    const nodeIp = allAllocs[0]?.ip || "0.0.0.0";

    // Determine next port: highest existing port + 1 (starting from 25565)
    const usedPorts = allAllocs.map((a) => a.port);
    const nextPort = usedPorts.length > 0 ? Math.max(...usedPorts) + 1 : 25565;

    // 4. Create a new allocation for this server
    await createAllocation(node.id, nodeIp, [String(nextPort)]);

    // 5. Re-fetch allocations to get the new allocation's ID
    const updatedAllocRes = await getNodeAllocations(node.id);
    const newAlloc = updatedAllocRes.data.find(
      (a) => a.attributes.port === nextPort && !a.attributes.assigned
    );

    if (!newAlloc) {
      return NextResponse.json(
        { error: "Allocation was created but could not be found. Please try again." },
        { status: 500 }
      );
    }

    // 6. Create the server
    const result = await createServer({
      name,
      user: userId,
      egg: eggId,
      docker_image: dockerImage,
      startup,
      environment,
      limits: { memory: 2048, swap: 0, disk: 10240, io: 500, cpu: 100 },
      feature_limits: { databases: 0, backups: 3 },
      allocation: { default: newAlloc.attributes.id },
    });

    return NextResponse.json({
      success: true,
      server: result.attributes,
      port: nextPort,
    });
  } catch (err) {
    console.error("[create-server]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
