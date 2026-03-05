import type { Metadata } from "next";
import React from "react";
import BackupsPageClient from "./BackupsPageClient";

export const metadata: Metadata = {
  title: "Backups",
  description: "List of backups",
};

export default function BackupsPage() {
  return <BackupsPageClient />;
}
