import type { Metadata } from "next";
import React from "react";
import NotificationsPage from "./NotificationsPage";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Configure notification providers, rules, and history",
};

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
