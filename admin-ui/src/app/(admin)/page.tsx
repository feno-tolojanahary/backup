import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard base",
};

export default function Dashboard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Start building your admin experience here.
      </p>
    </div>
  );
}
