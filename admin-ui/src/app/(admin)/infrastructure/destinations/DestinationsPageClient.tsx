"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { useModal } from "@/hooks/useModal";
import { Destination, StatusType } from "@/handlers/destinations/type";
import DestinationsFilters from "./components/DestinationsFilters";
import DestinationsGrid from "./components/DestinationsGrid";
import DestinationDeleteModal from "./components/DestinationDeleteModal";
import UpsertDestinationModal from "./components/UpsertDestinationModal";
import { useListDestinations } from "@/handlers/destinations/destinationHooks";

export default function DestinationsPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "">("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(
    null
  );
  const [editTarget, setEditTarget] = useState<Destination | null>(null);

  const deleteModal = useModal();
  const createModal = useModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handledCreateParam = useRef(false);

  const { data: destinations } = useListDestinations();
  const destinationItems = destinations ?? [];

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

  useEffect(() => {
    if (handledCreateParam.current) return;
    const createParam = searchParams.get("create");
    if (createParam === "1" || createParam === "true") {
      handledCreateParam.current = true;
      setEditTarget(null);
      createModal.openModal();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("create");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }
  }, [searchParams, createModal, pathname, router]);


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
            onEdit={openEditDestination}
            onDelete={openDeleteConfirm}
          />
        </ComponentCard>
      </div>

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
