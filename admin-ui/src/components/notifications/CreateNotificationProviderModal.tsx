"use client";

import React, { useEffect, useMemo } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";

type ConfigMethod = "smtp" | "ses";
type ProviderType = "email";
type EncryptionType = "none" | "ssl" | "starttls";

type NotificationProviderPayload =
  | {
      name: string;
      type: ProviderType;
      enabled: boolean;
      method: "smtp";
      config: {
        host: string;
        port: number;
        username: string;
        password: string;
        senderEmail: string;
        encryption: EncryptionType;
      };
    }
  | {
      name: string;
      type: ProviderType;
      enabled: boolean;
      method: "ses";
      config: {
        region: string;
        accessKey: string;
        secretKey: string;
        senderEmail: string;
        configurationSet?: string;
      };
    };

type CreateNotificationProviderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: NotificationProviderPayload) => void;
};

type FormValues = {
  name: string;
  type: ProviderType;
  enabled: boolean;
  method: ConfigMethod;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpSenderEmail: string;
  smtpEncryption: EncryptionType;
  sesRegion: string;
  sesAccessKey: string;
  sesSecretKey: string;
  sesSenderEmail: string;
  sesConfigurationSet: string;
};

const providerTypeOptions = [{ value: "email", label: "Email" }];

const methodOptions = [
  { value: "smtp", label: "SMTP" },
  { value: "ses", label: "SES" },
];

const encryptionOptions = [
  { value: "none", label: "None" },
  { value: "ssl", label: "SSL" },
  { value: "starttls", label: "STARTTLS" },
];

const sesRegionOptions = [
  { value: "us-east-1", label: "us-east-1" },
  { value: "us-west-2", label: "us-west-2" },
  { value: "eu-west-1", label: "eu-west-1" },
];

const buildDefaults = (): FormValues => ({
  name: "",
  type: "email",
  enabled: true,
  method: "smtp",
  smtpHost: "",
  smtpPort: "",
  smtpUsername: "",
  smtpPassword: "",
  smtpSenderEmail: "",
  smtpEncryption: "starttls",
  sesRegion: "",
  sesAccessKey: "",
  sesSecretKey: "",
  sesSenderEmail: "",
  sesConfigurationSet: "",
});

const CreateNotificationProviderModal: React.FC<
  CreateNotificationProviderModalProps
