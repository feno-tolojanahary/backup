import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useDeleteBackup } from "@/handlers/backups/backupHooks";
import { Backup } from "@/handlers/backups/type";

type BackupDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  deleteTarget: Backup | null;
};

export default function BackupDeleteModal({
  isOpen,
  onClose,
  deleteTarget,
}: BackupDeleteModalProps) {

  const { deleteBackup } = useDeleteBackup();
  const { toastSuccess, toastError } = useToast();

  const handleDelete = async () => {
    try {
        if (!deleteTarget?.id)
          return;
        await deleteBackup(deleteTarget.id);
        toastSuccess("Deleting the backup with success.");
    } catch (error: any) {
      console.log("Error delete backup: ", error.message);
      toastError();
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete backup {deleteTarget?.backupUid} ?
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This action permanently removes the backup and its files.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="button" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
