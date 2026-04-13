"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";
import {
  AuthMethodType,
  CreateDestinationPayload,
  Destination,
  DestinationType,
  HostConfig,
  LocalStorageConfig,
  S3Config,
  UpdateDestinationPayload,
} from "@/handlers/destinations/type";
import {
  testConnection,
  useCreateDestination,
  useListDestinations,
  useUpdateDestination,
} from "@/handlers/destinations/destinationHooks";
import { useToast } from "@/context/ToastContext";

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
  passphrase: string;
  maxDiskUsage: string;
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
  { value: "private_key", label: "Private key" },
  { value: "password", label: "Password (not recommended)" },
];

const PRIVATE_KEY_PATTERNS = [
  /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]+-----END OPENSSH PRIVATE KEY-----/,
  /-----BEGIN RSA PRIVATE KEY-----[\s\S]+-----END RSA PRIVATE KEY-----/,
  /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/,
  /-----BEGIN DSA PRIVATE KEY-----[\s\S]+-----END DSA PRIVATE KEY-----/,
  /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/,
];

const normalizePrivateKey = (value: string) =>
  `${value.replace(/\r\n/g, "\n").trim()}\n`;

const validatePrivateKeyFormat = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "Private key is required.";
  }

  const normalizedValue = normalizePrivateKey(trimmedValue);
  return PRIVATE_KEY_PATTERNS.some((pattern) => pattern.test(normalizedValue))
    ? true
    : "Private key must be a valid OpenSSH or PEM private key.";
};

const formatPrivateKeyDate = (value?: string) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toISOString().slice(0, 10);
};

