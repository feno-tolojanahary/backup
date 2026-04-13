"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Destination,
  HostConfig,
  LocalStorageConfig,
  S3Config,
  StatusType,
} from "@/handlers/destinations/type";
import { statusBadgeColor } from "./DestinationsUtils";

type DestinationDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination | null;
};

const statusLabel: Record<StatusType, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  failed: "Failed",
};

export default function DestinationDetailModal({
  isOpen,
  onClose,
  destination,
}: DestinationDetailModalProps) {
  const privateKeyUpdatedAt = destination?.updatedAt
    ? new Date(destination.updatedAt).toISOString().slice(0, 10)
    : "-";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] m-4">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Destination Details
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {destination?.name}
            </p>
          </div>
          {destination?.status && (
            <Badge size="sm" color={statusBadgeColor(destination.status)}>
              {statusLabel[destination.status]}
            </Badge>
          )}
        </div>

        {destination && (
          <div className="mt-6 space-y-5 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Type
                </p>
                <p className="text-gray-800 dark:text-white/80">
                  {destination.type}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Created by
                </p>
                <p className="text-gray-800 dark:text-white/80">
                  {destination.createdBy ?? "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Configuration
              </p>
              <div className="mt-2 space-y-1">
                {destination.type === "s3" && (
                  <>
                    <p>Endpoint: {(destination.config as S3Config)?.endpoint}</p>
                    <p>Bucket: {(destination.config as S3Config)?.bucketName}</p>
                    <p>Region: {(destination.config as S3Config)?.region}</p>
                    <p>Access key: {(destination.config as S3Config)?.accessKey}</p>
                    <p>Secret key: ••••••••</p>
                    <p>Prefix: {(destination.config as S3Config)?.prefix}</p>
                  </>
                )}
                {destination.type === "ssh" && (
                  <>
                    <p>Host: {(destination.config as HostConfig)?.host}</p>
                    <p>Port: {(destination.config as HostConfig)?.port}</p>
                    <p>Username: {(destination.config as HostConfig)?.username}</p>
                    <p>Auth method: {(destination.config as HostConfig)?.authMethod}</p>
                    <p>Password: ••••••••</p>
                    <p>Private key: {destination.hasPrivateKey ? "Configured" : "Not configured"}</p>
                    <p>Fingerprint: {destination.fingerprint ?? "-"}</p>
                    <p>Private key updated: {privateKeyUpdatedAt}</p>
                    <p>Passphrase: ••••••••</p>
                    <p>Destination folder: {(destination.config as HostConfig)?.destinationFolder}</p>
                    <p>Max disk usage: {(destination.config as HostConfig)?.maxDiskUsage}</p>
                  </>
                )}
                {destination.type === "local-storage" && (
                  <>
                    <p>Destination folder: {(destination.config as LocalStorageConfig)?.destinationFolder}</p>
                    <p>Max disk usage: {(destination.config as LocalStorageConfig)?.maxDiskUsage}</p>
                  </>
                )}
              </div>
            </div>

            {destination.errorMsg && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Error message
                </p>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {destination.errorMsg}
                </p>
              </div>
            )}
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
