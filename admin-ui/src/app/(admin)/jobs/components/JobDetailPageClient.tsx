"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { JobRecord, JobRun } from "../data";
import Link from "next/link";

type RunStatus = JobRun["status"];
type DateRangeFilter = "24h" | "7d" | "30d" | "custom";

type ProducedBackup = {
  uid: string;
  size: string;
  storage: string;
  createdAt: string;
};

const statusBadgeColor = (status: RunStatus) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  if (status === "pending") return "dark";
  return "warning";
};

const formatDateTime = (value: string) => {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const parseDuration = (duration: string) => {
  if (!duration || duration === "-") return null;
  const minutes = duration.match(/(\d+)m/);
  const seconds = duration.match(/(\d+)s/);
  if (!minutes && !seconds) return null;
  return (minutes ? Number(minutes[1]) * 60 : 0) + (seconds ? Number(seconds[1]) : 0);
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const mins = Math.floor(seconds / 60);
  return `${mins}m${(seconds % 60).toString().padStart(2, "0")}s`;
};

const getRunBackups = (run: JobRun): ProducedBackup[] => {
  if (run.status !== "success") return [];
  const seed = run.id.replace(/[^a-zA-Z0-9]/g, "").slice(-5) || "921a3";
  return [
    {
      uid: `bk_${seed}`,
      size: "1.2GB",
      storage: "s3-default",
      createdAt: formatDateTime(run.finishedAt !== "-" ? run.finishedAt : run.startedAt),
    },
  ];
};

const getRunLogs = (run: JobRun) => {
  const start = Number.isNaN(new Date(run.startedAt).getTime())
    ? "02:00:00"
    : new Date(run.startedAt).toLocaleTimeString();
  if (run.status === "failed") {
    return [
      `[${start}] Starting backup job`,
      `[${start}] Dumping source data`,
      `[${start}] Upload failed`,
      `[${start}] ${run.errorMessage ?? "Execution failed"}`,
    ];
  }
  if (run.status === "running" || run.status === "pending") {
    return [
      `[${start}] Starting backup job`,
      `[${start}] Preparing source snapshot`,
      `[${start}] Uploading backup to s3-default`,
      `[${start}] Run still in progress`,
    ];
  }
  if (run.status === "canceled") {
    return [
      `[${start}] Starting backup job`,
      `[${start}] Preparing source snapshot`,
      `[${start}] Run canceled by operator`,
    ];
  }
  return [
    `[${start}] Starting backup job`,
    `[${start}] Dumping MongoDB database`,
    `[${start}] Uploading backup to s3-default`,
    `[${start}] Backup completed`,
  ];
};

export default function JobDetailPageClient({ job }: { job: JobRecord }) {
  const [statusFilter, setStatusFilter] = useState<RunStatus | "">("");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("30d");
  const [search, setSearch] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<JobRun | null>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);

  const sortedRuns = useMemo(
    () =>
      [...job.runs].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      ),
    [job.runs]
  );

  const filteredRuns = useMemo(() => {
    const referenceTimestamp = sortedRuns[0]
      ? new Date(sortedRuns[0].startedAt).getTime()
      : 0;
    return sortedRuns.filter((run) => {
      if (statusFilter && run.status !== statusFilter) return false;
      if (search && !run.id.toLowerCase().includes(search.toLowerCase().trim())) return false;

      const startedAt = new Date(run.startedAt).getTime();
      if (Number.isNaN(startedAt)) return false;
      if (dateRangeFilter === "24h") {
        return startedAt >= referenceTimestamp - 24 * 60 * 60 * 1000;
      }
      if (dateRangeFilter === "7d") {
        return startedAt >= referenceTimestamp - 7 * 24 * 60 * 60 * 1000;
      }
      if (dateRangeFilter === "30d") {
        return startedAt >= referenceTimestamp - 30 * 24 * 60 * 60 * 1000;
      }
      if (dateRangeFilter !== "custom") return true;
      if (!customStart || !customEnd) return true;

      const start = new Date(`${customStart}T00:00:00`).getTime();
      const end = new Date(`${customEnd}T23:59:59`).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return true;
      return startedAt >= start && startedAt <= end;
    });
  }, [sortedRuns, statusFilter, search, dateRangeFilter, customStart, customEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);

  const pagedRuns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRuns.slice(start, start + itemsPerPage);
  }, [filteredRuns, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const recent = sortedRuns.slice(0, 30);
    const successes = recent.filter((run) => run.status === "success").length;
    const samples = recent
      .map((run) => parseDuration(run.duration))
      .filter((value): value is number => value !== null);
    const avg = samples.length
      ? Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length)
      : 0;

    return {
      lastRunStatus: sortedRuns[0]?.status ?? "-",
      successRate: recent.length ? Math.round((successes / recent.length) * 100) : 0,
      averageDuration: formatDuration(avg),
      totalRuns: sortedRuns.length,
    };
  }, [sortedRuns]);

  const openRunModal = (run: JobRun) => {
    setSelectedRun(run);
    setRunModalOpen(true);
    setOpenMenuId(null);
  };

  const selectedRunBackups = selectedRun ? getRunBackups(selectedRun) : [];
  const selectedRunLogs = selectedRun ? getRunLogs(selectedRun) : [];

  return (
    <div>
      <PageBreadcrumb pageTitle="Job Details" />
      <div className="space-y-6">
        <ComponentCard title="Job Details">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{job.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{job.target}</p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Schedule</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.scheduleText}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Retention</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.retentionDays} days</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Run</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{formatDateTime(job.lastRun)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Status</p>
                  <div className="mt-1">
                    <Badge size="sm" color={statusBadgeColor(job.lastStatus)}>
                      {job.lastStatus}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Schedule Type</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.scheduleType}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Schedule Value</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.scheduleValue}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Encryption</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.encryptionEnabled ? "enabled" : "disabled"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Job State</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.enabled ? "enabled" : "disabled"}</p>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Execution Controls">
          <div className="flex flex-wrap gap-3">
            <Button size="sm" type="button" onClick={() => console.log("Run job", job.id)}>
              Run Job Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() =>
                console.log(job.enabled ? "Disable job" : "Enable job", job.id)
              }
            >
              {job.enabled ? "Disable Job" : "Enable Job"}
            </Button>
            <Link href={`/jobs/${job.id}/edit`}>
              <Button size="sm" variant="outline" type="button">
                Edit Job
              </Button>
            </Link>
          </div>
        </ComponentCard>
        <ComponentCard title="Run History">
          <></>
        </ComponentCard>
      </div>

      {/* Modal detail here */}
    </div>
  );
}
