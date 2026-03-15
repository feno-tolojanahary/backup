import React from "react";
import { Destination } from "@/handlers/destinations/type";
import DestinationCard from "./DestinationCard";
import DestinationsEmptyState from "./DestinationsEmptyState";

type DestinationsGridProps = {
  destinations: Destination[];
  filteredDestinations: Destination[];
  openMenuId: string | null;
  setOpenMenuId: (value: string | null) => void;
  onAdd: () => void;
  onTestConnection: (destination: Destination) => void;
  onEdit: (destination: Destination) => void;
  onDelete: (destination: Destination) => void;
};

export default function DestinationsGrid({
  destinations,
  filteredDestinations,
  openMenuId,
  setOpenMenuId,
  onAdd,
  onTestConnection,
  onEdit,
  onDelete,
}: DestinationsGridProps) {
  if (destinations.length === 0) {
    return <DestinationsEmptyState onAdd={onAdd} />;
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
            onTestConnection={onTestConnection}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
