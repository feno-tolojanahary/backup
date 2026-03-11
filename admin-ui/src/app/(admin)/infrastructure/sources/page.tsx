import type { Metadata } from "next";
import React from "react";
import SourcesPageClient from "./SourcesPageClient";

export const metadata: Metadata = {
  title: "Sources",
  description: "Manage backup data sources.",
};

export default function SourcesPage() {
  return <SourcesPageClient />;
}
