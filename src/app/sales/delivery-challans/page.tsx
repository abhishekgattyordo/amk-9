import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function SalesDeliveryChallansPage() {
  return <AppClient initialModule="dispatch" dispatchSubTab="dispatch_list" />;
}
