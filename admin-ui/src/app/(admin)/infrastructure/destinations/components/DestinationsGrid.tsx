import React, { useState } from "react";
import { Destination, StatusType } from "@/handlers/destinations/type";
import DestinationDetailModal from "../components/DestinationDetailModal";
import DestinationTestModal from "../components/DestinationTestModal";
import DestinationCard from "./DestinationCard";
import { useModal } from "@/hooks/useModal";

type DestinationsGridProps = {
  destinations: Destination[];
  filteredDestinations: Destination[];
  openMenuId: string | null;
  setOpenMenuId: (value: string | null) => void;
  onEdit: (destination: Destination) => void;
  onDelete: (destination: Destination) => void;
};

export default function DestinationsGrid({
  destinations,
  filteredDestinations,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDelete,
}: DestinationsGridProps) {
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [testStatus, setTestStatus] = useState<StatusType | null>(null);
  const testModal = useModal();
  const detailModal = useModal();

  const handleTestResult = (destination: Destination, status: StatusType) => {
    setSelectedDestination(destination);
    setTestStatus(status);
    testModal.openModal();
  };

  const handleCloseTestModal = () => {
    testModal.closeModal();
    setSelectedDestination(null);
    setTestStatus(null);
  };

  const handleOpenDetail = (destination: Destination) => {
    setSelectedDestination(destination);
    detailModal.openModal();
  };

  const handleCloseDetail = () => {
    detailModal.closeModal();
    setSelectedDestination(null);
  };

  if (destinations.length === 0) {
    return <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No destinations configured yet.
            </p>
          </div>
  }

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {filteredDestinations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 sm:col-span-2 xl:col-span-3">
          No destinations match these filters.
        </div>
      ) : (
        filteredDestinations.map((destination) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onTestResult={handleTestResult}
            onOpenDetail={handleOpenDetail}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
      <DestinationTestModal
        isOpen={testModal.isOpen}
        onClose={handleCloseTestModal}
        destination={selectedDestination}
        status={testStatus}
      />
      <DestinationDetailModal
        isOpen={detailModal.isOpen}
        onClose={handleCloseDetail}
        destination={selectedDestination}
      />
    </div>
  );
}
