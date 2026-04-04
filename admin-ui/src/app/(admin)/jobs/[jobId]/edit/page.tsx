import type { Metadata } from "next";
import JobFormPageClient from "../../JobFormPageClient";


export const metadata: Metadata = {
  title: "Edit Job",
  description: "Edit a backup job",
};

export default function EditJobPage() {
  return <><JobFormPageClient/></>;
}
