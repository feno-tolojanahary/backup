import type { Metadata } from "next";
import React from "react";
import StorageFormPageClient from "../../StorageFormPageClient";
import { storages } from "../../data";

export const metadata: Metadata = {
  title: "Edit Storage",
  description: "Edit a storage destination",
};

export default function EditStoragePage({
  params,
}: {
  params: { storageId: string };
}) {
  const storage =
    storages.find((item) => item.id === params.storageId) ?? storages[0];

  return <StorageFormPageClient mode="edit" storage={storage} />;
}
