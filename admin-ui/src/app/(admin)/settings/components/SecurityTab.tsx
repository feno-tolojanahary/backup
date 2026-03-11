import React from "react";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import { FieldLabel, SectionCard, TabActions } from "./SettingsShared";

export default function SecurityTab() {
  return (
    <SectionCard
      title="Security"
      description="Configure encryption and sensitive security options."
    >
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
            Enable Backup Encryption
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Encrypt backup files before upload.
          </p>
        </div>
        <Switch label="true" defaultChecked />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Encryption Key"
          description="Secret key used to encrypt backup files before upload."
        />
        <Input type="password" defaultValue="••••••••••" />
      </div>
      <TabActions />
    </SectionCard>
  );
}
