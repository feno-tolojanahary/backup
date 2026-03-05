"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { StorageRecord, StorageType } from "./data";

type StorageFormPageClientProps = {
  mode: "create" | "edit";
  storage?: StorageRecord;
};

export default function StorageFormPageClient({
  mode,
  storage,
}: StorageFormPageClientProps) {
  const title = mode === "create" ? "Add Storage" : "Edit Storage";
  const [storageType, setStorageType] = useState<StorageType>(
    storage?.type ?? "local"
  );
  const [authMethod, setAuthMethod] = useState("password");

  const typeOptions = useMemo(
    () => [
      { value: "local", label: "local" },
      { value: "s3", label: "s3" },
      { value: "sftp", label: "sftp" },
    ],
    []
  );

  return (
    <div>
      <PageBreadcrumb pageTitle={title} />
      <div className="space-y-6">
        <ComponentCard
          title={title}
          desc="Define the storage backend and connection details."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Storage name
              </label>
              <Input placeholder="Storage name" defaultValue={storage?.name ?? ""} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Storage type
              </label>
              <Select
                options={typeOptions}
                defaultValue={storageType}
                onChange={(value) => setStorageType(value as StorageType)}
              />
            </div>

            {storageType === "local" && (
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Local path
                </label>
                <Input placeholder="/mnt/backups" defaultValue={storage?.folder ?? ""} />
              </div>
            )}

            {storageType === "s3" && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Endpoint
                  </label>
                  <Input placeholder="s3.amazonaws.com" defaultValue={storage?.endpoint ?? ""} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Bucket
                  </label>
                  <Input placeholder="backup-bucket" defaultValue={storage?.bucket ?? ""} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Region
                  </label>
                  <Input placeholder="us-east-1" defaultValue="" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Access key
                  </label>
                  <Input placeholder="ACCESS_KEY" defaultValue="" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Secret key
                  </label>
                  <Input type="password" placeholder="SECRET_KEY" defaultValue="" />
                </div>
              </>
            )}

            {storageType === "sftp" && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Host
                  </label>
                  <Input placeholder="sftp.example.com" defaultValue={storage?.host ?? ""} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Port
                  </label>
                  <Input type="number" placeholder="22" defaultValue={storage?.port ?? 22} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Username
                  </label>
                  <Input placeholder="backup" defaultValue={storage?.username ?? ""} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Authentication method
                  </label>
                  <Select
                    options={[
                      { value: "password", label: "password" },
                      { value: "key", label: "key" },
                    ]}
                    defaultValue={authMethod}
                    onChange={(value) => setAuthMethod(value)}
                  />
                </div>
                {authMethod === "password" ? (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Password
                    </label>
                    <Input type="password" placeholder="Password" defaultValue="" />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Private key
                    </label>
                    <Input placeholder="/path/to/key.pem" defaultValue="" />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link href="/storages">
              <Button size="sm" variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button size="sm" type="button" onClick={() => console.log("Save storage")}>
              Save Storage
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
