import React from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

type DestinationsFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  setTypeFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
};

export default function DestinationsFilters({
  search,
  setSearch,
  setTypeFilter,
  setStatusFilter,
  onRefresh,
  onAdd,
}: DestinationsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Search
          </label>
          <Input
            placeholder="Search destination name..."
            defaultValue={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Destination type
          </label>
          <Select
            options={[
              { value: "local-storage", label: "local" },
              { value: "s3", label: "s3" },
              { value: "ssh", label: "sftp" },
            ]}
            placeholder="All types"
            onChange={(value) => setTypeFilter(value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Status
          </label>
          <Select
            options={[
              { value: "connected", label: "connected" },
              { value: "failed", label: "failed" },
              { value: "unknown", label: "unknown" },
            ]}
            placeholder="All status"
            onChange={(value) => setStatusFilter(value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" type="button" onClick={onRefresh}>
          Refresh
        </Button>
        <Button size="sm" type="button" onClick={onAdd}>
          Add Destination
        </Button>
      </div>
    </div>
  );
}
