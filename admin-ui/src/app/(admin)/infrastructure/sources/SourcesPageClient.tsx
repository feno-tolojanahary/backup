"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SourceGrid from "@/components/sources/SourceGrid";
import SourceCreateModal from "@/components/sources/SourceCreateModal";
import { useModal } from "@/hooks/useModal";
import { SourceRecord, SourceStatus, SourceType } from "@/components/sources/types";
import { sources } from "./data";

const sourceTypeOptions = [
  { value: "mongodb", label: "MongoDB" },
  { value: "s3", label: "S3" },
  { value: "filesystem", label: "Filesystem" },
];

const statusOptions = [
  { value: "connected", label: "Connected" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Connection Failed" },
];

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Search
                </label>
                <Input
                  placeholder="Search source name..."
                  defaultValue={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Source type
                </label>
                <Select
                  options={sourceTypeOptions}
                  placeholder="All types"
                  onChange={(value) => setTypeFilter(value as SourceType)}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <Select
                  options={statusOptions}
                  placeholder="All status"
                  onChange={(value) => setStatusFilter(value as SourceStatus)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => console.log("Refresh sources")}
              >
                Refresh
              </Button>
              <Button size="sm" type="button" onClick={createModal.openModal}>
                Add Source
              </Button>
            </div>
          </div>

          {sources.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sources configured yet.
              </p>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                Sources define where backups are taken from, such as MongoDB
                databases, S3 buckets, or filesystem paths.
              </p>
              <Button size="sm" type="button" onClick={createModal.openModal}>
                Create Your First Source
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              {filteredSources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                  No sources match these filters.
                </div>
              ) : (
                <SourceGrid
                  sources={filteredSources}
                  onView={(source) => handleAction("View", source)}
                  onEdit={(source) => handleAction("Edit", source)}
                  onTest={(source) => handleAction("Test", source)}
                  onDelete={(source) => handleAction("Delete", source)}
                />
              )}
            </div>
          )}
        </ComponentCard>
      </div>

      <SourceCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
      />
    </div>
  );
}
