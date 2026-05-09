const PELICAN_URL = process.env.PELICAN_URL || "http://127.0.0.1:80";
const PELICAN_API_KEY = process.env.PELICAN_API_KEY || "";
const PELICAN_CLIENT_KEY = process.env.PELICAN_CLIENT_KEY || "";

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
  cpu: number;
  cpu_overallocate: number;
  daemon_listen: number;
  daemon_sftp: number;
  maintenance_mode: boolean;
  servers_count?: number;
  allocated_resources?: {
    memory: number;
    disk: number;
    cpu: number;
  };
  relationships?: {
    servers?: {
      data: unknown[];
    };
  };
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
    `/nodes?include=servers&page=${page}`
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
  egg: number;
  docker_image: string;
  startup: string;
  environment: Record<string, string>;
  limits: { memory: number; swap: number; disk: number; io: number; cpu: number };
  feature_limits: { databases: number; backups: number };
  allocation: { default: number };
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
    `/nodes/${nodeId}/allocations?page=${page}&per_page=100`
  );
}

export async function createAllocation(nodeId: number, ip: string, ports: string[]) {
  const res = await fetch(`${PELICAN_URL}/api/application/nodes/${nodeId}/allocations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PELICAN_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ ip, ports }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create allocation (${res.status}): ${text}`);
  }
}

export interface PelicanEgg {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  docker_images: Record<string, string>;
  startup: string;
  config: {
    files: Record<string, unknown>;
    startup: Record<string, unknown>;
    stop: string;
  };
  script: {
    privileged: boolean;
    install: string;
    entry: string;
    container: string;
    extends: string | null;
  };
  relationships?: {
    variables?: {
      object: string;
      data: {
        object: string;
        attributes: {
          id: number;
          egg_id: number;
          name: string;
          description: string;
          env_variable: string;
          default_value: string;
          user_viewable: boolean;
          user_editable: boolean;
          rules: string;
        };
      }[];
    };
  };
}

export async function getEggs(page = 1) {
  return pelicanFetch<PaginatedResponse<PelicanEgg>>(
    `/eggs?include=variables&page=${page}`
  );
}

export async function getEgg(id: number) {
  const res = await pelicanFetch<{ attributes: PelicanEgg }>(`/eggs/${id}?include=variables`);
  return res.attributes;
}

// ─── Client API ──────────────────────────────────────────────────────────────

