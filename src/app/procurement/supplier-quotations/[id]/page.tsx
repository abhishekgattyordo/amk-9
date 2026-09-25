import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierQuotationViewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || '';

  return (
    <AppClient
      initialModule="procurement_quotes"
      procurementSubPage="quote_view"
      selectedQuoteId={id}
    />
  );
}
