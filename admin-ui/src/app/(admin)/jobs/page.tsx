import type { Metadata } from "next";
import React from "react";
import JobsPageClient from "./JobsPageClient";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Configure and manage automated backup jobs.",
};

export default function JobsPage() {
  return <JobsPageClient />;
}
