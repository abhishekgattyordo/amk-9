import React from "react";
import AppClient from "@/app/AppClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DispatchEditPageRoute({ params }: PageProps) {
  const { id } = await params;
  return <AppClient initialModule="dispatch" dispatchSubTab="dispatch_edit" selectedDispatchId={id} />;
}
