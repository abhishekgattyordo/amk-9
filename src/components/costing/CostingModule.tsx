'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  LayoutDashboard,
  Layers,
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  History,
} from 'lucide-react';
import { CostingDashboard } from './CostingDashboard';
import { CostSheetList } from './CostSheetList';
import { CostSheetForm } from './CostSheetForm';
import { CostSheetDetail } from './CostSheetDetail';
import { CostingHistory } from './CostingHistory';
import { CostingBomList } from './CostingBomList';
import { CostingBomForm } from './CostingBomForm';
import { CostingBomDetail } from './CostingBomDetail';
import { CostSheetItem, User } from '@/types';

interface CostingModuleProps {
  darkMode?: boolean;
  currentUser?: User | null;
  initialTab?: string;
  initialBomId?: string | null;
  initialCostSheetId?: string | null;
  initialLeadId?: string | null;
  onNavigateToQuotation?: (quotationId: string) => void;
}

export function CostingModule({
  darkMode,
  currentUser,
  initialTab = 'dashboard',
  initialBomId,
  initialCostSheetId,
  initialLeadId,
  onNavigateToQuotation,
}: CostingModuleProps) {
  // Tab state: 'dashboard' | 'bom' | 'bom-new' | 'bom-edit' | 'bom-view' | 'sheets' | 'new' | 'view' | 'pending' | 'approved' | 'history'
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (initialBomId) return 'bom-view';
    if (initialCostSheetId) return 'view';
    return initialTab;
  });

  const [selectedCostSheetId, setSelectedCostSheetId] = useState<string | null>(
    initialCostSheetId || null
  );
  const [selectedBomId, setSelectedBomId] = useState<string | null>(
    initialBomId || null
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialLeadId || null
  );
  const [selectedBomData, setSelectedBomData] = useState<any | null>(null);

  // Sync with prop changes
  useEffect(() => {
    if (initialBomId) {
      setSelectedBomId(initialBomId);
      setCurrentTab('bom-view');
    } else if (initialCostSheetId) {
      setSelectedCostSheetId(initialCostSheetId);
      setCurrentTab('view');
    } else if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
      if (initialTab === 'bom-new' || initialTab === 'bom') {
        setCurrentTab('bom-new');
      } else if (initialTab) {
        setCurrentTab(initialTab);
      }
    } else if (initialTab) {
      setCurrentTab(initialTab);
    }
  }, [initialTab, initialBomId, initialCostSheetId, initialLeadId]);

  const handleNavigateTab = (tab: string, costSheetId?: string) => {
    if (costSheetId) {
      setSelectedCostSheetId(costSheetId);
    }
    setCurrentTab(tab);
  };

  // Cost Sheet handlers
  const handleSelectCostSheet = (id: string, mode: 'view' | 'edit') => {
    setSelectedCostSheetId(id);
    if (mode === 'edit') {
      setCurrentTab('new');
    } else {
      setCurrentTab('view');
    }
  };

  const handleCreateNewCostSheet = (bomId?: string, bomData?: any) => {
    setSelectedCostSheetId(null);
    if (bomId) {
      setSelectedBomId(bomId);
      setSelectedBomData(bomData || null);
    } else {
      setSelectedBomId(null);
      setSelectedBomData(null);
    }
    setCurrentTab('new');
  };

  const handleCostSheetSaved = (savedSheet: CostSheetItem) => {
    setSelectedCostSheetId(savedSheet.id);
    setCurrentTab('view');
  };

  // BOM handlers
  const handleSelectBom = (id: string, mode: 'view' | 'edit') => {
    setSelectedBomId(id);
    if (mode === 'edit') {
      setCurrentTab('bom-edit');
    } else {
      setCurrentTab('bom-view');
    }
  };

  const handleCreateNewBom = () => {
    setSelectedBomId(null);
    setCurrentTab('bom-new');
  };

  const handleBomSaved = (savedBom: any) => {
    setSelectedBomId(savedBom.id);
    setSelectedBomData(savedBom);
    setCurrentTab('bom-view');
  };

  // Determine active top navigation item
  const isBomActive = ['bom', 'bom-list', 'bom-new', 'bom-edit', 'bom-view'].includes(currentTab);
  const isCostSheetsActive = ['sheets', 'new', 'view'].includes(currentTab);

  return (
    <div className="space-y-6">
      {/* Top Module Sub-Navigation Bar */}
      <div
        className={`p-1.5 rounded-2xl border flex items-center space-x-1 overflow-x-auto ${
          darkMode
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <button
          onClick={() => {
            setSelectedCostSheetId(null);
            setSelectedBomId(null);
            setCurrentTab('dashboard');
          }}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            currentTab === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {/* BOM (Bill of Material) Tab */}
        <button
          onClick={() => {
            setSelectedBomId(null);
            setCurrentTab('bom');
          }}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            isBomActive
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-300" />
          <span>BOM</span>
        </button>

        {/* Cost Sheets Tab */}
        <button
          onClick={() => {
            setSelectedCostSheetId(null);
            setCurrentTab('sheets');
          }}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            isCostSheetsActive
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Cost Sheets</span>
        </button>

        {/* Pending Approval Tab */}
        <button
          onClick={() => {
            setSelectedCostSheetId(null);
            setCurrentTab('pending');
          }}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            currentTab === 'pending'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Pending Approval</span>
        </button>

        {/* Approved Tab */}
        <button
          onClick={() => {
            setSelectedCostSheetId(null);
            setCurrentTab('approved');
          }}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            currentTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Approved</span>
        </button>

        {/* Costing History Tab */}
        <button
          onClick={() => {
            setSelectedCostSheetId(null);
            setCurrentTab('history');
          }}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            currentTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Costing History</span>
        </button>
      </div>

      {/* Main Tab Content View */}
      <div>
        {/* DASHBOARD */}
        {currentTab === 'dashboard' && (
          <CostingDashboard
            darkMode={darkMode}
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
            onSelectCostSheet={handleSelectCostSheet}
          />
        )}

        {/* BOM VIEWS */}
        {(currentTab === 'bom' || currentTab === 'bom-list') && (
          <CostingBomList
            darkMode={darkMode}
            currentUser={currentUser}
            onSelectBom={handleSelectBom}
            onCreateNew={handleCreateNewBom}
            onCreateCostSheet={(bomId, bomData) => {
              handleCreateNewCostSheet(bomId, bomData);
            }}
          />
        )}

        {currentTab === 'bom-new' && (
          <CostingBomForm
            darkMode={darkMode}
            currentUser={currentUser}
            initialLeadId={selectedLeadId || undefined}
            onBack={() => setCurrentTab('bom')}
            onSaved={handleBomSaved}
          />
        )}

        {currentTab === 'bom-edit' && selectedBomId && (
          <CostingBomForm
            darkMode={darkMode}
            currentUser={currentUser}
            bomId={selectedBomId}
            onBack={() => setCurrentTab('bom-view')}
            onSaved={handleBomSaved}
          />
        )}

        {currentTab === 'bom-view' && selectedBomId && (
          <CostingBomDetail
            bomId={selectedBomId}
            darkMode={darkMode}
            currentUser={currentUser}
            onBack={() => setCurrentTab('bom')}
            onEdit={(id) => {
              setSelectedBomId(id);
              setCurrentTab('bom-edit');
            }}
            onCreateCostSheet={(bomId, bomData) => {
              handleCreateNewCostSheet(bomId, bomData);
            }}
          />
        )}

        {/* COST SHEET LIST */}
        {currentTab === 'sheets' && (
          <CostSheetList
            darkMode={darkMode}
            currentUser={currentUser}
            initialStatusFilter="all"
            onSelectCostSheet={handleSelectCostSheet}
            onCreateNew={() => handleCreateNewCostSheet()}
          />
        )}

        {/* PENDING APPROVAL LIST */}
        {currentTab === 'pending' && (
          <CostSheetList
            darkMode={darkMode}
            currentUser={currentUser}
            initialStatusFilter="Pending MD Approval"
            onSelectCostSheet={handleSelectCostSheet}
            onCreateNew={() => handleCreateNewCostSheet()}
          />
        )}

        {/* APPROVED LIST */}
        {currentTab === 'approved' && (
          <CostSheetList
            darkMode={darkMode}
            currentUser={currentUser}
            initialStatusFilter="Approved"
            onSelectCostSheet={handleSelectCostSheet}
            onCreateNew={() => handleCreateNewCostSheet()}
          />
        )}

        {/* NEW / EDIT COST SHEET */}
        {currentTab === 'new' && (
          <CostSheetForm
            darkMode={darkMode}
            currentUser={currentUser}
            costSheetId={selectedCostSheetId || undefined}
            initialBomId={selectedBomId || undefined}
            initialBomData={selectedBomData || undefined}
            onBack={() => setCurrentTab('sheets')}
            onSaved={handleCostSheetSaved}
          />
        )}

        {/* COST SHEET DETAIL */}
        {currentTab === 'view' && selectedCostSheetId && (
          <CostSheetDetail
            costSheetId={selectedCostSheetId}
            darkMode={darkMode}
            currentUser={currentUser}
            onBack={() => setCurrentTab('sheets')}
            onEdit={(id) => {
              setSelectedCostSheetId(id);
              setCurrentTab('new');
            }}
            onViewBom={(bomId) => {
              setSelectedBomId(bomId);
              setCurrentTab('bom-view');
            }}
            onQuotationCreated={onNavigateToQuotation}
          />
        )}

        {/* COSTING HISTORY */}
        {currentTab === 'history' && (
          <CostingHistory
            darkMode={darkMode}
            onSelectCostSheet={handleSelectCostSheet}
          />
        )}
      </div>
    </div>
  );
}
