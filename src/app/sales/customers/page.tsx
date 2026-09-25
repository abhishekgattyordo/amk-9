import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function SalesCustomersPage() {
  return <AppClient initialModule="sales" salesSubPage="customer_view" />;
}
