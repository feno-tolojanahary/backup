"use client";

import React, { useMemo, useState } from "react";
import GeneralTab from "./components/GeneralTab";
import NotificationsTab from "./components/NotificationsTab";
import EmailTab from "./components/EmailTab";
import BackupEngineTab from "./components/BackupEngineTab";
import SecurityTab from "./components/SecurityTab";
import SystemHealthTab from "./components/SystemHealthTab";

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
      return <GeneralTab />;
    }

    if (activeTab === "notifications") {
      return (
        <NotificationsTab
          notifyEmailEnabled={notifyEmailEnabled}
          setNotifyEmailEnabled={setNotifyEmailEnabled}
          notifyTriggers={notifyTriggers}
          setNotifyTriggers={setNotifyTriggers}
        />
      );
    }

    if (activeTab === "email") {
      return (
        <EmailTab
          smtpRecipients={smtpRecipients}
          setSmtpRecipients={setSmtpRecipients}
          sesRecipients={sesRecipients}
          setSesRecipients={setSesRecipients}
        />
      );
    }

    if (activeTab === "backup-engine") {
      return <BackupEngineTab />;
    }

    if (activeTab === "security") {
      return <SecurityTab />;
    }

    return <SystemHealthTab />;
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