async function clientFetch<T>(path: string, options: PelicanRequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  const res = await fetch(`${PELICAN_URL}/api/client${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pelican Client API ${method} ${path} failed (${res.status}): ${text}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

// ─── Client Types ────────────────────────────────────────────────────────────

export interface ClientServer {
  server_owner: boolean;
  identifier: string;
  internal_id: number;
  uuid: string;
  name: string;
  node: string;
  is_node_under_maintenance: boolean;
  sftp_details: { ip: string; alias: string | null; port: number };
  description: string;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
    threads: string;
    oom_disabled: boolean;
    oom_killer: boolean;
  };
  invocation: string;
  docker_image: string;
  egg_features: string[];
  feature_limits: { databases: number; allocations: number; backups: number };
  status: string | null;
  is_suspended: boolean;
  is_installing: boolean;
  is_transferring: boolean;
  relationships: {
    allocations: {
      object: string;
      data: {
        object: string;
        attributes: {
          id: number;
          ip: string;
          ip_alias: string | null;
          port: number;
          notes: string | null;
          is_default: boolean;
        };
      }[];
    };
    variables: {
      object: string;
      data: {
        object: string;
        attributes: {
          name: string;
          description: string;
          env_variable: string;
          default_value: string;
          server_value: string;
          is_editable: boolean;
          rules: string;
        };
      }[];
    };
  };
}

export interface ServerResources {
  current_state: string;
  is_suspended: boolean;
  resources: {
    memory_bytes: number;
    cpu_absolute: number;
    disk_bytes: number;
    network_rx_bytes: number;
    network_tx_bytes: number;
    uptime: number;
  };
}

export interface WebSocketAuth {
  token: string;
  socket: string;
}

export interface FileObject {
  name: string;
  mode: string;
  mode_bits: string;
  size: number;
  is_file: boolean;
  is_symlink: boolean;
  mimetype: string;
  created_at: string;
  modified_at: string;
}

// ─── Client API Methods ──────────────────────────────────────────────────────

export async function getClientServer(identifier: string) {
  const res = await clientFetch<{ attributes: ClientServer }>(`/servers/${identifier}`);
  return res.attributes;
}

export async function getServerResources(identifier: string) {
  const res = await clientFetch<{ attributes: ServerResources }>(`/servers/${identifier}/resources`);
  return res.attributes;
}

export async function getWebSocketAuth(identifier: string) {
  const res = await clientFetch<{ data: WebSocketAuth }>(`/servers/${identifier}/websocket`);
  return res.data;
}

export type PowerSignal = "start" | "stop" | "restart" | "kill";

export async function sendPowerAction(identifier: string, signal: PowerSignal) {
  return clientFetch<void>(`/servers/${identifier}/power`, {
    method: "POST",
    body: { signal },
  });
}

export async function sendCommand(identifier: string, command: string) {
  return clientFetch<void>(`/servers/${identifier}/command`, {
    method: "POST",
    body: { command },
  });
}

export async function listFiles(identifier: string, directory = "/") {
  const res = await clientFetch<{ data: { attributes: FileObject }[] }>(
    `/servers/${identifier}/files/list?directory=${encodeURIComponent(directory)}`
  );
  return res.data.map((f) => f.attributes);
}

export async function getFileContent(identifier: string, file: string) {
  const res = await fetch(
    `${PELICAN_URL}/api/client/servers/${identifier}/files/contents?file=${encodeURIComponent(file)}`,
    {
      headers: {
        Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`Failed to read file (${res.status})`);
  return res.text();
}

export async function writeFileContent(identifier: string, file: string, content: string) {
  const res = await fetch(
    `${PELICAN_URL}/api/client/servers/${identifier}/files/write?file=${encodeURIComponent(file)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PELICAN_CLIENT_KEY}`,
        "Content-Type": "text/plain",
      },
      body: content,
    }
  );
  if (!res.ok) throw new Error(`Failed to write file (${res.status})`);
}

export async function deleteFiles(identifier: string, root: string, files: string[]) {
  return clientFetch<void>(`/servers/${identifier}/files/delete`, {
    method: "POST",
    body: { root, files },
  });
}

export async function renameFile(identifier: string, root: string, from: string, to: string) {
  return clientFetch<void>(`/servers/${identifier}/files/rename`, {
    method: "PUT",
    body: { root, files: [{ from, to }] },
  });
}

export async function createDirectory(identifier: string, root: string, name: string) {
  return clientFetch<void>(`/servers/${identifier}/files/create-folder`, {
    method: "POST",
    body: { root, name },
  });
}

export async function updateStartupVariable(identifier: string, key: string, value: string) {
  return clientFetch<{ attributes: { name: string; description: string; env_variable: string; default_value: string; server_value: string; is_editable: boolean; rules: string } }>(
    `/servers/${identifier}/startup/variable`,
    { method: "PUT", body: { key, value } }
  );
}

export async function renameServer(identifier: string, name: string, description?: string) {
  return clientFetch<void>(`/servers/${identifier}/settings/rename`, {
    method: "POST",
    body: { name, description: description ?? "" },
  });
}

export async function reinstallServer(identifier: string) {
  return clientFetch<void>(`/servers/${identifier}/settings/reinstall`, {
    method: "POST",
  });
}

// ─── Backups ─────────────────────────────────────────────────────────────────

export interface Backup {
  uuid: string;
  is_successful: boolean;
  is_locked: boolean;
  name: string;
  ignored_files: string[];
  checksum: string | null;
  bytes: number;
  created_at: string;
  completed_at: string | null;
}

export async function listBackups(identifier: string) {
  const res = await clientFetch<{ data: { attributes: Backup }[] }>(
    `/servers/${identifier}/backups`
  );
  return res.data.map((b) => b.attributes);
}

export async function createBackup(identifier: string, name?: string) {
  return clientFetch<{ attributes: Backup }>(`/servers/${identifier}/backups`, {
    method: "POST",
    body: { name: name || `Backup ${new Date().toLocaleString()}` },
  });
}

export async function getBackupDownloadUrl(identifier: string, backupId: string) {
  const res = await clientFetch<{ attributes: { url: string } }>(
    `/servers/${identifier}/backups/${backupId}/download`
  );
  return res.attributes.url;
}

export async function deleteBackup(identifier: string, backupId: string) {
  return clientFetch<void>(`/servers/${identifier}/backups/${backupId}`, {
    method: "DELETE",
  });
}

export async function restoreBackup(identifier: string, backupId: string, truncate = false) {
  return clientFetch<void>(`/servers/${identifier}/backups/${backupId}/restore`, {
    method: "POST",
    body: { truncate },
  });
}

export async function toggleBackupLock(identifier: string, backupId: string) {
  return clientFetch<{ attributes: Backup }>(`/servers/${identifier}/backups/${backupId}/lock`, {
    method: "POST",
  });
}
