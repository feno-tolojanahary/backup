"use client";

import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { SourceStatus, SourceType } from "./types";
import { MongodbConfig, Source } from "@/handlers/sources/type";
import { S3Config } from "@/handlers/destinations/type";

type SourceDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  source: Source | null;
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

export default function SourceDetailModal({
  isOpen,
  onClose,
  source,
}: SourceDetailModalProps) {

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[620px] m-4">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Source Details
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {source?.name}
            </p>
          </div>
          {source && (
            <Badge size="sm" color={statusColor[source.status]}>
              {statusLabel[source.status]}
            </Badge>
          )}
        </div>

        {source && (
          <div className="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Type
                </p>
                <p className="text-gray-800 dark:text-white/80">
                  {typeLabel[source.type]}
                </p>
              </div>
              {/* <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Jobs
                </p>
                <p className="text-gray-800 dark:text-white/80">
                  {source.jobsCount} {source.jobsCount === 1 ? "job" : "jobs"}
                </p>
              </div> */}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Configuration
              </p>
              <div className="mt-2 space-y-1">
                { source.type === "mongodb" &&
                  <>
                    <p>Database: {(source.config as MongodbConfig)?.database}</p>
                    <p>Uri: {(source.config as MongodbConfig)?.uri}</p>
                  </>
                }
                {
                  source.type === "s3" && 
                  <>
                    <p>Bucket: {(source.config as S3Config)?.bucketName}</p>
                    <p>Secret key: {(source.config as S3Config)?.secretKey}</p>
                    <p>Access key: {(source.config as S3Config)?.accessKey}</p>
                    <p>Prefix: {(source.config as S3Config)?.prefix}</p>
                  </>
                }
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
