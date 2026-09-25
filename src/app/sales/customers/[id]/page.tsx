import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerWorkspaceRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const customerId = resolvedParams?.id || '';

  return (
    <AppClient
      initialModule="sales_customers"
      salesSubPage="customer_view"
      selectedCustomerId={customerId}
    />
  );
}
