import React from "react";
import Button from "@/components/ui/button/Button";

type FieldLabelProps = {
  label: string;
  description?: string;
};

export const FieldLabel = ({ label, description }: FieldLabelProps) => (
  <div className="space-y-1">
    <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
      {label}
    </p>
    {description ? (
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    ) : null}
  </div>
);

type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export const SectionCard = ({
  title,
  description,
  children,
}: SectionCardProps) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
    </div>
    <div className="space-y-6 p-6">{children}</div>
  </div>
);

export const TabActions = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm" type="button">
      Save Changes
    </Button>
    <Button size="sm" variant="outline" type="button">
      Cancel
    </Button>
  </div>
);
