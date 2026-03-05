"use client";

import React, { useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
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
import { JobRecord } from "./data";

const runStatusColor = (status: JobRecord["runs"][number]["status"]) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  return "dark";
};

export default function JobDetailPageClient({ job }: { job: JobRecord }) {
  const [openRunMenu, setOpenRunMenu] = useState<string | null>(null);

  return (
    <div>
      <PageBreadcrumb pageTitle="Job Details" />
      <div className="space-y-6">
        <ComponentCard title="Job Information">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Job name
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {job.name}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Target
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {job.target}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Schedule type
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {job.scheduleType}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Schedule value
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {job.scheduleValue}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Retention policy
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {job.retentionDays} days
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Encryption enabled
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {job.encryptionEnabled ? "Yes" : "No"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Created date
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Last updated
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(job.updatedAt).toLocaleString()}
              </p>
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
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Run ID
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
                        Started At
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Finished At
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Duration
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Error message
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
                    {job.runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                          {run.id}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          <Badge size="sm" color={runStatusColor(run.status)}>
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {run.startedAt === "-" ? "-" : new Date(run.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {run.finishedAt === "-" ? "-" : new Date(run.finishedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {run.duration}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                          {run.errorMessage ?? "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="relative inline-flex">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenRunMenu(
                                  openRunMenu === run.id ? null : run.id
                                )
                              }
                              className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                            </button>
                            <Dropdown
                              isOpen={openRunMenu === run.id}
                              onClose={() => setOpenRunMenu(null)}
                              className="w-52 p-2"
                            >
                              <DropdownItem
                                onItemClick={() => {
                                  setOpenRunMenu(null);
                                  console.log("View logs", run.id);
                                }}
                                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                              >
                                View logs
                              </DropdownItem>
                              <DropdownItem
                                onItemClick={() => {
                                  setOpenRunMenu(null);
                                  console.log("View generated backups", run.id);
                                }}
                                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                              >
                                View generated backups
                              </DropdownItem>
                            </Dropdown>
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

        <div className="flex justify-end">
          <Link href="/jobs">
            <Button size="sm" variant="outline" type="button">
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
