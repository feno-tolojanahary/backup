"use client";

import { useEffect, useState } from "react";
import Checkbox from "@/components/form/input/Checkbox";
import { FieldLabel, SectionCard } from "./SettingsShared";
import Button from "@/components/ui/button/Button";
import { useSettings, useSettingUpsert } from "@/handlers/settings/SettingHooks";
import { useToast } from "@/context/ToastContext";

export default function ParametersTab() {
  const [notifyTriggers, setNotifyTriggers] = useState({
    completed: true,
    backupFailed: true,
    jobFailed: true,
    storageError: false,
  });
  
  const { toastError, toastSuccess } = useToast();
  const { upsert } = useSettingUpsert();
  const { settings, getSetting } = useSettings();

  useEffect(() => {
      const defaultNotifyTriggers = {
        completed: getSetting("completed"),
        backupFailed: getSetting("backupFailed"),
        jobFailed: getSetting("jobFailed"),
        storageError: getSetting("storageError")
      }
      setNotifyTriggers(defaultNotifyTriggers);
  }, [settings]);

  const handleSave = async () => {
      try {
        const data = Object.entries(notifyTriggers).map(([key, value]) => ({ key, value }))
        const res = await upsert(data);
        if (!res)
          throw new Error("no result data.")
        toastSuccess("Saving notification data with success");
      } catch(error: any) {
        console.log("setting notification save: ", error.message);
        toastError();
      } 
  }

  return (
    <div className="space-y-4">
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
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" type="button" onClick={handleSave}>
          Save Changes
        </Button>
        <Button size="sm" variant="outline" type="button">
          Cancel
        </Button>
      </div>
    </SectionCard>
    </div>
  );
}
