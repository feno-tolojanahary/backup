"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { BoxIcon, FolderIcon, PlugInIcon, MoreDotIcon } from "@/icons";
import { storages, StorageRecord, StorageStatus } from "./data";

const statusBadgeColor = (status: StorageStatus) => {
  if (status === "connected") return "success";
  if (status === "error") return "error";
  return "dark";
};

const parseStorageToGB = (value: string) => {
  const match = value.trim().match(/^([\d.]+)\s*(KB|MB|GB|TB|PB)$/i);
  if (!match) return 0;

  const amount = Number.parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (Number.isNaN(amount)) return 0;
  if (unit === "KB") return amount / (1024 * 1024);
  if (unit === "MB") return amount / 1024;
  if (unit === "GB") return amount;
  if (unit === "TB") return amount * 1024;
  if (unit === "PB") return amount * 1024 * 1024;

  return 0;
};

const usagePercent = (used: string, capacity?: string) => {
  if (!capacity) return 0;

  const usedGB = parseStorageToGB(used);
  const capacityGB = parseStorageToGB(capacity);
  if (!capacityGB) return 0;

  return Math.min(100, Math.max(0, (usedGB / capacityGB) * 100));
};

export default function StoragesPageClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<StorageRecord | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<StorageRecord | null>(null);

  const testModal = useModal();
  const deleteModal = useModal();

  const filteredStorages = useMemo(() => {
    return storages.filter((storage) => {
      if (
        search &&
        !storage.name.toLowerCase().includes(search.toLowerCase().trim())
      ) {
        return false;
      }
      if (typeFilter && storage.type !== typeFilter) return false;
      if (statusFilter && storage.status !== statusFilter) return false;
      return true;
    });
  }, [search, typeFilter, statusFilter]);

  const openTestConnection = (storage: StorageRecord) => {
    setSelectedStorage(storage);
    testModal.openModal();
  };

  const openDeleteConfirm = (storage: StorageRecord) => {
    setDeleteTarget(storage);
    deleteModal.openModal();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      console.log("Delete storage", deleteTarget.id);
    }
    deleteModal.closeModal();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Storages" />
      <div className="space-y-6">
        <ComponentCard
          title="Storages"
          desc="Manage backup storage destinations."
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Search
                </label>
                <Input
                  placeholder="Search storage name..."
                  defaultValue={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Storage type
                </label>
                <Select
                  options={[
                    { value: "local", label: "local" },
                    { value: "s3", label: "s3" },
                    { value: "sftp", label: "sftp" },
                  ]}
                  placeholder="All types"
                  onChange={(value) => setTypeFilter(value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <Select
                  options={[
                    { value: "connected", label: "connected" },
                    { value: "error", label: "error" },
                    { value: "unknown", label: "unknown" },
                  ]}
                  placeholder="All status"
                  onChange={(value) => setStatusFilter(value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => console.log("Refresh storages")}
              >
                Refresh
              </Button>
              <Link href="/storages/new">
                <Button size="sm" type="button">
                  Add Storage
                </Button>
              </Link>
            </div>
          </div>

          {storages.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No storage configured yet.
              </p>
              <Link href="/storages/new">
                <Button size="sm" type="button">
                  Add Storage
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStorages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 sm:col-span-2 xl:col-span-3">
                  No storages match these filters.
                </div>
              ) : (
                filteredStorages.map((storage) => {
                  const capacityUsage = usagePercent(
                    storage.totalUsed,
                    storage.totalCapacity
                  );

                  return (
                    <div
                      key={storage.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {storage.type === "s3" ? (
                            <BoxIcon />
                          ) : storage.type === "sftp" ? (
                            <PlugInIcon />
                          ) : (
                            <FolderIcon />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
                            {storage.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {storage.type.toUpperCase()} storage
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge size="sm" color={statusBadgeColor(storage.status)}>
                          {storage.status}
                        </Badge>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === storage.id ? null : storage.id
                              )
                            }
                            className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                          </button>
                          <Dropdown
                            isOpen={openMenuId === storage.id}
                            onClose={() => setOpenMenuId(null)}
                            className="w-44 p-2"
                          >
                            <DropdownItem
                              tag="a"
                              href={`/storages/${storage.id}`}
                              onItemClick={() => setOpenMenuId(null)}
                              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              View details
                            </DropdownItem>
                            <DropdownItem
                              onItemClick={() => {
                                setOpenMenuId(null);
                                openTestConnection(storage);
                              }}
                              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              Test connection
                            </DropdownItem>
                            <DropdownItem
                              tag="a"
                              href={`/storages/${storage.id}/edit`}
                              onItemClick={() => setOpenMenuId(null)}
                              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              Edit storage
                            </DropdownItem>
                            <DropdownItem
                              onItemClick={() => {
                                setOpenMenuId(null);
                                openDeleteConfirm(storage);
                              }}
                              className="flex w-full font-normal text-left text-error-600 rounded-lg hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-white/5"
                            >
                              Delete storage
                            </DropdownItem>
                          </Dropdown>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        Storage type: <span className="text-gray-800 dark:text-white/80">{storage.type}</span>
                      </p>
                      <p>
                        Configuration: <span className="text-gray-800 dark:text-white/80">{storage.configName}</span>
                      </p>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Capacity
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {Math.round(capacityUsage)}%
                          </span>
                        </div>
                        <div className="relative h-2 w-full rounded-sm bg-gray-200 dark:bg-gray-800">
                          <div
                            className="absolute left-0 top-0 h-full rounded-sm bg-brand-500"
                            style={{ width: `${capacityUsage}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {storage.totalUsed} used
                          {storage.totalCapacity
                            ? ` / ${storage.totalCapacity} total`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {storage.type === "s3" && (
                        <>
                          <p>Endpoint: {storage.endpoint}</p>
                          <p>Bucket: {storage.bucket}</p>
                        </>
                      )}
                      {storage.type === "sftp" && (
                        <>
                          <p>Host: {storage.host}</p>
                          <p>Folder: {storage.folder}</p>
                        </>
                      )}
                      {storage.type === "local" && <p>Folder: {storage.folder}</p>}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => openTestConnection(storage)}
                      >
                        Test connection
                      </Button>
                    </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </ComponentCard>
      </div>

      <Modal
        isOpen={testModal.isOpen}
        onClose={testModal.closeModal}
        className="max-w-[520px] m-4"
      >
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Test connection
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Storage: {selectedStorage?.name}
          </p>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            {selectedStorage?.lastTestStatus === "success" && (
              <p className="text-success-600">Connection successful.</p>
            )}
            {selectedStorage?.lastTestStatus === "failed" && (
              <>
                <p className="text-error-600">Connection failed.</p>
                {selectedStorage.lastTestMessage && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {selectedStorage.lastTestMessage}
                  </p>
                )}
              </>
            )}
            {selectedStorage?.lastTestStatus === "unknown" && (
              <p className="text-gray-600 dark:text-gray-400">
                Connection status unknown.
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline" type="button" onClick={testModal.closeModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-w-[520px] m-4"
      >
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delete storage {deleteTarget?.name} ?
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Backups referencing this storage may become inaccessible.
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
