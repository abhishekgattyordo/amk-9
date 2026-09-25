import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function RFQListPage() {
  return (
    <AppClient
      initialModule="procurement_rfq"
      procurementSubPage="rfq_list"
    />
  );
}
