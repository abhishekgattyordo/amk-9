import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

export default function ReelInwardPage() {
  return (
    <AppClient
      initialModule="procurement_reel_inward"
    />
  );
}
