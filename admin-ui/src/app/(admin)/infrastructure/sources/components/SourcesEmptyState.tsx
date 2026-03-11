import React from "react";
import Button from "@/components/ui/button/Button";

export default function SourcesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No sources configured yet.
      </p>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
        Sources define where backups are taken from, such as MongoDB databases, S3
        buckets, or filesystem paths.
      </p>
      <Button size="sm" type="button" onClick={onCreate}>
        Create Your First Source
      </Button>
    </div>
  );
}
