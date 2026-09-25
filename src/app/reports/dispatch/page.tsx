import React from "react";
import AppClient from "../../AppClient";

export const dynamic = 'force-dynamic';

export default function ReportsDispatchPage() {
  return <AppClient initialModule="reports_dispatch" />;
}
