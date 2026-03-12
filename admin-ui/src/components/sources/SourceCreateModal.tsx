"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { SourceType } from "./types";
import { Controller, useForm } from "react-hook-form";

export type SourceFormPayload = {
  name: string;
  type: SourceType;
  config: {
    host?: string;
    database?: string;
    bucket?: string;
    prefix?: string;
    path?: string;
  };
};

type SourceCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: SourceFormPayload) => void;
  initialData?: {
    name: string;
    type: SourceType;
    host?: string;
    database?: string;
    bucket?: string;
    prefix?: string;
    path?: string;
  } | null;
};

const sourceTypeOptions = [
  { value: "mongodb", label: "MongoDB" },
  { value: "s3", label: "S3 Bucket" },
  { value: "filesystem", label: "Filesystem" },
];

type SourceFormValues = {
  name: string;
  type: SourceType;
  connectionUri: string;
  database: string;
  bucket: string;
  prefix: string;
  path: string;
};

const SourceCreateModal: React.FC<SourceCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const buildDefaults = (
    data?: SourceCreateModalProps["initialData"]
  ): SourceFormValues => ({
    name: data?.name || "",
    type: data?.type || "mongodb",
    connectionUri: data?.host ||  "",
    database: data?.database || "",
    bucket: data?.bucket || "",
    prefix: data?.prefix || "",
    path: data?.path || "",
  });

  const { control, register, handleSubmit, reset, watch } =
    useForm<SourceFormValues>({
      defaultValues: buildDefaults(initialData),
    });

  const sourceType = watch("type");

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults(initialData));
  }, [isOpen, initialData, reset]);

  const onSubmitForm = (values: SourceFormValues) => {
    const payload: SourceFormPayload = {
      name: values.name.trim(),
      type: values.type,
      config: {},
    };

    if (values.type === "mongodb") {
      payload.config.host = values.connectionUri.trim();
      payload.config.database = values.database.trim();
    }

    if (values.type === "s3") {
      payload.config.bucket = values.bucket.trim();
      payload.config.prefix = values.prefix.trim();
    }

    if (values.type === "filesystem") {
      payload.config.path = values.path.trim();
    }

    onSubmit?.(payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[620px] m-4">
      <form className="p-6 sm:p-8" onSubmit={handleSubmit(onSubmitForm)}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {initialData ? "Edit Source" : "Add Source"}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select a source type and provide connection details.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Source type
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  options={sourceTypeOptions}
                  placeholder="Choose a source type"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Name
            </label>
            <Input placeholder="source-name" {...register("name")} />
          </div>

          {sourceType === "mongodb" && (
            <>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Connection URI
                </label>
                <Input
                  placeholder="mongodb://user:pass@localhost:27017"
                  {...register("connectionUri")}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Database
                </label>
                <Input placeholder="local" {...register("database")} />
              </div>
            </>
          )}

          {sourceType === "s3" && (
            <>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Bucket name
                </label>
                <Input placeholder="backup-source" {...register("bucket")} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Prefix
                </label>
                <Input placeholder="/" {...register("prefix")} />
              </div>
            </>
          )}

          {sourceType === "filesystem" && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Path
              </label>
              <Input placeholder="/var/lib/data" {...register("path")} />
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button size="sm" variant="outline" type="button">
            Test Connection
          </Button>
          <Button size="sm" type="submit">
            {initialData ? "Save Changes" : "Save Source"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SourceCreateModal;


