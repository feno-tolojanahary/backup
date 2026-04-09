"use client";

import React, { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";
import { Destination, DestinationType, S3Config, AuthMethodType, HostConfig, LocalStorageConfig, CreateDestinationPayload, UpdateDestinationPayload } from "@/handlers/destinations/type";
import { testConnection, useCreateDestination, useListDestinations, useUpdateDestination } from "@/handlers/destinations/destinationHooks";
import { useToast } from "@/context/ToastContext";

export type DestinationFormPayload = {
  name: string;
  configName: string;
  type: DestinationType;
  config: Record<string, string | number>;
};

type UpsertDestinationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  destination?: Destination | null;
};

type FormValues = {
  name: string;
  type: DestinationType;
  enabled: boolean;
  notes: string;
  destinationFolder: string;
  endpoint: string;
  bucketName: string;
  region: string;
  accessKey: string;
  secretKey: string;
  useSSL: boolean;
  passphrase: string,
  maxDiskUsage: string,
  prefix: string;
  host: string;
  port: string;
  username: string;
  authMethod: AuthMethodType;
  sftpAuthMode: "private_key" | "password";
  password: string;
  privateKey: string;
};

const typeOptions = [
  { value: "local-storage", label: "local" },
  { value: "s3", label: "s3" },
  { value: "ssh", label: "sftp" },
];

const authMethodOptions = [
  { value: "private_key", label: "Upload Private Key (advanced)" },
  { value: "password", label: "Password (not recommended)" },
];

const buildDefaults = (
  data?: Destination | null
): FormValues => {
  const formValue = {
    name: data?.name ?? "",
    type: (data?.type ?? "ssh") as DestinationType,
    enabled: true,
    notes: "",
    
    destinationFolder: "",
    endpoint: "",
    bucketName: "",
    region: "",
    accessKey: "",
    secretKey: "",
    useSSL: true,
    host: "",
    port: "22",
    username: "",
    authMethod: "password" as AuthMethodType,
    sftpAuthMode: "private_key" as const,
    password: "",
    privateKey: "",
    maxDiskUsage: "",
    passphrase: "",
    prefix: ""
  }
  if (data?.type === "s3") {
    const s3Config = (data?.config || {}) as S3Config;
    return { ...formValue, ...s3Config }
  } else if (data?.type === "ssh") {
    const hostConf = (data?.config || {}) as HostConfig;
    return {
      ...formValue,
      ...hostConf,
      sftpAuthMode:
        hostConf.authMethod === "password"
          ? "password"
          : "private_key",
    };
  } else if (data?.type === "local-storage") {
    const localConf = (data?.config || {}) as LocalStorageConfig;
    return { ...formValue, ...localConf };
  } else {
    return formValue;
  }
}

