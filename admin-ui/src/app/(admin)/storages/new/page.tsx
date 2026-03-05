import type { Metadata } from "next";
import React from "react";
import StorageFormPageClient from "../StorageFormPageClient";

export const metadata: Metadata = {
  title: "Add Storage",
  description: "Create a storage destination",
};

export default function CreateStoragePage() {
  return <StorageFormPageClient mode="create" />;
}
