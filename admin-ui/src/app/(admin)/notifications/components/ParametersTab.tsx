"use client";

import { useEffect, useRef, useState } from "react";
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
  const isDirtyRef = useRef(false);
  
  const { toastError, toastSuccess } = useToast();
  const { upsert } = useSettingUpsert();
  const { settings, getSettingValue } = useSettings();

  useEffect(() => {
    if (!settings) return;
    const next = {
      completed: getSettingValue("completed") ?? false,
      backupFailed: getSettingValue("backupFailed") ?? false,
      jobFailed: getSettingValue("jobFailed") ?? false,
      storageError: getSettingValue("storageError") ?? false,
    };
    if (isDirtyRef.current) return;
    setNotifyTriggers((prev) =>
      prev.completed === next.completed &&
      prev.backupFailed === next.backupFailed &&
      prev.jobFailed === next.jobFailed &&
      prev.storageError === next.storageError
        ? prev
        : next
    );
  }, [settings, getSettingValue]);

  const handleSave = async () => {
    try {
      const data = Object.entries(notifyTriggers).map(([key, value]) => ({ key, value }))
      const res = await upsert(data);
      if (!res)
        throw new Error("no result data.")
      isDirtyRef.current = false;
      toastSuccess("Saving notification data with success");
    } catch(error: any) {
      console.log("setting notification save: ", error.message);
      toastError();
    } 
  }

  const handleCancel = () => {
    if (!settings) return;
    isDirtyRef.current = false;
    setNotifyTriggers({
      completed: getSettingValue("completed") ?? false,
      backupFailed: getSettingValue("backupFailed") ?? false,
      jobFailed: getSettingValue("jobFailed") ?? false,
      storageError: getSettingValue("storageError") ?? false,
    });
  }

  const handleTriggerChange = (
    key: keyof typeof notifyTriggers,
    checked: boolean
  ) => {
    isDirtyRef.current = true;
    setNotifyTriggers((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

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
            onChange={(checked) => handleTriggerChange("completed", checked)}
          />
          <Checkbox
            label="Backup failed"
            checked={notifyTriggers.backupFailed}
            onChange={(checked) => handleTriggerChange("backupFailed", checked)}
          />
          <Checkbox
            label="Job failed"
            checked={notifyTriggers.jobFailed}
            onChange={(checked) => handleTriggerChange("jobFailed", checked)}
          />
          <Checkbox
            label="Storage connection error"
            checked={notifyTriggers.storageError}
            onChange={(checked) => handleTriggerChange("storageError", checked)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" type="button" onClick={handleSave}>
          Save Changes
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </SectionCard>
    </div>
  );
}
