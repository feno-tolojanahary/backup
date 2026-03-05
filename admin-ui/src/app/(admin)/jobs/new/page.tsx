import type { Metadata } from "next";
import React from "react";
import JobFormPageClient from "../JobFormPageClient";

export const metadata: Metadata = {
  title: "Create Job",
  description: "Create a backup job",
};

export default function CreateJobPage() {
  return <JobFormPageClient mode="create" />;
}
