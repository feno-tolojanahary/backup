"use client";

import { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import SourceUpsertModal from "@/app/(admin)/infrastructure/sources/components/modals/SourceUpsertModal";
import { useModal } from "@/hooks/useModal";
import {
  Source,
  SourceType,
  StatusType
} from "@/handlers/sources/type";
import SourcesFilters from "./components/SourcesFilters";
import SourceCard from "./components/tables/SourceCard";
import SourceDetailModal from "./components/SourceDetailModal";
import { useSources } from "@/handlers/sources/sourcesHooks";
import LoadingDots from "@/components/common/LoadingDots";

export default function SourcesPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SourceType | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "">("");
  const [viewTarget, setViewTarget] = useState<Source | null>(null);
  const [editSource, setEditSource] = useState<Source | null>(null);
  const createModal = useModal();
  const detailModal = useModal();

  const { sources, isLoading } = useSources()

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
  }, [search, typeFilter, statusFilter, sources]);

  const handleView = (source: Source) => {
    setViewTarget(source);
    detailModal.openModal();
  };

  const handleEdit = (source: Source) => {
    setEditSource(source);
    createModal.openModal();
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
            onAdd={() => {
              setEditSource(null);
              createModal.openModal();
            }}
          />
          <div className="mt-6">
            { isLoading ?
              <LoadingDots />
              :
              <>
                {filteredSources.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                    No sources match these filters.
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredSources.map((source) => (
                      <SourceCard
                        key={source.id}
                        source={source}
                        onView={handleView}
                        onEdit={handleEdit}
                        onTest={(source) => console.log("Test source", source.id)}
                        onDelete={(source) => console.log("Delete source", source.id)}
                      />
                    ))}
                </div>
                )}
              </>
            }
          </div>
        </ComponentCard>
      </div>

      <SourceUpsertModal
        isOpen={createModal.isOpen}
        onClose={() => {
          setEditSource(null);
          createModal.closeModal();
        }}
        modal={createModal}
        initialData={
          editSource
            ? editSource
            : null
        }
      />

      <SourceDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => {
          setViewTarget(null);
          detailModal.closeModal();
        }}
        source={viewTarget}
      />
    </div>
  );
}
