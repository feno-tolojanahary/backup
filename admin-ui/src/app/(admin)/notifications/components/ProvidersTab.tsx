"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import CreateNotificationProviderModal from "@/components/notifications/CreateNotificationProviderModal";
import { useModal } from "@/hooks/useModal";
import {
  ActionDropdown,
  DataTable,
  DetailDrawer,
  StatusBadge,
  statusTone,
} from "@/app/(admin)/notifications/components/NotificationsShared";

type ProviderStatus = "enabled" | "disabled";

type ProviderRecord = {
  id: number;
  name: string;
  type: string;
  config: string;
  status: ProviderStatus;
  createdAt: string;
};

const providers: ProviderRecord[] = [
  {
    id: 1,
    name: "Admin Email",
    type: "email",
    config: "smtp",
    status: "enabled",
    createdAt: "2026-03-01",
  },
  {
    id: 2,
    name: "Ops Slack",
    type: "slack",
    config: "webhook",
    status: "enabled",
    createdAt: "2026-03-02",
  },
  {
    id: 3,
    name: "Monitoring Hook",
    type: "webhook",
    config: "http",
    status: "disabled",
    createdAt: "2026-03-03",
  },
];

const providerDetails: Record<
  number,
  {
    lastUpdated: string;
    config: {
      host: string;
      port: string;
      username: string;
      senderEmail: string;
      password: string;
    };
  }
> = {
  1: {
    lastUpdated: "2026-03-08",
    config: {
      host: "smtp.company.com",
      port: "587",
      username: "alerts@company.com",
      senderEmail: "backups@company.com",
      password: "********",
    },
  },
  2: {
    lastUpdated: "2026-03-07",
    config: {
      host: "hooks.slack.com",
      port: "443",
      username: "ops-alerts",
      senderEmail: "masked",
      password: "********",
    },
  },
  3: {
    lastUpdated: "2026-03-05",
    config: {
      host: "hooks.company.com",
      port: "443",
      username: "monitoring-hook",
      senderEmail: "masked",
      password: "********",
    },
  },
};

export default function ProvidersTab() {
  const createProviderModal = useModal();
  const [openProviderMenu, setOpenProviderMenu] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRecord | null>(
    null
  );
  const [providerDrawerOpen, setProviderDrawerOpen] = useState(false);

  const openProviderDetails = (provider: ProviderRecord) => {
    setSelectedProvider(provider);
    setProviderDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Notification Providers
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage delivery channels for alerts and reports.
          </p>
        </div>
        <Button size="sm" type="button" onClick={createProviderModal.openModal}>
          Add Provider
        </Button>
      </div>

      <DataTable
        columns={[
          {
            key: "name",
            label: "Provider Name",
            sortable: true,
            cellClassName: "text-gray-700 dark:text-gray-300",
          },
          { key: "type", label: "Type", sortable: true },
          { key: "config", label: "Configuration", sortable: true },
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
                openMenuId={openProviderMenu}
                setOpenMenuId={setOpenProviderMenu}
                items={[
                  {
                    label: "View details",
                    onClick: () => openProviderDetails(row),
                  },
                  {
                    label: "Edit provider",
                    onClick: () => console.log("Edit provider", row.id),
                  },
                  {
                    label: row.status === "enabled" ? "Disable" : "Enable",
                    onClick: () => console.log("Toggle provider", row.id),
                  },
                  {
                    label: "Delete provider",
                    onClick: () => console.log("Delete provider", row.id),
                    danger: true,
                  },
                ]}
              />
            ),
          },
        ]}
        rows={providers}
        emptyMessage="No providers found."
        initialSortKey="name"
      />

      <DetailDrawer
        isOpen={providerDrawerOpen && selectedProvider !== null}
        onClose={() => setProviderDrawerOpen(false)}
        title="Provider Details"
      >
        {selectedProvider && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Provider Information
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Provider name
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedProvider.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Provider type
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedProvider.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Configuration type
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedProvider.config}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <StatusBadge tone={statusTone(selectedProvider.status)}>
                    {selectedProvider.status}
                  </StatusBadge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created date
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedProvider.createdAt}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {providerDetails[selectedProvider.id].lastUpdated}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Configuration
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(providerDetails[selectedProvider.id].config).map(
                  ([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase())}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                        {value}
                      </p>
                    </div>
                  )
                )}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Sensitive values are hidden for security.
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>

      <CreateNotificationProviderModal
        isOpen={createProviderModal.isOpen}
        onClose={createProviderModal.closeModal}
        onSubmit={(payload) =>
          console.log("Create provider from notifications page", payload)
        }
      />
    </div>
  );
}
