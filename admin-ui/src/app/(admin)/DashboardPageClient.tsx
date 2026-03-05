"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type StatusColor = "success" | "error" | "info" | "dark";

const statusColor = (status: string): StatusColor => {
  if (status === "success" || status === "completed") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  return "dark";
};

const metricCards = [
  {
    label: "Total Targets",
    value: "3",
    description: "Number of configured backup targets.",
    meta: ["app1", "mongodb", "s3-wasabi"],
  },
  {
    label: "Active Jobs",
    value: "5",
    description: "Number of enabled jobs.",
  },
  {
    label: "Total Backups",
    value: "238",
    description: "Total backups stored across all destinations.",
  },
  {
    label: "Total Storage Used",
    value: "1.7 TB",
    description: "Total disk or object storage used.",
  },
];

const statusSeries = [190, 28, 20];
const statusLabels = ["Completed", "Failed", "Archived"];
const statusColors = ["#22C55E", "#EF4444", "#9CA3AF"];

const statusOptions: ApexOptions = {
  chart: {
    type: "donut",
    fontFamily: "Outfit, sans-serif",
  },
  labels: statusLabels,
  colors: statusColors,
  dataLabels: {
    enabled: false,
  },
  legend: {
    show: false,
  },
  stroke: {
    width: 0,
  },
  plotOptions: {
    pie: {
      donut: {
        size: "68%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "Total",
            fontSize: "14px",
            color: "#6B7280",
            formatter: function () {
              return "238";
            },
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (value) => `${value} backups`,
    },
  },
};

const activitySeries = [
  {
    name: "Successful",
    data: [18, 21, 17, 20, 19, 14, 12],
  },
  {
    name: "Failed",
    data: [2, 1, 3, 0, 1, 2, 1],
  },
];

const activityOptions: ApexOptions = {
  chart: {
    type: "line",
    height: 320,
    fontFamily: "Outfit, sans-serif",
    toolbar: { show: false },
  },
  colors: ["#22C55E", "#EF4444"],
  stroke: {
    curve: "smooth",
    width: 3,
  },
  markers: {
    size: 4,
    strokeColors: "#fff",
    strokeWidth: 2,
    hover: {
      size: 6,
    },
  },
  xaxis: {
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: "#6B7280",
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: "#6B7280",
      },
    },
  },
  grid: {
    borderColor: "#E5E7EB",
    strokeDashArray: 4,
  },
  dataLabels: {
    enabled: false,
  },
  legend: {
    position: "top",
    horizontalAlign: "left",
    labels: {
      colors: "#6B7280",
    },
  },
};

const storageSeries = [
  {
    name: "Storage",
    data: [1200, 420, 120],
  },
];

const storageOptions: ApexOptions = {
  chart: {
    type: "bar",
    height: 280,
    fontFamily: "Outfit, sans-serif",
    toolbar: { show: false },
  },
  colors: ["#38BDF8"],
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: "55%",
      borderRadius: 8,
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ["#1F2937"],
      fontSize: "12px",
      fontWeight: 600,
    },
    formatter: (value) => {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)} TB`;
      }
      return `${value} GB`;
    },
  },
  xaxis: {
    categories: ["Wasabi S3", "Local Storage", "SFTP Remote"],
    labels: {
      style: {
        colors: "#6B7280",
      },
      formatter: (value) => `${value} GB`,
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: "#6B7280",
      },
    },
  },
  grid: {
    borderColor: "#E5E7EB",
    strokeDashArray: 4,
  },
  tooltip: {
    y: {
      formatter: (value) => {
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)} TB`;
        }
        return `${value} GB`;
      },
    },
  },
};

