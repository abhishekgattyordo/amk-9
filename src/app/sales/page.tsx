import React from "react";
import AppClient from "../AppClient";

export const dynamic = 'force-dynamic';

export default function SalesPage() {
  return <AppClient initialModule="sales" />;
}
