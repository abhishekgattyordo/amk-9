import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function NewRFQPage() {
  return (
    <AppClient
      initialModule="procurement_rfq"
      procurementSubPage="rfq_new"
    />
  );
}
