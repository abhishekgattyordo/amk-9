import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function SupplierQuotationsListPage() {
  return (
    <AppClient
      initialModule="procurement_quotes"
      procurementSubPage="quote_list"
    />
  );
}
