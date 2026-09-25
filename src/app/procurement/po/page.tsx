import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function PurchaseOrdersListPage() {
  return (
    <AppClient
      initialModule="procurement_po"
    />
  );
}
