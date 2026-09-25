'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DispatchCreatePage } from '../dispatch/DispatchCreatePage';

interface NewDeliveryChallanPageProps {
  darkMode: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const NewDeliveryChallanPage: React.FC<NewDeliveryChallanPageProps> = ({
  darkMode,
  onBack,
  onSuccess,
}) => {
  const router = useRouter();

  const handleNavigateTab = (tab: string) => {
    if (onBack) {
      onBack();
    } else {
      router.push('/sales_dispatch');
    }
  };

  const handleDispatchCreated = () => {
    if (onSuccess) {
      onSuccess();
    } else if (onBack) {
      onBack();
    } else {
      router.push('/sales_dispatch');
    }
  };

  return (
    <div className="w-full">
      <DispatchCreatePage
        darkMode={darkMode}
        onNavigateTab={handleNavigateTab}
        onDispatchCreated={handleDispatchCreated}
      />
    </div>
  );
};
