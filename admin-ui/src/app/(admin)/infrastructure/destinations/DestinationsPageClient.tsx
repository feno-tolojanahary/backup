"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { useModal } from "@/hooks/useModal";
import {
  destinations,
  DestinationRecord,
  DestinationStatus,
} from "./data";
import DestinationsFilters from "./components/DestinationsFilters";
import DestinationsGrid from "./components/DestinationsGrid";
import DestinationTestModal from "./components/DestinationTestModal";
import DestinationDeleteModal from "./components/DestinationDeleteModal";

export default function DestinationsPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DestinationStatus | "">("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] =
    useState<DestinationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DestinationRecord | null>(
    null
  );

  const testModal = useModal();
  const deleteModal = useModal();

  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      if (
        search &&
        !destination.name.toLowerCase().includes(search.toLowerCase().trim())
      ) {
        return false;
      }
      if (typeFilter && destination.type !== typeFilter) return false;
      if (statusFilter && destination.status !== statusFilter) return false;
      return true;
    });
  }, [search, typeFilter, statusFilter]);

  const openTestConnection = (destination: DestinationRecord) => {
    setSelectedDestination(destination);
    testModal.openModal();
  };

  const openDeleteConfirm = (destination: DestinationRecord) => {
    setDeleteTarget(destination);
    deleteModal.openModal();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      console.log("Delete destination", deleteTarget.id);
    }
    deleteModal.closeModal();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Destinations" />
      <div className="space-y-6">
        <ComponentCard
          title="Destinations"
          desc="Manage backup storage destinations."
        >
          <DestinationsFilters
            search={search}
            setSearch={setSearch}
            setTypeFilter={setTypeFilter}
            setStatusFilter={(value) => setStatusFilter(value as DestinationStatus)}
            onRefresh={() => console.log("Refresh destinations")}
            onAdd={() => console.log("Add destination")}
          />

          <DestinationsGrid
            destinations={destinations}
            filteredDestinations={filteredDestinations}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onAdd={() => console.log("Add destination")}
            onTestConnection={openTestConnection}
            onEdit={(destination) =>
              console.log("Edit destination", destination.id)
            }
            onDelete={openDeleteConfirm}
          />
        </ComponentCard>
      </div>

      <DestinationTestModal
        isOpen={testModal.isOpen}
        onClose={testModal.closeModal}
        destination={selectedDestination}
      />

      <DestinationDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleDelete}
        deleteTarget={deleteTarget}
      />
    </div>
  );
}
