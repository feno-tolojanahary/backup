"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import SourceCreateModal from "@/components/sources/SourceCreateModal";
import SourceDetailModal from "@/components/sources/SourceDetailModal";
import { useModal } from "@/hooks/useModal";
import {
  SourceRecord,
  SourceStatus,
  SourceType,
} from "@/components/sources/types";
import { sources } from "./data";
import SourcesFilters from "./components/SourcesFilters";
import SourcesContent from "./components/SourcesContent";
import { SourceFormPayload } from "@/components/sources/SourceCreateModal";

export default function SourcesPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SourceType | "">("");
  const [statusFilter, setStatusFilter] = useState<SourceStatus | "">("");
  const [sourceItems, setSourceItems] = useState<SourceRecord[]>(sources);
  const [editTarget, setEditTarget] = useState<SourceRecord | null>(null);
  const [viewTarget, setViewTarget] = useState<SourceRecord | null>(null);
  const createModal = useModal();
  const detailModal = useModal();

  const filteredSources = useMemo(() => {
    return sourceItems.filter((source) => {
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
  }, [search, typeFilter, statusFilter, sourceItems]);

  const getSummaryValue = (source: SourceRecord, key: string) => {
    const line = source.configSummary.find((item) =>
      item.toLowerCase().startsWith(`${key.toLowerCase()}:`)
    );
    if (!line) return "";
    return line.split(":").slice(1).join(":").trim();
  };

  const buildConfigSummary = (payload: SourceFormPayload) => {
    if (payload.type === "mongodb") {
      return [
        `Database: ${payload.config.database || "-"}`,
        `Host: ${payload.config.host || "-"}`,
      ];
    }
    if (payload.type === "s3") {
      return [
        `Bucket: ${payload.config.bucket || "-"}`,
        `Prefix: ${payload.config.prefix || "/"}`,
      ];
    }
    return [`Path: ${payload.config.path || "-"}`];
  };

  const handleUpsert = (payload: SourceFormPayload) => {
    if (editTarget) {
      setSourceItems((prev) =>
        prev.map((item) =>
          item.id === editTarget.id
            ? {
                ...item,
                name: payload.name,
                type: payload.type,
                configSummary: buildConfigSummary(payload),
              }
            : item
        )
      );
      setEditTarget(null);
      createModal.closeModal();
      return;
    }

    const newId = Date.now();
    setSourceItems((prev) => [
      ...prev,
      {
        id: newId,
        name: payload.name,
        type: payload.type,
        status: "warning",
        configSummary: buildConfigSummary(payload),
        jobsCount: 0,
      },
    ]);
    createModal.closeModal();
  };

  const handleView = (source: SourceRecord) => {
    setViewTarget(source);
    detailModal.openModal();
  };

  const handleEdit = (source: SourceRecord) => {
    setEditTarget(source);
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
              setEditTarget(null);
              createModal.openModal();
            }}
          />

          <SourcesContent
            sources={sourceItems}
            filteredSources={filteredSources}
            onCreate={() => {
              setEditTarget(null);
              createModal.openModal();
            }}
            onView={handleView}
            onEdit={handleEdit}
            onTest={(source) => console.log("Test source", source.id)}
            onDelete={(source) => console.log("Delete source", source.id)}
          />
        </ComponentCard>
      </div>

      <SourceCreateModal
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
                type: editTarget.type,
                host: getSummaryValue(editTarget, "Host"),
                database: getSummaryValue(editTarget, "Database"),
                bucket: getSummaryValue(editTarget, "Bucket"),
                prefix: getSummaryValue(editTarget, "Prefix"),
                path: getSummaryValue(editTarget, "Path"),
              }
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
