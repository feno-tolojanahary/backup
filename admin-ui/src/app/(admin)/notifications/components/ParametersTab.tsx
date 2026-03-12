"use client";

import React, { useState } from "react";
import NotificationsTab from "@/app/(admin)/settings/components/NotificationsTab";

export default function ParametersTab() {
  const [notifyTriggers, setNotifyTriggers] = useState({
    completed: true,
    backupFailed: true,
    jobFailed: true,
    storageError: false,
  });

  return (
    <div className="space-y-4">
      <NotificationsTab
        notifyTriggers={notifyTriggers}
        setNotifyTriggers={setNotifyTriggers}
      />
    </div>
  );
}
