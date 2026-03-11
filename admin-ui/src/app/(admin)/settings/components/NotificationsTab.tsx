import React from "react";
import Switch from "@/components/form/switch/Switch";
import Checkbox from "@/components/form/input/Checkbox";
import { FieldLabel, SectionCard, TabActions } from "./SettingsShared";

type NotifyTriggers = {
  completed: boolean;
  backupFailed: boolean;
  jobFailed: boolean;
  storageError: boolean;
};

type NotificationsTabProps = {
  notifyEmailEnabled: boolean;
  setNotifyEmailEnabled: (value: boolean) => void;
  notifyTriggers: NotifyTriggers;
  setNotifyTriggers: React.Dispatch<React.SetStateAction<NotifyTriggers>>;
};

export default function NotificationsTab({
  notifyEmailEnabled,
  setNotifyEmailEnabled,
  notifyTriggers,
  setNotifyTriggers,
}: NotificationsTabProps) {
  return (
    <SectionCard
      title="Notifications"
      description="Enable or disable system alerts."
    >
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
            Enable Email Notifications
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Send email alerts when critical events occur.
          </p>
        </div>
        <Switch
          label={notifyEmailEnabled ? "enabled" : "disabled"}
          defaultChecked={notifyEmailEnabled}
          onChange={(checked) => setNotifyEmailEnabled(checked)}
        />
      </div>

      <div className="space-y-3">
        <FieldLabel label="Alert Triggers" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox
            label="Backup completed"
            checked={notifyTriggers.completed}
            onChange={(checked) =>
              setNotifyTriggers((prev) => ({
                ...prev,
                completed: checked,
              }))
            }
          />
          <Checkbox
            label="Backup failed"
            checked={notifyTriggers.backupFailed}
            onChange={(checked) =>
              setNotifyTriggers((prev) => ({
                ...prev,
                backupFailed: checked,
              }))
            }
          />
          <Checkbox
            label="Job failed"
            checked={notifyTriggers.jobFailed}
            onChange={(checked) =>
              setNotifyTriggers((prev) => ({
                ...prev,
                jobFailed: checked,
              }))
            }
          />
          <Checkbox
            label="Storage connection error"
            checked={notifyTriggers.storageError}
            onChange={(checked) =>
              setNotifyTriggers((prev) => ({
                ...prev,
                storageError: checked,
              }))
            }
          />
        </div>
      </div>
      <TabActions />
    </SectionCard>
  );
}
