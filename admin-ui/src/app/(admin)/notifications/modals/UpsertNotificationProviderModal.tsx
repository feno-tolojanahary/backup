  "use client";

import React, { useEffect, useMemo, useRef } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";
import { CreateNotificationProvider, NotificationProvider, ProviderType, SESConfigType, SmtpConfigType, UpdateNotificationProvider } from "@/handlers/notifications/notification-providers/type";
import { useToast } from "@/context/ToastContext";
import { useCreateNotificationProvider, useUdpateNotificationProvider } from "@/handlers/notifications/notification-providers/notificationProviderHooks";

type ConfigMethod = "smtp" | "ses";

type UpsertNotficationProviderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: NotificationProvider) => void;
  notificationProvider: NotificationProvider | null;
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
  smtpDestinations: string;
  sesRegion: string;
  sesAccessKey: string;
  sesSecretKey: string;
  sesSenderEmail: string;
  sesDestinations: string;
};

const providerTypeOptions = [{ value: "email", label: "Email" }];

const methodOptions = [
  { value: "smtp", label: "SMTP" },
  { value: "ses", label: "SES" },
];

const sesRegionOptions = [
  { value: "us-east-1", label: "us-east-1" },
  { value: "us-west-2", label: "us-west-2" },
  { value: "eu-west-1", label: "eu-west-1" },
];

const resolveConfigMethod = (config?: SmtpConfigType | SESConfigType | null): ConfigMethod => {
  if (!config) return "smtp";
  if (config.method === "smtp" || config.method === "ses") return config.method;
  return "region" in config ? "ses" : "smtp";
};

const buildDefaults = (notificationProvider: NotificationProvider | null): FormValues => {
  const defaultValue = {
    name: notificationProvider?.name ?? "",
    type: notificationProvider?.type ?? "email",
    enabled: notificationProvider?.isEnable ?? true,
    method: resolveConfigMethod(notificationProvider?.config),
    smtpHost: (notificationProvider?.config as SmtpConfigType)?.host ?? "",
    smtpPort: (notificationProvider?.config as SmtpConfigType)?.port ?? "",
    smtpUsername: (notificationProvider?.config as SmtpConfigType)?.username ?? "",
    smtpPassword: (notificationProvider?.config as SmtpConfigType)?.auth ?? "",
    smtpSenderEmail: (notificationProvider?.config as SmtpConfigType)?.senderEmail ?? "",
    smtpDestinations: (notificationProvider?.config as SmtpConfigType)?.destinations?.join(";") ?? "",
    sesRegion: (notificationProvider?.config as SESConfigType)?.region ?? "",
    sesAccessKey: (notificationProvider?.config as SESConfigType)?.accessKeyId ?? "",
    sesSecretKey: (notificationProvider?.config as SESConfigType)?.secretAccessKey ?? "",
    sesSenderEmail: (notificationProvider?.config as SESConfigType)?.senderEmail ?? "",
    sesDestinations: (notificationProvider?.config as SESConfigType)?.destinations?.join(";") ?? ""
  } 
  console.log("default value: ", defaultValue)
  return defaultValue;
}


const getPayloadData = (values: FormValues): CreateNotificationProvider | UpdateNotificationProvider => {
    const defaultVal = {
      name: values.name,
      type: values.type,
      isEnable: values.enabled
    }
    if (values.method === "smtp") {
      return {
        ...defaultVal,
        config: {
          host: values.smtpHost,
          port: values.smtpPort,
          username: values.smtpUsername,
          auth: values.smtpPassword,
          method: values.method,
          senderEmail: values.smtpSenderEmail,
          destinations: values.smtpDestinations.split(";")
        }
      }
    } else {
      return {
        ...defaultVal,
        config: {
          region: values.sesRegion,
          accessKeyId: values.sesAccessKey,
          method: values.method,
          secretAccessKey: values.sesSecretKey,
          senderEmail: values.sesSenderEmail,
          destinations: values.sesDestinations.split(";")
        }
      }
    }
}

const UpsertNotficationProviderModal: React.FC<
  UpsertNotficationProviderModalProps
> = ({ isOpen, onClose, onSubmit, notificationProvider }) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: buildDefaults(null),
    shouldUnregister: false,
  });

  const method = watch("method");
  const enabled = watch("enabled");
  const providerId = notificationProvider?.id ?? null;
  const isEdit = Boolean(providerId);
  const lastResetKey = useRef<number | "new" | null>(null);

  const { toastSuccess, toastError } = useToast();
  const { create: createProvider, isMutating: isLoadingCreate } = useCreateNotificationProvider();
  const { update: updateProvider, isMutating: isLoadingUpdate } = useUdpateNotificationProvider();

  useEffect(() => {
    if (!isOpen) {
      lastResetKey.current = null;
      return;
    }
    const resetKey = providerId ?? "new";
    if (lastResetKey.current === resetKey) return;
    lastResetKey.current = resetKey;
    reset(buildDefaults(notificationProvider));
  }, [isOpen, reset, notificationProvider, providerId]);

  const requiredFields = useMemo(() => {
    if (method === "smtp") {
      return [
        "name",
        "smtpHost",
        "smtpPort",
        "smtpUsername",
        "smtpPassword",
        "smtpSenderEmail",
      ];
    }
    return ["name", "sesRegion", "sesAccessKey", "sesSecretKey", "sesSenderEmail"];
  }, [method]);

  const onSubmitForm = async (values: FormValues) => {
    const payloadData = getPayloadData(values);
    if (notificationProvider?.id) {
      try {
        const res = await updateProvider(notificationProvider?.id, payloadData as UpdateNotificationProvider)
        if (!res)
          throw new Error("no result.");
        toastSuccess("Notification provider updated.");
        onClose();
      } catch (error: any) {
        console.log("Error update notification: ", error.message)
        toastError();
      }
    } else {
      try {
        const result = await createProvider(payloadData as CreateNotificationProvider);
        if (!result)
          throw new Error("no result.") 
        toastSuccess("Notification provider created.");
        onClose();
      } catch (error: any) {
        console.log("Error save notification: ", error.message);
        toastError();
      }
    }
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
            {isEdit ? "Update Notification Provider" : "Create Notification Provider"}
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
                    disabled={isEdit}
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
                      Destination Emails{requiredMarker("smtpDestinations")}
                    </label>
                    <Input
                      type="text"
                      placeholder="email@receiver.com;email2@receiver.com;email3@receiver.com"
                      {...register("smtpDestinations", {
                        required: "Sender email is required.",
                      })}
                      error={Boolean(errors.smtpDestinations)}
                      hint={errors.smtpDestinations?.message}
                    />
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
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Destination Emails{requiredMarker("sesDestinations")}
                    </label>
                    <Input
                      type="text"
                      placeholder="email@receiver.com;email2@receiver.com;email3@receiver.com"
                      {...register("sesDestinations", {
                        required: "Sender email is required.",
                      })}
                      error={Boolean(errors.sesDestinations)}
                      hint={errors.sesDestinations?.message}
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
          <Button size="sm" type="submit" isLoading={isLoadingCreate || isLoadingUpdate}>
            {isEdit ? "Update Provider" : "Create Provider"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UpsertNotficationProviderModal;
