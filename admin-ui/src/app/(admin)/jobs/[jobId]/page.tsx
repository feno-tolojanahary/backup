import type { Metadata } from "next";
import { useEffect, useState } from "react";
import JobDetailPageClient from "../components/JobDetailPageClient";
import { useJobList } from "@/handlers/jobs/jobHooks";
import { Job } from "@/handlers/jobs/type";

export const metadata: Metadata = {
  title: "Job Details",
  description: "Job management details",
};

export default function JobDetailPage({
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

  return <>
          { 
            selectedJob ?
            <JobDetailPageClient job={selectedJob} />
            : <div>Detail job not found.</div>
          }
        </>;
}
