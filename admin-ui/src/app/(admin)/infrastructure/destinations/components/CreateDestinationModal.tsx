"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";

type DestinationType = "local" | "s3" | "sftp";

export type DestinationFormPayload = {
  name: string;
  configName: string;
  type: DestinationType;
  config: Record<string, string | number>;
};

type CreateDestinationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: DestinationFormPayload) => void;
  initialData?: {
    name: string;
    configName: string;
    type: DestinationType;
    endpoint?: string;
    bucket?: string;
    folder?: string;
    host?: string;
    port?: number;
    username?: string;
  } | null;
};

type FormValues = {
  name: string;
  configName: string;
  type: DestinationType;
  localPath: string;
  s3Endpoint: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
  sftpHost: string;
  sftpPort: string;
  sftpUsername: string;
  sftpFolder: string;
  sftpAuthMethod: "password" | "key";
  sftpPassword: string;
  sftpPrivateKey: string;
};

const typeOptions = [
  { value: "local", label: "local" },
  { value: "s3", label: "s3" },
  { value: "sftp", label: "sftp (ssh remote)" },
];

const authMethodOptions = [
  { value: "password", label: "password" },
  { value: "key", label: "key" },
];

const buildDefaults = (
  data?: CreateDestinationModalProps["initialData"]
): FormValues => ({
  name: data?.name ?? "",
  configName: data?.configName ?? "",
  type: data?.type ?? "local",
  localPath: data?.folder ?? "",
  s3Endpoint: data?.endpoint ?? "",
  s3Bucket: data?.bucket ?? "",
  s3Region: "",
  s3AccessKey: "",
  s3SecretKey: "",
  sftpHost: data?.host ?? "",
  sftpPort: data?.port ? String(data.port) : "22",
  sftpUsername: data?.username ?? "",
  sftpFolder: data?.folder ?? "",
  sftpAuthMethod: "password",
  sftpPassword: "",
  sftpPrivateKey: "",
});

const CreateDestinationModal: React.FC<CreateDestinationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(initialData),
    shouldUnregister: true,
  });

  const destinationType = watch("type");
  const authMethod = watch("sftpAuthMethod");

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults(initialData));
  }, [initialData, isOpen, reset]);

  const onSubmitForm = (values: FormValues) => {
    let config: DestinationFormPayload["config"] = {};

    if (values.type === "local") {
      config = { path: values.localPath.trim() };
    }

    if (values.type === "s3") {
      config = {
        endpoint: values.s3Endpoint.trim(),
        bucket: values.s3Bucket.trim(),
        region: values.s3Region.trim(),
        accessKey: values.s3AccessKey.trim(),
        secretKey: values.s3SecretKey.trim(),
      };
    }

    if (values.type === "sftp") {
      config = {
        host: values.sftpHost.trim(),
        port: Number(values.sftpPort) || 22,
        username: values.sftpUsername.trim(),
        folder: values.sftpFolder.trim(),
        authMethod: values.sftpAuthMethod,
        password:
          values.sftpAuthMethod === "password"
            ? values.sftpPassword
            : undefined,
        privateKey:
          values.sftpAuthMethod === "key" ? values.sftpPrivateKey : undefined,
      };
    }

    const payload: DestinationFormPayload = {
      name: values.name.trim(),
      configName: values.configName.trim(),
      type: values.type,
      config,
    };

    onSubmit?.(payload);
    console.log("Create destination payload", payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] m-4">
      <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {initialData ? "Edit Destination" : "Create Destination"}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Configure the storage backend and connection details for backups.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Destination Information
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Destination name<span className="text-error-500"> *</span>
                </label>
                <Input
                  placeholder="prod-backups"
                  {...register("name", {
                    required: "Destination name is required.",
                  })}
                  error={Boolean(errors.name)}
                  hint={errors.name?.message}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Config name<span className="text-error-500"> *</span>
                </label>
                <Input
                  placeholder="s3-prod"
                  {...register("configName", {
                    required: "Config name is required.",
                  })}
                  error={Boolean(errors.configName)}
                  hint={errors.configName?.message}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Destination type<span className="text-error-500"> *</span>
                </label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Destination type is required." }}
                  render={({ field }) => (
                    <Select
                      options={typeOptions}
                      placeholder="Select type"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
                {errors.type && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.type.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {destinationType === "local" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Local Storage
              </h4>
              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Local path
                </label>
                <Input
                  placeholder="/mnt/backups"
                  {...register("localPath", {
                    required: "Local path is required.",
                  })}
                  error={Boolean(errors.localPath)}
                  hint={errors.localPath?.message}
                />
              </div>
            </div>
          )}

          {destinationType === "s3" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                S3 Storage
              </h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Endpoint
                  </label>
                  <Input
                    placeholder="s3.amazonaws.com"
                    {...register("s3Endpoint", {
                      required: "Endpoint is required.",
                    })}
                    error={Boolean(errors.s3Endpoint)}
                    hint={errors.s3Endpoint?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Bucket
                  </label>
                  <Input
                    placeholder="backup-bucket"
                    {...register("s3Bucket", {
                      required: "Bucket is required.",
                    })}
                    error={Boolean(errors.s3Bucket)}
                    hint={errors.s3Bucket?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Region
                  </label>
                  <Input placeholder="us-east-1" {...register("s3Region")} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Access key
                  </label>
                  <Input
                    placeholder="ACCESS_KEY"
                    {...register("s3AccessKey", {
                      required: "Access key is required.",
                    })}
                    error={Boolean(errors.s3AccessKey)}
                    hint={errors.s3AccessKey?.message}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Secret key
                  </label>
                  <Input
                    type="password"
                    placeholder="SECRET_KEY"
                    {...register("s3SecretKey", {
                      required: "Secret key is required.",
                    })}
                    error={Boolean(errors.s3SecretKey)}
                    hint={errors.s3SecretKey?.message}
                  />
                </div>
              </div>
            </div>
          )}

          {destinationType === "sftp" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                SSH Remote Storage
              </h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Host
                  </label>
                  <Input
                    placeholder="sftp.example.com"
                    {...register("sftpHost", {
                      required: "Host is required.",
                    })}
                    error={Boolean(errors.sftpHost)}
                    hint={errors.sftpHost?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Port
                  </label>
                  <Input
                    type="number"
                    placeholder="22"
                    {...register("sftpPort")}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Username
                  </label>
                  <Input
                    placeholder="backup"
                    {...register("sftpUsername", {
                      required: "Username is required.",
                    })}
                    error={Boolean(errors.sftpUsername)}
                    hint={errors.sftpUsername?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Remote folder
                  </label>
                  <Input
                    placeholder="/data/backups"
                    {...register("sftpFolder", {
                      required: "Remote folder is required.",
                    })}
                    error={Boolean(errors.sftpFolder)}
                    hint={errors.sftpFolder?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Authentication method
                  </label>
                  <Controller
                    name="sftpAuthMethod"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={authMethodOptions}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    )}
                  />
                </div>
                {authMethod === "password" ? (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Password"
                      {...register("sftpPassword", {
                        required: "Password is required.",
                      })}
                      error={Boolean(errors.sftpPassword)}
                      hint={errors.sftpPassword?.message}
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Private key
                    </label>
                    <Input
                      placeholder="/path/to/key.pem"
                      {...register("sftpPrivateKey", {
                        required: "Private key is required.",
                      })}
                      error={Boolean(errors.sftpPrivateKey)}
                      hint={errors.sftpPrivateKey?.message}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit">
            {initialData ? "Save Changes" : "Create Destination"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDestinationModal;
