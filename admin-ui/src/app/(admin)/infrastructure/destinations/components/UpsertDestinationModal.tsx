"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";
import { Destination, DestinationType, S3Config, AuthMethodType, HostConfig, LocalStorageConfig, CreateDestinationPayload, UpdateDestinationPayload } from "@/handlers/destinations/type";
import { useCreateDestination, useListDestinations, useUpdateDestination } from "@/handlers/destinations/destinationHooks";
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
  destinationFolder: string;
  endpoint: string;
  bucketName: string;
  region: string;
  accessKey: string;
  secretKey: string;
  passphrase: string,
  maxDiskUsage: string,
  prefix: string;
  host: string;
  port: string;
  username: string;
  authMethod: AuthMethodType;
  password: string;
  privateKey: string;
};

const typeOptions = [
  { value: "local-storage", label: "local" },
  { value: "s3", label: "s3" },
  { value: "ssh", label: "sftp (ssh remote)" },
];

const authMethodOptions = [
  { value: "password", label: "password" },
  { value: "key", label: "key" },
];

const buildDefaults = (
  data?: Destination | null
): FormValues => {
  const formValue = {
    name: data?.name ?? "",
    type: (data?.type ?? "ssh") as DestinationType,
    
    destinationFolder: "",
    endpoint: "",
    bucketName: "",
    region: "",
    accessKey: "",
    secretKey: "",
    host: "",
    port: "22",
    username: "",
    authMethod: "password" as AuthMethodType,
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
    return { ...formValue, ...hostConf }
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
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(destination),
    shouldUnregister: true,
  }); 

  const destinationType = watch("type");
  const authMethod = watch("authMethod");

  const { create: createDestination } = useCreateDestination();
  const { update: updateDestination } = useUpdateDestination();
  const { data: destinations } = useListDestinations();

  const { toastError, toastSuccess } = useToast()

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults(destination));
  }, [destination, isOpen, reset]);

  const getDestinationData = (values: FormValues) => {
    let destination: CreateDestinationPayload | UpdateDestinationPayload = {
      name: values.name.trim(),
      type: values.type as DestinationType,
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
      const { host, port, username, password, authMethod, privateKey, passphrase, destinationFolder, maxDiskUsage } = values; 
      destination = {
        ...destination,
        config: { host, port, username, password, authMethod, privateKey, passphrase, destinationFolder, maxDiskUsage }
      }
    } else {
      const { destinationFolder, maxDiskUsage } = values;
      destination = {
        ...destination,
        config: { destinationFolder, maxDiskUsage }
      }
    }
    return destination;
  }

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
            </div>
          </div>

          {destinationType === "local-storage" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Local Storage
              </h4>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Local path
                </label>
                <Input
                  placeholder="/mnt/backups"
                  {...register("destinationFolder", {
                    required: "Local path is required.",
                  })}
                  error={Boolean(errors.destinationFolder)}
                  hint={errors.destinationFolder?.message}
                />
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Max disk usage
                </label>
                <Input
                  placeholder="e.g. 100GB"
                  {...register("maxDiskUsage", {
                    required: "Max disk usage is required.",
                  })}
                  error={Boolean(errors.maxDiskUsage)}
                  hint={errors.maxDiskUsage?.message}
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
                <div className="sm:col-span-2">
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
                    Prefix
                  </label>
                  <Input placeholder="/" {...register("prefix")} />
                </div>
              </div>
            </div>
          )}

          {destinationType === "ssh" && (
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
                    placeholder="backup"
                    {...register("username", {
                      required: "Username is required.",
                    })}
                    error={Boolean(errors.username)}
                    hint={errors.username?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Authentication method
                  </label>
                  <Controller
                    name="authMethod"
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
                      {...register("password", {
                        required: "Password is required.",
                      })}
                      error={Boolean(errors.password)}
                      hint={errors.password?.message}
                    />
                  </div>
                ) : (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Private key
                      </label>
                      <Input
                        placeholder="/path/to/key.pem"
                        {...register("privateKey", {
                          required: "Private key is required.",
                        })}
                        error={Boolean(errors.privateKey)}
                        hint={errors.privateKey?.message}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Passphrase
                      </label>
                      <Input
                        placeholder="Optional"
                        {...register("passphrase")}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Destination folder
                  </label>
                  <Input
                    placeholder="/home/ubuntu/"
                    {...register("destinationFolder", {
                      required: "Remote folder is required.",
                    })}
                    error={Boolean(errors.destinationFolder)}
                    hint={errors.destinationFolder?.message}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Max disk usage
                  </label>
                  <Input
                    placeholder="/mnt/backups"
                    {...register("maxDiskUsage")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit">
            {destination?.id ? "Save Changes" : "Create Destination"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UpsertDestinationModal;
