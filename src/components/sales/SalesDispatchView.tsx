'use client';

import React from 'react';
import { DispatchModule } from '../dispatch/DispatchModule';

interface SalesDispatchViewProps {
  darkMode: boolean;
  loading?: boolean;
  onRefreshParent?: () => void;
  onSelectModule?: (mod: string) => void;
  onNewDeliveryChallan?: () => void;
}

export const SalesDispatchView: React.FC<SalesDispatchViewProps> = ({
  darkMode,
}) => {
  return (
    <div className="w-full">
      <DispatchModule darkMode={darkMode} />
    </div>
  );
};
