import React from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { BoxIcon, FolderIcon, PlugInIcon } from "@/icons";
import { SourceRecord, SourceStatus, SourceType } from "./types";

type SourceCardProps = SourceRecord & {
  onView?: (source: SourceRecord) => void;
  onEdit?: (source: SourceRecord) => void;
  onTest?: (source: SourceRecord) => void;
  onDelete?: (source: SourceRecord) => void;
};

const statusLabel: Record<SourceStatus, string> = {
  connected: "Connected",
  warning: "Warning",
  error: "Connection Failed",
};

const statusColor: Record<SourceStatus, "success" | "warning" | "error"> = {
  connected: "success",
  warning: "warning",
  error: "error",
};

const typeLabel: Record<SourceType, string> = {
  mongodb: "MongoDB",
  s3: "S3 Bucket",
  filesystem: "Filesystem",
};

const typeIcon = (type: SourceType) => {
  if (type === "mongodb") return <PlugInIcon />;
  if (type === "s3") return <BoxIcon />;
  return <FolderIcon />;
};

const SourceCard: React.FC<SourceCardProps> = ({
  id,
  name,
  type,
  status,
  configSummary,
  jobsCount,
  onView,
  onEdit,
  onTest,
  onDelete,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {typeIcon(type)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {typeLabel[type]}
            </p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
              {name}
            </h3>
          </div>
        </div>
        <Badge size="sm" color={statusColor[status]}>
          {statusLabel[status]}
        </Badge>
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {configSummary.map((line) => (
          <p key={`${id}-${line}`}>{line}</p>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Used by:{" "}
        <span className="font-semibold text-gray-800 dark:text-white/80">
          {jobsCount} {jobsCount === 1 ? "job" : "jobs"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() =>
            onView?.({ id, name, type, status, configSummary, jobsCount })
          }
        >
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() =>
            onEdit?.({ id, name, type, status, configSummary, jobsCount })
          }
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() =>
            onTest?.({ id, name, type, status, configSummary, jobsCount })
          }
        >
          Test
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={() =>
            onDelete?.({ id, name, type, status, configSummary, jobsCount })
          }
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default SourceCard;
