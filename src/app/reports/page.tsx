import React from "react";
import AppClient from "../AppClient";

export const dynamic = 'force-dynamic';

export default function ReportsDashboardPage() {
  return <AppClient initialModule="reports_dashboard" />;
}
