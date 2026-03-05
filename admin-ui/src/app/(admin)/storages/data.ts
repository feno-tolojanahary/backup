export type StorageType = "local" | "s3" | "sftp";
export type StorageStatus = "connected" | "error" | "unknown";

export type StorageRecord = {
  id: string;
  name: string;
  type: StorageType;
  status: StorageStatus;
  configName: string;
  totalBackups: number;
  totalFiles: number;
  totalUsed: string;
  totalCapacity?: string;
  endpoint?: string;
  bucket?: string;
  folder?: string;
  host?: string;
  port?: number;
  username?: string;
  lastTestStatus: "success" | "failed" | "unknown";
  lastCheckAt: string;
  lastTestMessage?: string;
};

export const storages: StorageRecord[] = [
  {
    id: "1",
    name: "wasabi-prod",
    type: "s3",
    status: "connected",
    configName: "s3-prod",
    totalBackups: 184,
    totalFiles: 9284,
    totalUsed: "1.2 TB",
    totalCapacity: "2 TB",
    endpoint: "s3.wasabisys.com",
    bucket: "prod-backups",
    lastTestStatus: "success",
    lastCheckAt: "2026-03-04T10:15:00Z",
  },
  {
    id: "2",
    name: "backup-sftp",
    type: "sftp",
    status: "error",
    configName: "sftp-eu1",
    totalBackups: 62,
    totalFiles: 4120,
    totalUsed: "420 GB",
    totalCapacity: "1 TB",
    host: "sftp.backup.internal",
    folder: "/data/backups",
    port: 22,
    username: "backup",
    lastTestStatus: "failed",
    lastCheckAt: "2026-03-03T18:30:00Z",
    lastTestMessage: "Authentication failed",
  },
  {
    id: "3",
    name: "local-ssd",
    type: "local",
    status: "unknown",
    configName: "local-ssd-01",
    totalBackups: 98,
    totalFiles: 6012,
    totalUsed: "810 GB",
    totalCapacity: "1.5 TB",
    folder: "/mnt/backup",
    lastTestStatus: "unknown",
    lastCheckAt: "2026-03-02T08:05:00Z",
  },
];
