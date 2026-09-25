import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SalesOrderEditRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const orderId = resolvedParams?.id || '';

  return (
    <AppClient
      initialModule="sales_orders"
      salesSubPage="sales_order_edit"
      selectedSalesOrderId={orderId}
    />
  );
}