const jobRuns = [
  {
    id: "1042",
    jobName: "mongodb-backup",
    target: "mongodb",
    status: "success",
    startedAt: "2026-03-05 02:00",
    duration: "3m12s",
    error: "-",
  },
  {
    id: "1041",
    jobName: "app1-backup",
    target: "app1",
    status: "success",
    startedAt: "2026-03-05 01:00",
    duration: "4m10s",
    error: "-",
  },
  {
    id: "1040",
    jobName: "mongodb-backup",
    target: "mongodb",
    status: "failed",
    startedAt: "2026-03-04 02:00",
    duration: "1m15s",
    error: "Network timeout",
  },
];

const recentBackups = [
  {
    uid: "bk_921a3",
    target: "mongodb",
    status: "completed",
    size: "1.2 GB",
    destination: "s3-default",
    createdAt: "2026-03-05",
  },
  {
    uid: "bk_92198",
    target: "app1",
    status: "completed",
    size: "850 MB",
    destination: "local-storage-1",
    createdAt: "2026-03-05",
  },
  {
    uid: "bk_92160",
    target: "mongodb",
    status: "failed",
    size: "-",
    destination: "host1",
    createdAt: "2026-03-04",
  },
];

const infrastructureHealth = [
  {
    name: "data_1",
    type: "mongodb",
    status: "connected",
  },
  {
    name: "wasa-buck-rep",
    type: "s3",
    status: "connected",
  },
  {
    name: "s3-default",
    type: "s3",
    status: "connected",
  },
  {
    name: "host1",
    type: "ssh host",
    status: "connected",
  },
  {
    name: "local-storage-1",
    type: "local",
    status: "connected",
  },
];

const targets = [
  {
    name: "app1",
    type: "app",
    source: "data_1",
    destinations: 3,
  },
  {
    name: "mongodb",
    type: "database",
    source: "data_1",
    destinations: 3,
  },
  {
    name: "s3-wasabi",
    type: "object replication",
    source: "wasa-buck-rep",
    destinations: 3,
  },
];

const systemAlerts = [
  {
    id: "alert-1",
    message: 'Backup job "mongodb-backup" failed 3 times in the last 24 hours.',
    tone: "error",
  },
  {
    id: "alert-2",
    message: 'Storage "host1" disk usage exceeded 90%.',
    tone: "warning",
  },
  {
    id: "alert-3",
    message: 'Destination "s3-default" connection failed.',
    tone: "error",
  },
];

const statusIndicator = (status: string) => {
  if (status === "connected") return "bg-success-500";
  if (status === "error") return "bg-error-500";
  return "bg-gray-400";
};

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
  const hasData =
    activitySeries[0].data.length > 0 ||
    statusSeries.length > 0 ||
    jobRuns.length > 0 ||
    recentBackups.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">
          No backup activity detected yet.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create a target, configure storage, or run a backup job to get started.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="sm" variant="outline" type="button">
            Create a target
          </Button>
          <Button size="sm" variant="outline" type="button">
            Configure storage
          </Button>
          <Button size="sm" type="button">
            Run a backup job
          </Button>
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
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => console.log("Refresh dashboard")}
        >
          Refresh
        </Button>
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

      <SectionCard title="Infrastructure Health">
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
      </SectionCard>

      <SectionCard title="Target Overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {targets.map((target) => (
            <div
              key={target.name}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                {target.name}
              </p>
              <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div>Type: {target.type}</div>
                <div>Source: {target.source}</div>
                <div>Destinations: {target.destinations}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Job Runs">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.02]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Run ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Job Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Target
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Started At
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Duration
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Error Message
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {jobRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                        {run.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                        {run.jobName}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {run.target}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm">
                        <Badge size="sm" color={statusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {run.startedAt}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {run.duration}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {run.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent Backups">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.02]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Backup UID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Target
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Size
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Destination
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Created At
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {recentBackups.map((backup) => (
                    <TableRow key={backup.uid}>
                      <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                        {backup.uid}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                        {backup.target}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm">
                        <Badge size="sm" color={statusColor(backup.status)}>
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {backup.size}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {backup.destination}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {backup.createdAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="System Alerts">
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
      </SectionCard>
    </div>
  );
}
