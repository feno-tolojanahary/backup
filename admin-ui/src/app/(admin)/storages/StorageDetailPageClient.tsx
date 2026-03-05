"use client";

import React, { useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import { StorageRecord } from "./data";

const statusBadgeColor = (status: StorageRecord["lastTestStatus"]) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  return "dark";
};

export default function StorageDetailPageClient({
  storage,
}: {
  storage: StorageRecord;
}) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div>
      <PageBreadcrumb pageTitle="Storage Details" />
      <div className="space-y-6">
        <ComponentCard title="Storage Information">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Storage name
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.name}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Storage type
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.type}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Endpoint / Host
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.endpoint ?? storage.host ?? "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Bucket / Folder
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.bucket ?? storage.folder ?? "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Configuration identifier
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.configName}
              </p>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Statistics">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Total backups stored
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.totalBackups}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Total files stored
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.totalFiles}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Total storage used
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {storage.totalUsed}
              </p>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Connection Status">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Last connection test result
              </p>
              <div className="mt-2">
                <Badge size="sm" color={statusBadgeColor(storage.lastTestStatus)}>
                  {storage.lastTestStatus}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Last check timestamp
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(storage.lastCheckAt).toLocaleString()}
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(!openMenu)}
                className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
              <Dropdown
                isOpen={openMenu}
                onClose={() => setOpenMenu(false)}
                className="w-52 p-2"
              >
                <DropdownItem
                  onItemClick={() => {
                    setOpenMenu(false);
                    console.log("Test connection", storage.id);
                  }}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  Test connection
                </DropdownItem>
                <DropdownItem
                  tag="a"
                  href={`/storages/${storage.id}/edit`}
                  onItemClick={() => setOpenMenu(false)}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  Edit storage
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
          {storage.lastTestMessage && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {storage.lastTestMessage}
            </p>
          )}
        </ComponentCard>

        <div className="flex justify-end">
          <Link href="/storages">
            <Button size="sm" variant="outline" type="button">
              Back to Storages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
