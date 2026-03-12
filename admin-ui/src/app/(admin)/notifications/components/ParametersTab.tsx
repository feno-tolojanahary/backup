"use client";

import React, { useState } from "react";
import NotificationsTab from "@/app/(admin)/settings/components/NotificationsTab";

export default function ParametersTab() {
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(true);
  const [notifyTriggers, setNotifyTriggers] = useState({
    completed: true,
    backupFailed: true,
    jobFailed: true,
    storageError: false,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          Notification Parameters
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure global notification behavior for this system.
        </p>
      </div>
      <NotificationsTab
        notifyEmailEnabled={notifyEmailEnabled}
        setNotifyEmailEnabled={setNotifyEmailEnabled}
        notifyTriggers={notifyTriggers}
        setNotifyTriggers={setNotifyTriggers}
      />
    </div>
  );
}
