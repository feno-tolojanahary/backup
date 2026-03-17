import React from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Backup, BackupStatus } from "@/handlers/backups/type";
import moment from "moment";
import { formatBytes } from "@/handlers/utils/utils";

type BackupDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  backup: Backup | null;
  statusBadgeColor: (status: BackupStatus) => "success" | "error" | "dark";
};

export default function BackupDetailsModal({
  isOpen,
  onClose,
  backup,
  statusBadgeColor,
}: BackupDetailsModalProps) {

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[900px] m-4">
      {backup && (
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Backup details
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Backup UID: {backup.backupUid}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Job name
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {backup.job?.name}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Status
              </p>
              <div className="mt-2">
                <Badge size="sm" color={statusBadgeColor(backup.status)}>
                  {backup.status}
                </Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Created
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {moment(backup.createdAt).format("YYYY-MM-DD hh:mm")}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Size
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {formatBytes(backup.size)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                File count
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {backup.files?.length || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Storage destination
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {backup.storage}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Encryption status
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {backup.isEncrypted ? "Encrypted" : "Plain text"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Files
            </h4>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[500px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                        >
                          File path
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                        >
                          Size
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {backup.files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-300">
                            {file.storagePath}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                            {formatBytes(file.size)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline" type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
