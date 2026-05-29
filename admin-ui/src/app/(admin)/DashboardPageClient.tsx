"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import useStats from "@/handlers/stats/statHooks";
import { RecentJobRunType, InfraNodeType } from "@/handlers/stats/type";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BoxCubeIcon,
  TaskIcon,
  DatabaseIcon,
  FolderIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@/icons/index";
import moment from "moment";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

/* ── helpers ─────────────────────────────────────────────────────── */

type StatusBadgeColor = "success" | "error" | "warning" | "info" | "light";

const statusBadge = (status: string): { color: StatusBadgeColor; label: string } => {
  switch (status) {
    case "success":
    case "completed":
      return { color: "success", label: "Success" };
    case "failed":
      return { color: "error", label: "Failed" };
    case "running":
      return { color: "info", label: "Running" };
    case "canceled":
      return { color: "warning", label: "Canceled" };
    default:
      return { color: "light", label: status };
  }
};

const infraStatusDot = (status: string | null) => {
  if (status === "connected") return "bg-success-500";
  if (status === "failed" || status === "disconnected") return "bg-error-500";
  return "bg-gray-400 dark:bg-gray-500";
};

const formatDuration = (start: number | null, end: number | null): string => {
  if (!start || !end) return "-";
  const secs = end - start;
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
};

/* ── metric card icons ───────────────────────────────────────────── */

const metricIcons: Record<string, React.ReactNode> = {
  "Total Targets": <DatabaseIcon />,
  "Active Jobs": <TaskIcon />,
  "Total Backups": <BoxCubeIcon />,
  "Total Storage Used": <FolderIcon />,
};

const metricIconBg: Record<string, string> = {
  "Total Targets": "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  "Active Jobs": "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  "Total Backups": "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  "Total Storage Used": "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
};

/* ── section card ────────────────────────────────────────────────── */

const SectionCard = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ── main component ──────────────────────────────────────────────── */

export default function DashboardPageClient() {
  const {
    activityOptions,
    activitySeries,
    isLoading,
    metricCards,
    statusOptions,
    statusSeries,
    storageOptions,
    storageSeries,
    statusColors,
    statusLabels,
    recentJobRuns,
    infrastructure,
  } = useStats();

  const hasData =
    activitySeries?.[0]?.data.length > 0 || statusSeries.length > 0;

  /* ── empty state ─────────────────────────────────────────────── */
  if (!hasData && !isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-white/[0.02]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15">
            <span className="text-brand-500 dark:text-brand-400">
              <BoxCubeIcon />
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">
            No backup activity yet
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Set up a source, configure a destination, then run your first backup
            job to see data here.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/infrastructure/sources?create=1">
              <Button size="sm" variant="outline" type="button" startIcon={<PlusIcon />}>
                Add Source
              </Button>
            </Link>
            <Link href="/infrastructure/destinations?create=1">
              <Button size="sm" variant="outline" type="button" startIcon={<PlusIcon />}>
                Add Destination
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button size="sm" type="button">
                Create Job
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── dashboard ───────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/95">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Backup operations overview and system health.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs/new">
            <Button size="sm" type="button" startIcon={<PlusIcon />}>
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white/90">
                  {card.value}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  metricIconBg[card.label] ?? "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400"
                }`}
              >
                {metricIcons[card.label]}
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
            {card.meta ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* ── Charts Row ───────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Backup Activity" description="Last 7 days">
          <ReactApexChart
            options={activityOptions}
            series={activitySeries}
            type="area"
            height={300}
          />
        </SectionCard>

        <SectionCard title="Backup Status" description="Distribution across all backups">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
            <div className="flex items-center justify-center">
              <ReactApexChart
                options={statusOptions}
                series={statusSeries}
                type="donut"
                height={220}
              />
            </div>
            <div className="space-y-3">
              {statusLabels.map((label, index) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: statusColors[index] }}
                    />
                    <span className="text-sm capitalize text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                  <span className="rounded-md bg-gray-50 px-2 py-0.5 text-sm font-semibold text-gray-900 dark:bg-white/[0.04] dark:text-white/90">
                    {statusSeries[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Recent Job Runs ──────────────────────────────────────── */}
      <SectionCard
        title="Recent Job Runs"
        action={
          <Link
            href="/jobs"
            className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            View all
            <ArrowRightIcon />
          </Link>
        }
      >
        {recentJobRuns.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            No job runs yet. Create and run a job to see activity here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 dark:border-gray-800">
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Job
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Started
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Duration
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Error
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobRuns.map((run: RecentJobRunType) => {
                  const badge = statusBadge(run.status);
                  return (
                    <TableRow
                      key={run.id}
                      className="border-b border-gray-50 transition-colors hover:bg-gray-50/50 dark:border-gray-800/50 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/jobs/${run.jobId}`}
                          className="text-sm font-medium text-gray-900 hover:text-brand-500 dark:text-white/90 dark:hover:text-brand-400"
                        >
                          {run.jobName ?? `Job #${run.jobId}`}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge size="sm" color={badge.color}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {run.startedAt
                          ? moment.unix(run.startedAt).fromNow()
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(run.startedAt, run.finishedAt)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {run.errorMessage ?? "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* ── Bottom Row: Storage + Infrastructure ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Storage Usage — wider */}
        <div className="lg:col-span-3">
          <SectionCard title="Storage Usage" description="By destination">
            <ReactApexChart
              options={storageOptions}
              series={storageSeries}
              type="bar"
              height={260}
            />
          </SectionCard>
        </div>

        {/* Infrastructure Health — narrower */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Infrastructure"
            description="Connection status"
            action={
              <Link
                href="/infrastructure/sources"
                className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Manage
                <ArrowRightIcon />
              </Link>
            }
          >
            {infrastructure.sources.length === 0 &&
            infrastructure.destinations.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                No infrastructure configured yet.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Sources */}
                {infrastructure.sources.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                      Sources
                    </p>
                    <div className="space-y-2">
                      {infrastructure.sources.map((node: InfraNodeType) => (
                        <div
                          key={node.name}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${infraStatusDot(
                                node.status
                              )}`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white/90">
                                {node.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {node.type}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
                            {node.status ?? "unknown"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Destinations */}
                {infrastructure.destinations.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                      Destinations
                    </p>
                    <div className="space-y-2">
                      {infrastructure.destinations.map((node: InfraNodeType) => (
                        <div
                          key={node.name}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${infraStatusDot(
                                node.status
                              )}`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white/90">
                                {node.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {node.type}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
                            {node.status ?? "unknown"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
