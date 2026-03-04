"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { BoxIcon, FolderIcon, PlugInIcon } from "@/icons";

type TargetType = "s3" | "remote" | "local";
type TargetStatus = "connected" | "warning" | "error";

interface Target {
  id: string;
  name: string;
  type: TargetType;
  region?: string;
  endpoint?: string;
  host?: string;
  path?: string;
  used: number;
  capacity: number;
  unit: string;
  jobs: number;
  lastWrite: string;
  status: TargetStatus;
}

const targets: Target[] = [
  {
    id: "1",
    name: "wasabi-prod",
    type: "s3",
    region: "us-east-1",
    endpoint: "s3.wasabisys.com",
    used: 120,
    capacity: 500,
    unit: "GB",
    jobs: 4,
    lastWrite: "3 minutes ago",
    status: "connected",
  },
  {
    id: "2",
    name: "backup-server",
    type: "remote",
    host: "192.168.1.20",
    path: "/data/backups",
    used: 320,
    capacity: 1000,
    unit: "GB",
    jobs: 3,
    lastWrite: "10 minutes ago",
    status: "connected",
  },
  {
    id: "3",
    name: "local-ssd",
    type: "local",
    path: "/mnt/backup",
    used: 800,
    capacity: 1000,
    unit: "GB",
    jobs: 6,
    lastWrite: "1 hour ago",
    status: "warning",
  },
];

const statusColor: Record<TargetStatus, "success" | "warning" | "error"> = {
  connected: "success",
  warning: "warning",
  error: "error",
};

export default function StoragesPageClient() {
  const [selectedType, setSelectedType] = useState<TargetType | "all">("all");

  const filteredTargets = useMemo(() => {
    if (selectedType === "all") return targets;
    return targets.filter((target) => target.type === selectedType);
  }, [selectedType]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Storage Targets" />
      <div className="space-y-6">
        <ComponentCard
          title="Storage Targets"
          desc="Manage backup storage targets across S3, remote hosts, and local disks."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "s3", "remote", "local"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedType === type
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-white/90"
                  }`}
                >
                  {type === "all"
                    ? "All"
                    : type === "s3"
                    ? "S3"
                    : type === "remote"
                    ? "Remote"
                    : "Local"}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              type="button"
              onClick={() => console.log("Add target clicked")}
            >
              + Add Target
            </Button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTargets.map((target) => {
              const percentage = Math.round((target.used / target.capacity) * 100);
              return (
                <div
                  key={target.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {target.type === "s3" ? (
                          <BoxIcon />
                        ) : target.type === "remote" ? (
                          <PlugInIcon />
                        ) : (
                          <FolderIcon />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
                          {target.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {target.type === "s3"
                            ? `S3 Storage • ${target.region ?? ""}`
                            : target.type === "remote"
                            ? "Remote Host"
                            : "Local Disk"}
                        </p>
                      </div>
                    </div>
                    <Badge size="sm" color={statusColor[target.status]}>
                      {target.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {target.type === "s3" && (
                      <p>Endpoint: {target.endpoint}</p>
                    )}
                    {target.type === "remote" && (
                      <>
                        <p>Host: {target.host}</p>
                        <p>Path: {target.path}</p>
                      </>
                    )}
                    {target.type === "local" && <p>Path: {target.path}</p>}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Usage
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {target.used} {target.unit} / {target.capacity} {target.unit}
                    </p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {percentage}%
                    </p>
                  </div>

                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>Jobs: {target.jobs}</p>
                    <p>Last write: {target.lastWrite}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" type="button">
                      Browse
                    </Button>
                    <Button size="sm" variant="outline" type="button">
                      Details
                    </Button>
                    <Button size="sm" variant="outline" type="button">
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
