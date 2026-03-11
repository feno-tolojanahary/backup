import React from "react";
import Button from "@/components/ui/button/Button";

export default function DestinationsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No destinations configured yet.
      </p>
      <Button size="sm" type="button" onClick={onAdd}>
        Add Destination
      </Button>
    </div>
  );
}
