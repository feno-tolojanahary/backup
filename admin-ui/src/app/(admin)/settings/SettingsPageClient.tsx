"use client";

import React, { useMemo, useState } from "react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

type TabKey =
  | "general"
  | "notifications"
  | "email"
  | "backup-engine"
  | "security"
  | "system-health";

const tabs: { key: TabKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "notifications", label: "Notifications" },
  { key: "email", label: "Email" },
  { key: "backup-engine", label: "Backup Engine" },
  { key: "security", label: "Security" },
  { key: "system-health", label: "System Health" },
];

const FieldLabel = ({ label, description }: { label: string; description?: string }) => (
  <div className="space-y-1">
    <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
      {label}
    </p>
    {description ? (
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    ) : null}
  </div>
);

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
    </div>
    <div className="space-y-6 p-6">{children}</div>
  </div>
);

const TabActions = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm" type="button">
      Save Changes
    </Button>
    <Button size="sm" variant="outline" type="button">
      Cancel
    </Button>
  </div>
);

export default function SettingsPageClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(true);
  const [notifyTriggers, setNotifyTriggers] = useState({
    completed: true,
    backupFailed: true,
    jobFailed: true,
    storageError: false,
  });
  const [smtpRecipients, setSmtpRecipients] = useState(
    "admin@company.com\nops@company.com"
  );
  const [sesRecipients, setSesRecipients] = useState(
    "alerts@company.com\nadmin@company.com"
  );

  const tabContent = useMemo(() => {
    if (activeTab === "general") {
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

    if (activeTab === "notifications") {
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

    if (activeTab === "email") {
      return (
        <div className="space-y-6">
          <SectionCard title="SMTP Configuration">
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="SMTP Host" />
              <Input defaultValue="smtp.mailserver.com" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:items-center">
              <div className="space-y-2">
                <FieldLabel label="SMTP Port" />
                <Input type="number" defaultValue="587" />
              </div>
              <div className="space-y-2">
                <FieldLabel label="Secure Connection" />
                <Switch label="true" defaultChecked />
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="Authentication Username" />
              <Input defaultValue="backup-system" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="Authentication Password" />
              <Input type="password" defaultValue="••••••••••" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="From Email Address" />
              <Input defaultValue="backup-system@company.com" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="Recipients" />
              <TextArea
                rows={4}
                value={smtpRecipients}
                onChange={setSmtpRecipients}
              />
            </div>
            <TabActions />
          </SectionCard>

          <SectionCard title="Amazon SES Configuration">
            <div className="grid gap-5 sm:grid-cols-2 lg:items-center">
              <div className="space-y-2">
                <FieldLabel label="AWS Region" />
                <Input defaultValue="us-east-1" />
              </div>
              <div className="space-y-2">
                <FieldLabel label="Port" />
                <Input type="number" defaultValue="587" />
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="Access Key ID" />
              <Input defaultValue="AKIA••••••••" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="Secret Access Key" />
              <Input type="password" defaultValue="••••••••••" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:items-center">
              <FieldLabel label="Recipients" />
              <TextArea
                rows={4}
                value={sesRecipients}
                onChange={setSesRecipients}
              />
            </div>
            <TabActions />
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "backup-engine") {
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

    if (activeTab === "security") {
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
  }, [
    activeTab,
    notifyEmailEnabled,
    notifyTriggers,
    smtpRecipients,
    sesRecipients,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white/90">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure global system behavior, notifications, backup engine settings,
          and security.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.12]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabContent}
    </div>
  );
}
