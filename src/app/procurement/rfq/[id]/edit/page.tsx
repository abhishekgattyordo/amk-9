import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RFQEditPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || '';

  return (
    <AppClient
      initialModule="procurement_rfq"
      procurementSubPage="rfq_edit"
      selectedRfqId={id}
    />
  );
}
