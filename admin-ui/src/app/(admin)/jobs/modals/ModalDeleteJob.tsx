import React from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { Job } from "@/handlers/jobs/type";
import { useDeleteJob } from "@/handlers/jobs/jobHooks";

type DestinationDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  deleteJob: Job | null;
};

export default function ModalDeleteJob({
  isOpen,
  onClose,
  deleteJob,
}: DestinationDeleteModalProps) {

  const { toastError, toastSuccess } = useToast();

  const { deleteById, error, isMutating } = useDeleteJob();

  const handleDelete = async () => {
    try {
      if (!deleteJob?.id)
        throw new Error("Target not found.");
      await deleteById(deleteJob.id)
      toastSuccess("Job deleted.");
      onClose();
    } catch (error) {
      console.log("Error delete job")
      toastError();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete job {deleteJob?.name} ?
        </h3>
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