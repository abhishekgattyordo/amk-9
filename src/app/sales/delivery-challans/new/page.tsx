import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function NewDeliveryChallanRoute() {
  return <AppClient initialModule="sales_dispatch" salesSubPage="new_delivery_challan" />;
}
