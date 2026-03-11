import type { Metadata } from "next";
import React from "react";
import DestinationsPageClient from "./DestinationsPageClient";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Manage backup storage destinations.",
};

export default function DestinationsPage() {
  return <DestinationsPageClient />;
}
