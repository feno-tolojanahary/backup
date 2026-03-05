import type { Metadata } from "next";
import React from "react";
import SettingsPageClient from "./SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Configure global system behavior, notifications, backup engine settings, and security.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
