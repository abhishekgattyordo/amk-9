import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadWorkspaceRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const leadId = resolvedParams?.id || '';

  return (
    <AppClient
      initialModule="sales_leads"
      salesSubPage="lead_workspace"
      selectedLeadId={leadId}
    />
  );
}
