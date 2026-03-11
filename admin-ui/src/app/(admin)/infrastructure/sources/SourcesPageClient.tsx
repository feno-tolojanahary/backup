"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import SourceCreateModal from "@/components/sources/SourceCreateModal";
import { useModal } from "@/hooks/useModal";
import { SourceRecord, SourceStatus, SourceType } from "@/components/sources/types";
import { sources } from "./data";
import SourcesFilters from "./components/SourcesFilters";
import SourcesContent from "./components/SourcesContent";

export default function SourcesPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SourceType | "">("");
  const [statusFilter, setStatusFilter] = useState<SourceStatus | "">("");
  const createModal = useModal();

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      if (
        search &&
        !source.name.toLowerCase().includes(search.toLowerCase().trim())
      ) {
        return false;
      }
      if (typeFilter && source.type !== typeFilter) return false;
      if (statusFilter && source.status !== statusFilter) return false;
      return true;
    });
  }, [search, typeFilter, statusFilter]);

  const handleAction = (action: string, source: SourceRecord) => {
    console.log(`${action} source`, source.id);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Sources" />
      <div className="space-y-6">
        <ComponentCard title="Sources" desc="Manage data sources used for backups.">
          <SourcesFilters
            search={search}
            setSearch={setSearch}
            setTypeFilter={(value) => setTypeFilter(value)}
            setStatusFilter={(value) => setStatusFilter(value)}
            onRefresh={() => console.log("Refresh sources")}
            onAdd={createModal.openModal}
          />

          <SourcesContent
            sources={sources}
            filteredSources={filteredSources}
            onCreate={createModal.openModal}
            onView={(source) => handleAction("View", source)}
            onEdit={(source) => handleAction("Edit", source)}
            onTest={(source) => handleAction("Test", source)}
            onDelete={(source) => handleAction("Delete", source)}
          />
        </ComponentCard>
      </div>

      <SourceCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
      />
    </div>
  );
}
