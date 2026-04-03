import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Destination, StatusType } from "@/handlers/destinations/type";

type DestinationTestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination | null;
  status: StatusType | null;
};

export default function DestinationTestModal({
  isOpen,
  onClose,
  destination,
  status,
}: DestinationTestModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Test connection
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Destination: {destination?.name}
        </p>
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          {!status && (
            <p className="text-gray-400 dark:text-gray-400">
              No test result available.
            </p>
          )}
          {status === "connected" && (
            <p className="text-success-600">Connection successful.</p>
          )}
          {status === "failed" && (
            <>
              <p className="text-error-600">Connection failed.</p>
              {destination?.errorMsg && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {destination.errorMsg}
                </p>
              )}
            </>
          )}
          {status === "disconnected" && (
            <p className="text-gray-600 dark:text-gray-400">
              Disconnected
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