const UpsertDestinationModal: React.FC<UpsertDestinationModalProps> = ({
  isOpen,
  onClose,
  destination,
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(destination),
    shouldUnregister: true,
    mode: "onChange",
  }); 

  const destinationType = watch("type");
  const sftpAuthMode = watch("sftpAuthMode");
  const [host, port, username, destinationFolder, password, privateKey] = watch([
    "host",
    "port",
    "username",
    "destinationFolder",
    "password",
    "privateKey",
  ]);

  const [testStatus, setTestStatus] = useState<{
    state: "idle" | "testing" | "success" | "error";
    message?: string;
  }>({ state: "idle" });

  const { create: createDestination } = useCreateDestination();
  const { update: updateDestination } = useUpdateDestination();
  const { data: destinations } = useListDestinations();

  const { toastError, toastSuccess } = useToast()

  useEffect(() => {
    if (!isOpen) return;
    const defaults = buildDefaults(destination);
    reset(defaults);
    setTestStatus({ state: "idle" });
  }, [destination, isOpen, reset]);

  useEffect(() => {
    if (destinationType !== "ssh") return;
    setTestStatus({ state: "idle" });
  }, [destinationType, setValue]);

  useEffect(() => {
    if (destinationType !== "ssh") return;
    if (sftpAuthMode === "private_key") {
      setValue("password", "");
      setValue("authMethod", "key" as AuthMethodType);
    } else {
      setValue("privateKey", "");
      setValue("passphrase", "");
      setValue("authMethod", "password" as AuthMethodType);
    }
    setTestStatus({ state: "idle" });
  }, [destinationType, sftpAuthMode, setValue]);

  const getDestinationData = useCallback((values: FormValues) => {
    let destination: CreateDestinationPayload | UpdateDestinationPayload = {
      name: values.name.trim(),
      type: values.type as DestinationType,
      status: testStatus?.state === "success" ? "connected" : "disconnected"
    }
    if (values.type === "local-storage") {
      destination = {
        ...destination,
        config: {
          destinationFolder: values.destinationFolder,
          maxDiskUsage: values.maxDiskUsage,
        }
      }
    } else if (values.type === "s3") {
      const { accessKey, secretKey, endpoint, bucketName, region, prefix } = values;
      destination = {
        ...destination,
        config: {
          accessKey,
          secretKey,
          endpoint,
          bucketName,
          region,
          prefix
        }
      }
    } else if (values.type === "ssh") {
      const { host, port, username, password, authMethod, privateKey, passphrase, destinationFolder, maxDiskUsage, sftpAuthMode } = values; 
      destination = {
        ...destination,
        config: {
          host,
          port,
          username,
          password: sftpAuthMode === "password" ? password : "",
          authMethod: sftpAuthMode === "password" ? ("password" as AuthMethodType) : authMethod,
          privateKey: sftpAuthMode === "private_key" ? privateKey : "",
          passphrase: sftpAuthMode === "private_key" ? passphrase : "",
          destinationFolder,
          maxDiskUsage,
          keyMode: sftpAuthMode,
        }
      }
    } else {
      const { destinationFolder, maxDiskUsage } = values;
      destination = {
        ...destination,
        config: { destinationFolder, maxDiskUsage }
      }
    }
    return destination;
  }, [testStatus])

  const buildNameValidator = (destinations?: Destination[], currentId?: number) => (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Destination name is required.";
    if (!destinations) return true;
    const normalized = trimmed.toLowerCase();
    const conflict = destinations.find((dest) => {
      if (currentId && dest.id === currentId) return false;
      return dest.name.trim().toLowerCase() === normalized;
    });
    return conflict ? "A destination with this name already exists." : true;
  };

  const isSftpConnectionReady = (() => {
    if (destinationType !== "ssh") return false;
    if (!host || !username || !destinationFolder || !port) return false;
    if (sftpAuthMode === "password") return Boolean(password);
    if (sftpAuthMode === "private_key") return Boolean(privateKey);
    return false;
  })();

  const handleTestConnection = async () => {
    if (!isSftpConnectionReady) return;
    setTestStatus({ state: "testing" });
    try {
      const values = watch();
      const config: HostConfig = {
        host: values.host,
        port: values.port,
        username: values.username,
        destinationFolder: values.destinationFolder,
        maxDiskUsage: values.maxDiskUsage,
        authMethod: values.authMethod,
      };

      if (sftpAuthMode === "private_key") {
        config.privateKey = values.privateKey;
        config.passphrase = values.passphrase;
      } else if (sftpAuthMode === "password") {
        config.password = values.password;
      }

      const result = await testConnection({
        id: destination?.id ?? 0,
        name: values.name,
        type: "ssh",
        config,
        errorMsg: "",
      });

      if (result?.status === "connected") {
        setTestStatus({ state: "success", message: "Connection successful." });
      } else {
        setTestStatus({
          state: "error",
          message: result?.errorMsg || "Connection failed.",
        });
      }
    } catch (error: any) {
      setTestStatus({
        state: "error",
        message: error?.message || "Connection failed.",
      });
    }
  };

  const onSubmitForm = async (values: FormValues) => {
    const destData = getDestinationData(values);
    if (destination?.id) {
      try {
        await updateDestination(destination.id, destData as UpdateDestinationPayload);
        toastSuccess("Update destination with success.");
        onClose();
      } catch(error: any) {
        console.log("Error dest update: ", error.message);
        toastError();
      }     
    } else {
      try {
        await createDestination(destData as CreateDestinationPayload);
        toastSuccess("Destination created with success.");
        onClose();
      } catch(error: any) {
        console.log("Error create dest: ", error.message);
        toastError();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] m-4">
      <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {destination?.id ? "Edit Destination" : "Create Destination"}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Configure a storage destination for backup data.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Destination Information
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Destination name<span className="text-error-500"> *</span>
                </label>
                <Input
                  placeholder="Primary SFTP Storage"
                  {...register("name", {
                    required: "Destination name is required.",
                    validate: buildNameValidator(destinations, destination?.id),
                  })}
                  error={Boolean(errors.name)}
                  hint={errors.name?.message}
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
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <Controller
                  name="enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      label={field.value ? "Enabled" : "Disabled"}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {destinationType === "local-storage" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Local Configuration
              </h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Local Path
                  </label>
                  <Input
                    placeholder="/var/backups"
                    {...register("destinationFolder", {
                      required: "Local path is required.",
                    })}
                    error={Boolean(errors.destinationFolder)}
                    hint={errors.destinationFolder?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Notes
                  </label>
                  <Input placeholder="Optional" {...register("notes")} />
                </div>
              </div>
            </div>
          )}

          {destinationType === "s3" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                S3 Configuration
              </h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Endpoint
                  </label>
                  <Input
                    placeholder="s3.amazonaws.com"
                    {...register("endpoint", {
                      required: "Endpoint is required.",
                    })}
                    error={Boolean(errors.endpoint)}
                    hint={errors.endpoint?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Bucket
                  </label>
                  <Input
                    placeholder="backup-bucket"
                    {...register("bucketName", {
                      required: "Bucket is required.",
                    })}
                    error={Boolean(errors.bucketName)}
                    hint={errors.bucketName?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Region
                  </label>
                  <Input placeholder="us-east-1" {...register("region")} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Use SSL
                  </label>
                  <Controller
                    name="useSSL"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        label={field.value ? "Enabled" : "Disabled"}
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Access key
                  </label>
                  <Input
                    placeholder="ACCESS_KEY"
                    {...register("accessKey", {
                      required: "Access key is required.",
                    })}
                    error={Boolean(errors.accessKey)}
                    hint={errors.accessKey?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Secret key
                  </label>
                  <Input
                    type="password"
                    placeholder="SECRET_KEY"
                    {...register("secretKey", {
                      required: "Secret key is required.",
                    })}
                    error={Boolean(errors.secretKey)}
                    hint={errors.secretKey?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Path Prefix
                  </label>
                  <Input placeholder="/" {...register("prefix")} />
                </div>
              </div>
            </div>
          )}

          {destinationType === "ssh" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                SFTP Configuration
              </h4>
              <div className="mt-4 space-y-6">
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Connection Information
                  </h5>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Host
                      </label>
                      <Input
                        placeholder="sftp.company.com"
                        {...register("host", {
                          required: "Host is required.",
                        })}
                        error={Boolean(errors.host)}
                        hint={errors.host?.message}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Port
                      </label>
                      <Input
                        type="number"
                        placeholder="22"
                        {...register("port")}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Username
                      </label>
                      <Input
                        placeholder="ubuntu"
                        {...register("username", {
                          required: "Username is required.",
                        })}
                        error={Boolean(errors.username)}
                        hint={errors.username?.message}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Root Folder
                      </label>
                      <Input
                        placeholder="/backups"
                        {...register("destinationFolder", {
                          required: "Root folder is required.",
                        })}
                        error={Boolean(errors.destinationFolder)}
                        hint={errors.destinationFolder?.message}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Authentication Method
                  </h5>
                  <div className="mt-3">
                    <Controller
                      name="sftpAuthMode"
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
                </div>

                {sftpAuthMode === "private_key" && (
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      Private Key Authentication
                    </h5>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Private Key
                        </label>
                        <Controller
                          name="privateKey"
                          control={control}
                          rules={{ required: "Private key is required." }}
                          render={({ field }) => (
                            <TextArea
                              rows={4}
                              value={field.value}
                              onChange={field.onChange}
                              error={Boolean(errors.privateKey)}
                              hint={errors.privateKey?.message}
                              placeholder="Paste private key"
                              className="font-mono"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Passphrase (Optional)
                        </label>
                        <Input
                          type="password"
                          placeholder="Optional"
                          {...register("passphrase")}
                        />
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                        Use a dedicated SSH key. Do NOT use your personal SSH key.
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={!isSftpConnectionReady}
                        >
                          Test Connection
                        </Button>
                        {testStatus.state !== "idle" && (
                          <span
                            className={`text-xs font-semibold ${
                              testStatus.state === "success"
                                ? "text-success-600"
                                : testStatus.state === "error"
                                ? "text-error-500"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {testStatus.state === "testing"
                              ? "Testing..."
                              : testStatus.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {sftpAuthMode === "password" && (
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      Password Authentication
                    </h5>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Password"
                          {...register("password", {
                            required: "Password is required.",
                          })}
                          error={Boolean(errors.password)}
                          hint={errors.password?.message}
                        />
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                        Password authentication is less secure and not recommended for
                        automated backups.
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={!isSftpConnectionReady}
                        >
                          Test Connection
                        </Button>
                        {testStatus.state !== "idle" && (
                          <span
                            className={`text-xs font-semibold ${
                              testStatus.state === "success"
                                ? "text-success-600"
                                : testStatus.state === "error"
                                ? "text-error-500"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {testStatus.state === "testing"
                              ? "Testing..."
                              : testStatus.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={!isValid}>
            {destination?.id ? "Save Changes" : "Create Destination"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UpsertDestinationModal;
