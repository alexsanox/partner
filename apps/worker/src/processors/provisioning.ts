import type { Job } from "bullmq";
import { db } from "@partner/db";
import type { ProvisioningJobData } from "@partner/shared";
import {
  createServer,
  suspendServer,
  unsuspendServer,
  deleteServer,
} from "../pelican";

export async function processProvisioningJob(
  job: Job<ProvisioningJobData>
): Promise<void> {
  const { serviceId, action, attempt = 1 } = job.data;

  console.log(
    `[Provisioning] Processing ${action} for service ${serviceId} (attempt ${attempt})`
  );

  const log = await db.provisioningLog.create({
    data: {
      serviceId,
      action,
      status: "PROCESSING",
      attempt,
      startedAt: new Date(),
    },
  });

  try {
    switch (action) {
      case "CREATE":
        await handleCreate(serviceId);
        break;
      case "SUSPEND":
        await handleSuspend(serviceId);
        break;
      case "UNSUSPEND":
        await handleUnsuspend(serviceId);
        break;
      case "DELETE":
        await handleDelete(serviceId);
        break;
      case "RETRY":
        await handleCreate(serviceId);
        break;
    }

    await db.provisioningLog.update({
      where: { id: log.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    console.log(
      `[Provisioning] ${action} completed for service ${serviceId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(
      `[Provisioning] ${action} failed for service ${serviceId}:`,
      errorMessage
    );

    await db.provisioningLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    if (action === "CREATE" && attempt < 3) {
      await db.service.update({
        where: { id: serviceId },
        data: { status: "PROVISIONING" },
      });
      throw error; // BullMQ will retry
    }

    await db.service.update({
      where: { id: serviceId },
      data: { status: "FAILED" },
    });
  }
}

async function handleCreate(serviceId: string): Promise<void> {
  const service = await db.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: { plan: true, node: true },
  });

  if (!service.node) {
    const node = await selectNode(service.plan.ramMb, service.plan.diskMb);
    await db.service.update({
      where: { id: serviceId },
      data: { nodeId: node.id, status: "PROVISIONING" },
    });
    service.nodeId = node.id;
  }

  const node = await db.node.findUniqueOrThrow({
    where: { id: service.nodeId! },
  });

  if (!node.pelicanNodeId) {
    throw new Error(`Node ${node.id} has no Pelican node ID configured`);
  }

  const result = await createServer({
    name: service.name,
    nodeId: node.pelicanNodeId,
    allocationId: 0, // auto-assigned by pelican
    eggId: 1, // Minecraft egg - configurable per plan
    memoryMb: service.plan.ramMb,
    diskMb: service.plan.diskMb,
    cpuPercent: service.plan.cpuPercent,
  });

  await db.service.update({
    where: { id: serviceId },
    data: {
      status: "ACTIVE",
      externalServerId: String(result.serverId),
      externalServerUuid: result.uuid,
      ipAddress: result.ip,
      port: result.port,
    },
  });

  await db.node.update({
    where: { id: node.id },
    data: {
      usedMemoryMb: { increment: service.plan.ramMb },
      usedDiskMb: { increment: service.plan.diskMb },
      usedCpu: { increment: service.plan.cpuPercent },
    },
  });
}

async function handleSuspend(serviceId: string): Promise<void> {
  const service = await db.service.findUniqueOrThrow({
    where: { id: serviceId },
  });

  if (service.externalServerId) {
    await suspendServer(Number(service.externalServerId));
  }

  await db.service.update({
    where: { id: serviceId },
    data: { status: "SUSPENDED", suspendedAt: new Date() },
  });
}

async function handleUnsuspend(serviceId: string): Promise<void> {
  const service = await db.service.findUniqueOrThrow({
    where: { id: serviceId },
  });

  if (service.externalServerId) {
    await unsuspendServer(Number(service.externalServerId));
  }

  await db.service.update({
    where: { id: serviceId },
    data: { status: "ACTIVE", suspendedAt: null },
  });
}

async function handleDelete(serviceId: string): Promise<void> {
  const service = await db.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: { plan: true },
  });

  if (service.externalServerId) {
    await deleteServer(Number(service.externalServerId));
  }

  if (service.nodeId) {
    await db.node.update({
      where: { id: service.nodeId },
      data: {
        usedMemoryMb: { decrement: service.plan.ramMb },
        usedDiskMb: { decrement: service.plan.diskMb },
        usedCpu: { decrement: service.plan.cpuPercent },
      },
    });
  }

  await db.service.update({
    where: { id: serviceId },
    data: { status: "CANCELLED", deletedAt: new Date(), cancelledAt: new Date() },
  });
}

async function selectNode(requiredRamMb: number, requiredDiskMb: number) {
  const nodes = await db.node.findMany({
    where: { status: "ACTIVE" },
    orderBy: { usedMemoryMb: "asc" },
  });

  const available = nodes.find(
    (n) =>
      n.maxMemoryMb - n.usedMemoryMb >= requiredRamMb &&
      n.maxDiskMb - n.usedDiskMb >= requiredDiskMb
  );

  if (!available) {
    throw new Error("No nodes with sufficient capacity available");
  }

  return available;
}
