import React from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { SourceStatus, SourceType } from "@/components/sources/types";

type SourcesFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  setTypeFilter: (value: SourceType) => void;
  setStatusFilter: (value: SourceStatus) => void;
  onRefresh: () => void;
  onAdd: () => void;
};

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

export default function SourcesFilters({
  search,
  setSearch,
  setTypeFilter,
  setStatusFilter,
  onRefresh,
  onAdd,
}: SourcesFiltersProps) {
  return (
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
        <Button size="sm" variant="outline" type="button" onClick={onRefresh}>
          Refresh
        </Button>
        <Button size="sm" type="button" onClick={onAdd}>
          Add Source
        </Button>
      </div>
    </div>
  );
}
