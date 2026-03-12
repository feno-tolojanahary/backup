"use client";

import /*React,*/ { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import ProvidersTab from "@/app/(admin)/notifications/components/ProvidersTab";
// import RulesTab from "@/app/(admin)/notifications/components/RulesTab";
// import HistoryTab from "@/app/(admin)/notifications/components/HistoryTab";
import ParametersTab from "@/app/(admin)/notifications/components/ParametersTab";

const tabConfig = [
  { id: "providers", label: "Providers" },
  // { id: "rules", label: "Rules" },
  // { id: "history", label: "History" },
  { id: "parameters", label: "Parameters" },
];

export default function NotificationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabConfig.some((tab) => tab.id === tabParam)) {
      return tabParam;
    }
    return "providers";
  }, [searchParams]);

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white/90">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure notification providers, define alert rules, and review
            notification delivery history.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => console.log("Refresh notifications")}
        >
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "providers" && <ProvidersTab />}
      {/* {activeTab === "rules" && <RulesTab />} */}
      {/* {activeTab === "history" && <HistoryTab />} */}
      {activeTab === "parameters" && <ParametersTab />}
    </div>
  );
}
