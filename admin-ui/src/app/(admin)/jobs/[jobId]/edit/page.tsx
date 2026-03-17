import type { Metadata } from "next";
import React, { useEffect, useState } from "react";
import JobFormPageClient from "../../JobFormPageClient";
import { useJobList } from "@/handlers/jobs/jobHooks";
import { Job } from "@/handlers/jobs/type";


export const metadata: Metadata = {
  title: "Edit Job",
  description: "Edit a backup job",
};

export default function EditJobPage({
  params,
}: {
  params: { jobId: string };
}) {

  const [selectedJob, setSelectedJob] = useState<Job | null>();
  const { data: jobs } = useJobList();

  useEffect(() => {
    if (jobs.length > 0 && params.jobId) {
      const foundJob = jobs.find((job) => job.id.toString() === params.jobId);
      setSelectedJob(foundJob);
    }
  }, [jobs, params.jobId])

  return <JobFormPageClient mode="edit" job={selectedJob} />;
}
