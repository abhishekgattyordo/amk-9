import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function SalesOrdersRoute() {
  return (
    <AppClient
      initialModule="sales_orders"
    />
  );
}
