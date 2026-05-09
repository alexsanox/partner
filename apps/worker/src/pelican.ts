import type { PelicanServerConfig } from "@partner/shared";

const PELICAN_URL = process.env.PELICAN_URL || "http://localhost:80";
const PELICAN_API_KEY = process.env.PELICAN_API_KEY || "";

interface PelicanApiResponse<T = unknown> {
  object: string;
  attributes: T;
}

interface PelicanServerAttributes {
  id: number;
  uuid: string;
  identifier: string;
  name: string;
  status: string | null;
}

interface PelicanAllocation {
  id: number;
  ip: string;
  port: number;
  assigned: boolean;
}

async function pelicanFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PELICAN_URL}/api/application${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${PELICAN_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Pelican API error [${res.status}] ${path}: ${body}`
    );
  }

  return res.json() as Promise<T>;
}

export async function createServer(
  config: PelicanServerConfig
): Promise<{ serverId: number; uuid: string; ip: string; port: number }> {
  const allocation = await findAvailableAllocation(config.nodeId);

  const body = {
    name: config.name,
    user: 1, // admin user on panel - will be configurable
    node_id: config.nodeId,
    allocation_id: allocation.id,
    egg_id: config.eggId,
    docker_image: "ghcr.io/pterodactyl/yolks:java_21",
    startup:
      "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}",
    limits: {
      memory: config.memoryMb,
      swap: 0,
      disk: config.diskMb,
      io: 500,
      cpu: config.cpuPercent,
    },
    feature_limits: {
      databases: 1,
      allocations: 1,
      backups: 1,
    },
    environment: {
      SERVER_JARFILE: "server.jar",
      VANILLA_VERSION: "latest",
      ...config.environment,
    },
  };

  const res = await pelicanFetch<PelicanApiResponse<PelicanServerAttributes>>(
    "/servers",
    { method: "POST", body: JSON.stringify(body) }
  );

  return {
    serverId: res.attributes.id,
    uuid: res.attributes.uuid,
    ip: allocation.ip,
    port: allocation.port,
  };
}

export async function suspendServer(serverId: number): Promise<void> {
  await pelicanFetch(`/servers/${serverId}/suspend`, { method: "POST" });
}

export async function unsuspendServer(serverId: number): Promise<void> {
  await pelicanFetch(`/servers/${serverId}/unsuspend`, { method: "POST" });
}

export async function deleteServer(serverId: number): Promise<void> {
  await pelicanFetch(`/servers/${serverId}`, { method: "DELETE" });
}

async function findAvailableAllocation(
  nodeId: number
): Promise<PelicanAllocation> {
  const res = await pelicanFetch<{
    data: Array<PelicanApiResponse<PelicanAllocation>>;
  }>(`/nodes/${nodeId}/allocations?filter[assigned]=false&per_page=1`);

  if (!res.data || res.data.length === 0) {
    throw new Error(`No available allocations on node ${nodeId}`);
  }

  return res.data[0].attributes;
}
