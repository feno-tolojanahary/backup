import React from "react";
import Input from "@/components/form/input/InputField";
import { FieldLabel, SectionCard, TabActions } from "../../notifications/components/SettingsShared";

export default function GeneralTab() {
  return (
    <SectionCard
      title="System Directories"
      description="Configure system directories and runtime paths."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Working Directory"
          description="Temporary directory used to store backup files before upload."
        />
        <Input defaultValue="/app/output" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Data Directory"
          description="Directory containing system data and the local database."
        />
        <Input defaultValue="/app/data" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Log Directory"
          description="Directory where application logs are written."
        />
        <Input defaultValue="/app/log" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Daemon Output Log"
          description="File path for daemon standard output."
        />
        <Input defaultValue="/app/log/daemon.log" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
        <FieldLabel
          label="Daemon Error Log"
          description="File path for daemon error output."
        />
        <Input defaultValue="/app/log/daemon.log" />
      </div>
      <TabActions />
    </SectionCard>
  );
}
