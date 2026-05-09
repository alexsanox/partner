export const APP_NAME = "Partner Hosting";
export const APP_DESCRIPTION = "Premium Minecraft Server Hosting";

export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
} as const;

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROVISIONING: "Provisioning",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

export const SERVICE_STATUS_COLORS: Record<string, string> = {
  PENDING: "yellow",
  PROVISIONING: "blue",
  ACTIVE: "green",
  SUSPENDED: "orange",
  CANCELLED: "gray",
  FAILED: "red",
};

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 5000;

export const PROVISIONING_QUEUE = "provisioning";
export const MAINTENANCE_QUEUE = "maintenance";
