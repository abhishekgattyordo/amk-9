import React from "react";
import AppClient from "../AppClient";

export const dynamic = 'force-dynamic';

export default function DispatchPageRoute() {
  return <AppClient initialModule="dispatch" dispatchSubTab="dispatch_list" />;
}
