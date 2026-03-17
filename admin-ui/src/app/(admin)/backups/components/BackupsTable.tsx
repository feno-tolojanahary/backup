import Badge from "@/components/ui/badge/Badge";
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
import { BackupStatus } from "./BackupsTypes";
import { Backup } from "@/handlers/backups/type";
import moment from "moment";

type BackupsTableProps = {
  pagedBackups: Backup[];
  openMenuId: number | null;
  setOpenMenuId: (value: number | null) => void;
  onOpenDetails: (backup: Backup) => void;
  onOpenDelete: (backup: Backup) => void;
  onRestore: (backup: Backup) => void;
  onDownload: (backup: Backup) => void;
  statusBadgeColor: (status: BackupStatus) => "success" | "error" | "dark";
};

export default function BackupsTable({
  pagedBackups,
  openMenuId,
  setOpenMenuId,
  onOpenDetails,
  onOpenDelete,
  onRestore,
  onDownload,
  statusBadgeColor,
}: BackupsTableProps) {
  return (
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
                        {backup.backupUid}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {backup.job?.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Badge size="sm" color={statusBadgeColor(backup.status)}>
                        {backup.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {backup.size}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {backup.files ? backup.files.map(({ storagePath }) => storagePath).join(", ") : "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {backup.storage}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {moment(backup.createdAt).format("YYYY-MM-DD hh:mm")}
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
                              onOpenDetails(backup);
                            }}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            View details
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => {
                              setOpenMenuId(null);
                              onRestore(backup);
                            }}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Restore backup
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => {
                              setOpenMenuId(null);
                              onDownload(backup);
                            }}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            Download
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => {
                              setOpenMenuId(null);
                              onOpenDelete(backup);
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
  );
}
