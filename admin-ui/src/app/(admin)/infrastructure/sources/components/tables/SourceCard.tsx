import React from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { BoxIcon, PlugInIcon } from "@/icons";
import { Source, SourceType, StatusType } from "@/handlers/sources/type";

type SourceCardProps = {
  source: Source,
  isTesting?: boolean;
  onView?: (source: Source) => void;
  onEdit?: (source: Source) => void;
  onTest?: (source: Source) => void;
  onDelete?: (source: Source) => void;
};

const statusLabel: Record<StatusType, string> = {
  connected: "Connected",
  disconnected: "Warning",
  failed: "Connection Failed",
};

const statusColor: Record<StatusType, "success" | "warning" | "error"> = {
  connected: "success",
  disconnected: "warning",
  failed: "error",
};

const typeLabel: Record<SourceType, string> = {
  mongodb: "MongoDB",
  s3: "S3 Bucket"
};

const typeIcon = (type: SourceType) => {
  if (type === "mongodb") return <PlugInIcon />;
  return <BoxIcon />;
};

const SourceCard: React.FC<SourceCardProps> = ({
  source,
  isTesting = false,
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
            {typeIcon(source.type)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {typeLabel[source.type]}
            </p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
              {source.name}
            </h3>
          </div>
        </div>
        <Badge size="sm" color={statusColor[source.status]}>
          {statusLabel[source.status]}
        </Badge>
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {/* {configSummary.map((line) => (
          <p key={`${id}-${line}`}>{line}</p>
        ))} */}
      </div>

      {/* <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Used by:{" "}
        <span className="font-semibold text-gray-800 dark:text-white/80">
          {jobsCount} {jobsCount === 1 ? "job" : "jobs"}
        </span>
      </div> */}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() =>
            onView?.(source)
          }
        >
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() =>
            onEdit?.(source)
          }
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          isLoading={isTesting}
          onClick={() =>
            onTest?.(source)
          }
        >
          Test
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={() =>
            onDelete?.(source)
          }
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default SourceCard;
