"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const statusTone = (status: string) => {
  if (status === "enabled" || status === "sent") return "success";
  if (status === "failed") return "error";
  if (status === "warning") return "warning";
  if (status === "info") return "info";
  if (status === "critical") return "error";
  return "dark";
};

type StatusBadgeProps = {
  tone: "success" | "error" | "warning" | "info" | "dark";
  children: React.ReactNode;
};

export const StatusBadge = ({ tone, children }: StatusBadgeProps) => (
  <Badge size="sm" color={tone}>
    {children}
  </Badge>
);

export type ActionItem = {
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

export const ActionDropdown = ({
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

export const DetailDrawer = ({
  isOpen,
  onClose,
  title,
  children,
}: DetailDrawerProps) => (
  <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] m-4">
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  </Modal>
);

export type Column<T> = {
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

export const DataTable = <T extends { id: number | string }>({
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
