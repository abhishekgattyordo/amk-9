import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function InwardAliasPage() {
  return (
    <AppClient
      initialModule="procurement_reel_inward"
    />
  );
}
