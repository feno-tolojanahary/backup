"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobRecord, JobRun } from "./data";
import Link from "next/link";

type RunStatus = JobRun["status"];
type DateRangeFilter = "24h" | "7d" | "30d" | "custom";

type ProducedBackup = {
  uid: string;
  size: string;
  storage: string;
  createdAt: string;
};
const STATUS_OPTIONS: { value: RunStatus; label: string }[] = [
  { value: "success", label: "success" },
  { value: "failed", label: "failed" },
  { value: "running", label: "running" },
  { value: "pending", label: "pending" },
  { value: "canceled", label: "canceled" },
];

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
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Run Status</p>
                <div className="mt-2">
                  {stats.lastRunStatus === "-" ? (
                    <span className="text-sm text-gray-400">-</span>
                  ) : (
                    <Badge size="sm" color={statusBadgeColor(stats.lastRunStatus as RunStatus)}>
                      {stats.lastRunStatus}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Success Rate (Last 30 Runs)</p>
                <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">{stats.successRate}%</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Average Duration</p>
                <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">{stats.averageDuration}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Runs</p>
                <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">{stats.totalRuns}</p>
              </div>
            </div>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</label>
                    <Select
                      options={STATUS_OPTIONS}
                      placeholder="All status"
                      onChange={(value) => {
                        setStatusFilter(value as RunStatus);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date range</label>
                    <Select
                      options={[
                        { value: "24h", label: "Last 24 hours" },
                        { value: "7d", label: "Last 7 days" },
                        { value: "30d", label: "Last 30 days" },
                        { value: "custom", label: "Custom range" },
                      ]}
                      placeholder="Last 30 days"
                      defaultValue="30d"
                      onChange={(value) => {
                        setDateRangeFilter(value as DateRangeFilter);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Search</label>
                    <Input
                      placeholder="Search Run ID"
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                {dateRangeFilter === "custom" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Start date</label>
                      <Input
                        type="date"
                        onChange={(event) => {
                          setCustomStart(event.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">End date</label>
                      <Input
                        type="date"
                        onChange={(event) => {
                          setCustomEnd(event.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                  <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[1400px]">
                      <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                          <TableRow>
                            {[
                              "Run ID",
                              "Status",
                              "Started At",
                              "Finished At",
                              "Duration",
                              "Backups Created",
                              "Error Message",
                              "Actions",
                            ].map((title) => (
                              <TableCell
                                key={title}
                                isHeader
                                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                              >
                                {title}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          {pagedRuns.length === 0 ? (
                            <TableRow>
                              <TableCell
                                className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                                colSpan={8}
                              >
                                No runs found for the current filters.
                              </TableCell>
                            </TableRow>
                          ) : (
                            pagedRuns.map((run) => (
                              <TableRow key={run.id}>
                                <TableCell className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                                  {run.id}
                                </TableCell>
                                <TableCell className="px-5 py-4">
                                  <Badge size="sm" color={statusBadgeColor(run.status)}>
                                    {run.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                                  {formatDateTime(run.startedAt)}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                                  {formatDateTime(run.finishedAt)}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                                  {run.duration}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                                  {getRunBackups(run).length}
                                </TableCell>
                                <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                                  {run.errorMessage ?? "-"}
                                </TableCell>
                                <TableCell className="px-5 py-4">
                                  <div className="relative inline-flex">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenMenuId(openMenuId === run.id ? null : run.id)
                                      }
                                      className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                      <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                                    </button>
                                    <Dropdown
                                      isOpen={openMenuId === run.id}
                                      onClose={() => setOpenMenuId(null)}
                                      className="w-52 p-2"
                                    >
                                      <DropdownItem
                                        onItemClick={() => openRunModal(run)}
                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                      >
                                        View run details
                                      </DropdownItem>
                                      <DropdownItem
                                        onItemClick={() => openRunModal(run)}
                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                      >
                                        View logs
                                      </DropdownItem>
                                      <DropdownItem
                                        onItemClick={() => openRunModal(run)}
                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                      >
                                        View produced backups
                                      </DropdownItem>
                                    </Dropdown>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Items per page</span>
                    <div className="w-28">
                      <Select
                        options={[
                          { value: "25", label: "25" },
                          { value: "50", label: "50" },
                          { value: "100", label: "100" },
                        ]}
                        defaultValue={`${itemsPerPage}`}
                        placeholder={`${itemsPerPage}`}
                        onChange={(value) => {
                          setItemsPerPage(Number(value));
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                    <Button size="sm" variant="outline" type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        </ComponentCard>
      </div>

      <Modal
        isOpen={runModalOpen && selectedRun !== null}
        onClose={() => setRunModalOpen(false)}
        className="mx-4 max-h-[90vh] max-w-5xl overflow-hidden"
      >
        {selectedRun && (
          <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Run Details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Run ID</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{selectedRun.id}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Job Name</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.name}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
                <div className="mt-1">
                  <Badge size="sm" color={statusBadgeColor(selectedRun.status)}>
                    {selectedRun.status}
                  </Badge>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Started At</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{formatDateTime(selectedRun.startedAt)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Finished At</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{formatDateTime(selectedRun.finishedAt)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{selectedRun.duration}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Error message</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedRun.errorMessage ?? "-"}</p>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Produced Backups</h4>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        {[
                          "Backup UID",
                          "Size",
                          "Storage",
                          "Created At",
                        ].map((title) => (
                          <TableCell
                            key={title}
                            isHeader
                            className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            {title}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {selectedRunBackups.length === 0 ? (
                        <TableRow>
                          <TableCell
                            className="px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400"
                            colSpan={4}
                          >
                            No backups produced for this run.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedRunBackups.map((backup) => (
                          <TableRow key={backup.uid}>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.uid}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.size}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.storage}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.createdAt}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Execution Logs</h4>
              <div className="mt-3 h-56 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">{selectedRunLogs.join("\n")}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
