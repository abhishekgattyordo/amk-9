import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function DispatchHistoryPageRoute() {
  return <AppClient initialModule="dispatch" dispatchSubTab="dispatch_history" />;
}
