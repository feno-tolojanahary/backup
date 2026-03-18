import React from "react";
import Input from "@/components/form/input/InputField";
import { FieldLabel, SectionCard, TabActions } from "../../notifications/components/SettingsShared";

export default function SystemHealthTab() {
  return (
    <SectionCard
      title="System Health"
      description="Runtime diagnostics and environment information."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel label="Working Directory Disk Usage" />
        <Input defaultValue="120 MB" disabled />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel label="Database Size" />
        <Input defaultValue="4 MB" disabled />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel label="Log Directory Size" />
        <Input defaultValue="32 MB" disabled />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel label="Daemon Status" />
        <Input defaultValue="Running" disabled />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel label="Last Daemon Start" />
        <Input defaultValue="2026-03-05 09:12" disabled />
      </div>
      <TabActions />
    </SectionCard>
  );
}
