"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import CreateNotificationProviderModal from "@/components/notifications/CreateNotificationProviderModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProviderStatus = "enabled" | "disabled";
type RuleSeverity = "info" | "warning" | "critical";
type RuleStatus = "enabled" | "disabled";
type NotificationStatus = "sent" | "failed" | "pending";

type ProviderRecord = {
  id: number;
  name: string;
  type: string;
  config: string;
  status: ProviderStatus;
  createdAt: string;
};

type RuleRecord = {
  id: number;
  name: string;
  event: string;
  provider: string;
  severity: RuleSeverity;
  status: RuleStatus;
};

type HistoryRecord = {
  id: number;
  event: string;
  provider: string;
  recipient: string;
  status: NotificationStatus;
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

type StatusBadgeProps = {
  tone: "success" | "error" | "warning" | "info" | "dark";
  children: React.ReactNode;
};

const StatusBadge = ({ tone, children }: StatusBadgeProps) => (
  <Badge size="sm" color={tone}>
    {children}
  </Badge>
);

type ActionItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

type ActionDropdownProps = {
  id: string | number;
  openMenuId: string | number | null;
  setOpenMenuId: (value: string | number | null) => void;
  items: ActionItem[];
};

const ActionDropdown = ({
  id,
  openMenuId,
  setOpenMenuId,
  items,
}: ActionDropdownProps) => (
  <div className="relative inline-flex">
    <button
      type="button"
      onClick={() => setOpenMenuId(openMenuId === id ? null : id)}
      className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
    </button>
    <Dropdown
      isOpen={openMenuId === id}
      onClose={() => setOpenMenuId(null)}
      className="w-44 p-2"
    >
      {items.map((item) => (
        <DropdownItem
          key={item.label}
          onItemClick={() => {
            setOpenMenuId(null);
            item.onClick();
          }}
          className={`flex w-full font-normal text-left rounded-lg ${
            item.danger
              ? "text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-white/5"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          }`}
        >
          {item.label}
        </DropdownItem>
      ))}
    </Dropdown>
  </div>
);

type DetailDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const DetailDrawer = ({ isOpen, onClose, title, children }: DetailDrawerProps) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] m-4">
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  </Modal>
);

type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage: string;
  minWidth?: string;
  initialSortKey?: string;
};

const DataTable = <T extends { id: number | string }>({
  columns,
  rows,
  emptyMessage,
  minWidth = "1000px",
  initialSortKey,
}: DataTableProps<T>) => {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows.length, itemsPerPage]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((col) => col.key === sortKey);
    const getValue = (row: T) =>
      column?.sortValue ? column.sortValue(row) : (row as never)[sortKey];
    return [...rows].sort((a, b) => {
      const valueA = getValue(a);
      const valueB = getValue(b);
      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }
      const stringA = String(valueA ?? "");
      const stringB = String(valueB ?? "");
      return sortDirection === "asc"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });
  }, [rows, sortKey, sortDirection, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / itemsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedRows.slice(start, start + itemsPerPage);
  }, [sortedRows, page, itemsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="max-w-full overflow-x-auto">
          <div style={{ minWidth }}>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {columns.map((column) => {
                    const isSorted = sortKey === column.key;
                    return (
                      <TableCell
                        key={column.key}
                        isHeader
                        className={`px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${column.headerClassName ?? ""}`}
                      >
                        {column.sortable ? (
                          <button
                            type="button"
                            onClick={() => handleSort(column.key)}
                            className="inline-flex items-center gap-2"
                          >
                            {column.label}
                            <span className="text-[10px] text-gray-400">
                              {isSorted
                                ? sortDirection === "asc"
                                  ? "▲"
                                  : "▼"
                                : "↕"}
                            </span>
                          </button>
                        ) : (
                          column.label
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="px-5 py-6 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                      colSpan={columns.length}
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((row) => (
                    <TableRow key={row.id}>
                      {columns.map((column) => (
                        <TableCell
                          key={`${row.id}-${column.key}`}
                          className={`px-5 py-4 text-theme-sm ${column.cellClassName ?? "text-gray-500 dark:text-gray-400"}`}
                        >
                          {column.render ? column.render(row) : (row as never)[column.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Items per page
          </span>
          <div className="w-24">
            <Select
              options={[
                { value: "5", label: "5" },
                { value: "10", label: "10" },
                { value: "25", label: "25" },
              ]}
              placeholder={`${itemsPerPage}`}
              defaultValue={`${itemsPerPage}`}
              onChange={(value) => setItemsPerPage(Number(value))}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

const tabConfig = [
  { id: "providers", label: "Providers" },
  { id: "rules", label: "Rules" },
  { id: "history", label: "History" },
];

const statusTone = (status: string) => {
  if (status === "enabled" || status === "sent") return "success";
  if (status === "failed") return "error";
  if (status === "warning") return "warning";
  if (status === "info") return "info";
  if (status === "critical") return "error";
  return "dark";
};

const parseDateTime = (value: string) => new Date(value.replace(" ", "T"));

export default function NotificationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const createProviderModal = useModal();

  const activeTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabConfig.some((tab) => tab.id === tabParam)) {
      return tabParam;
    }
    return "providers";
  }, [searchParams]);

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [openProviderMenu, setOpenProviderMenu] = useState<number | null>(null);
  const [openRuleMenu, setOpenRuleMenu] = useState<number | null>(null);
  const [openHistoryMenu, setOpenHistoryMenu] = useState<number | null>(null);

  const [selectedProvider, setSelectedProvider] = useState<ProviderRecord | null>(
    null
  );
  const [selectedRule, setSelectedRule] = useState<RuleRecord | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(
    null
  );

  const [providerDrawerOpen, setProviderDrawerOpen] = useState(false);
  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);
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

  const openProviderDetails = (provider: ProviderRecord) => {
    setSelectedProvider(provider);
    setProviderDrawerOpen(true);
  };

  const openRuleDetails = (rule: RuleRecord) => {
    setSelectedRule(rule);
    setRuleDrawerOpen(true);
  };

  const openHistoryDetails = (entry: HistoryRecord) => {
    setSelectedHistory(entry);
    setHistoryDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white/90">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure notification providers, define alert rules, and review
            notification delivery history.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => console.log("Refresh notifications")}
        >
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "providers" && (
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
            <Button
              size="sm"
              type="button"
              onClick={createProviderModal.openModal}
            >
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
                        onClick: () =>
                          console.log("Toggle provider", row.id),
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
        </div>
      )}

      {activeTab === "rules" && (
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
            <Button
              size="sm"
              type="button"
              onClick={() => console.log("Create rule")}
            >
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
        </div>
      )}

      {activeTab === "history" && (
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
        </div>
      )}

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
                {Object.entries(
                  providerDetails[selectedProvider.id].config
                ).map(([key, value]) => (
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
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Sensitive values are hidden for security.
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>

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
