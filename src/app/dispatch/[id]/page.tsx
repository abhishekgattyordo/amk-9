import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DispatchViewPageRoute({ params }: PageProps) {
  const { id } = await params;
  return <AppClient initialModule="dispatch" dispatchSubTab="dispatch_view" selectedDispatchId={id} />;
}
