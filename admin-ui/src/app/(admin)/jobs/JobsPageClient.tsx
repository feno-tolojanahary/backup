"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import {
  CheckCircleIcon,
  CloseLineIcon,
  TimeIcon,
} from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function JobsPageClient() {
  const [filter, setFilter] = useState<
    "all" | "enabled" | "disabled" | "failed"
  >("all");

  const jobs: Array<{
    id: string;
    name: string;
    source: string;
    target: string;
    schedule: string;
    lastRun: string;
    lastDuration: string;
    lastSize: string;
    status: "success" | "running" | "failed" | "disabled";
    enabled: boolean;
  }> = [
    {
      id: "1",
      name: "mongodb-prod",
      source: "MongoDB production-db",
      target: "wasabi-prod",
      schedule: "daily 02:00",
      lastRun: "5 minutes ago",
      lastDuration: "1m 20s",
      lastSize: "3.2 GB",
      status: "success",
      enabled: true,
    },
    {
      id: "2",
      name: "postgres-app",
      source: "Postgres app-db",
      target: "local-ssd",
      schedule: "hourly",
      lastRun: "1 hour ago",
      lastDuration: "45s",
      lastSize: "800 MB",
      status: "success",
      enabled: true,
    },
    {
      id: "3",
      name: "files-backup",
      source: "/var/data",
      target: "backup-server",
      schedule: "daily 01:00",
      lastRun: "2 hours ago",
      lastDuration: "3m 10s",
      lastSize: "12 GB",
      status: "failed",
      enabled: true,
    },
  ];

  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "enabled") return job.enabled;
    if (filter === "disabled") return !job.enabled;
    if (filter === "failed") return job.status === "failed";
    return true;
  });

  const statusBadge = (status: string) => {
    if (status === "success") return "success";
    if (status === "running") return "info";
    if (status === "failed") return "error";
    if (status === "disabled") return "dark";
    return "light";
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Backup Jobs" />
      <div className="space-y-6">
        <ComponentCard
          title="Backup Jobs"
          desc="Monitor schedules, targets, and job status."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "enabled", "disabled", "failed"] as const).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      filter === item
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-white/90"
                    }`}
                  >
                    {item === "all"
                      ? "All"
                      : item === "enabled"
                      ? "Enabled"
                      : item === "disabled"
                      ? "Disabled"
                      : "Failed"}
                  </button>
                )
              )}
            </div>
            <Button
              size="sm"
              type="button"
              onClick={() => console.log("Create job clicked")}
            >
              + Create Job
            </Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Source
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
                        Last Run
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Status
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
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="font-medium text-gray-800 dark:text-white/90">
                            {job.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {job.lastSize} • {job.lastDuration}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {job.source}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {job.target}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {job.schedule}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {job.lastRun}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            {job.status === "success" && (
                              <CheckCircleIcon />
                            )}
                            {job.status === "running" && <TimeIcon />}
                            {job.status === "failed" && <CloseLineIcon />}
                            {job.status === "disabled" && <CloseLineIcon />}
                            <Badge size="sm" color={statusBadge(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => console.log("Run job", job.id)}
                            >
                              Run Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => console.log("View backups", job.id)}
                            >
                              Backups
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => console.log("Edit job", job.id)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => console.log("Disable job", job.id)}
                            >
                              Disable
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
