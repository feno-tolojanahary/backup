"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import SourceUpsertModal from "@/app/(admin)/infrastructure/sources/components/modals/SourceUpsertModal";
import SourceDeleteModal from "@/app/(admin)/infrastructure/sources/components/modals/SourceDeleteModal";
import { useModal } from "@/hooks/useModal";
import {
  Source,
  SourceType,
  StatusType
} from "@/handlers/sources/type";
import SourcesFilters from "./components/SourcesFilters";
import SourceCard from "./components/tables/SourceCard";
import SourceDetailModal from "./components/SourceDetailModal";
import { useSources, useTestConnection, useUpdateSource } from "@/handlers/sources/sourcesHooks";
import LoadingDots from "@/components/common/LoadingDots";
import { useToast } from "@/context/ToastContext";

export default function SourcesPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SourceType | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "">("");
  const [viewTarget, setViewTarget] = useState<Source | null>(null);
  const [editSource, setEditSource] = useState<Source | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const createModal = useModal();
  const detailModal = useModal();
  const deleteModal = useModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handledCreateParam = useRef(false);

  const { sources, isLoading } = useSources();
  const { testConnection } = useTestConnection();
  const { updateSource } = useUpdateSource();
  const { toastSuccess, toastWarning, toastError } = useToast();

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

  const handleDelete = (source: Source) => {
    setDeleteTarget(source);
    deleteModal.openModal();
  };

  const handleTest = async (source: Source) => {
    if (testingId) return;
    setTestingId(source.id);
    try {
      const resConfig = await testConnection(source.config);
      const connected = Boolean(resConfig?.connected);
      const nextStatus: StatusType = connected ? "connected" : "disconnected";
      if (source.status !== nextStatus) {
        await updateSource(source.id, {
          name: source.name,
          type: source.type,
          config: source.config,
          status: nextStatus,
        });
      }
      if (connected) {
        toastSuccess("The source is connected.");
      } else {
        toastWarning("The source is not connected.");
      }
    } catch (error) {
      toastError();
    } finally {
      setTestingId(null);
    }
  };

  useEffect(() => {
    if (handledCreateParam.current) return;
    const createParam = searchParams.get("create");
    if (createParam === "1" || createParam === "true") {
      handledCreateParam.current = true;
      setEditSource(null);
      createModal.openModal();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("create");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }
  }, [searchParams, createModal, pathname, router]);

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
                        isTesting={testingId === source.id}
                        onView={handleView}
                        onEdit={handleEdit}
                        onTest={handleTest}
                        onDelete={handleDelete}
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

      <SourceDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setDeleteTarget(null);
          deleteModal.closeModal();
        }}
        deleteTarget={deleteTarget}
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
