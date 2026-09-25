'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  LayoutDashboard,
  Clock,
  FileText,
  History,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { DispatchDashboardView } from './DispatchDashboardView';
import { DispatchListView } from './DispatchListView';
import { DispatchPendingView } from './DispatchPendingView';
import { DispatchHistoryView } from './DispatchHistoryView';
import { DispatchCreatePage } from './DispatchCreatePage';
import { DispatchViewPage } from './DispatchViewPage';
import { DispatchEditPage } from './DispatchEditPage';

interface DispatchModuleProps {
  darkMode: boolean;
  currentSubTab?: string;
  onSubTabChange?: (tab: string) => void;
  selectedDispatchId?: string | null;
}

export const DispatchModule: React.FC<DispatchModuleProps> = ({
  darkMode,
  currentSubTab,
  onSubTabChange,
  selectedDispatchId,
}) => {
  const [activeTab, setActiveTab] = useState<string>(currentSubTab || 'dispatch_dashboard');
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(selectedDispatchId || null);
  const [initiatingOrder, setInitiatingOrder] = useState<any>(null);

  useEffect(() => {
    if (currentSubTab) {
      setActiveTab(currentSubTab);
    }
  }, [currentSubTab]);

  useEffect(() => {
    if (selectedDispatchId) {
      setActiveDispatchId(selectedDispatchId);
      setActiveTab('dispatch_view');
    }
  }, [selectedDispatchId]);

  const handleNavigateTab = (tab: string, params?: any) => {
    if (params?.id) {
      setActiveDispatchId(params.id);
    }
    setActiveTab(tab);
    onSubTabChange?.(tab);
  };

  const handleInitiateDispatchFromOrder = (order: any) => {
    setInitiatingOrder(order);
    handleNavigateTab('dispatch_create');
  };

  const tabs = [
    { id: 'dispatch_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dispatch_list', label: 'Dispatch', icon: Truck },
    { id: 'dispatch_pending', label: 'Pending Dispatch', icon: Clock },
    { id: 'dispatch_completed', label: 'Completed Dispatch', icon: CheckCircle2 },
    { id: 'dispatch_history', label: 'Dispatch History', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Navigation Header */}
      <div className={`border-b ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'} -mx-6 -mt-6 px-6 pt-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Dispatch Management
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Delivery challans, vehicle dispatch, pending & completed fulfillment queues, and audit history
              </p>
            </div>
          </div>

          <button
            onClick={() => handleNavigateTab('dispatch_create')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery Challan</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeTab === tab.id ||
              ((tab.id === 'dispatch_list' || tab.id === 'dispatch') && (activeTab === 'dispatch_list' || activeTab === 'dispatch' || activeTab === 'dispatch_view' || activeTab === 'dispatch_edit'));
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigateTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {(activeTab === 'dispatch_dashboard' || activeTab === 'dashboard') && (
          <DispatchDashboardView
            darkMode={darkMode}
            onNavigateTab={handleNavigateTab}
            onSelectDispatch={(id) => handleNavigateTab('dispatch_view', { id })}
          />
        )}

        {(activeTab === 'dispatch_list' || activeTab === 'dispatch') && (
          <DispatchListView
            darkMode={darkMode}
            onNavigateTab={handleNavigateTab}
            onSelectDispatch={(id) => handleNavigateTab('dispatch_view', { id })}
            onEditDispatch={(id) => handleNavigateTab('dispatch_edit', { id })}
          />
        )}

        {activeTab === 'dispatch_pending' && (
          <DispatchPendingView
            darkMode={darkMode}
            onInitiateDispatch={handleInitiateDispatchFromOrder}
          />
        )}

        {activeTab === 'dispatch_completed' && (
          <DispatchListView
            darkMode={darkMode}
            initialStatusFilter="Delivered"
            onNavigateTab={handleNavigateTab}
            onSelectDispatch={(id) => handleNavigateTab('dispatch_view', { id })}
            onEditDispatch={(id) => handleNavigateTab('dispatch_edit', { id })}
          />
        )}

        {activeTab === 'dispatch_history' && (
          <DispatchHistoryView
            darkMode={darkMode}
            onSelectDispatch={(id) => handleNavigateTab('dispatch_view', { id })}
          />
        )}

        {activeTab === 'dispatch_create' && (
          <DispatchCreatePage
            darkMode={darkMode}
            initialOrder={initiatingOrder}
            onNavigateTab={handleNavigateTab}
            onDispatchCreated={(disp) => handleNavigateTab('dispatch_view', { id: disp.id })}
          />
        )}

        {activeTab === 'dispatch_view' && activeDispatchId && (
          <DispatchViewPage
            dispatchId={activeDispatchId}
            darkMode={darkMode}
            onNavigateTab={handleNavigateTab}
            onEditDispatch={(id) => handleNavigateTab('dispatch_edit', { id })}
          />
        )}

        {activeTab === 'dispatch_edit' && activeDispatchId && (
          <DispatchEditPage
            dispatchId={activeDispatchId}
            darkMode={darkMode}
            onNavigateTab={handleNavigateTab}
            onSaved={() => handleNavigateTab('dispatch_view', { id: activeDispatchId })}
          />
        )}
      </div>
    </div>
  );
};
