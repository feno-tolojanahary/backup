export type JobStatus = "success" | "failed" | "running" | "pending";
export type ScheduleType = "interval" | "cron" | "manual";

export type JobRun = {
  id: string;
  status: "pending" | "running" | "success" | "failed" | "canceled";
  startedAt: string;
  finishedAt: string;
  duration: string;
  errorMessage?: string;
};

export type JobRecord = {
  id: string;
  name: string;
  target: string;
  scheduleText: string;
  scheduleType: ScheduleType;
  scheduleValue: string;
  retentionDays: number;
  lastRun: string;
  lastStatus: JobStatus;
  enabled: boolean;
  encryptionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  runs: JobRun[];
};

export const jobs: JobRecord[] = [
  {
    id: "1",
    name: "mongodb-prod",
    target: "MongoDB production-db",
    scheduleText: "daily at 02:00",
    scheduleType: "cron",
    scheduleValue: "0 2 * * *",
    retentionDays: 30,
    lastRun: "2026-03-04T09:10:00Z",
    lastStatus: "success",
    enabled: true,
    encryptionEnabled: true,
    createdAt: "2025-12-12T10:00:00Z",
    updatedAt: "2026-03-01T15:05:00Z",
    runs: [
      {
        id: "run_9821",
        status: "success",
        startedAt: "2026-03-04T09:10:00Z",
        finishedAt: "2026-03-04T09:12:10Z",
        duration: "2m 10s",
      },
      {
        id: "run_9819",
        status: "success",
        startedAt: "2026-03-03T09:10:00Z",
        finishedAt: "2026-03-03T09:12:03Z",
        duration: "1m 53s",
      },
    ],
  },
  {
    id: "2",
    name: "postgres-app",
    target: "Postgres app-db",
    scheduleText: "every 6 hours",
    scheduleType: "interval",
    scheduleValue: "21600",
    retentionDays: 14,
    lastRun: "2026-03-04T06:00:00Z",
    lastStatus: "running",
    enabled: true,
    encryptionEnabled: false,
    createdAt: "2026-01-10T08:30:00Z",
    updatedAt: "2026-02-20T11:40:00Z",
    runs: [
      {
        id: "run_7712",
        status: "running",
        startedAt: "2026-03-04T06:00:00Z",
        finishedAt: "-",
        duration: "6m 02s",
      },
      {
        id: "run_7711",
        status: "success",
        startedAt: "2026-03-04T00:00:00Z",
        finishedAt: "2026-03-04T00:01:05Z",
        duration: "1m 05s",
      },
    ],
  },
  {
    id: "3",
    name: "files-backup",
    target: "/var/data",
    scheduleText: "manual",
    scheduleType: "manual",
    scheduleValue: "manual",
    retentionDays: 7,
    lastRun: "2026-03-03T06:30:00Z",
    lastStatus: "failed",
    enabled: false,
    encryptionEnabled: true,
    createdAt: "2025-11-18T13:45:00Z",
    updatedAt: "2026-02-11T09:15:00Z",
    runs: [
      {
        id: "run_5541",
        status: "failed",
        startedAt: "2026-03-03T06:30:00Z",
        finishedAt: "2026-03-03T06:32:00Z",
        duration: "2m 00s",
        errorMessage: "SFTP connection timeout",
      },
      {
        id: "run_5539",
        status: "canceled",
        startedAt: "2026-03-02T06:30:00Z",
        finishedAt: "2026-03-02T06:31:10Z",
        duration: "1m 10s",
        errorMessage: "Canceled by operator",
      },
    ],
  },
  {
    id: "4",
    name: "analytics-warehouse",
    target: "BigQuery analytics",
    scheduleText: "daily at 01:00",
    scheduleType: "cron",
    scheduleValue: "0 1 * * *",
    retentionDays: 45,
    lastRun: "2026-03-04T01:05:00Z",
    lastStatus: "pending",
    enabled: true,
    encryptionEnabled: true,
    createdAt: "2025-10-20T07:15:00Z",
    updatedAt: "2026-02-25T10:20:00Z",
    runs: [
      {
        id: "run_4301",
        status: "pending",
        startedAt: "2026-03-04T01:05:00Z",
        finishedAt: "-",
        duration: "-",
      },
    ],
  },
];
