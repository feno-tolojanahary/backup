import React from "react";
import SourceGrid from "@/components/sources/SourceGrid";
import { SourceRecord } from "@/components/sources/types";
import SourcesEmptyState from "./SourcesEmptyState";

type SourcesContentProps = {
  sources: SourceRecord[];
  filteredSources: SourceRecord[];
  onCreate: () => void;
  onView: (source: SourceRecord) => void;
  onEdit: (source: SourceRecord) => void;
  onTest: (source: SourceRecord) => void;
  onDelete: (source: SourceRecord) => void;
};

export default function SourcesContent({
  sources,
  filteredSources,
  onCreate,
  onView,
  onEdit,
  onTest,
  onDelete,
}: SourcesContentProps) {
  if (sources.length === 0) {
    return <SourcesEmptyState onCreate={onCreate} />;
  }

  return (
    <div className="mt-6">
      {filteredSources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          No sources match these filters.
        </div>
      ) : (
        <SourceGrid
          sources={filteredSources}
          onView={onView}
          onEdit={onEdit}
          onTest={onTest}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
