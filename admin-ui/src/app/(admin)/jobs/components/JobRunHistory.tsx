"use client";

import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
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
import { JobRun } from "../data";

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

export default function JobRunHistory() {


    return (
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
    )
}