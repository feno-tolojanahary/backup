import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";

type BackupsPaginationProps = {
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function BackupsPagination({
  itemsPerPage,
  setItemsPerPage,
  page,
  totalPages,
  onPrev,
  onNext,
}: BackupsPaginationProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Items per page
        </span>
        <div className="w-28">
          <Select
            options={[
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            placeholder={`${itemsPerPage}`}
            onChange={(value) => {
              setItemsPerPage(Number(value));
            }}
            defaultValue={`${itemsPerPage}`}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={onPrev}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={onNext}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
