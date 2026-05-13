import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerResources, sendPowerAction } from "@/lib/pelican";
import * as net from "net";

// GET /api/cron/idle-shutdown
// Checks Minecraft trial/free services for 0 players for 5 minutes, then stops them.
// Run every minute: * * * * * curl -s -H "x-cron-secret: $CRON_SECRET" https://novally.tech/api/cron/idle-shutdown
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const IDLE_MS = 5 * 60 * 1000; // 5 minutes

  // Only check MINECRAFT trial/free services that are ACTIVE
  const services = await prisma.service.findMany({
    where: {
      status: "ACTIVE",
      isTrial: true,
      plan: { type: "MINECRAFT" },
    },
    include: { plan: true },
  });

  // Also include isFree Minecraft services
  const freeServices = await prisma.service.findMany({
    where: {
      status: "ACTIVE",
      isFree: true,
      plan: { type: "MINECRAFT" },
    },
    include: { plan: true },
  });

  const allServices = [...services, ...freeServices];
  const results: { id: string; name: string; action: string; players?: number; error?: string }[] = [];

  for (const service of allServices) {
    if (!service.externalServerId || !service.ipAddress || !service.port) continue;

    try {
      // Check current state via Pelican resources
      const resources = await getServerResources(service.externalServerId).catch(() => null);
      if (!resources || resources.current_state !== "running") continue;

      // Query player count via Minecraft status protocol
      const playerCount = await queryMinecraftPlayers(service.ipAddress, service.port).catch(() => -1);

      if (playerCount === -1) {
        // Can't reach server, skip
        results.push({ id: service.id, name: service.name, action: "unreachable" });
        continue;
      }

      if (playerCount > 0) {
        // Players online — reset idle timer
        await prisma.service.update({
          where: { id: service.id },
          data: { idleEmptySince: null },
        });
        results.push({ id: service.id, name: service.name, action: "active", players: playerCount });
        continue;
      }

      // 0 players — check how long it's been empty
      const now = new Date();
      if (!service.idleEmptySince) {
        // First time seeing empty — record timestamp
        await prisma.service.update({
          where: { id: service.id },
          data: { idleEmptySince: now },
        });
        results.push({ id: service.id, name: service.name, action: "idle-started", players: 0 });
      } else {
        const idleMs = now.getTime() - service.idleEmptySince.getTime();
        if (idleMs >= IDLE_MS) {
          // Stop server after 5 min idle
          await sendPowerAction(service.externalServerId, "stop");
          await prisma.service.update({
            where: { id: service.id },
            data: { idleEmptySince: null, status: "SUSPENDED", suspendedAt: now },
          });
          results.push({ id: service.id, name: service.name, action: "stopped-idle", players: 0 });
        } else {
          results.push({ id: service.id, name: service.name, action: `idle-${Math.round(idleMs / 60000)}min`, players: 0 });
        }
      }
    } catch (err) {
      results.push({ id: service.id, name: service.name, action: "error", error: String(err) });
    }
  }

  return NextResponse.json({ checked: allServices.length, results });
}

// Minecraft Java Edition status ping — returns online player count
function queryMinecraftPlayers(host: string, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => { socket.destroy(); reject(new Error("timeout")); }, 3000);

    socket.connect(port, host, () => {
      // Send Handshake (protocol 47 = 1.8) + Status Request
      const hostBuf = Buffer.from(host);
      const handshake = Buffer.alloc(7 + hostBuf.length);
      let offset = 0;
      handshake[offset++] = 0x00;                       // Packet ID
      handshake.writeInt16BE(47, offset); offset += 2;  // Protocol version (legacy-compat)
      handshake[offset++] = hostBuf.length;             // Host length
      hostBuf.copy(handshake, offset); offset += hostBuf.length;
      handshake.writeUInt16BE(port, offset); offset += 2;
      handshake[offset++] = 0x01;                       // Next state: status

      const statusRequest = Buffer.from([0x01, 0x00]);  // Length=1, Packet ID=0x00

      socket.write(handshake);
      socket.write(statusRequest);
    });

    let data = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      data = Buffer.concat([data, chunk]);
      const str = data.toString();
      // Look for JSON in the response
      const start = str.indexOf("{");
      const end = str.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          const json = JSON.parse(str.slice(start, end + 1));
          clearTimeout(timeout);
          socket.destroy();
          resolve(json?.players?.online ?? 0);
        } catch { /* keep reading */ }
      }
    });

    socket.on("error", (err) => { clearTimeout(timeout); reject(err); });
    socket.on("close", () => { clearTimeout(timeout); reject(new Error("closed")); });
  });
}
