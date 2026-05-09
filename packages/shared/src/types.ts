export interface PlanDisplay {
  id: string;
  name: string;
  slug: string;
  ram: string;
  cpu: string;
  disk: string;
  playerSlots: number;
  backupSlots: number;
  priceMonthly: number;
  features: string[];
  popular?: boolean;
}

export interface ProvisioningJobData {
  serviceId: string;
  action: "CREATE" | "SUSPEND" | "UNSUSPEND" | "DELETE" | "RETRY";
  attempt?: number;
}

export interface PelicanServerConfig {
  name: string;
  nodeId: number;
  allocationId: number;
  eggId: number;
  memoryMb: number;
  diskMb: number;
  cpuPercent: number;
  environment?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
