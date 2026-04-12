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
import { statusBadgeColor } from "./components/BackupsTypes";
import { useBackupList } from "@/handlers/backups/backupHooks";
import { Backup } from "@/handlers/backups/type";
import { useJobList } from "@/handlers/jobs/jobHooks";


export default function BackupsPageClient() {
  const detailsModal = useModal();
  const deleteModal = useModal();

  const { data: backups } = useBackupList();
  const { data: jobs } = useJobList();

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);

  const jobOptions = useMemo(() => {
    return jobs.map((job) => ({ label: job.name, value: `${job.id}` }));
  }, [jobs]);

  const filteredBackups = useMemo(() => {
    return backups.filter((backup) => {
      if (
        search &&
        !backup.name.toLowerCase().includes(search.toLowerCase().trim())
      ) {
        return false;
      }
      if (jobFilter && `${backup.jobId}` !== jobFilter) {
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
  }, [backups, search, jobFilter, statusFilter, dateFrom, dateTo]);

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

  const openDetails = (backup: Backup) => {
    setSelectedBackup(backup);
    detailsModal.openModal();
  };

  const openDeleteConfirm = (backup: Backup) => {
    setDeleteTarget(backup);
    deleteModal.openModal();
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
              console.log("Restore backup", backup.backupUid)
            }
            onDownload={(backup) =>
              console.log("Download backup", backup.backupUid)
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
        deleteTarget={deleteTarget}
      />
    </div>
  );
}
