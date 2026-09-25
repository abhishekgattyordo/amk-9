import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function NewLeadRoute() {
  return <AppClient initialModule="sales_leads" salesSubPage="new_lead" />;
}
