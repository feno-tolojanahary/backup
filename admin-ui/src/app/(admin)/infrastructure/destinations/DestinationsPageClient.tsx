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
import CreateDestinationModal, {
  DestinationFormPayload,
} from "./components/CreateDestinationModal";

export default function DestinationsPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DestinationStatus | "">("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [destinationItems, setDestinationItems] =
    useState<DestinationRecord[]>(destinations);
  const [selectedDestination, setSelectedDestination] =
    useState<DestinationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DestinationRecord | null>(
    null
  );
  const [editTarget, setEditTarget] = useState<DestinationRecord | null>(null);

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

  const openTestConnection = (destination: DestinationRecord) => {
    setSelectedDestination(destination);
    testModal.openModal();
  };

  const openEditDestination = (destination: DestinationRecord) => {
    setEditTarget(destination);
    createModal.openModal();
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

  const handleUpsert = (payload: DestinationFormPayload) => {
    if (editTarget) {
      setDestinationItems((prev) =>
        prev.map((item) =>
          item.id === editTarget.id
            ? {
                ...item,
                name: payload.name,
                configName: payload.configName,
                type: payload.type,
                endpoint:
                  payload.type === "s3"
                    ? String(payload.config.endpoint ?? "")
                    : undefined,
                bucket:
                  payload.type === "s3"
                    ? String(payload.config.bucket ?? "")
                    : undefined,
                folder:
                  payload.type === "local"
                    ? String(payload.config.path ?? "")
                    : payload.type === "sftp"
                    ? String(payload.config.folder ?? "")
                    : undefined,
                host:
                  payload.type === "sftp"
                    ? String(payload.config.host ?? "")
                    : undefined,
                port:
                  payload.type === "sftp" && payload.config.port
                    ? Number(payload.config.port)
                    : undefined,
                username:
                  payload.type === "sftp"
                    ? String(payload.config.username ?? "")
                    : undefined,
              }
            : item
        )
      );
    } else {
      const newId = `${Date.now()}`;
      setDestinationItems((prev) => [
        ...prev,
        {
          id: newId,
          name: payload.name,
          type: payload.type,
          status: "unknown",
          configName: payload.configName,
          totalBackups: 0,
          totalFiles: 0,
          totalUsed: "0 GB",
          totalCapacity: undefined,
          endpoint:
            payload.type === "s3"
              ? String(payload.config.endpoint ?? "")
              : undefined,
          bucket:
            payload.type === "s3"
              ? String(payload.config.bucket ?? "")
              : undefined,
          folder:
            payload.type === "local"
              ? String(payload.config.path ?? "")
              : payload.type === "sftp"
              ? String(payload.config.folder ?? "")
              : undefined,
          host:
            payload.type === "sftp"
              ? String(payload.config.host ?? "")
              : undefined,
          port:
            payload.type === "sftp" && payload.config.port
              ? Number(payload.config.port)
              : undefined,
          username:
            payload.type === "sftp"
              ? String(payload.config.username ?? "")
              : undefined,
          lastTestStatus: "unknown",
          lastCheckAt: new Date().toISOString(),
        },
      ]);
    }
    setEditTarget(null);
    createModal.closeModal();
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

      <CreateDestinationModal
        isOpen={createModal.isOpen}
        onClose={() => {
          setEditTarget(null);
          createModal.closeModal();
        }}
        onSubmit={handleUpsert}
        initialData={
          editTarget
            ? {
                name: editTarget.name,
                configName: editTarget.configName,
                type: editTarget.type,
                endpoint: editTarget.endpoint,
                bucket: editTarget.bucket,
                folder: editTarget.folder,
                host: editTarget.host,
                port: editTarget.port,
                username: editTarget.username,
              }
            : null
        }
      />
    </div>
  );
}
