import React from "react";
import AppClient from "../../AppClient";

export const dynamic = 'force-dynamic';

export default function ReportsFinancialPage() {
  return <AppClient initialModule="reports_financial" />;
}
