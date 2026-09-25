import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function NewQuotationRoute() {
  return <AppClient initialModule="sales_quotations" salesSubPage="new_quotation" />;
}
