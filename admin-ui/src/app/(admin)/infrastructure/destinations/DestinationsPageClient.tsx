"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { useModal } from "@/hooks/useModal";
import { Destination, StatusType } from "@/handlers/destinations/type";
import DestinationsFilters from "./components/DestinationsFilters";
import DestinationsGrid from "./components/DestinationsGrid";
import DestinationTestModal from "./components/DestinationTestModal";
import DestinationDeleteModal from "./components/DestinationDeleteModal";
import UpsertDestinationModal from "./components/UpsertDestinationModal";

export default function DestinationsPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "">("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [destinationItems, setDestinationItems] =
    useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(
    null
  );
  const [editTarget, setEditTarget] = useState<Destination | null>(null);

  const testModal = useModal();
  const deleteModal = useModal();
  const createModal = useModal();

  const filteredDestinations = useMemo(() => {
    return destinationItems.filter((destination) => {
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
  }, [search, typeFilter, statusFilter, destinationItems]);

  const openTestConnection = (destination: Destination) => {
    setSelectedDestination(destination);
    testModal.openModal();
  };

  const openEditDestination = (destination: Destination) => {
    setEditTarget(destination);
    createModal.openModal();
  };

  const openDeleteConfirm = (destination: Destination) => {
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
            setStatusFilter={(value) => setStatusFilter(value as StatusType)}
            onRefresh={() => console.log("Refresh destinations")}
            onAdd={() => {
              setEditTarget(null);
              createModal.openModal();
            }}
          />

          <DestinationsGrid
            destinations={destinationItems}
            filteredDestinations={filteredDestinations}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onAdd={() => {
              setEditTarget(null);
              createModal.openModal();
            }}
            onTestConnection={openTestConnection}
            onEdit={openEditDestination}
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

      <UpsertDestinationModal
        isOpen={createModal.isOpen}
        onClose={() => {
          setEditTarget(null);
          createModal.closeModal();
        }}
        destination={
          editTarget
            ? editTarget
            : null
        }
      />
    </div>
  );
}
