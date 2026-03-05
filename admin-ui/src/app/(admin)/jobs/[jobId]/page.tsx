import type { Metadata } from "next";
import React from "react";
import JobDetailPageClient from "../JobDetailPageClient";
import { jobs } from "../data";

export const metadata: Metadata = {
  title: "Job Details",
  description: "Job management details",
};

export default function JobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const job = jobs.find((item) => item.id === params.jobId) ?? jobs[0];

  return <JobDetailPageClient job={job} />;
}
