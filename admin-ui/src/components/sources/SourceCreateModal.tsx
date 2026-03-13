"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";
import { useCreateSource } from "@/handlers/sources/sourcesHooks";
import { CreateSourcePayload, MongodbConfig, S3Config, Source, SourceType } from "@/handlers/sources/type";
import { useToast } from "@/context/ToastContext";

export type SourceFormPayload = {
  name: string;
  type: SourceType;
  config: {
    host?: string;
    database?: string;
    bucketName?: string;
    prefix?: string;
    path?: string;
  };
};

type SourceCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: SourceFormPayload) => void;
  initialData?: Source | null;
};

const sourceTypeOptions = [
  { value: "mongodb", label: "MongoDB" },
  { value: "s3", label: "S3 Bucket" }
];

type SourceFormValues = {
  name: string;
  type: SourceType;
  uri: string;
  database: string;
  bucketName: string;
  prefix: string;
  path: string;
  secretKey: string;
  accessKey: string;
};

const SourceCreateModal: React.FC<SourceCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {

  const buildDefaults = (
    data?: SourceCreateModalProps["initialData"]
  ): SourceFormValues => {
    const config = data?.config;
    const isMongo = data?.type === "mongodb";
    const isS3 = data?.type === "s3";

    return {
      name: data?.name || "",
      type: data?.type || "mongodb",
      uri: isMongo ? (config as MongodbConfig)?.uri || "" : "",
      database: isMongo ? (config as MongodbConfig)?.database || "" : "",
      bucketName: isS3 ? (config as S3Config)?.bucketName || "" : "",
      prefix: isS3 ? (config as S3Config)?.prefix || "" : "",
      secretKey: isS3 ? (config as S3Config)?.secretKey || "" : "",
      accessKey: isS3 ? (config as S3Config)?.accessKey || "" : "",
      path: "",
    };
  };

  const { control, register, handleSubmit, reset, watch } =
    useForm<SourceFormValues>({
      defaultValues: buildDefaults(initialData),
    });

  const sourceType = watch("type");

  const { createSource, isLoading, error } = useCreateSource();
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults(initialData));
  }, [isOpen, initialData, reset]);

  const onSubmitForm = async (values: SourceFormValues) => {
    const payload: CreateSourcePayload = {
      name: values.name.trim(),
      type: values.type,
      config: {},
    };

    if (values.type === "mongodb") {
      payload.config.host = values.uri.trim();
      payload.config.database = values.database.trim();
    }

    if (values.type === "s3") {
      payload.config.bucketName = values.bucketName.trim();
      payload.config.prefix = values.prefix.trim();
    }

    onSubmit?.(payload);
    try {
      await createSource(payload);
      addToast({
        variant: "success",
        title: "Source created",
        message: "The source was created successfully.",
      });
    } catch (err) {
      const message = "Failed to create source.";
      addToast({
        variant: "error",
        title: "Create failed",
        message,
      });
    }
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
                  {...register("uri")}
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
                <Input type="text" placeholder="backup-source" {...register("bucketName")} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Secret key
                </label>
                <Input placeholder="/" {...register("secretKey")} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Access key
                </label>
                <Input placeholder="/" {...register("accessKey")} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Prefix
                </label>
                <Input placeholder="/" {...register("prefix")} />
              </div>
            </>
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
