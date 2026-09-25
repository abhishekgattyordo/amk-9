import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function SalesQuotationsPage() {
  return <AppClient initialModule="sales" salesSubPage="quotation_workspace" />;
}
