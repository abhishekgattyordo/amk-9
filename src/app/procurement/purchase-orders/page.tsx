import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function PurchaseOrdersAliasPage() {
  return (
    <AppClient
      initialModule="procurement_po"
    />
  );
}
