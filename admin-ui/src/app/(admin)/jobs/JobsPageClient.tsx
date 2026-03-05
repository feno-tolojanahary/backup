"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
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
import { jobs, JobStatus } from "./data";

const statusBadgeColor = (status: JobStatus) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  return "dark";
};

export default function JobsPageClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (
        search &&
        !job.name.toLowerCase().includes(search.toLowerCase().trim())
      ) {
        return false;
      }
      if (statusFilter === "enabled" && !job.enabled) return false;
      if (statusFilter === "disabled" && job.enabled) return false;
      if (statusFilter === "running" && job.lastStatus !== "running")
        return false;
      if (scheduleFilter && job.scheduleType !== scheduleFilter)
        return false;
      return true;
    });
  }, [search, statusFilter, scheduleFilter]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredJobs]);

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / itemsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedJobs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedJobs.slice(start, start + itemsPerPage);
  }, [sortedJobs, page, itemsPerPage]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Jobs" />
      <div className="space-y-6">
        <ComponentCard
          title="Jobs"
          desc="Configure and manage automated backup jobs."
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Search
                </label>
                <Input
                  placeholder="Search job name..."
                  defaultValue={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <Select
                  options={[
                    { value: "enabled", label: "enabled" },
                    { value: "disabled", label: "disabled" },
                    { value: "running", label: "running" },
                  ]}
                  placeholder="All status"
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Schedule type
                </label>
                <Select
                  options={[
                    { value: "interval", label: "interval" },
                    { value: "cron", label: "cron" },
                    { value: "manual", label: "manual" },
                  ]}
                  placeholder="All schedules"
                  onChange={(value) => {
                    setScheduleFilter(value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => console.log("Refresh jobs")}
              >
                Refresh
              </Button>
              <Link href="/jobs/new">
                <Button size="sm" type="button">
                  Create Job
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1100px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Job Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Target
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Schedule
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Retention
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Last Run
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Last Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Enabled
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {pagedJobs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          className="px-5 py-6 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                          colSpan={8}
                        >
                          No jobs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {job.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {job.scheduleType}
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {job.target}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {job.scheduleText}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {job.retentionDays} days
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {new Date(job.lastRun).toLocaleString()}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            <Badge size="sm" color={statusBadgeColor(job.lastStatus)}>
                              {job.lastStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <Switch
                              label="Enabled"
                              defaultChecked={job.enabled}
                              onChange={(checked) =>
                                console.log("Toggle job", job.id, checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="relative inline-flex">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === job.id ? null : job.id
                                  )
                                }
                                className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                              </button>
                              <Dropdown
                                isOpen={openMenuId === job.id}
                                onClose={() => setOpenMenuId(null)}
                                className="w-44 p-2"
                              >
                                <DropdownItem
                                  tag="a"
                                  href={`/jobs/${job.id}`}
                                  onItemClick={() => setOpenMenuId(null)}
                                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                  View job
                                </DropdownItem>
                                <DropdownItem
                                  onItemClick={() => {
                                    setOpenMenuId(null);
                                    console.log("Run job now", job.id);
                                  }}
                                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                  Run job now
                                </DropdownItem>
                                <DropdownItem
                                  tag="a"
                                  href={`/jobs/${job.id}/edit`}
                                  onItemClick={() => setOpenMenuId(null)}
                                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                  Edit job
                                </DropdownItem>
                                <DropdownItem
                                  onItemClick={() => {
                                    setOpenMenuId(null);
                                    console.log(
                                      job.enabled ? "Disable job" : "Enable job",
                                      job.id
                                    );
                                  }}
                                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                  {job.enabled ? "Disable job" : "Enable job"}
                                </DropdownItem>
                                <DropdownItem
                                  onItemClick={() => {
                                    setOpenMenuId(null);
                                    console.log("Delete job", job.id);
                                  }}
                                  className="flex w-full font-normal text-left text-error-600 rounded-lg hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-white/5"
                                >
                                  Delete job
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

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Items per page
              </span>
              <div className="w-28">
                <Select
                  options={[
                    { value: "25", label: "25" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                  placeholder={`${itemsPerPage}`}
                  onChange={(value) => {
                    setItemsPerPage(Number(value));
                    setPage(1);
                  }}
                  defaultValue={`${itemsPerPage}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
