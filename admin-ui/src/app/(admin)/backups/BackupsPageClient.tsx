"use client";

import React, { useMemo, useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { MoreDotIcon } from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BackupStatus = "completed" | "failed" | "archived";

type BackupFile = {
  path: string;
  size: string;
};

type BackupRecord = {
  id: string;
  uid: string;
  job: string;
  status: BackupStatus;
  size: string;
  files: number;
  storage: string;
  createdAt: string;
  encryption: string;
  fileList: BackupFile[];
};

const backups: BackupRecord[] = [
  {
    id: "1",
    uid: "bkp_2026_03_04_0001",
    job: "mongodb-prod",
    status: "completed",
    size: "3.2 GB",
    files: 1284,
    storage: "s3",
    createdAt: "2026-03-04T09:12:00Z",
    encryption: "AES-256",
    fileList: [
      { path: "/var/lib/mongo/oplog.bson", size: "1.3 GB" },
      { path: "/var/lib/mongo/metadata.json", size: "12 KB" },
      { path: "/var/lib/mongo/data.tar", size: "1.9 GB" },
    ],
  },
  {
    id: "2",
    uid: "bkp_2026_03_03_0042",
    job: "postgres-app",
    status: "completed",
    size: "820 MB",
    files: 412,
    storage: "local",
    createdAt: "2026-03-03T22:10:00Z",
    encryption: "None",
    fileList: [
      { path: "/db/pg_base.tar", size: "780 MB" },
      { path: "/db/pg_wal.tar", size: "40 MB" },
    ],
  },
  {
    id: "3",
    uid: "bkp_2026_03_03_0007",
    job: "files-backup",
    status: "failed",
    size: "0 B",
    files: 0,
    storage: "sftp",
    createdAt: "2026-03-03T06:30:00Z",
    encryption: "AES-256",
    fileList: [{ path: "/var/data", size: "-" }],
  },
  {
    id: "4",
    uid: "bkp_2026_03_02_0018",
    job: "mongodb-prod",
    status: "archived",
    size: "3.1 GB",
    files: 1202,
    storage: "s3",
    createdAt: "2026-03-02T04:05:00Z",
    encryption: "AES-256",
    fileList: [
      { path: "/var/lib/mongo/oplog.bson", size: "1.2 GB" },
      { path: "/var/lib/mongo/data.tar", size: "1.9 GB" },
    ],
  },
];

const statusBadgeColor = (status: BackupStatus) => {
  if (status === "completed") return "success";
  if (status === "failed") return "error";
  return "dark";
};

export default function BackupsPageClient() {
  const detailsModal = useModal();
  const deleteModal = useModal();

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<BackupRecord | null>(null);

  const jobOptions = useMemo(() => {
    const uniqueJobs = Array.from(new Set(backups.map((item) => item.job)));
    return uniqueJobs.map((job) => ({ value: job, label: job }));
  }, []);

  const filteredBackups = useMemo(() => {
    return backups.filter((backup) => {
      if (
        search &&
        !backup.uid.toLowerCase().includes(search.toLowerCase().trim())
      ) {
        return false;
      }
      if (jobFilter && backup.job !== jobFilter) {
        return false;
      }
      if (statusFilter && backup.status !== statusFilter) {
        return false;
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (new Date(backup.createdAt) < from) {
          return false;
        }
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(backup.createdAt) > to) {
          return false;
        }
      }
      return true;
    });
  }, [search, jobFilter, statusFilter, dateFrom, dateTo]);

  const sortedBackups = useMemo(() => {
    return [...filteredBackups].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredBackups]);

  const totalPages = Math.max(1, Math.ceil(sortedBackups.length / itemsPerPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedBackups = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedBackups.slice(start, start + itemsPerPage);
  }, [sortedBackups, page, itemsPerPage]);

  const openDetails = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    detailsModal.openModal();
  };

  const openDeleteConfirm = (backup: BackupRecord) => {
    setDeleteTarget(backup);
    deleteModal.openModal();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      console.log("Delete backup", deleteTarget.uid);
    }
    deleteModal.closeModal();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Backups" />
      <div className="space-y-6">
        <ComponentCard
          title="Backups"
          desc="View and manage all backup snapshots created by jobs."
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Search
                </label>
                <Input
                  placeholder="Search backup UID..."
                  defaultValue={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Job
                </label>
                <Select
                  options={jobOptions}
                  placeholder="All jobs"
                  onChange={(value) => {
                    setJobFilter(value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <Select
                  options={[
                    { value: "completed", label: "completed" },
                    { value: "failed", label: "failed" },
                    { value: "archived", label: "archived" },
                  ]}
                  placeholder="All status"
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date from
                </label>
                <Input
                  type="date"
                  defaultValue={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date to
                </label>
                <Input
                  type="date"
                  defaultValue={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <Button
              size="sm"
              type="button"
              onClick={() => console.log("Refresh backups")}
            >
              Refresh
            </Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1100px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Backup UID
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Job
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Size
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Files
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Storage
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Created
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {pagedBackups.length === 0 ? (
                      <TableRow>
                        <TableCell
                          className="px-5 py-6 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                          colSpan={8}
                        >
                          No backups found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedBackups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {backup.uid}
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {backup.job}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            <Badge
                              size="sm"
                              color={statusBadgeColor(backup.status)}
                            >
                              {backup.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {backup.size}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {backup.files}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {backup.storage}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                            {new Date(backup.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="relative inline-flex">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === backup.id ? null : backup.id
                                  )
                                }
                                className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                              </button>
                              <Dropdown
                                isOpen={openMenuId === backup.id}
                                onClose={() => setOpenMenuId(null)}
                                className="w-44 p-2"
                              >
                                <DropdownItem
                                  onItemClick={() => {
                                    setOpenMenuId(null);
                                    openDetails(backup);
                                  }}
                                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                  View details
                                </DropdownItem>
                                <DropdownItem
                                  onItemClick={() => {
                                    setOpenMenuId(null);
                                    console.log("Restore backup", backup.uid);
                                  }}
                                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                  Restore backup
                                </DropdownItem>
                                <DropdownItem
                                  onItemClick={() => {
                                    setOpenMenuId(null);
                                    console.log("Download backup", backup.uid);
                                  }}
                                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                  Download
                                </DropdownItem>
                                <DropdownItem
                                  onItemClick={() => {
                                    setOpenMenuId(null);
                                    openDeleteConfirm(backup);
                                  }}
                                  className="flex w-full font-normal text-left text-error-600 rounded-lg hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-white/5"
                                >
                                  Delete backup
                                </DropdownItem>
                              </Dropdown>
                            </div>
                          </TableCell>
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
              <div className="w-28">
                <Select
                  options={[
                    { value: "25", label: "25" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                  placeholder={`${itemsPerPage}`}
                  onChange={(value) => {
                    setItemsPerPage(Number(value));
                    setPage(1);
                  }}
                  defaultValue={`${itemsPerPage}`}
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
        </ComponentCard>
      </div>

      <Modal
        isOpen={detailsModal.isOpen}
        onClose={detailsModal.closeModal}
        className="max-w-[900px] m-4"
      >
        {selectedBackup && (
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Backup details
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Backup UID: {selectedBackup.uid}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Job name
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBackup.job}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <div className="mt-2">
                  <Badge
                    size="sm"
                    color={statusBadgeColor(selectedBackup.status)}
                  >
                    {selectedBackup.status}
                  </Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Created
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                  {new Date(selectedBackup.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Size
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBackup.size}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  File count
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBackup.files}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Storage destination
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBackup.storage}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Encryption status
                </p>
                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedBackup.encryption}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Files
              </h4>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[500px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell
                            isHeader
                            className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            File path
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            Size
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {selectedBackup.fileList.map((file) => (
                          <TableRow key={file.path}>
                            <TableCell className="px-4 py-3 text-gray-600 text-theme-sm dark:text-gray-300">
                              {file.path}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                              {file.size}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={detailsModal.closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-w-[520px] m-4"
      >
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delete backup {deleteTarget?.uid} ?
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This action permanently removes the backup and its files.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={deleteModal.closeModal}
            >
              Cancel
            </Button>
            <Button size="sm" type="button" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
