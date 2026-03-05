"use client";

import React from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { JobRecord } from "./data";

type JobFormPageClientProps = {
  mode: "create" | "edit";
  job?: JobRecord;
};

export default function JobFormPageClient({ mode, job }: JobFormPageClientProps) {
  const title = mode === "create" ? "Create Job" : "Edit Job";

  return (
    <div>
      <PageBreadcrumb pageTitle={title} />
      <div className="space-y-6">
        <ComponentCard
          title={title}
          desc="Define backup targets, schedule details, retention settings, and encryption."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Job name
              </label>
              <Input
                placeholder="Enter job name"
                defaultValue={job?.name ?? ""}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Target
              </label>
              <Input
                placeholder="Database name or filesystem path"
                defaultValue={job?.target ?? ""}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Schedule type
              </label>
              <Select
                options={[
                  { value: "interval", label: "interval" },
                  { value: "cron", label: "cron" },
                  { value: "manual", label: "manual" },
                ]}
                placeholder="Select schedule type"
                defaultValue={job?.scheduleType ?? ""}
                onChange={() => undefined}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Schedule value
              </label>
              <Input
                placeholder="3600 or 0 2 * * *"
                defaultValue={job?.scheduleValue ?? ""}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Retention days
              </label>
              <Input
                type="number"
                placeholder="30"
                defaultValue={job?.retentionDays ?? 30}
              />
            </div>
            <div className="flex items-end">
              <Switch
                label="Use encryption"
                defaultChecked={job?.encryptionEnabled ?? true}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link href="/jobs">
              <Button size="sm" variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button size="sm" type="button" onClick={() => console.log("Save job")}>
              Save Job
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
