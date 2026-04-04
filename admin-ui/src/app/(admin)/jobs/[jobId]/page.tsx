import type { Metadata } from "next";
import JobDetailPageClient from "../components/JobDetailPageClient";

export const metadata: Metadata = {
  title: "Job Details",
  description: "Job management details",
};

export default function JobDetailPage() {
  return <><JobDetailPageClient/></>
}
