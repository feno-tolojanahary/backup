"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";
import { useCreateSource, useTestConnection, useUpdateSource } from "@/handlers/sources/sourcesHooks";
import { CreateSourcePayload, MongodbConfig, S3Config, Source, SourceType } from "@/handlers/sources/type";
import { useToast } from "@/context/ToastContext";
import { ModalType } from "@/types/common";

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

type SourceUpsertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Source | null;
  modal: ModalType
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

const SourceUpsertModal: React.FC<SourceUpsertModalProps> = ({
  isOpen,
  onClose,
  modal,
  initialData,
}) => {

  const buildDefaults = (
    data?: SourceUpsertModalProps["initialData"]
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

  const [isConnected, setIsConnected] = useState(false)

  const sourceType = watch("type");

  const { createSource, isLoading: isLoadingSource } = useCreateSource();
  const { updateSource, isLoading: isLoadingUpdate } = useUpdateSource();
  const { testConnection, isLoading: isLoadingConnection} = useTestConnection();

  const { toastError, toastSuccess, toastWarning } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults(initialData));
  }, [isOpen, initialData, reset]);
  
  const getCreatePayload = (values: SourceFormValues): CreateSourcePayload => {
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
    return payload;
  };

  const testConfigConnection = async (values: SourceFormValues) => {
    const payload = getCreatePayload(values);
    try {
      const resConfig = await testConnection(payload.config);
      setIsConnected(Boolean(resConfig.connected));
      if (resConfig.connected) {
        toastSuccess("The source is connected.");
      } else {
        toastWarning("The source is not connected.")
      }
    } catch (error) {
      toastError();
    }
  }

  const upsertSource = async (values: SourceFormValues) => {
    const payload = getCreatePayload(values);
    if (initialData?.id) {
      try {
        const result = await updateSource(initialData.id, payload);
        if (result) {
          throw new Error("Error update ressource.")
        }
        toastSuccess("Source updated with success.");
        modal.closeModal();
      } catch (error: any) {
        console.log("Error update source: ", error.message);
        toastError();
      }
    } else {
     try {
        await createSource(payload);
        toastSuccess("The source was created successfully.")
        modal.closeModal();
      } catch (err: any) {
        console.log("Error create source: ", err.message);
        toastError();
      } 
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[620px] m-4">
      <form className="p-6 sm:p-8">
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

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button isLoading={isLoadingConnection} size="sm" variant="outline" type="button" onClick={handleSubmit(testConfigConnection)}>
            Test Connection
          </Button>
          { (isConnected || initialData?.status === "connected") &&
            <Button  size="sm" isLoading={isLoadingSource} type="button" onClick={handleSubmit(upsertSource)} >
              {initialData ? "Save Changes" : "Save Source"}
            </Button>
          }
        </div>
      </form>
    </Modal>
  );
};

export default SourceUpsertModal;
