import type { Metadata } from "next";
import React from "react";
import DashboardPageClient from "./DashboardPageClient";
import SWRProvider from '@/components/common/SWRProvider';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of backup operations, storage usage, and system activity.",
};

export default function Dashboard() {
  return (
    <SWRProvider>
      <DashboardPageClient />
    </SWRProvider>
  );
}
