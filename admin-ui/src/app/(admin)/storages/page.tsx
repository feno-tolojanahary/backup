import type { Metadata } from "next";
import React from "react";
import StoragesPageClient from "./StoragesPageClient";

export const metadata: Metadata = {
  title: "Storages",
  description: "Manage backup storage destinations.",
};

export default function StoragesPage() {
  return <StoragesPageClient />;
}
