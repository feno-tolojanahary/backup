import React from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { BackupRecord } from "./BackupsTypes";

type BackupDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleteTarget: BackupRecord | null;
};

export default function BackupDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  deleteTarget,
}: BackupDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete backup {deleteTarget?.uid} ?
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This action permanently removes the backup and its files.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="button" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
