import { Worker } from "bullmq";
import { redis } from "./redis";
import { processProvisioningJob } from "./processors/provisioning";
import { PROVISIONING_QUEUE } from "@partner/shared";
import type { ProvisioningJobData } from "@partner/shared";

console.log("[Worker] Starting provisioning worker...");

const provisioningWorker = new Worker<ProvisioningJobData>(
  PROVISIONING_QUEUE,
  async (job) => {
    await processProvisioningJob(job);
  },
  {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 60_000,
    },
  }
);

provisioningWorker.on("completed", (job) => {
  console.log(
    `[Worker] Job ${job.id} completed: ${job.data.action} for ${job.data.serviceId}`
  );
});

provisioningWorker.on("failed", (job, err) => {
  console.error(
    `[Worker] Job ${job?.id} failed: ${err.message}`,
    { serviceId: job?.data.serviceId, action: job?.data.action }
  );
});

provisioningWorker.on("error", (err) => {
  console.error("[Worker] Worker error:", err.message);
});

async function shutdown() {
  console.log("[Worker] Shutting down gracefully...");
  await provisioningWorker.close();
  await redis.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[Worker] Provisioning worker started successfully");
