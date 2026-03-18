"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import UpsertNotificationProviderModal from "@/app/(admin)/notifications/modals/UpsertNotificationProviderModal";
import { useModal } from "@/hooks/useModal";
import {
  ActionDropdown,
  DataTable,
  DetailDrawer,
  StatusBadge,
  statusTone,
} from "@/app/(admin)/notifications/components/NotificationsShared";
import { useListNotificationProviders, useUdpateNotificationProvider } from "@/handlers/notifications/notification-providers/notificationProviderHooks";
import { NotificationProvider } from "@/handlers/notifications/notification-providers/type";
import { useToast } from "@/context/ToastContext";
import DeleteNotificationProviderModal from "../modals/DeleteNotificationProviderModal";

export default function ProvidersTab() {
  const upsertProviderModal = useModal();
  const [openProviderMenu, setOpenProviderMenu] = useState<number | string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<NotificationProvider | null>(
    null
  );
  const [providerDrawerOpen, setProviderDrawerOpen] = useState(false);
  const { data: providers } = useListNotificationProviders();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const { toastError } = useToast();
  
  const { update: updateProvider } = useUdpateNotificationProvider();

  const openProviderDetails = (provider: NotificationProvider) => {
    setSelectedProvider(provider);
    setProviderDrawerOpen(true);
  };

  const handleToggleEnable = async (provider: NotificationProvider) => {
    try { 
      const update = {
        isEnable: provider.isEnable
      }
      const res = await updateProvider(provider.id, update);
      if (!res)
        throw new Error("Error when updating provider.");
    } catch (error: any) {
      console.log("Error update: ", error.message);
      toastError();
    }
  }

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
        <Button size="sm" type="button" onClick={upsertProviderModal.openModal}>
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
                {row.status === "connected" ? "Connected" : "Disconnected"}
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
                    onClick: () => {
                      setSelectedProvider(row);
                      upsertProviderModal.openModal();                      
                    },
                  },
                  {
                    label: row.status === "enabled" ? "Disable" : "Enable",
                    onClick: () => handleToggleEnable(row),
                  },
                  {
                    label: "Delete provider",
                    onClick: () => {
                      setSelectedProvider(row);
                      setOpenDeleteModal(true);
                    },
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
                    {selectedProvider.type.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <StatusBadge tone={statusTone(selectedProvider.status)}>
                    {selectedProvider.status.toUpperCase()}
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
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Configuration
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(selectedProvider.config).map(
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

      <UpsertNotificationProviderModal
        isOpen={upsertProviderModal.isOpen}
        onClose={upsertProviderModal.closeModal}
        notificationProvider={selectedProvider}
        onSubmit={(payload) =>
          console.log("Create provider from notifications page", payload)
        }
      />
      <DeleteNotificationProviderModal 
        isOpen={openDeleteModal}
        onClose={() => {}}
        deleteNotification={selectedProvider}    
      />
    </div>
  );
}
