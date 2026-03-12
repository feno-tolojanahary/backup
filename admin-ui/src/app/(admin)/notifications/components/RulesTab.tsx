"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import CreateNotificationRuleModal from "@/components/notifications/CreateNotificationRuleModal";
import { useModal } from "@/hooks/useModal";
import {
  ActionDropdown,
  DataTable,
  DetailDrawer,
  StatusBadge,
  statusTone,
} from "@/app/(admin)/notifications/components/NotificationsShared";

type RuleSeverity = "info" | "warning" | "critical";
type RuleStatus = "enabled" | "disabled";

type RuleRecord = {
  id: number;
  name: string;
  event: string;
  provider: string;
  severity: RuleSeverity;
  status: RuleStatus;
};

const rules: RuleRecord[] = [
  {
    id: 1,
    name: "Backup Failure Alert",
    event: "backup_failed",
    provider: "Admin Email",
    severity: "critical",
    status: "enabled",
  },
  {
    id: 2,
    name: "Job Failure Alert",
    event: "job_failed",
    provider: "Ops Slack",
    severity: "critical",
    status: "enabled",
  },
  {
    id: 3,
    name: "Storage Usage Warning",
    event: "storage_high_usage",
    provider: "Ops Slack",
    severity: "warning",
    status: "enabled",
  },
  {
    id: 4,
    name: "Backup Success Info",
    event: "job_completed",
    provider: "Admin Email",
    severity: "info",
    status: "enabled",
  },
];

const ruleDetails: Record<
  number,
  {
    target: string;
    retryThreshold: string;
    storageThreshold: string;
  }
> = {
  1: {
    target: "production backups",
    retryThreshold: "3 failures",
    storageThreshold: "N/A",
  },
  2: {
    target: "scheduled jobs",
    retryThreshold: "2 failures",
    storageThreshold: "N/A",
  },
  3: {
    target: "s3-default",
    retryThreshold: "N/A",
    storageThreshold: "85%",
  },
  4: {
    target: "all jobs",
    retryThreshold: "N/A",
    storageThreshold: "N/A",
  },
};

export default function RulesTab() {
  const createRuleModal = useModal();
  const [openRuleMenu, setOpenRuleMenu] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<RuleRecord | null>(null);
  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);

  const openRuleDetails = (rule: RuleRecord) => {
    setSelectedRule(rule);
    setRuleDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Notification Rules
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define which events trigger notifications.
          </p>
        </div>
        <Button size="sm" type="button" onClick={createRuleModal.openModal}>
          Create Rule
        </Button>
      </div>

      <DataTable
        columns={[
          {
            key: "name",
            label: "Rule Name",
            sortable: true,
            cellClassName: "text-gray-700 dark:text-gray-300",
          },
          { key: "event", label: "Event", sortable: true },
          { key: "provider", label: "Provider", sortable: true },
          {
            key: "severity",
            label: "Severity",
            sortable: true,
            render: (row) => (
              <StatusBadge tone={statusTone(row.severity)}>
                {row.severity}
              </StatusBadge>
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
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <ActionDropdown
                id={row.id}
                openMenuId={openRuleMenu}
                setOpenMenuId={setOpenRuleMenu}
                items={[
                  {
                    label: "View rule",
                    onClick: () => openRuleDetails(row),
                  },
                  {
                    label: "Edit rule",
                    onClick: () => console.log("Edit rule", row.id),
                  },
                  {
                    label: "Disable rule",
                    onClick: () => console.log("Disable rule", row.id),
                  },
                  {
                    label: "Delete rule",
                    onClick: () => console.log("Delete rule", row.id),
                    danger: true,
                  },
                ]}
              />
            ),
          },
        ]}
        rows={rules}
        emptyMessage="No rules found."
        initialSortKey="name"
      />

      <DetailDrawer
        isOpen={ruleDrawerOpen && selectedRule !== null}
        onClose={() => setRuleDrawerOpen(false)}
        title="Rule Details"
      >
        {selectedRule && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Rule Information
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rule name
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedRule.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Event type
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedRule.event}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Provider
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedRule.provider}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Severity
                  </p>
                  <StatusBadge tone={statusTone(selectedRule.severity)}>
                    {selectedRule.severity}
                  </StatusBadge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enabled
                  </p>
                  <StatusBadge tone={statusTone(selectedRule.status)}>
                    {selectedRule.status}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Conditions
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Target
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {ruleDetails[selectedRule.id].target}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Retry threshold
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {ruleDetails[selectedRule.id].retryThreshold}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Storage usage threshold
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {ruleDetails[selectedRule.id].storageThreshold}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      <CreateNotificationRuleModal
        isOpen={createRuleModal.isOpen}
        onClose={createRuleModal.closeModal}
        onSubmit={(payload) =>
          console.log("Create rule from notifications page", payload)
        }
      />
    </div>
  );
}
