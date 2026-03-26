"use client";
import React from "react";
import Image from "next/image";
import { useFormContext, useWatch } from "react-hook-form";
import type { UserForm } from "@/handlers/users/type";

export default function UserMetaCard() {
  const { control } = useFormContext<UserForm>();
  const [fullName, email, companyName, role, avatarUrl] = useWatch({
    control,
    name: ["fullName", "email", "companyName", "role", "avatarUrl"],
  });

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <Image
              width={80}
              height={80}
              src={avatarUrl || "/images/user/owner.jpg"}
              alt="user"
            />
          </div>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {fullName || "-"}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">{role || "-"}</p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {companyName || "-"}
              </p>
            </div>
          </div>
          <div className="order-2 xl:order-3 xl:ml-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400">{email || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
