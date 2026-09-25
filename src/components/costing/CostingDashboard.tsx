'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  Plus,
  Layers,
  ShoppingBag,
  Percent,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { CostSheetItem, CostingMetrics, User } from '@/types';

interface CostingDashboardProps {
  darkMode?: boolean;
  currentUser?: User | null;
  onNavigateTab: (tab: string, costSheetId?: string) => void;
  onSelectCostSheet: (id: string, mode: 'view' | 'edit') => void;
}

export function CostingDashboard({
  darkMode,
  currentUser,
  onNavigateTab,
  onSelectCostSheet,
}: CostingDashboardProps) {
  const [metrics, setMetrics] = useState<CostingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/costing/stats');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.error || 'Failed to load costing metrics');
      }
    } catch (err: any) {
      console.error('Error fetching costing stats:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val?: number) => {
    return `₹${(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Loading Costing Analytics & Metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800 shadow-lg shadow-slate-950/40'
            : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1
                  className={`text-xl sm:text-2xl font-bold tracking-tight ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Costing & Box Engineering
                </h1>
                <p
                  className={`text-xs sm:text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Precise paper layer calculations, Bursting Strength, BCT
                  predictions, and MD commercial approval workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => onNavigateTab('bom-new')}
              className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>New BOM</span>
            </button>
            <button
              onClick={() => onNavigateTab('new')}
              className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Cost Sheet</span>
            </button>
            <button
              onClick={fetchDashboardData}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                darkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Cost Sheets */}
        <div
          onClick={() => onNavigateTab('sheets')}
          className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Cost Sheets
            </span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {metrics?.totalCostSheets || 0}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-500">All Revisions</span>
            <span className="text-emerald-500 font-medium flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>

        {/* Pending MD Approval */}
        <div
          onClick={() => onNavigateTab('pending')}
          className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50'
              : 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Pending MD Approval
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-2xl font-bold ${
              (metrics?.pendingApprovalCount || 0) > 0
                ? 'text-amber-500'
                : darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {metrics?.pendingApprovalCount || 0}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-500">Awaiting Decision</span>
            <span className="text-amber-500 font-medium flex items-center">
              Review <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>

        {/* Approved Sheets */}
        <div
          onClick={() => onNavigateTab('approved')}
          className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
              : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Approved Sheets
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {metrics?.approvedCount || 0}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-500">Ready for Quotation</span>
            <span className="text-emerald-500 font-medium flex items-center">
              Explore <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>

        {/* Average Profit Margin */}
        <div
          className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Average Margin
            </span>
            <Percent className="w-4 h-4 text-blue-500" />
          </div>
          <div
            className={`text-2xl font-bold ${
              (metrics?.averageMargin || 0) >= 15
                ? 'text-emerald-500'
                : (metrics?.averageMargin || 0) >= 10
                ? 'text-amber-500'
                : 'text-rose-500'
            }`}
          >
            {metrics?.averageMargin || 0}%
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-500">Target: ≥ 15.0%</span>
            <span className="text-slate-400">All Active</span>
          </div>
        </div>

        {/* Quoted Pipeline Value */}
        <div
          className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-slate-900/60 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Pipeline Value
            </span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div
            className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {formatCurrency(metrics?.totalValueQuoted)}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-slate-500">Total Order Value</span>
            <span className="text-purple-500 font-medium">Active Sheets</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Pending Approvals & Box Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Widget (2 Cols) */}
        <div
          className={`lg:col-span-2 p-5 rounded-2xl border ${
            darkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2
                className={`text-base font-bold ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Pending MD Approvals
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('pending')}
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
            >
              <span>View All ({metrics?.pendingApprovals?.length || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {metrics?.pendingApprovals && metrics.pendingApprovals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      darkMode
                        ? 'border-slate-800 text-slate-400'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <th className="pb-2 font-medium">Cost Sheet #</th>
                    <th className="pb-2 font-medium">Customer / Item</th>
                    <th className="pb-2 font-medium text-right">Target Qty</th>
                    <th className="pb-2 font-medium text-right">Selling Price</th>
                    <th className="pb-2 font-medium text-right">Margin %</th>
                    <th className="pb-2 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {metrics.pendingApprovals.slice(0, 5).map((cs) => (
                    <tr
                      key={cs.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-3 font-semibold text-emerald-500">
                        {cs.costSheetNumber}
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                          v{cs.revision}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-white">
                          {cs.customerName || cs.customer?.name || 'Standard Box'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {cs.boxType} ({cs.ply}-Ply, {cs.length}x{cs.width}x
                          {cs.height}mm)
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {(cs.targetQuantity || 0).toLocaleString()} {cs.unit}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        ₹{(cs.sellingPricePerBox || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            (cs.profitMarginPercent || 0) >= 15
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : (cs.profitMarginPercent || 0) >= 10
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {(cs.profitMarginPercent || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => onSelectCostSheet(cs.id, 'view')}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
              <p
                className={`text-sm font-medium ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                No Cost Sheets Pending MD Approval
              </p>
              <p className="text-xs text-slate-500">
                All submitted cost sheets have been reviewed.
              </p>
            </div>
          )}
        </div>

        {/* Box Type Distribution & Quick Calculation Widget */}
        <div className="space-y-6">
          {/* Quick Engineering Creator Card */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-gradient-to-br from-slate-900 to-slate-900/60 border-slate-800'
                : 'bg-gradient-to-br from-white to-emerald-50/30 border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Layers className="w-4 h-4" />
              </div>
              <h2
                className={`text-base font-bold ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Quick Cost Sheet Creator
              </h2>
            </div>
            <p
              className={`text-xs mb-4 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Start engineering a box with instant paper flute decomposition,
              Bursting Strength, and margin simulation.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigateTab('new')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  darkMode
                    ? 'border-slate-800 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-slate-800/80'
                    : 'border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40'
                }`}
              >
                <div className="text-xs font-bold text-emerald-500 mb-1">
                  Universal Box (RSC)
                </div>
                <div className="text-[11px] text-slate-400">
                  Standard 3-Ply / 5-Ply auto-deckle
                </div>
              </button>

              <button
                onClick={() => onNavigateTab('new')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  darkMode
                    ? 'border-slate-800 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-slate-800/80'
                    : 'border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40'
                }`}
              >
                <div className="text-xs font-bold text-teal-500 mb-1">
                  Customized / Die-Cut
                </div>
                <div className="text-[11px] text-slate-400">
                  Custom deckle, die & stereos
                </div>
              </button>
            </div>
          </div>

          {/* Box Types Breakdown */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-slate-900/80 border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h2
              className={`text-base font-bold mb-3 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Box Types in Portfolio
            </h2>

            <div className="space-y-3">
              {metrics?.byBoxType && metrics.byBoxType.length > 0 ? (
                metrics.byBoxType.map((bt) => (
                  <div key={bt.boxType} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span
                        className={`font-medium ${
                          darkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {bt.boxType}
                      </span>
                      <span className="text-slate-400">
                        {bt.count} sheets ({formatCurrency(bt.value)})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              10,
                              (bt.count / (metrics.totalCostSheets || 1)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-3 text-center">
                  No box type data available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cost Sheets Table */}
      <div
        className={`p-5 rounded-2xl border ${
          darkMode
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileText className="w-4 h-4" />
            </div>
            <h2
              className={`text-base font-bold ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Recent Cost Sheets
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('sheets')}
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
          >
            <span>View All Cost Sheets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {metrics?.recentCostSheets && metrics.recentCostSheets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b ${
                    darkMode
                      ? 'border-slate-800 text-slate-400'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <th className="pb-2 font-medium">Cost Sheet #</th>
                  <th className="pb-2 font-medium">Customer / Lead</th>
                  <th className="pb-2 font-medium">Box Specifications</th>
                  <th className="pb-2 font-medium text-right">Mfg Cost</th>
                  <th className="pb-2 font-medium text-right">Selling Price</th>
                  <th className="pb-2 font-medium text-right">Margin %</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                  <th className="pb-2 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {metrics.recentCostSheets.map((cs) => (
                  <tr
                    key={cs.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <td className="py-3 font-semibold text-emerald-500">
                      {cs.costSheetNumber}
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                        v{cs.revision}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-white">
                        {cs.customerName || cs.customer?.name || 'Standard Client'}
                      </div>
                      {cs.lead && (
                        <div className="text-[10px] text-blue-400">
                          Lead: {cs.lead.leadNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-slate-200">
                        {cs.boxType} ({cs.ply}-Ply)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {cs.length}x{cs.width}x{cs.height}
                        {cs.dimensionUnit} | {cs.totalBoardGsm} GSM |{' '}
                        {cs.burstingStrength} BS
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-slate-300">
                      ₹{(cs.totalManufacturingCostPerBox || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      ₹{(cs.sellingPricePerBox || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          (cs.profitMarginPercent || 0) >= 15
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : (cs.profitMarginPercent || 0) >= 10
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {(cs.profitMarginPercent || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          cs.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : cs.status === 'Pending MD Approval' ||
                              cs.status === 'Submitted'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : cs.status === 'Converted to Quotation'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : cs.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}
                      >
                        {cs.status}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onSelectCostSheet(cs.id, 'view')}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <Calculator className="w-8 h-8 text-slate-600 mx-auto" />
            <p
              className={`text-sm ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              No cost sheets created yet.
            </p>
            <button
              onClick={() => onNavigateTab('new')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              Create Your First Cost Sheet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
