import React from "react";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import { FieldLabel, SectionCard, TabActions } from "../../notifications/components/SettingsShared";

export default function BackupEngineTab() {
  return (
    <SectionCard
      title="Backup Engine"
      description="Configure global backup behavior and scheduling."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Default Cron Schedule"
          description="Cron expression controlling background job scheduling."
        />
        <Input placeholder="0 */6 * * *" defaultValue="" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Retention Time"
          description="Default retention time in milliseconds."
        />
        <Input type="number" defaultValue="86400000" />
      </div>
      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <FieldLabel label="Granular Retention Policy" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <FieldLabel label="Daily backups to keep" />
            <Input type="number" defaultValue="6" />
          </div>
          <div className="space-y-2">
            <FieldLabel label="Weekly backups to keep" />
            <Input type="number" defaultValue="2" />
          </div>
          <div className="space-y-2">
            <FieldLabel label="Monthly backups to keep" />
            <Input type="number" defaultValue="1" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
            Enable Remote Server Sync
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Allow synchronization of backups to remote hosts.
          </p>
        </div>
        <Switch label="true" defaultChecked />
      </div>
      <TabActions />
    </SectionCard>
  );
}
