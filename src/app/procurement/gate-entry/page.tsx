import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function GateEntryPage() {
  return (
    <AppClient
      initialModule="procurement_gate_entry"
    />
  );
}
