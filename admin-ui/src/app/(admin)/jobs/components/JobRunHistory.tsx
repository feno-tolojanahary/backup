"use client";

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
import { Job, JobRun } from "@/handlers/jobs/type";
import { useJobRun } from "@/handlers/jobs/jobHooks";
import moment from "moment";
import { useState } from "react";
import ModalDetailJobRun from "../modals/ModalDetailJobRun";

type RunStatus = JobRun["status"];
type DateRangeFilter = "24h" | "7d" | "30d" | "custom";

const STATUS_OPTIONS: { value: RunStatus; label: string }[] = [
  { value: "success", label: "success" },
  { value: "failed", label: "failed" },
  { value: "running", label: "running" },
  { value: "canceled", label: "canceled" },
];

const statusBadgeColor = (status: RunStatus) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  if (status === "canceled") return "dark";
  return "warning";
};

export default function JobRunHistory({job}: { job: Job }) {
    const [statusFilter, setStatusFilter] = useState<RunStatus | "">("");
    const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("30d");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [search, setSearch] = useState("");
    
    const [openMenu, setOpenMenu] = useState(false);
    const [selectedRun, setSelectedRun] = useState<JobRun | null>(null);
    const [runModalOpen, setRunModalOpen] = useState(false);
        
    const { jobRuns, isLoading } = useJobRun(job?.id);
    
    const openRunModal = (run: JobRun) => {
      setSelectedRun(run);
      setRunModalOpen(true);
      setOpenMenu(false);
    };

    // const sortedRuns = useMemo(
    //   () =>
    //     [...jobRuns].sort(
    //       (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    //     ),
    //   [jobRuns]
    // );

    // const filteredRuns = useMemo(() => {
    //   const referenceTimestamp = sortedRuns[0]
    //     ? new Date(sortedRuns[0].startedAt).getTime()
    //     : 0;
    //   return sortedRuns.filter((run) => {
    //     if (statusFilter && run.status !== statusFilter) return false;
    //     if (search && !run.id.toLowerCase().includes(search.toLowerCase().trim())) return false;

    //     const startedAt = new Date(run.startedAt).getTime();
    //     if (Number.isNaN(startedAt)) return false;
    //     if (dateRangeFilter === "24h") {
    //       return startedAt >= referenceTimestamp - 24 * 60 * 60 * 1000;
    //     }
    //     if (dateRangeFilter === "7d") {
    //       return startedAt >= referenceTimestamp - 7 * 24 * 60 * 60 * 1000;
    //     }
    //     if (dateRangeFilter === "30d") {
    //       return startedAt >= referenceTimestamp - 30 * 24 * 60 * 60 * 1000;
    //     }
    //     if (dateRangeFilter !== "custom") return true;
    //     if (!customStart || !customEnd) return true;

    //     const start = new Date(`${customStart}T00:00:00`).getTime();
    //     const end = new Date(`${customEnd}T23:59:59`).getTime();
    //     if (Number.isNaN(start) || Number.isNaN(end)) return true;
    //     return startedAt >= start && startedAt <= end;
    //   });
    // }, [sortedRuns, statusFilter, search, dateRangeFilter, customStart, customEnd]);

    // const totalPages = Math.max(1, Math.ceil(filteredRuns.length / itemsPerPage));
    // const currentPage = Math.min(page, totalPages);

    // const pagedRuns = useMemo(() => {
    //   const start = (currentPage - 1) * itemsPerPage;
    //   return filteredRuns.slice(start, start + itemsPerPage);
    // }, [filteredRuns, currentPage, itemsPerPage]);

    // const stats = useMemo(() => {
    //   const recent = sortedRuns.slice(0, 30);
    //   const successes = recent.filter((run) => run.status === "success").length;
    //   const samples = recent
    //     .map((run) => parseDuration(run.duration))
    //     .filter((value): value is number => value !== null);
    //   const avg = samples.length
    //     ? Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length)
    //     : 0;

    //   return {
    //     lastRunStatus: sortedRuns[0]?.status ?? "-",
    //     successRate: recent.length ? Math.round((successes / recent.length) * 100) : 0,
    //     averageDuration: formatDuration(avg),
    //     totalRuns: sortedRuns.length,
    //   };
    // }, [sortedRuns]);


    // const selectedRunBackups = selectedRun ? getRunBackups(selectedRun) : [];
    // const selectedRunLogs = selectedRun ? getRunLogs(selectedRun) : [];

    return (
      <div className="space-y-6">
        {/* <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        </div> */}

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</label>
                <Select
                  options={STATUS_OPTIONS}
                  placeholder="All status"
                  onChange={(value) => {
                    setStatusFilter(value as RunStatus);
                    // setPage(1);
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
                    // setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Search</label>
                <Input
                  placeholder="Search Run ID"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    // setPage(1);
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
                      // setPage(1);
                    }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">End date</label>
                  <Input
                    type="date"
                    onChange={(event) => {
                      setCustomEnd(event.target.value);
                      // setPage(1);
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
                      {jobRuns.length === 0 ? (
                        <TableRow>
                          <TableCell
                            className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                            colSpan={8}
                          >
                            No runs found for the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        jobRuns.map((run) => (
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
                              {moment(run.startedAt).format("YYYY-MM-DD hh:mm")}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                              {moment(run.finishedAt).format("YYYY-MM-DD hh:mm")}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                              {run.duration}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                              {run.backupCount ?? 0}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                              {run.errorMessage ?? "-"}
                            </TableCell>
                            <TableCell className="px-5 py-4">
                              <div className="relative inline-flex">
                                <button
                                  type="button"
                                  onClick={(open) =>
                                    setOpenMenu(!open)
                                  }
                                  className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                                </button>
                                <Dropdown
                                  isOpen={openMenu}
                                  onClose={() => setOpenMenu(false)}
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

            {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            </div> */}
          </div>
          { selectedRun &&
            <ModalDetailJobRun
              isOpen={runModalOpen}
              job={job}
              onClose={() => {}}
              selectedRun={selectedRun}
            />
          }
        </div>
    )
} 