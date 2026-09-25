import React from "react";
import AppClient from "../AppClient";

export const dynamic = 'force-dynamic';

export default function ProcurementPage() {
  return <AppClient initialModule="procurement" />;
}
