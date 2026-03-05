import type { Metadata } from "next";
import React from "react";
import JobFormPageClient from "../../JobFormPageClient";
import { jobs } from "../../data";

export const metadata: Metadata = {
  title: "Edit Job",
  description: "Edit a backup job",
};

export default function EditJobPage({
  params,
}: {
  params: { jobId: string };
}) {
  const job = jobs.find((item) => item.id === params.jobId) ?? jobs[0];

  return <JobFormPageClient mode="edit" job={job} />;
}
