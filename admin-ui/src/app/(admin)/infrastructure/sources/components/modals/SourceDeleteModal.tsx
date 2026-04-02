import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useDeleteSource } from "@/handlers/sources/sourcesHooks";
import { Source } from "@/handlers/sources/type";

type SourceDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  deleteTarget: Source | null;
};

export default function SourceDeleteModal({
  isOpen,
  onClose,
  deleteTarget,
}: SourceDeleteModalProps) {
  const { deleteSource, isLoading } = useDeleteSource();
  const { toastError, toastSuccess } = useToast();

  const handleDelete = async () => {
    try {
      if (!deleteTarget?.id) {
        throw new Error("Target not found.");
      }
      await deleteSource(deleteTarget.id);
      toastSuccess("Source deleted.");
      onClose();
    } catch (error) {
      toastError();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete source {deleteTarget?.name} ?
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This action permanently removes the source and its configuration.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} size="sm" type="button" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
