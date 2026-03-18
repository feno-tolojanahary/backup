import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { useDeleteNotificationProvider } from "@/handlers/notifications/notification-providers/notificationProviderHooks";
import { NotificationProvider } from "@/handlers/notifications/notification-providers/type";

type BackupDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  deleteNotification: NotificationProvider | null;
};

export default function DeleteNotificationProviderModal({
  isOpen,
  onClose,
  deleteNotification,
}: BackupDeleteModalProps) {

    const { deleteById } = useDeleteNotificationProvider();
    const { toastSuccess, toastError } = useToast();

  const handleDelete = async () => {
    try {
        if (!deleteNotification?.id)
          return;
        await deleteById(deleteNotification.id);
        toastSuccess("Deleting the provider with success.");
    } catch (error: any) {
      console.log("Error delete provider: ", error.message);
      toastError();
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete notification provider {deleteNotification?.name} ?
        </h3>
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
