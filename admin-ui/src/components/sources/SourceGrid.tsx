import React from "react";
import SourceCard from "./SourceCard";
import { SourceRecord } from "./types";

type SourceGridProps = {
  sources: SourceRecord[];
  onView?: (source: SourceRecord) => void;
  onEdit?: (source: SourceRecord) => void;
  onTest?: (source: SourceRecord) => void;
  onDelete?: (source: SourceRecord) => void;
};

const SourceGrid: React.FC<SourceGridProps> = ({
  sources,
  onView,
  onEdit,
  onTest,
  onDelete,
}) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {sources.map((source) => (
        <SourceCard
          key={source.id}
          {...source}
          onView={onView}
          onEdit={onEdit}
          onTest={onTest}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default SourceGrid;
