"use client";
import Image from "next/image";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useMemo } from "react";
import { timeAgo } from "@/utils/util";

type NotificationDropdownItemProps = {
  onItemClick: () => void;
  name: string;
  actionText: string;
  project: string;
  category: string;
  time: string;
  avatarSrc: string;
  status: "succeeded" | "failed";
  href?: string;
};

export default function NotificationDropdownItem({
  onItemClick,
  name,
  actionText,
  project,
  category,
  time,
  avatarSrc,
  status,
  href,
}: NotificationDropdownItemProps) {
  const eventTypeClass =
    status === "succeeded" ? "bg-success-500" : "bg-error-500";

  const dateTimeAgo = useMemo(() => timeAgo(time), [time])

  return (
    <DropdownItem
      onItemClick={onItemClick}
      className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
      href={href}
    >
      <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
        <Image
          width={40}
          height={40}
          src={avatarSrc}
          alt="User"
          className="w-full overflow-hidden rounded-full"
        />
        <span
          className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white ${eventTypeClass} dark:border-gray-900`}
        ></span>
      </span>

      <span className="block">
        <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {name}
          </span>
          <span>{actionText}</span>
          <span className="font-medium text-gray-800 dark:text-white/90">
            {project}
          </span>
        </span>

        <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
          <span>{category}</span>
          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
          <span>{dateTimeAgo}</span>
        </span>
      </span>
    </DropdownItem>
  );
}
