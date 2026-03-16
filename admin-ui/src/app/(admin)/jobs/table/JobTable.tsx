import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ModalDeleteJob from "../modals/ModalDeleteJob";
import { Job } from "@/handlers/jobs/type";
import JobTableRaw from "./JobTableRow";

type JobTableProps = {
  filteredJobs: Job[];
  handleEdit: (job: Job) => void;
}

export default function JobTable({
  filteredJobs
}: JobTableProps) {
  const [isOpenDeleteJob, setIsOpenDeleteJob] = useState(false);
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);

  const handleDelete = (job: Job) => {
    setDeleteJob(job);
    setIsOpenDeleteJob(true);
  }
  
  return (
    <div className="min-w-[1100px]">
      <Table>
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Job Name
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Source
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Destinations
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Schedule
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Last Run
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Enabled
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
          {filteredJobs.length === 0 ? (
            <TableRow>
              <TableCell
                className="px-5 py-6 text-center text-gray-500 text-theme-sm dark:text-gray-400"
                colSpan={8}
              >
                No jobs found.
              </TableCell>
            </TableRow>
          ) : (
            filteredJobs.map((job: Job) => (
                <JobTableRaw
                  key={job.id}
                  job={job}
                  handleDelete={handleDelete}
                />
            ))
          )}
        </TableBody>
      </Table>
      <ModalDeleteJob
        deleteJob={deleteJob}
        isOpen={isOpenDeleteJob}
        onClose={() => {
          setIsOpenDeleteJob(false);
          setDeleteJob(null);
        }}
      />
    </div>
  )
}