import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function NewCustomerRoute() {
  return <AppClient initialModule="sales_customers" salesSubPage="new_customer" />;
}
