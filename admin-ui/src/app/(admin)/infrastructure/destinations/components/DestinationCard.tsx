import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { BoxIcon, FolderIcon, PlugInIcon, MoreDotIcon } from "@/icons";
import { statusBadgeColor, usagePercent } from "./DestinationsUtils";
import { Destination, HostConfig, LocalStorageConfig, S3Config } from "@/handlers/destinations/type";

type DestinationCardProps = {
  destination: Destination;
  openMenuId: string | null;
  setOpenMenuId: (value: string | null) => void;
  onTestConnection: (destination: Destination) => void;
  onEdit: (destination: Destination) => void;
  onDelete: (destination: Destination) => void;
};

export default function DestinationCard({
  destination,
  openMenuId,
  setOpenMenuId,
  onTestConnection,
  onEdit,
  onDelete,
}: DestinationCardProps) {
  const capacityUsage = usagePercent(
    "40",
    "100"
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {destination.type === "s3" ? (
              <BoxIcon />
            ) : destination.type === "ssh" ? (
              <PlugInIcon />
            ) : (
              <FolderIcon />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
              {destination.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {destination.type.toUpperCase()} destination
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge size="sm" color={statusBadgeColor(destination?.status || "error")}>
            {destination.status}
          </Badge>
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenMenuId(
                  openMenuId === destination.id ? null : destination.id
                )
              }
              className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            <Dropdown
              isOpen={openMenuId === destination.id}
              onClose={() => setOpenMenuId(null)}
              className="w-44 p-2"
            >
              <DropdownItem
                onItemClick={() => {
                  setOpenMenuId(null);
                  onTestConnection(destination);
                }}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Test connection
              </DropdownItem>
              <DropdownItem
                onItemClick={() => {
                  setOpenMenuId(null);
                  onEdit(destination);
                }}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Edit destination
              </DropdownItem>
              <DropdownItem
                onItemClick={() => {
                  setOpenMenuId(null);
                  onDelete(destination);
                }}
                className="flex w-full font-normal text-left text-error-600 rounded-lg hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-white/5"
              >
                Delete destination
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Destination type:{" "}
          <span className="text-gray-800 dark:text-white/80">
            {destination.type}
          </span>
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
          {/* <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {destination.totalUsed} used
            {destination.totalCapacity
              ? ` / ${destination.totalCapacity} total`
              : ""}
          </p> */}
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {destination.type === "s3" && (
          <>
            <p>Endpoint: {(destination.config as S3Config)?.endpoint}</p>
            <p>Bucket: {(destination.config as S3Config)?.bucketName}</p>
          </>
        )}
        {destination.type === "ssh" && (
          <>
            <p>Host: {(destination.config as HostConfig)?.host}</p>
            <p>Folder: {(destination.config as HostConfig).destinationFolder}</p>
          </>
        )}
        {destination.type === "local-storage" && <p>Folder: {(destination.config as LocalStorageConfig).destinationFolder}</p>}
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => onTestConnection(destination)}
        >
          Test connection
        </Button>
      </div>
    </div>
  );
}
