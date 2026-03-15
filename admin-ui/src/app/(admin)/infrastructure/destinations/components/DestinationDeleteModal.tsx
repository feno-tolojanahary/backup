import React from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Destination } from "@/handlers/destinations/type";
import { useDeleteDestination } from "@/handlers/destinations/destinationHooks";
import { useToast } from "@/context/ToastContext";

type DestinationDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleteTarget: Destination | null;
};

export default function DestinationDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  deleteTarget,
}: DestinationDeleteModalProps) {

  const { toastError, toastSuccess } = useToast();

  const { deleteById, error, isMutating } = useDeleteDestination();

  const handleDelete = async () => {
    try {
      if (!deleteTarget?.id)
        throw new Error("Target not found.");
      await deleteById(deleteTarget.id)
      toastSuccess("Destination deleted.");
      onClose();
    } catch (error) {
      toastError();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete destination {deleteTarget?.name} ?
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Backups referencing this destination may become inaccessible.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isMutating} size="sm" type="button" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