const buildDefaults = (data?: Destination | null): FormValues => {
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
    prefix: "",
  };

  if (data?.type === "s3") {
    const s3Config = (data?.config || {}) as S3Config;
    return { ...formValue, ...s3Config };
  }

  if (data?.type === "ssh") {
    const hostConf = (data?.config || {}) as HostConfig;
    return {
      ...formValue,
      ...hostConf,
      privateKey: "",
      sftpAuthMode:
        hostConf.authMethod === "password" ? "password" : "private_key",
    };
  }

  if (data?.type === "local-storage") {
    const localConf = (data?.config || {}) as LocalStorageConfig;
    return { ...formValue, ...localConf };
  }

  return formValue;
};

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
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(destination),
    shouldUnregister: true,
    mode: "onChange",
  });

  const destinationType = watch("type");
  const sftpAuthMode = watch("sftpAuthMode");
  const [host, port, username, destinationFolder, password, privateKey, passphrase] =
    watch([
      "host",
      "port",
      "username",
      "destinationFolder",
      "password",
      "privateKey",
      "passphrase",
    ]);

  const [privateKeyMode, setPrivateKeyMode] = useState<"view" | "replace">(
    "view"
  );
  const [removePrivateKey, setRemovePrivateKey] = useState(false);
  const [uploadedPrivateKeyName, setUploadedPrivateKeyName] = useState<
    string | null
  >(null);
  const [hasVerifiedReplacementKey, setHasVerifiedReplacementKey] =
    useState(false);
  const [testStatus, setTestStatus] = useState<{
    state: "idle" | "testing" | "success" | "error";
    message?: string;
  }>({ state: "idle" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { create: createDestination } = useCreateDestination();
  const { update: updateDestination } = useUpdateDestination();
  const { data: destinations } = useListDestinations();
  const { addToast, toastError, toastSuccess } = useToast();

  const hasConfiguredPrivateKey = Boolean(
    destination?.hasPrivateKey ||
      (destination?.config as HostConfig | undefined)?.privateKeyEnc
  );
  const isReplacingPrivateKey = privateKeyMode === "replace";
  const isUsingStoredPrivateKey =
    destinationType === "ssh" &&
    sftpAuthMode === "private_key" &&
    Boolean(destination?.id) &&
    hasConfiguredPrivateKey &&
    !isReplacingPrivateKey &&
    !removePrivateKey;
  const currentPrivateKey = privateKey ?? "";
  const isPrivateKeyRequired =
    destinationType === "ssh" &&
    sftpAuthMode === "private_key" &&
    !removePrivateKey &&
    (!destination?.id || !hasConfiguredPrivateKey || isReplacingPrivateKey);

  const clearPrivateKeyInputs = useCallback(() => {
    setValue("privateKey", "");
    clearErrors("privateKey");
    setUploadedPrivateKeyName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [clearErrors, setValue]);

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults(destination));
    setPrivateKeyMode("view");
    setRemovePrivateKey(false);
    setUploadedPrivateKeyName(null);
    setHasVerifiedReplacementKey(false);
    setTestStatus({ state: "idle" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [destination, isOpen, reset]);

  useEffect(() => {
    if (destinationType !== "ssh") return;
    setTestStatus({ state: "idle" });
  }, [destinationType, host, port, username, destinationFolder, password]);

  useEffect(() => {
    if (destinationType !== "ssh") return;
    if (sftpAuthMode === "private_key") {
      setValue("password", "");
      setValue("authMethod", "key" as AuthMethodType);
      return;
    }

    clearPrivateKeyInputs();
    setValue("passphrase", "");
    setValue("authMethod", "password" as AuthMethodType);
    setPrivateKeyMode("view");
    setRemovePrivateKey(false);
    setHasVerifiedReplacementKey(false);
    setTestStatus({ state: "idle" });
  }, [clearPrivateKeyInputs, destinationType, sftpAuthMode, setValue]);

  useEffect(() => {
    if (destinationType !== "ssh" || sftpAuthMode !== "private_key") return;
    setTestStatus({ state: "idle" });
    setHasVerifiedReplacementKey(false);
  }, [destinationType, sftpAuthMode, privateKey, passphrase, removePrivateKey]);

  const buildNameValidator =
    (allDestinations?: Destination[], currentId?: number) => (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return "Destination name is required.";
      if (!allDestinations) return true;
      const normalized = trimmed.toLowerCase();
      const conflict = allDestinations.find((dest) => {
        if (currentId && dest.id === currentId) return false;
        return dest.name.trim().toLowerCase() === normalized;
      });
      return conflict ? "A destination with this name already exists." : true;
    };

  const handlePrivateKeyFileUpload = useCallback(
    async (file?: File | null) => {
      if (!file) return;

      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".pem")) {
        setError("privateKey", {
          type: "validate",
          message: "Upload a .pem private key file.",
        });
        return;
      }

      try {
        const fileContents = await file.text();
        const validationResult = validatePrivateKeyFormat(fileContents);
        if (validationResult !== true) {
          setError("privateKey", {
            type: "validate",
            message: validationResult,
          });
          return;
        }

        setPrivateKeyMode("replace");
        setRemovePrivateKey(false);
        setUploadedPrivateKeyName(file.name);
        setValue("privateKey", normalizePrivateKey(fileContents), {
          shouldDirty: true,
          shouldValidate: true,
        });
        clearErrors("privateKey");
      } catch {
        setError("privateKey", {
          type: "validate",
          message: "Unable to read the selected private key file.",
        });
      }
    },
    [clearErrors, setError, setValue]
  );

  const getDestinationData = useCallback(
    (values: FormValues): CreateDestinationPayload | UpdateDestinationPayload => {
      const nextPrivateKey = values.privateKey ?? "";
      let nextDestination: CreateDestinationPayload | UpdateDestinationPayload = {
        name: values.name.trim(),
        type: values.type as DestinationType,
        status: testStatus.state === "success" ? "connected" : "disconnected",
      };

      if (values.type === "local-storage") {
        nextDestination = {
          ...nextDestination,
          config: {
            destinationFolder: values.destinationFolder,
            maxDiskUsage: values.maxDiskUsage,
          },
        };
      } else if (values.type === "s3") {
        nextDestination = {
          ...nextDestination,
          config: {
            accessKey: values.accessKey,
            secretKey: values.secretKey,
            endpoint: values.endpoint,
            bucketName: values.bucketName,
            region: values.region,
            prefix: values.prefix,
          },
        };
      } else if (values.type === "ssh") {
        nextDestination = {
          ...nextDestination,
          config: {
            host: values.host,
            port: values.port,
            username: values.username,
            password:
              values.sftpAuthMode === "password" ? values.password : "",
            authMethod:
              values.sftpAuthMode === "password"
                ? ("password" as AuthMethodType)
                : ("key" as AuthMethodType),
            passphrase:
              values.sftpAuthMode === "private_key" ? values.passphrase : "",
            destinationFolder: values.destinationFolder,
            maxDiskUsage: values.maxDiskUsage,
            keyMode: values.sftpAuthMode,
          },
        };

        if (values.sftpAuthMode === "private_key") {
          if (nextPrivateKey.trim()) {
            nextDestination.privateKey = normalizePrivateKey(nextPrivateKey);
          }

          if (removePrivateKey && !nextPrivateKey.trim()) {
            nextDestination.removePrivateKey = true;
          }
        }
      } else {
        nextDestination = {
          ...nextDestination,
          config: {
            destinationFolder: values.destinationFolder,
            maxDiskUsage: values.maxDiskUsage,
          },
        };
      }

      return nextDestination;
    },
    [removePrivateKey, testStatus.state]
  );

  const isSftpConnectionReady = (() => {
    if (destinationType !== "ssh") return false;
    if (!host || !username || !destinationFolder || !port) return false;
    if (sftpAuthMode === "password") return Boolean(password);

    if (sftpAuthMode === "private_key") {
      if (removePrivateKey && !currentPrivateKey.trim()) return false;
      if (currentPrivateKey.trim()) {
        return validatePrivateKeyFormat(currentPrivateKey) === true;
      }
      return isUsingStoredPrivateKey;
    }

    return false;
  })();

  const handleTestConnection = async () => {
    if (!isSftpConnectionReady) return;

    setTestStatus({ state: "testing" });
    try {
      const values = watch();
      const nextPrivateKey = values.privateKey ?? "";
      const config: HostConfig = {
        host: values.host,
        port: values.port,
        username: values.username,
        destinationFolder: values.destinationFolder,
        maxDiskUsage: values.maxDiskUsage,
        authMethod: values.authMethod,
      };

      if (sftpAuthMode === "private_key") {
        if (removePrivateKey && !nextPrivateKey.trim()) {
          throw new Error("Add a replacement key before testing the connection.");
        }
        if (nextPrivateKey.trim()) {
          config.privateKey = normalizePrivateKey(nextPrivateKey);
        }
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
        if (isReplacingPrivateKey && nextPrivateKey.trim()) {
          setHasVerifiedReplacementKey(true);
        }
        return;
      }

      setTestStatus({
        state: "error",
        message: result?.errorMsg || "Connection failed.",
      });
    } catch (error: any) {
      setTestStatus({
        state: "error",
        message: error?.message || "Connection failed.",
      });
    }
  };

  const handleClose = useCallback(() => {
    clearPrivateKeyInputs();
    setValue("passphrase", "");
    setPrivateKeyMode("view");
    setRemovePrivateKey(false);
    setHasVerifiedReplacementKey(false);
    setTestStatus({ state: "idle" });
    onClose();
  }, [clearPrivateKeyInputs, onClose, setValue]);

  const onSubmitForm = async (values: FormValues) => {
    const nextPrivateKey = values.privateKey ?? "";
    if (isReplacingPrivateKey && nextPrivateKey.trim() && !hasVerifiedReplacementKey) {
      addToast({
        variant: "warning",
        title: "Test Required",
        message: "Test the replacement key successfully before saving.",
      });
      return;
    }

    const destinationPayload = getDestinationData(values);
    if (destination?.id) {
      try {
        await updateDestination(
          destination.id,
          destinationPayload as UpdateDestinationPayload
        );
        toastSuccess("Update destination with success.");
        handleClose();
      } catch (error: any) {
        console.log("Error dest update: ", error.message);
        toastError();
      }
      return;
    }

    try {
      await createDestination(destinationPayload as CreateDestinationPayload);
      toastSuccess("Destination created with success.");
      handleClose();
    } catch (error: any) {
      console.log("Error create dest: ", error.message);
      toastError();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[720px] m-4">
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
                      {destination?.id && (
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Private Key
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    hasConfiguredPrivateKey && !removePrivateKey
                                      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {hasConfiguredPrivateKey && !removePrivateKey
                                    ? "Configured"
                                    : "Not configured"}
                                </span>
                              </div>
                              {hasConfiguredPrivateKey && !removePrivateKey && (
                                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                  {destination?.fingerprint && (
                                    <p>Fingerprint: {destination.fingerprint}</p>
                                  )}
                                  <p>
                                    Last updated:{" "}
                                    {formatPrivateKeyDate(destination?.updatedAt)}
                                  </p>
                                </div>
                              )}
                              {removePrivateKey && !currentPrivateKey.trim() && (
                                <p className="mt-3 text-sm text-error-600 dark:text-error-400">
                                  The stored private key will be removed when you save.
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setPrivateKeyMode("replace");
                                  setRemovePrivateKey(false);
                                  setHasVerifiedReplacementKey(false);
                                  setTestStatus({ state: "idle" });
                                }}
                              >
                                Replace private key
                              </Button>
                              {hasConfiguredPrivateKey && (
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const shouldRemove = window.confirm(
                                      "Remove the stored private key? The destination will stay disconnected until you save a replacement key."
                                    );
                                    if (!shouldRemove) return;
                                    clearPrivateKeyInputs();
                                    setPrivateKeyMode("view");
                                    setRemovePrivateKey(true);
                                    setHasVerifiedReplacementKey(false);
                                    setTestStatus({ state: "idle" });
                                  }}
                                >
                                  Remove private key
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {(isReplacingPrivateKey ||
                        (!destination?.id && sftpAuthMode === "private_key")) && (
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Upload a .PEM Private Key File
                            </label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pem"
                              className="block w-full rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
                              onChange={(event) => {
                                void handlePrivateKeyFileUpload(
                                  event.target.files?.[0] ?? null
                                );
                              }}
                            />
                            {uploadedPrivateKeyName && (
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Loaded file: {uploadedPrivateKeyName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                              Or
                            </span>
                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Paste Private Key
                            </label>
                            <Controller
                              name="privateKey"
                              control={control}
                              rules={{
                                validate: (value) => {
                                  if (!isPrivateKeyRequired && !value.trim()) {
                                    return true;
                                  }
                                  return validatePrivateKeyFormat(value);
                                },
                              }}
                              render={({ field }) => (
                                <TextArea
                                  rows={6}
                                  value={field.value}
                                  onChange={(nextValue) => {
                                    setUploadedPrivateKeyName(null);
                                    setRemovePrivateKey(false);
                                    field.onChange(nextValue);
                                  }}
                                  error={Boolean(errors.privateKey)}
                                  hint={errors.privateKey?.message}
                                  placeholder="Paste the contents of your .pem private key"
                                  className="font-mono"
                                />
                              )}
                            />
                          </div>
                        </div>
                      )}

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
                      {isReplacingPrivateKey && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
                          Replacing a key is explicit. The existing key is never shown
                          and will be overwritten only after you save.
                        </div>
                      )}
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
          <Button size="sm" variant="outline" type="button" onClick={handleClose}>
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
