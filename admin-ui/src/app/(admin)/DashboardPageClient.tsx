"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import Button from "@/components/ui/button/Button";
import useStats from "@/handlers/stats/statHooks";
// import Badge from "@/components/ui/badge/Badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// type StatusColor = "success" | "error" | "info" | "dark";

// const statusColor = (status: string): StatusColor => {
//   if (status === "success" || status === "completed") return "success";
//   if (status === "failed") return "error";
//   if (status === "running") return "info";
//   return "dark";
// };

// const infrastructureHealth = [
//   {
//     name: "data_1",
//     type: "mongodb",
//     status: "connected",
//   },
//   {
//     name: "wasa-buck-rep",
//     type: "s3",
//     status: "connected",
//   },
//   {
//     name: "s3-default",
//     type: "s3",
//     status: "connected",
//   },
//   {
//     name: "host1",
//     type: "ssh host",
//     status: "connected",
//   },
//   {
//     name: "local-storage-1",
//     type: "local",
//     status: "connected",
//   },
// ];

// const systemAlerts = [
//   {
//     id: "alert-1",
//     message: 'Backup job "mongodb-backup" failed 3 times in the last 24 hours.',
//     tone: "error",
//   },
//   {
//     id: "alert-2",
//     message: 'Storage "host1" disk usage exceeded 90%.',
//     tone: "warning",
//   },
//   {
//     id: "alert-3",
//     message: 'Destination "s3-default" connection failed.',
//     tone: "error",
//   },
// ];

// const statusIndicator = (status: string) => {
//   if (status === "connected") return "bg-success-500";
//   if (status === "error") return "bg-error-500";
//   return "bg-gray-400";
// };

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function DashboardPageClient() {
  const { 
    activityOptions,
    activitySeries,
    error,
    isLoading,
    metricCards,
    statusOptions,
    statusSeries,
    storageOptions,
    storageSeries,
    statusColors,
    statusLabels
  } = useStats();

  const hasData =
    activitySeries?.[0]?.data.length > 0 ||
    statusSeries.length > 0

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">
          No backup activity detected yet.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create a source, configure destination, or run a backup job to get started.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/infrastructure/sources?create=1">
            <Button size="sm" variant="outline" type="button">
              Create a source
            </Button>
          </Link>
          <Link href="/infrastructure/destinations?create=1">
            <Button size="sm" variant="outline" type="button">
              Configure destination
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="sm" type="button">
              Run a backup job
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white/90">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of backup operations, infrastructure health, and storage usage.
          </p>
        </div>

      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white/90">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
            {card.meta ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {card.meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Backup Activity (Last 7 Days)">
          <ReactApexChart
            options={activityOptions}
            series={activitySeries}
            type="line"
            height={320}
          />
        </SectionCard>

        <SectionCard title="Backup Status Overview">
          <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
            <div className="flex items-center justify-center">
              <ReactApexChart
                options={statusOptions}
                series={statusSeries}
                type="donut"
                height={240}
              />
            </div>
            <div className="space-y-3">
              {statusLabels.map((label, index) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: statusColors[index] }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {statusSeries[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Storage Usage by Destination">
        <ReactApexChart
          options={storageOptions}
          series={storageSeries}
          type="bar"
          height={280}
        />
      </SectionCard>

      {/* <SectionCard title="Infrastructure Health">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {infrastructureHealth.map((storage) => (
            <div
              key={storage.name}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {storage.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Type: {storage.type}
                  </p>
                </div>
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${statusIndicator(
                    storage.status
                  )}`}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white/90">
                  {storage.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard> */}


      {/* <SectionCard title="System Alerts">
        <div className="space-y-3">
          {systemAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border px-4 py-3 text-sm ${
                alert.tone === "error"
                  ? "border-error-200 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
                  : "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-200"
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      </SectionCard> */}
    </div>
  );
}
