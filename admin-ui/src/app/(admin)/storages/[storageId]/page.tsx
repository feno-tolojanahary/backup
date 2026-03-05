import type { Metadata } from "next";
import React from "react";
import StorageDetailPageClient from "../StorageDetailPageClient";
import { storages } from "../data";

export const metadata: Metadata = {
  title: "Storage Details",
  description: "Storage configuration details",
};

export default function StorageDetailPage({
  params,
}: {
  params: { storageId: string };
}) {
  const storage = storages.find((item) => item.id === params.storageId) ?? storages[0];

  return <StorageDetailPageClient storage={storage} />;
}
