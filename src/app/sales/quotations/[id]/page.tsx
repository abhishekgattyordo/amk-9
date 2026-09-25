import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotationWorkspaceRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const quotationId = resolvedParams?.id || '';

  return (
    <AppClient
      initialModule="sales_quotations"
      salesSubPage="quotation_workspace"
      selectedQuotationId={quotationId}
    />
  );
}
