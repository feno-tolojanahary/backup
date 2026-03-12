"use client";

import React, { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";

type Severity = "info" | "warning" | "critical";
type EventType =
  | "backup_failed"
  | "backup_completed"
  | "job_failed"
  | "job_completed"
  | "storage_high_usage"
  | "storage_connection_failed";

type RuleFormState = {
  name: string;
  enabled: boolean;
  severity: Severity;
  event: EventType;
  target: string;
  provider: string;
  retryThreshold: string;
  storageUsageThreshold: string;
};

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

const CreateNotificationRuleModal: React.FC<CreateNotificationRuleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formState, setFormState] = useState<RuleFormState>({
    name: "",
    enabled: true,
    severity: "critical",
    event: "backup_failed",
    target: "all",
    provider: "Admin Email",
    retryThreshold: "",
    storageUsageThreshold: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const requiredFields = useMemo(
    () => ["name", "severity", "event", "provider"],
    []
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!formState.name.trim()) nextErrors.name = "Rule name is required.";
    if (!formState.severity) nextErrors.severity = "Severity is required.";
    if (!formState.event) nextErrors.event = "Event type is required.";
    if (!formState.provider) nextErrors.provider = "Provider is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: NotificationRulePayload = {
      name: formState.name.trim(),
      enabled: formState.enabled,
      severity: formState.severity,
      event: formState.event,
      target: formState.target,
      provider: formState.provider,
      conditions: {
        retryThreshold: formState.retryThreshold
          ? Number(formState.retryThreshold)
          : undefined,
        storageUsageThreshold: formState.storageUsageThreshold
          ? Number(formState.storageUsageThreshold)
          : undefined,
      },
    };

    onSubmit?.(payload);
    console.log("Create notification rule payload", payload);
    onClose();
  };

  const requiredMarker = (key: string) =>
    requiredFields.includes(key) ? (
      <span className="text-error-500"> *</span>
    ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[680px] m-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
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
                  Rule Name{requiredMarker("name")}
                </label>
                <Input
                  placeholder="Backup Failure Alert"
                  defaultValue={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  error={Boolean(errors.name)}
                  hint={errors.name}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Rule Status
                </label>
                <Switch
                  label={formState.enabled ? "Enabled" : "Disabled"}
                  defaultChecked={formState.enabled}
                  onChange={(checked) =>
                    setFormState((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Severity{requiredMarker("severity")}
                </label>
                <Select
                  options={severityOptions}
                  placeholder="Select severity"
                  defaultValue={formState.severity}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      severity: value as Severity,
                    }))
                  }
                />
                {errors.severity && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.severity}
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
                  Event Type{requiredMarker("event")}
                </label>
                <Select
                  options={eventOptions}
                  placeholder="Select event"
                  defaultValue={formState.event}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      event: value as EventType,
                    }))
                  }
                />
                {errors.event && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.event}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Target
                </label>
                <Select
                  options={targetOptions}
                  placeholder="All Targets"
                  defaultValue={formState.target}
                  onChange={(value) =>
                    setFormState((prev) => ({ ...prev, target: value }))
                  }
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
                Notification Provider{requiredMarker("provider")}
              </label>
              <Select
                options={providerOptions}
                placeholder="Select provider"
                defaultValue={formState.provider}
                onChange={(value) =>
                  setFormState((prev) => ({ ...prev, provider: value }))
                }
              />
              {errors.provider && (
                <p className="mt-1.5 text-xs text-error-500">
                  {errors.provider}
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
                  defaultValue={formState.retryThreshold}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      retryThreshold: e.target.value,
                    }))
                  }
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
                  defaultValue={formState.storageUsageThreshold}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      storageUsageThreshold: e.target.value,
                    }))
                  }
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
