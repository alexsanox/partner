const PELICAN_URL = process.env.PELICAN_URL || "http://127.0.0.1:80";
const PELICAN_API_KEY = process.env.PELICAN_API_KEY || "";

interface PelicanRequestOptions {
  method?: string;
  body?: unknown;
}

async function pelicanFetch<T>(path: string, options: PelicanRequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  const res = await fetch(`${PELICAN_URL}/api/application${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PELICAN_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pelican API ${method} ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PelicanServer {
  id: number;
  external_id: string | null;
  uuid: string;
  identifier: string;
  name: string;
  description: string;
  status: string | null;
  suspended: boolean;
  node: number;
  node_id: number;
  allocation: number;
  allocation_id: number;
  user: number;
  user_id: number;
  egg: number;
  limits: {
    memory: number;
    disk: number;
    cpu: number;
    io: number;
    swap: number;
    threads: string | null;
    oom_disabled: boolean;
    oom_killer: boolean;
  };
  feature_limits: {
    databases: number;
    allocations: number;
    backups: number;
  };
  container: {
    startup_command: string;
    image: string;
    installed: number;
    environment: Record<string, string>;
  };
  created_at: string;
  updated_at: string;
}

export interface PelicanNode {
  id: number;
  uuid: string;
  name: string;
  description: string;
  fqdn: string;
  scheme: string;
  memory: number;
  memory_overallocate: number;
  disk: number;
  disk_overallocate: number;
  daemon_listen: number;
  daemon_sftp: number;
  maintenance_mode: boolean;
  servers_count?: number;
}

export interface PelicanUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  root_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  object: string;
  data: { object: string; attributes: T }[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

// ─── API Methods ────────────────────────────────────────────────────────────

export async function getServers(page = 1, perPage = 50) {
  return pelicanFetch<PaginatedResponse<PelicanServer>>(
    `/servers?page=${page}&per_page=${perPage}`
  );
}

export async function getServer(id: number) {
  const res = await pelicanFetch<{ attributes: PelicanServer }>(`/servers/${id}`);
  return res.attributes;
}

export async function getNodes(page = 1) {
  return pelicanFetch<PaginatedResponse<PelicanNode>>(
    `/nodes?page=${page}`
  );
}

export async function getNode(id: number) {
  const res = await pelicanFetch<{ attributes: PelicanNode }>(`/nodes/${id}`);
  return res.attributes;
}

export async function getUsers(page = 1) {
  return pelicanFetch<PaginatedResponse<PelicanUser>>(
    `/users?page=${page}`
  );
}

export async function createServer(config: {
  name: string;
  user: number;
  node_id: number;
  allocation_id: number;
  nest_id: number;
  egg_id: number;
  memory: number;
  disk: number;
  cpu: number;
  startup: string;
  environment: Record<string, string>;
}) {
  return pelicanFetch<{ attributes: PelicanServer }>("/servers", {
    method: "POST",
    body: config,
  });
}

export async function suspendServer(id: number) {
  return pelicanFetch<void>(`/servers/${id}/suspend`, { method: "POST" });
}

export async function unsuspendServer(id: number) {
  return pelicanFetch<void>(`/servers/${id}/unsuspend`, { method: "POST" });
}

export async function deleteServer(id: number) {
  return pelicanFetch<void>(`/servers/${id}`, { method: "DELETE" });
}

export async function getNodeAllocations(nodeId: number, page = 1) {
  return pelicanFetch<PaginatedResponse<{ id: number; ip: string; port: number; assigned: boolean }>>(
    `/nodes/${nodeId}/allocations?page=${page}`
  );
}
