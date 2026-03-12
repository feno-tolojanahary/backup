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
  notifyTriggers: NotifyTriggers;
  setNotifyTriggers: React.Dispatch<React.SetStateAction<NotifyTriggers>>;
};

export default function NotificationsTab({
  notifyTriggers,
  setNotifyTriggers,
}: NotificationsTabProps) {
  return (
    <SectionCard
      title="Notifications"
      description="Enable or disable system alerts."
    >
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
