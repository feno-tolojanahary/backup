"use client";

import React, { useMemo, useState } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import {
  ActionDropdown,
  DataTable,
  DetailDrawer,
  StatusBadge,
  statusTone,
} from "@/app/(admin)/notifications/components/NotificationsShared";

type NotificationStatus = "sent" | "failed" | "pending";

type HistoryRecord = {
  id: number;
  event: string;
  provider: string;
  recipient: string;
  status: NotificationStatus;
  createdAt: string;
};

const history: HistoryRecord[] = [
  {
    id: 9241,
    event: "backup_failed",
    provider: "email",
    recipient: "admin@company.com",
    status: "sent",
    createdAt: "2026-03-10 12:02",
  },
  {
    id: 9240,
    event: "job_completed",
    provider: "slack",
    recipient: "#ops-alerts",
    status: "sent",
    createdAt: "2026-03-10 11:10",
  },
  {
    id: 9239,
    event: "backup_failed",
    provider: "email",
    recipient: "admin@company.com",
    status: "failed",
    createdAt: "2026-03-10 10:55",
  },
];

const notificationPayloads: Record<
  number,
  {
    subject: string;
    message: string;
    metadata: string;
  }
> = {
  9241: {
    subject: "Backup failed on mongodb-prod",
    message:
      "Backup job mongodb-prod failed after 3 retries. Please investigate the backup logs.",
    metadata: "{ job: mongodb-prod, retries: 3, region: us-east }",
  },
  9240: {
    subject: "Job completed successfully",
    message: "Job app1-backup completed and uploaded to s3-default.",
    metadata: "{ job: app1-backup, duration: 4m10s, size: 820MB }",
  },
  9239: {
    subject: "Backup failed on postgres-app",
    message: "Backup job postgres-app failed due to connection timeout.",
    metadata: "{ job: postgres-app, retries: 2, error: timeout }",
  },
};

const parseDateTime = (value: string) => new Date(value.replace(" ", "T"));

export default function HistoryTab() {
  const [openHistoryMenu, setOpenHistoryMenu] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(
    null
  );
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const [historySearch, setHistorySearch] = useState("");
  const [historyEvent, setHistoryEvent] = useState("all");
  const [historyProvider, setHistoryProvider] = useState("all");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const historyEvents = useMemo(
    () => Array.from(new Set(history.map((item) => item.event))),
    []
  );
  const historyProviders = useMemo(
    () => Array.from(new Set(history.map((item) => item.provider))),
    []
  );

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (
        historySearch &&
        !item.event.toLowerCase().includes(historySearch.toLowerCase().trim()) &&
        !item.recipient.toLowerCase().includes(historySearch.toLowerCase().trim())
      ) {
        return false;
      }
      if (historyEvent !== "all" && item.event !== historyEvent) return false;
      if (historyProvider !== "all" && item.provider !== historyProvider)
        return false;
      if (historyStatus !== "all" && item.status !== historyStatus)
        return false;
      if (historyFrom && parseDateTime(item.createdAt) < new Date(historyFrom))
        return false;
      if (historyTo) {
        const end = new Date(historyTo);
        end.setHours(23, 59, 59, 999);
        if (parseDateTime(item.createdAt) > end) return false;
      }
      return true;
    });
  }, [
    historySearch,
    historyEvent,
    historyProvider,
    historyStatus,
    historyFrom,
    historyTo,
  ]);

  const openHistoryDetails = (entry: HistoryRecord) => {
    setSelectedHistory(entry);
    setHistoryDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          Notification History
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review recently delivered notifications and delivery status.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Search
          </label>
          <Input
            placeholder="Search by event or recipient"
            defaultValue={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Event
          </label>
          <Select
            options={[
              { value: "all", label: "All events" },
              ...historyEvents.map((event) => ({
                value: event,
                label: event,
              })),
            ]}
            defaultValue="all"
            placeholder="All events"
            onChange={(value) => setHistoryEvent(value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Provider
          </label>
          <Select
            options={[
              { value: "all", label: "All providers" },
              ...historyProviders.map((provider) => ({
                value: provider,
                label: provider,
              })),
            ]}
            defaultValue="all"
            placeholder="All providers"
            onChange={(value) => setHistoryProvider(value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Status
          </label>
          <Select
            options={[
              { value: "all", label: "All status" },
              { value: "sent", label: "sent" },
              { value: "failed", label: "failed" },
              { value: "pending", label: "pending" },
            ]}
            defaultValue="all"
            placeholder="All status"
            onChange={(value) => setHistoryStatus(value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            From
          </label>
          <Input
            type="date"
            defaultValue={historyFrom}
            onChange={(e) => setHistoryFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            To
          </label>
          <Input
            type="date"
            defaultValue={historyTo}
            onChange={(e) => setHistoryTo(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "id",
            label: "ID",
            sortable: true,
            cellClassName: "text-gray-700 dark:text-gray-300",
          },
          { key: "event", label: "Event", sortable: true },
          { key: "provider", label: "Provider", sortable: true },
          {
            key: "recipient",
            label: "Recipient",
            render: (row) =>
              row.recipient.includes("@") ? (
                <a
                  href={`mailto:${row.recipient}`}
                  className="text-brand-500 hover:underline"
                >
                  {row.recipient}
                </a>
              ) : (
                row.recipient
              ),
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (row) => (
              <StatusBadge tone={statusTone(row.status)}>
                {row.status}
              </StatusBadge>
            ),
          },
          { key: "createdAt", label: "Created At", sortable: true },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <ActionDropdown
                id={row.id}
                openMenuId={openHistoryMenu}
                setOpenMenuId={setOpenHistoryMenu}
                items={[
                  {
                    label: "View notification",
                    onClick: () => openHistoryDetails(row),
                  },
                  {
                    label: "Retry sending",
                    onClick: () => console.log("Retry notification", row.id),
                  },
                ]}
              />
            ),
          },
        ]}
        rows={filteredHistory}
        emptyMessage="No notifications found."
        initialSortKey="createdAt"
      />

      <DetailDrawer
        isOpen={historyDrawerOpen && selectedHistory !== null}
        onClose={() => setHistoryDrawerOpen(false)}
        title="Notification Details"
      >
        {selectedHistory && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Notification
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Event
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedHistory.event}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Provider
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedHistory.provider}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recipient
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedHistory.recipient}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <StatusBadge tone={statusTone(selectedHistory.status)}>
                    {selectedHistory.status}
                  </StatusBadge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created At
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedHistory.createdAt}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Payload
              </h4>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Subject
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {notificationPayloads[selectedHistory.id].subject}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Message
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {notificationPayloads[selectedHistory.id].message}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Metadata
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {notificationPayloads[selectedHistory.id].metadata}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
