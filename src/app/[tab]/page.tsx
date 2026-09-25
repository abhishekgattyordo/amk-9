import React from "react";
import AppClient from "../AppClient";
import { ModuleType } from "../../types";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ tab: string }>;
}

export default async function TabPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawTab = (resolvedParams?.tab || 'dashboard') as ModuleType;

  return <AppClient initialModule={rawTab} />;
}


