"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { jobs, JobStatus } from "./data";

export default function JobsPageClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [page, setPage] = useState(1);

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
