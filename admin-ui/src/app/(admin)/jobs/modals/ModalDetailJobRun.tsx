"use client";

import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
import { Job, JobRun } from "@/handlers/jobs/type";
import moment from "moment";

type RunStatus = JobRun["status"];

const statusBadgeColor = (status: RunStatus) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  // if (status === "pending") return "dark";
  return "warning";
};

type ModalPropsType = { 
    job: Job, 
    selectedRun: JobRun, 
    isOpen: boolean,
    onClose: () => void
}

export default function ModalDetailJobRun({ job, selectedRun, isOpen, onClose }: ModalPropsType) {

    return (
      <Modal
        isOpen={isOpen}
        className="mx-4 max-h-[90vh] max-w-5xl overflow-hidden"
        onClose={onClose}
      >
        {selectedRun && (
          <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Run Details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Run ID</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{selectedRun.id}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Job Name</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{job.name}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
                <div className="mt-1">
                  <Badge size="sm" color={statusBadgeColor(selectedRun.status)}>
                    {selectedRun.status}
                  </Badge>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Started At</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{moment(selectedRun.startedAt).format("YYYY-MM-DD hh:mm")}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Finished At</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{moment(selectedRun.finishedAt).format("YYYY-MM-DD hh:mm")}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{selectedRun.duration}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Error message</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedRun.errorMessage ?? "-"}</p>
            </div>
            {/* <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Produced Backups</h4>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        {[
                          "Backup UID",
                          "Size",
                          "Storage",
                          "Created At",
                        ].map((title) => (
                          <TableCell
                            key={title}
                            isHeader
                            className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            {title}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {selectedRunBackups.length === 0 ? (
                        <TableRow>
                          <TableCell
                            className="px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400"
                            colSpan={4}
                          >
                            No backups produced for this run.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedRunBackups.map((backup) => (
                          <TableRow key={backup.uid}>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.uid}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.size}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.storage}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                              {backup.createdAt}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div> */}
            {/* <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Execution Logs</h4>
              <div className="mt-3 h-56 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">{selectedRunLogs.join("\n")}</pre>
              </div>
            </div> */}
          </div>
        )}
      </Modal>
    )
}