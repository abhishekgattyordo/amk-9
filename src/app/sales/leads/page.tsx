import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function SalesLeadsPage() {
  return <AppClient initialModule="sales" salesSubPage="lead_workspace" />;
}