> = ({ isOpen, onClose, onSubmit }) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(),
    shouldUnregister: true,
  });

  const method = watch("method");
  const enabled = watch("enabled");

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults());
  }, [isOpen, reset]);

  const requiredFields = useMemo(() => {
    if (method === "smtp") {
      return [
        "name",
        "smtpHost",
        "smtpPort",
        "smtpUsername",
        "smtpPassword",
        "smtpSenderEmail",
        "smtpEncryption",
      ];
    }
    return ["name", "sesRegion", "sesAccessKey", "sesSecretKey", "sesSenderEmail"];
  }, [method]);

  const onSubmitForm = (values: FormValues) => {
    const payload: NotificationProviderPayload =
      values.method === "smtp"
        ? {
            name: values.name.trim(),
            type: values.type,
            enabled: values.enabled,
            method: "smtp",
            config: {
              host: values.smtpHost.trim(),
              port: Number(values.smtpPort),
              username: values.smtpUsername.trim(),
              password: values.smtpPassword,
              senderEmail: values.smtpSenderEmail.trim(),
              encryption: values.smtpEncryption,
            },
          }
        : {
            name: values.name.trim(),
            type: values.type,
            enabled: values.enabled,
            method: "ses",
            config: {
              region: values.sesRegion.trim(),
              accessKey: values.sesAccessKey.trim(),
              secretKey: values.sesSecretKey,
              senderEmail: values.sesSenderEmail.trim(),
              configurationSet: values.sesConfigurationSet?.trim() || undefined,
            },
          };

    onSubmit?.(payload);
    console.log("Create notification provider payload", payload);
    onClose();
  };

  const requiredMarker = (key: string) =>
    requiredFields.includes(key) ? (
      <span className="text-error-500"> *</span>
    ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[680px] m-4">
      <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Create Notification Provider
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Configure a notification channel used to send alerts from the backup
            system.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Provider Information
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Provider Name{requiredMarker("name")}
                </label>
                <Input
                  placeholder="Admin Email"
                  {...register("name", { required: "Provider name is required." })}
                  error={Boolean(errors.name)}
                  hint={errors.name?.message}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Provider Type
                </label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={providerTypeOptions}
                      placeholder="Select type"
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
                  Provider Status
                </label>
                <Controller
                  name="enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      label={enabled ? "Enabled" : "Disabled"}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Configuration Method
            </h4>
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Configuration Method
              </label>
              <Controller
                name="method"
                control={control}
                render={({ field }) => (
                  <Select
                    options={methodOptions}
                    placeholder="Choose a method"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Provider Configuration
            </h4>

            {method === "smtp" && (
              <div className="mt-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  SMTP Configuration
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      SMTP Host{requiredMarker("smtpHost")}
                    </label>
                    <Input
                      placeholder="smtp.mailserver.com"
                      {...register("smtpHost", {
                        required: "SMTP host is required.",
                      })}
                      error={Boolean(errors.smtpHost)}
                      hint={errors.smtpHost?.message}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Port{requiredMarker("smtpPort")}
                    </label>
                    <Input
                      type="number"
                      placeholder="587"
                      {...register("smtpPort", {
                        required: "Port is required.",
                      })}
                      error={Boolean(errors.smtpPort)}
                      hint={errors.smtpPort?.message}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Username{requiredMarker("smtpUsername")}
                    </label>
                    <Input
                      placeholder="admin@mailserver.com"
                      {...register("smtpUsername", {
                        required: "Username is required.",
                      })}
                      error={Boolean(errors.smtpUsername)}
                      hint={errors.smtpUsername?.message}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Password{requiredMarker("smtpPassword")}
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...register("smtpPassword", {
                        required: "Password is required.",
                      })}
                      error={Boolean(errors.smtpPassword)}
                      hint={errors.smtpPassword?.message}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sender Email{requiredMarker("smtpSenderEmail")}
                    </label>
                    <Input
                      type="email"
                      placeholder="backup@mailserver.com"
                      {...register("smtpSenderEmail", {
                        required: "Sender email is required.",
                      })}
                      error={Boolean(errors.smtpSenderEmail)}
                      hint={errors.smtpSenderEmail?.message}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Encryption{requiredMarker("smtpEncryption")}
                    </label>
                    <Controller
                      name="smtpEncryption"
                      control={control}
                      rules={{ required: "Encryption is required." }}
                      render={({ field }) => (
                        <Select
                          options={encryptionOptions}
                          placeholder="Select encryption"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      )}
                    />
                    {errors.smtpEncryption && (
                      <p className="mt-1.5 text-xs text-error-500">
                        {errors.smtpEncryption.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {method === "ses" && (
              <div className="mt-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Amazon SES Configuration
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Region{requiredMarker("sesRegion")}
                    </label>
                    <Controller
                      name="sesRegion"
                      control={control}
                      rules={{ required: "Region is required." }}
                      render={({ field }) => (
                        <Select
                          options={sesRegionOptions}
                          placeholder="Select region"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      )}
                    />
                    {errors.sesRegion && (
                      <p className="mt-1.5 text-xs text-error-500">
                        {errors.sesRegion.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Access Key{requiredMarker("sesAccessKey")}
                    </label>
                    <Input
                      placeholder="AKIA..."
                      {...register("sesAccessKey", {
                        required: "Access key is required.",
                      })}
                      error={Boolean(errors.sesAccessKey)}
                      hint={errors.sesAccessKey?.message}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Secret Key{requiredMarker("sesSecretKey")}
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...register("sesSecretKey", {
                        required: "Secret key is required.",
                      })}
                      error={Boolean(errors.sesSecretKey)}
                      hint={errors.sesSecretKey?.message}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sender Email{requiredMarker("sesSenderEmail")}
                    </label>
                    <Input
                      type="email"
                      placeholder="backup@mailserver.com"
                      {...register("sesSenderEmail", {
                        required: "Sender email is required.",
                      })}
                      error={Boolean(errors.sesSenderEmail)}
                      hint={errors.sesSenderEmail?.message}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Configuration Set
                    </label>
                    <Input
                      placeholder="optional-config-set"
                      {...register("sesConfigurationSet")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit">
            Create Provider
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNotificationProviderModal;
