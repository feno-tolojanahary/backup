import React, { useEffect, useRef, useState } from "react";
// import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import {
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { Job, JobRunStatus } from "@/handlers/jobs/type";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useAbortJob, useRunJob, useUpdateJob } from "@/handlers/jobs/jobHooks";
import Switch from "@/components/form/switch/Switch";
import Badge from "@/components/ui/badge/Badge";

type TableRowProps = {
    job: Job;
    handleDelete: (job: Job) => void;
}

const statusBadgeColor = (status: JobRunStatus) => {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "info";
  return "dark";
};

export default function JobTableRaw({ job, handleDelete }: TableRowProps) {
    const [openMenu, setOpenMenu] = useState(false);
    const router = useRouter();
    const { toastError } = useToast();
    const { update } = useUpdateJob();
    const [isEnable, setIsEnable] = useState(true);
    const { runJob } = useRunJob();
    const { abortJob } = useAbortJob();
    const runAbortRef = useRef<AbortController | null>(null);

    const toggleEnableJob = async (checked: boolean) => {
        try {
            const jobUpdate = {
                isEnable: checked
            }
            const res = await update(job.id, jobUpdate);
        } catch(error: any) {
            console.log("Error checking job: ", error.message);
            toastError();
        }
    }

    const runJobNow = async () => {
        setOpenMenu(false);
        runAbortRef.current?.abort();
        const controller = new AbortController();
        runAbortRef.current = controller;
        try {
            await runJob(job.id, controller.signal);
        } finally {
            if (runAbortRef.current === controller) {
                runAbortRef.current = null;
            }
        }
    }

    const cancelJob = async () => {
        setOpenMenu(false);
        if (runAbortRef.current) {
            runAbortRef.current?.abort();
            runAbortRef.current = null;
        } else {
            await abortJob(job.id);
        }
    }

    const handleEditJob = () => {
        router.push(`/jobs/${job.id}/edit`);
    }

    useEffect(() => {
        setIsEnable(job?.isEnable);
    }, [job?.isEnable])

    const isRunning = job?.status === "running";
    
    return (
        <TableRow key={job.id}>
            <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300">
                <div className="font-medium text-gray-800 dark:text-white/90">
                    {job.name}
                </div>
                <div className="text-xs text-gray-400">
                    {job.scheduleType}
                </div>
            </TableCell>
            <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                {job.source?.name}
            </TableCell>    
            <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                {job.destinations ? job.destinations.map(({name}) => name).join(', ') : "-"}
            </TableCell>
            <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                {isRunning ? (
                    <span className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400">
                        <span className="btn-spinner" aria-hidden="true" />
                        Running now
                    </span>
                ) : (
                    job.lastJobRun?.status ? <Badge size="sm" color={statusBadgeColor(job.lastJobRun?.status)}>
                        {job.lastJobRun?.status}
                    </Badge> : "-"
                )}
            </TableCell>
            <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                {job.lastJobRun?.finishedAt ? (
                    new Date(job.lastJobRun.finishedAt).toLocaleString()
                ) : (
                    "-"
                )}
            </TableCell>
            <TableCell className="px-5 py-4">
                <Switch
                    label="Enabled"
                    onChange={toggleEnableJob}
                    checked={isEnable}
                />
            </TableCell>
            <TableCell className="px-5 py-4">
                <div className="relative inline-flex">
                    <button
                        type="button"
                        onClick={() =>
                            setOpenMenu((isOpen) => !isOpen)
                        }
                        className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                    </button>
                    <Dropdown
                        isOpen={openMenu}
                        onClose={() => setOpenMenu(false)}
                        className="w-44 p-2"
                    >
                        <DropdownItem
                            tag="a"
                            href={`/jobs/${job.id}`}
                            onItemClick={() => setOpenMenu(false)}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            View job
                        </DropdownItem>
                        { job.status !== "running" &&
                            <>
                                <DropdownItem
                                    onItemClick={runJobNow}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Run job now
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        handleEditJob();
                                        setOpenMenu(false)
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Edit job
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setOpenMenu(false);
                                        handleDelete(job)
                                    }}
                                    className="flex w-full font-normal text-left text-error-600 rounded-lg hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-white/5"
                                >
                                    Delete job
                                </DropdownItem>
                            </>
                        }
                        {
                            job.status === "running" && 
                            <>
                                <DropdownItem
                                    onItemClick={cancelJob}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Cancel job
                                </DropdownItem>
                            </>
                        }
                    </Dropdown>
                </div>
            </TableCell>
        </TableRow>
    )
}
