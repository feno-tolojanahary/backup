import { StatusType } from "@/handlers/destinations/type";

export const statusBadgeColor = (status: StatusType) => {
  if (status === "connected") return "success";
  if (status === "failed") return "error";
  return "dark";
};

export const parseStorageToGB = (value: string) => {
  const match = value.trim().match(/^([\d.]+)\s*(KB|MB|GB|TB|PB)$/i);
  if (!match) return 0;

  const amount = Number.parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (Number.isNaN(amount)) return 0;
  if (unit === "KB") return amount / (1024 * 1024);
  if (unit === "MB") return amount / 1024;
  if (unit === "GB") return amount;
  if (unit === "TB") return amount * 1024;
  if (unit === "PB") return amount * 1024 * 1024;

  return 0;
};

export const usagePercent = (used: string, capacity?: string) => {
  if (!capacity) return 0;

  const usedGB = parseStorageToGB(used);
  const capacityGB = parseStorageToGB(capacity);
  if (!capacityGB) return 0;

  return Math.min(100, Math.max(0, (usedGB / capacityGB) * 100));
};
