"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { Controller, useForm } from "react-hook-form";

type Severity = "info" | "warning" | "critical";
type EventType =
  | "backup_failed"
  | "backup_completed"
  | "job_failed"
  | "job_completed"
  | "storage_high_usage"
  | "storage_connection_failed";

type NotificationRulePayload = {
  name: string;
  enabled: boolean;
  severity: Severity;
  event: EventType;
  target: string;
  provider: string;
  conditions: {
    retryThreshold?: number;
    storageUsageThreshold?: number;
  };
};

type CreateNotificationRuleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: NotificationRulePayload) => void;
};

type FormValues = {
  name: string;
  enabled: boolean;
  severity: Severity;
  event: EventType;
  target: string;
  provider: string;
  retryThreshold: string;
  storageUsageThreshold: string;
};

const severityOptions = [
  { value: "info", label: "info" },
  { value: "warning", label: "warning" },
  { value: "critical", label: "critical" },
];

const eventOptions = [
  { value: "backup_failed", label: "backup_failed" },
  { value: "backup_completed", label: "backup_completed" },
  { value: "job_failed", label: "job_failed" },
  { value: "job_completed", label: "job_completed" },
  { value: "storage_high_usage", label: "storage_high_usage" },
  { value: "storage_connection_failed", label: "storage_connection_failed" },
];

const targetOptions = [
  { value: "all", label: "All Targets" },
  { value: "mongodb", label: "mongodb" },
  { value: "app1", label: "app1" },
  { value: "filesystem-backup", label: "filesystem-backup" },
];

const providerOptions = [
  { value: "Admin Email", label: "Admin Email" },
  { value: "Ops Slack", label: "Ops Slack" },
  { value: "Monitoring Webhook", label: "Monitoring Webhook" },
];

const buildDefaults = (): FormValues => ({
  name: "",
  enabled: true,
  severity: "critical",
  event: "backup_failed",
  target: "all",
  provider: "Admin Email",
  retryThreshold: "",
  storageUsageThreshold: "",
});

const CreateNotificationRuleModal: React.FC<CreateNotificationRuleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(),
  });

  const enabled = watch("enabled");

  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaults());
  }, [isOpen, reset]);

  const onSubmitForm = (values: FormValues) => {
    const payload: NotificationRulePayload = {
      name: values.name.trim(),
      enabled: values.enabled,
      severity: values.severity,
      event: values.event,
      target: values.target,
      provider: values.provider,
      conditions: {
        retryThreshold: values.retryThreshold
          ? Number(values.retryThreshold)
          : undefined,
        storageUsageThreshold: values.storageUsageThreshold
          ? Number(values.storageUsageThreshold)
          : undefined,
      },
    };

    onSubmit?.(payload);
    console.log("Create notification rule payload", payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[680px] m-4">
      <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Create Notification Rule
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Define when the system should send notifications and which provider
            should be used.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Rule Information
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Rule Name<span className="text-error-500"> *</span>
                </label>
                <Input
                  placeholder="Backup Failure Alert"
                  {...register("name", { required: "Rule name is required." })}
                  error={Boolean(errors.name)}
                  hint={errors.name?.message}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Rule Status
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
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Severity<span className="text-error-500"> *</span>
                </label>
                <Controller
                  name="severity"
                  control={control}
                  rules={{ required: "Severity is required." }}
                  render={({ field }) => (
                    <Select
                      options={severityOptions}
                      placeholder="Select severity"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
                {errors.severity && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.severity.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Trigger Event
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Event Type<span className="text-error-500"> *</span>
                </label>
                <Controller
                  name="event"
                  control={control}
                  rules={{ required: "Event type is required." }}
                  render={({ field }) => (
                    <Select
                      options={eventOptions}
                      placeholder="Select event"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
                {errors.event && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.event.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Target
                </label>
                <Controller
                  name="target"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={targetOptions}
                      placeholder="All Targets"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Delivery Settings
            </h4>
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Notification Provider<span className="text-error-500"> *</span>
              </label>
              <Controller
                name="provider"
                control={control}
                rules={{ required: "Provider is required." }}
                render={({ field }) => (
                  <Select
                    options={providerOptions}
                    placeholder="Select provider"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                )}
              />
              {errors.provider && (
                <p className="mt-1.5 text-xs text-error-500">
                  {errors.provider.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Optional Conditions
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Retry Threshold
                </label>
                <Input
                  type="number"
                  placeholder="2"
                  {...register("retryThreshold")}
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Trigger only if retries exceed this value.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Storage Usage Threshold (%)
                </label>
                <Input
                  type="number"
                  placeholder="90"
                  {...register("storageUsageThreshold")}
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Trigger if storage usage exceeds this percentage.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit">
            Create Rule
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNotificationRuleModal;
