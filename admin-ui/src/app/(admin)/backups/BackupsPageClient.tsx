"use client";

import React, { useMemo, useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { useModal } from "@/hooks/useModal";
import BackupsFilters from "./components/BackupsFilters";
import BackupsTable from "./components/BackupsTable";
import BackupsPagination from "./components/BackupsPagination";
import BackupDetailsModal from "./components/BackupDetailsModal";
import BackupDeleteModal from "./components/BackupDeleteModal";
import { BackupRecord, statusBadgeColor } from "./components/BackupsTypes";

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
          <BackupsFilters
            search={search}
            setSearch={setSearch}
            setJobFilter={setJobFilter}
            setStatusFilter={setStatusFilter}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            jobOptions={jobOptions}
            onRefresh={() => console.log("Refresh backups")}
            onResetPage={() => setPage(1)}
          />

          <BackupsTable
            pagedBackups={pagedBackups}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onOpenDetails={openDetails}
            onOpenDelete={openDeleteConfirm}
            onRestore={(backup) =>
              console.log("Restore backup", backup.uid)
            }
            onDownload={(backup) =>
              console.log("Download backup", backup.uid)
            }
            statusBadgeColor={statusBadgeColor}
          />

          <BackupsPagination
            itemsPerPage={itemsPerPage}
            setItemsPerPage={(value) => {
              setItemsPerPage(value);
              setPage(1);
            }}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </ComponentCard>
      </div>

      <BackupDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={detailsModal.closeModal}
        backup={selectedBackup}
        statusBadgeColor={statusBadgeColor}
      />

      <BackupDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleDelete}
        deleteTarget={deleteTarget}
      />
    </div>
  );
}
