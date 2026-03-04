import type { Metadata } from "next";
import React from "react";
import StoragesPageClient from "./StoragesPageClient";

export const metadata: Metadata = {
  title: "Storages",
  description: "List of storage targets",
};

export default function StoragesPage() {
  return <StoragesPageClient />;
}
