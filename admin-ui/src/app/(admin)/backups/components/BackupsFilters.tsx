import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

type JobOption = {
  value: string;
  label: string;
};

type BackupsFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  setJobFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  jobOptions: JobOption[];
  onRefresh: () => void;
  onResetPage: () => void;
};

export default function BackupsFilters({
  search,
  setSearch,
  setJobFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  jobOptions,
  onRefresh,
  onResetPage,
}: BackupsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Search
          </label>
          <Input
            placeholder="Search backup UID..."
            defaultValue={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onResetPage();
            }}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Job
          </label>
          <Select
            options={jobOptions}
            placeholder="All jobs"
            onChange={(value) => {
              setJobFilter(value);
              onResetPage();
            }}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Status
          </label>
          <Select
            options={[
              { value: "completed", label: "completed" },
              { value: "failed", label: "failed" },
              { value: "archived", label: "archived" },
            ]}
            placeholder="All status"
            onChange={(value) => {
              setStatusFilter(value);
              onResetPage();
            }}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Date from
          </label>
          <Input
            type="date"
            defaultValue={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              onResetPage();
            }}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Date to
          </label>
          <Input
            type="date"
            defaultValue={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              onResetPage();
            }}
          />
        </div>
      </div>
      <Button size="sm" type="button" onClick={onRefresh}>
        Refresh
      </Button>
    </div>
  );
}
