import React, { useState } from "react";
// import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import {
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { Job, JobStatus } from "@/handlers/jobs/type";

type TableRowProps = {
    job: Job;
}

// const statusBadgeColor = (status: JobStatus) => {
//   if (status === "success") return "success";
//   if (status === "failed") return "error";
//   if (status === "running") return "info";
//   return "dark";
// };

export default function TableRaw({ job }: TableRowProps) {
    const [openMenu, setOpenMenu] = useState(false);

    const toggleEnableJob = async (checked: boolean) => {

    }

    const runJobNow = async () => {

    }
    
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
                {job.scheduleType} - {job.scheduleValue}
            </TableCell>
            <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                {job.lastRun ? new Date(job.lastRun).toLocaleString() : "-"}
            </TableCell>
            <TableCell className="px-5 py-4">
                <Switch
                    label="Enabled"
                    defaultChecked={job.isEnable}
                    onChange={(checked: boolean) =>
                        console.log("Toggle job", job.id, checked)
                    }
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
                        <DropdownItem
                            onItemClick={() => {
                                setOpenMenu(false);
                                console.log("Run job now", job.id);
                            }}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            Run job now
                        </DropdownItem>
                        <DropdownItem
                            tag="a"
                            href={`/jobs/${job.id}/edit`}
                            onItemClick={() => setOpenMenu(false)}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            Edit job
                        </DropdownItem>
                        <DropdownItem
                            onItemClick={() => {
                                setOpenMenu(false);
                                console.log("Delete job", job.id);
                            }}
                            className="flex w-full font-normal text-left text-error-600 rounded-lg hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-white/5"
                        >
                            Delete job
                        </DropdownItem>
                    </Dropdown>
                </div>
            </TableCell>
        </TableRow>
    )
}