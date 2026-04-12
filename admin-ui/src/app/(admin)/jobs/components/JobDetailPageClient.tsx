"use client";

import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Link from "next/link";
import { useJobList, useRunJob } from "@/handlers/jobs/jobHooks";
import { Job, JobStatus } from "@/handlers/jobs/type";
import JobRunHistory from "./JobRunHistory";
import { useParams } from "next/navigation";

const statusBadgeColor = (status: JobStatus | undefined) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  return "warning";
};

export default function JobDetailPageClient() {
  const params = useParams<{ jobId: string }>();
  const { data: jobs } = useJobList();

  const job = useMemo(() => {
    if (!params?.jobId) 
      return {} as Job;
    const foundJob = jobs.find((job) => job.id.toString() === params.jobId);
    return foundJob ?? {} as Job;
  }, [jobs, params.jobId]);

  const { runJob } = useRunJob();
  
  return (
    <div>
      <PageBreadcrumb pageTitle="Job Details" />
      <div className="space-y-6">
        <ComponentCard title="Job Details">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{job.name}</h3>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Schedule</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.scheduleValue}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Retention</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.retentionDays} days</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Run</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{moment(job.lastJobRun?.finishedAt).format("YYYY-MM-DD hh:mm")}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Status</p>
                  <div className="mt-1">
                    <Badge size="sm" color={statusBadgeColor(job.lastJobRun?.status)}>
                      {job.lastJobRun?.status}
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
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.isEncrypted ? "enabled" : "disabled"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Job State</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.isEnable ? "enabled" : "disabled"}</p>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Execution Controls">
          <div className="flex flex-wrap gap-3">
            <Button size="sm" isLoading={job.status === "running"} type="button" onClick={() => runJob(job.id)}>
              Run Job Now
            </Button>
            { job.status !== "running" && 
              <>
                <Link href={`/jobs/${job.id}/edit`}>
                  <Button size="sm" variant="outline" type="button">
                    Edit Job
                  </Button>
                </Link>
              </>
            }
          </div>
        </ComponentCard>
        <ComponentCard title="Run History">
          <JobRunHistory
            job={job}
          />
        </ComponentCard>
      </div>

      {/* Modal detail here */}
    </div>
  );
}