'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  FileText,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Clock,
  Eye,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Layers,
  User,
  CheckCircle2,
  Calendar,
  DollarSign,
  Box,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { CostSheetItem, CostSheetRevisionItem } from '@/types';

interface CostingHistoryProps {
  darkMode?: boolean;
  onSelectCostSheet: (id: string, mode: 'view' | 'edit') => void;
}

interface FlatRevisionRecord {
  id: string;
  costSheetId: string;
  costSheetNumber: string;
  revisionNumber: number;
  customerName: string;
  boxType: string;
  dimensions: string;
  ply: number;
  gsm?: number;
  reason: string;
  changedBy: string;
  sellingPrice: number;
  mfgCost?: number;
  profitMargin: number;
  createdAt: string;
  rawRevision?: CostSheetRevisionItem;
  parentSheet?: CostSheetItem;
}

export function CostingHistory({
  darkMode,
  onSelectCostSheet,
}: CostingHistoryProps) {
  const [costSheets, setCostSheets] = useState<CostSheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [expandedSheetIds, setExpandedSheetIds] = useState<Record<string, boolean>>({});
  const [selectedSnapshot, setSelectedSnapshot] = useState<{
    costSheetNumber: string;
    revisionNumber: number;
    changedBy: string;
    createdAt: string;
    reason: string;
    data: any;
  } | null>(null);

  // Load cost sheets data
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/costing');
      const data = await res.json();
      if (data.success) {
        setCostSheets(data.data || []);
      }
    } catch (err) {
      console.error('Error loading costing history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Build flattened revision logs for the table
  const flatRevisions: FlatRevisionRecord[] = useMemo(() => {
    const list: FlatRevisionRecord[] = [];
    costSheets.forEach((cs) => {
      const dimStr = `${cs.length}×${cs.width}×${cs.height} ${cs.dimensionUnit || 'mm'}`;
      const customer = cs.customerName || cs.customer?.name || 'Standard Client';

      if (cs.revisions && cs.revisions.length > 0) {
        cs.revisions.forEach((rev) => {
          list.push({
            id: rev.id,
            costSheetId: cs.id,
            costSheetNumber: cs.costSheetNumber,
            revisionNumber: rev.revisionNumber,
            customerName: customer,
            boxType: cs.boxType,
            dimensions: dimStr,
            ply: cs.ply,
            gsm: cs.totalBoardGsm,
            reason: rev.reason || `Costing Revision v${rev.revisionNumber}`,
            changedBy: rev.changedBy || cs.preparedBy || 'Costing Engineer',
            sellingPrice: rev.sellingPrice || cs.sellingPricePerBox || 0,
            mfgCost: cs.totalManufacturingCostPerBox,
            profitMargin: rev.profitMargin !== undefined ? rev.profitMargin : (cs.profitMarginPercent || 0),
            createdAt: rev.createdAt || cs.createdAt || new Date().toISOString(),
            rawRevision: rev,
            parentSheet: cs,
          });
        });
      } else {
        // If no revision objects existed, add the root cost sheet as v1 baseline
        list.push({
          id: `root-${cs.id}`,
          costSheetId: cs.id,
          costSheetNumber: cs.costSheetNumber,
          revisionNumber: cs.revision || 1,
          customerName: customer,
          boxType: cs.boxType,
          dimensions: dimStr,
          ply: cs.ply,
          gsm: cs.totalBoardGsm,
          reason: 'Initial Cost Sheet Creation',
          changedBy: cs.preparedBy || 'Costing Engineer',
          sellingPrice: cs.sellingPricePerBox || 0,
          mfgCost: cs.totalManufacturingCostPerBox,
          profitMargin: cs.profitMarginPercent || 0,
          createdAt: cs.createdAt || new Date().toISOString(),
          parentSheet: cs,
        });
      }
    });

    // Sort descending by timestamp
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [costSheets]);

  // Filtered lists
  const filteredFlatRevisions = useMemo(() => {
    if (!search.trim()) return flatRevisions;
    const q = search.toLowerCase();
    return flatRevisions.filter(
      (r) =>
        r.costSheetNumber?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.changedBy?.toLowerCase().includes(q) ||
        r.boxType?.toLowerCase().includes(q) ||
        `v${r.revisionNumber}`.toLowerCase().includes(q)
    );
  }, [flatRevisions, search]);

  const filteredGroupedSheets = useMemo(() => {
    if (!search.trim()) return costSheets;
    const q = search.toLowerCase();
    return costSheets.filter(
      (cs) =>
        cs.costSheetNumber?.toLowerCase().includes(q) ||
        cs.customerName?.toLowerCase().includes(q) ||
        cs.customer?.name?.toLowerCase().includes(q) ||
        cs.title?.toLowerCase().includes(q) ||
        cs.boxType?.toLowerCase().includes(q)
    );
  }, [costSheets, search]);

  // Statistics
  const totalRevisionsCount = flatRevisions.length;
  const totalSheetsTracked = costSheets.length;
  const avgMargin = flatRevisions.length
    ? (
        flatRevisions.reduce((acc, curr) => acc + (curr.profitMargin || 0), 0) /
        flatRevisions.length
      ).toFixed(1)
    : '0.0';

  const toggleExpand = (sheetId: string) => {
    setExpandedSheetIds((prev) => ({
      ...prev,
      [sheetId]: !prev[sheetId],
    }));
  };

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      'Cost Sheet Number',
      'Revision',
      'Customer',
      'Box Type',
      'Dimensions',
      'Ply',
      'GSM',
      'Revision Reason',
      'Changed By',
      'Selling Price (INR)',
      'Profit Margin (%)',
      'Timestamp',
    ];

    const rows = filteredFlatRevisions.map((r) => [
      `"${r.costSheetNumber}"`,
      `"v${r.revisionNumber}"`,
      `"${r.customerName}"`,
      `"${r.boxType}"`,
      `"${r.dimensions}"`,
      r.ply,
      r.gsm || '-',
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      `"${r.changedBy}"`,
      r.sellingPrice.toFixed(2),
      `${r.profitMargin}%`,
      `"${new Date(r.createdAt).toLocaleString('en-IN')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Costing_Revision_History_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenSnapshot = (record: FlatRevisionRecord) => {
    if (record.rawRevision?.snapshotData) {
      try {
        const parsed = JSON.parse(record.rawRevision.snapshotData);
        setSelectedSnapshot({
          costSheetNumber: record.costSheetNumber,
          revisionNumber: record.revisionNumber,
          changedBy: record.changedBy,
          createdAt: record.createdAt,
          reason: record.reason,
          data: parsed,
        });
        return;
      } catch (e) {
        console.error('Failed to parse snapshot data', e);
      }
    }

    // Fallback if no JSON snapshot stored
    setSelectedSnapshot({
      costSheetNumber: record.costSheetNumber,
      revisionNumber: record.revisionNumber,
      changedBy: record.changedBy,
      createdAt: record.createdAt,
      reason: record.reason,
      data: {
        dimensions: record.dimensions,
        boxType: record.boxType,
        sellingPrice: record.sellingPrice,
        profitMargin: record.profitMargin,
        mfgCost: record.mfgCost,
      },
    });
  };

  return (
    <div className="space-y-6" id="costing-history-module">
      {/* Header & KPI Summary */}
      <div
        id="costing-history-header-card"
        className={`p-6 rounded-2xl border ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-3.5">
            <div
              className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1
                  className={`text-xl font-bold ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Costing Revision History & Audit Logs
                </h1>
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                    darkMode
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {totalRevisionsCount} Total Logs
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Comprehensive audit trail tracking specification changes, paper GSM
                revisions, margin adjustments, and commercial prices.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`px-4 py-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-slate-800/40 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Tracked Sheets
              </div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {totalSheetsTracked}
              </div>
            </div>

            <div
              className={`px-4 py-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-slate-800/40 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Audit Revisions
              </div>
              <div
                className={`text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400`}
              >
                {totalRevisionsCount}
              </div>
            </div>

            <div
              className={`px-4 py-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-slate-800/40 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Avg. Margin
              </div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  darkMode ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                {avgMargin}%
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, View Mode Toggle, and Actions */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-80">
              <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                id="costing-history-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Sheet #, Client, Author, Reason..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none transition-all ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 shadow-xs'
                }`}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div
              className={`p-1 rounded-xl border flex items-center space-x-1 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                id="btn-view-flat-log"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === 'flat'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : darkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Revision Logs
              </button>
              <button
                id="btn-view-grouped-log"
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : darkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grouped by Sheet
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              id="btn-refresh-history"
              onClick={loadData}
              disabled={loading}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Refresh Records"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Structure */}
      {viewMode === 'flat' ? (
        /* FLAT REVISION LOGS TABLE */
        <div
          id="costing-history-flat-table-container"
          className={`rounded-2xl border overflow-hidden ${
            darkMode
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table
              id="costing-history-flat-table"
              className="w-full text-left text-xs border-collapse"
            >
              <thead>
                <tr
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    darkMode
                      ? 'bg-slate-800/80 border-slate-800 text-slate-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Cost Sheet & Rev</th>
                  <th className="py-3.5 px-4">Customer & Account</th>
                  <th className="py-3.5 px-4">Box Specifications</th>
                  <th className="py-3.5 px-4">Change / Audit Reason</th>
                  <th className="py-3.5 px-4">Prepared By</th>
                  <th className="py-3.5 px-4 text-right">Mfg Cost</th>
                  <th className="py-3.5 px-4 text-center">Profit Margin</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  darkMode ? 'divide-slate-800/60' : 'divide-slate-200'
                }`}
              >
                {loading ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-20 text-center text-slate-500"
                    >
                      <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                      <p
                        className={`text-xs ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        Loading revision history table...
                      </p>
                    </td>
                  </tr>
                ) : filteredFlatRevisions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className={`py-20 text-center ${
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                      No costing revision records found matching &quot;{search}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredFlatRevisions.map((record, index) => (
                    <tr
                      key={`${record.id}-${index}`}
                      id={`costing-rev-row-${record.costSheetNumber}-v${record.revisionNumber}`}
                      className={`transition-colors ${
                        darkMode
                          ? 'hover:bg-slate-800/30 text-slate-300'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {index + 1}
                      </td>

                      {/* Cost Sheet Number & Rev Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              onSelectCostSheet(record.costSheetId, 'view')
                            }
                            className={`font-bold hover:underline cursor-pointer ${
                              darkMode ? 'text-emerald-400' : 'text-emerald-700'
                            }`}
                          >
                            {record.costSheetNumber}
                          </button>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                              record.revisionNumber > 1
                                ? darkMode
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                                : darkMode
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            v{record.revisionNumber}
                          </span>
                        </div>
                      </td>

                      {/* Customer / Client */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-semibold ${
                            darkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {record.customerName}
                        </div>
                        <div
                          className={`text-[11px] ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {record.boxType}
                        </div>
                      </td>

                      {/* Box Specifications */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-medium ${
                            darkMode ? 'text-slate-200' : 'text-slate-800'
                          }`}
                        >
                          {record.dimensions}
                        </div>
                        <div
                          className={`text-[10px] ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {record.ply}-Ply {record.gsm ? `| ${record.gsm} GSM` : ''}
                        </div>
                      </td>

                      {/* Audit Change Reason */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-medium max-w-xs truncate ${
                            darkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}
                          title={record.reason}
                        >
                          {record.reason}
                        </div>
                      </td>

                      {/* Prepared / Changed By */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span
                            className={`font-medium ${
                              darkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            {record.changedBy}
                          </span>
                        </div>
                      </td>

                      {/* Manufacturing Cost */}
                      <td className="py-3.5 px-4 text-right font-medium">
                        {record.mfgCost !== undefined
                          ? `₹${record.mfgCost.toFixed(2)}`
                          : '-'}
                      </td>

                      {/* Margin % */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            record.profitMargin >= 15
                              ? darkMode
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : record.profitMargin >= 10
                              ? darkMode
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                              : darkMode
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {record.profitMargin.toFixed(1)}%
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td
                        className={`py-3.5 px-4 text-right font-bold text-sm ${
                          darkMode ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      >
                        ₹{record.sellingPrice.toFixed(2)}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`text-xs ${
                            darkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          {new Date(record.createdAt).toLocaleDateString(
                            'en-IN',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </div>
                        <div
                          className={`text-[10px] ${
                            darkMode ? 'text-slate-500' : 'text-slate-500'
                          }`}
                        >
                          {new Date(record.createdAt).toLocaleTimeString(
                            'en-IN',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            }
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            id={`btn-view-sheet-${record.costSheetId}`}
                            onClick={() =>
                              onSelectCostSheet(record.costSheetId, 'view')
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode
                                ? 'hover:bg-slate-700 text-emerald-400'
                                : 'hover:bg-slate-100 text-emerald-700'
                            }`}
                            title="View Cost Sheet"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            id={`btn-inspect-rev-${record.id}`}
                            onClick={() => handleOpenSnapshot(record)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                              darkMode
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                            title="Inspect Revision Snapshot"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GROUPED BY COST SHEET TABLE WITH EXPANDABLE ROWS */
        <div
          id="costing-history-grouped-table-container"
          className={`rounded-2xl border overflow-hidden ${
            darkMode
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table
              id="costing-history-grouped-table"
              className="w-full text-left text-xs border-collapse"
            >
              <thead>
                <tr
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    darkMode
                      ? 'bg-slate-800/80 border-slate-800 text-slate-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <th className="py-3.5 px-4 w-10"></th>
                  <th className="py-3.5 px-4">Cost Sheet #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Box Specifications</th>
                  <th className="py-3.5 px-4 text-center">Version Count</th>
                  <th className="py-3.5 px-4">Latest Author</th>
                  <th className="py-3.5 px-4 text-right">Mfg Cost</th>
                  <th className="py-3.5 px-4 text-center">Profit Margin</th>
                  <th className="py-3.5 px-4 text-right">Latest Selling Price</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  darkMode ? 'divide-slate-800/60' : 'divide-slate-200'
                }`}
              >
                {loading ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-20 text-center text-slate-500"
                    >
                      <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                      <p
                        className={`text-xs ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        Loading Cost Sheets...
                      </p>
                    </td>
                  </tr>
                ) : filteredGroupedSheets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className={`py-20 text-center ${
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      No cost sheets found.
                    </td>
                  </tr>
                ) : (
                  filteredGroupedSheets.map((cs) => {
                    const isExpanded = !!expandedSheetIds[cs.id];
                    const revCount =
                      cs.revisions && cs.revisions.length > 0
                        ? cs.revisions.length
                        : 1;

                    return (
                      <React.Fragment key={cs.id}>
                        {/* Parent Cost Sheet Summary Row */}
                        <tr
                          id={`grouped-row-${cs.id}`}
                          className={`transition-colors ${
                            isExpanded
                              ? darkMode
                                ? 'bg-slate-800/40'
                                : 'bg-slate-50/80'
                              : darkMode
                              ? 'hover:bg-slate-800/20 text-slate-300'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          {/* Toggle expand button */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => toggleExpand(cs.id)}
                              className={`p-1 rounded-md cursor-pointer transition-colors ${
                                darkMode
                                  ? 'hover:bg-slate-700 text-slate-400'
                                  : 'hover:bg-slate-200 text-slate-600'
                              }`}
                              title={
                                isExpanded
                                  ? 'Collapse Revisions'
                                  : 'Expand Revisions'
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Cost Sheet Number */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`font-bold ${
                                  darkMode
                                    ? 'text-emerald-400'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {cs.costSheetNumber}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  darkMode
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                v{cs.revision}
                              </span>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4 font-semibold">
                            {cs.customerName ||
                              cs.customer?.name ||
                              'Standard Client'}
                          </td>

                          {/* Specifications */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium">
                              {cs.boxType} ({cs.ply}-Ply)
                            </div>
                            <div
                              className={`text-[11px] ${
                                darkMode ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {cs.length}×{cs.width}×{cs.height}{' '}
                              {cs.dimensionUnit || 'mm'} | {cs.totalBoardGsm}{' '}
                              GSM
                            </div>
                          </td>

                          {/* Revisions Count */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => toggleExpand(cs.id)}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                                darkMode
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <History className="w-3 h-3 text-emerald-500" />
                              <span>
                                {revCount} {revCount === 1 ? 'log' : 'logs'}
                              </span>
                            </button>
                          </td>

                          {/* Latest Author */}
                          <td className="py-3.5 px-4">
                            {cs.preparedBy || 'Costing Engineer'}
                          </td>

                          {/* Mfg Cost */}
                          <td className="py-3.5 px-4 text-right font-medium">
                            ₹
                            {(
                              cs.totalManufacturingCostPerBox || 0
                            ).toFixed(2)}
                          </td>

                          {/* Margin */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                (cs.profitMarginPercent || 0) >= 15
                                  ? darkMode
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : darkMode
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {(cs.profitMarginPercent || 0).toFixed(1)}%
                            </span>
                          </td>

                          {/* Selling Price */}
                          <td
                            className={`py-3.5 px-4 text-right font-bold text-sm ${
                              darkMode
                                ? 'text-emerald-400'
                                : 'text-emerald-700'
                            }`}
                          >
                            ₹{(cs.sellingPricePerBox || 0).toFixed(2)}
                          </td>

                          {/* Last Updated */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                            {new Date(
                              cs.updatedAt || cs.createdAt || ''
                            ).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() =>
                                onSelectCostSheet(cs.id, 'view')
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                darkMode
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              View Sheet
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Sub-Table for Historical Revisions */}
                        {isExpanded && (
                          <tr
                            id={`expanded-subtable-${cs.id}`}
                            className={
                              darkMode ? 'bg-slate-950/40' : 'bg-slate-50'
                            }
                          >
                            <td colSpan={11} className="py-4 px-6">
                              <div
                                className={`p-4 rounded-xl border ${
                                  darkMode
                                    ? 'bg-slate-900 border-slate-800'
                                    : 'bg-white border-slate-200 shadow-xs'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <History className="w-4 h-4 text-emerald-500" />
                                    <h4
                                      className={`text-xs font-bold ${
                                        darkMode ? 'text-white' : 'text-slate-900'
                                      }`}
                                    >
                                      Revision Audit Trail for {cs.costSheetNumber}
                                    </h4>
                                  </div>
                                  <span
                                    className={`text-[11px] ${
                                      darkMode
                                        ? 'text-slate-400'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    Showing all snapshot checkpoints
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr
                                        className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                                          darkMode
                                            ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                                            : 'bg-slate-100 border-slate-200 text-slate-600'
                                        }`}
                                      >
                                        <th className="py-2.5 px-3">Revision</th>
                                        <th className="py-2.5 px-3">
                                          Change Reason / Log
                                        </th>
                                        <th className="py-2.5 px-3">
                                          Changed By
                                        </th>
                                        <th className="py-2.5 px-3 text-right">
                                          Selling Price
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          Profit Margin
                                        </th>
                                        <th className="py-2.5 px-3">
                                          Logged At
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          Snapshot
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody
                                      className={`divide-y ${
                                        darkMode
                                          ? 'divide-slate-800'
                                          : 'divide-slate-100'
                                      }`}
                                    >
                                      {cs.revisions &&
                                      cs.revisions.length > 0 ? (
                                        cs.revisions.map((rev) => (
                                          <tr
                                            key={rev.id}
                                            className={`transition-colors ${
                                              darkMode
                                                ? 'hover:bg-slate-800/30 text-slate-300'
                                                : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                          >
                                            <td className="py-2.5 px-3">
                                              <span
                                                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                                  darkMode
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-emerald-100 text-emerald-800'
                                                }`}
                                              >
                                                v{rev.revisionNumber}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-medium">
                                              {rev.reason ||
                                                'Costing Revision Snapshot'}
                                            </td>
                                            <td className="py-2.5 px-3">
                                              {rev.changedBy ||
                                                cs.preparedBy ||
                                                'Costing Engineer'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                              {rev.sellingPrice
                                                ? `₹${rev.sellingPrice.toFixed(
                                                    2
                                                  )}`
                                                : `₹${(
                                                    cs.sellingPricePerBox || 0
                                                  ).toFixed(2)}`}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold">
                                              {rev.profitMargin !== undefined
                                                ? `${rev.profitMargin}%`
                                                : `${cs.profitMarginPercent}%`}
                                            </td>
                                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                                              {new Date(
                                                rev.createdAt || cs.createdAt || ''
                                              ).toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <button
                                                onClick={() =>
                                                  handleOpenSnapshot({
                                                    id: rev.id,
                                                    costSheetId: cs.id,
                                                    costSheetNumber:
                                                      cs.costSheetNumber,
                                                    revisionNumber:
                                                      rev.revisionNumber,
                                                    customerName:
                                                      cs.customerName ||
                                                      cs.customer?.name ||
                                                      '',
                                                    boxType: cs.boxType,
                                                    dimensions: `${cs.length}×${cs.width}×${cs.height} ${cs.dimensionUnit}`,
                                                    ply: cs.ply,
                                                    reason:
                                                      rev.reason || '',
                                                    changedBy:
                                                      rev.changedBy || '',
                                                    sellingPrice:
                                                      rev.sellingPrice ||
                                                      cs.sellingPricePerBox ||
                                                      0,
                                                    profitMargin:
                                                      rev.profitMargin ||
                                                      cs.profitMarginPercent ||
                                                      0,
                                                    createdAt:
                                                      rev.createdAt || '',
                                                    rawRevision: rev,
                                                    parentSheet: cs,
                                                  })
                                                }
                                                className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                                                  darkMode
                                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                                }`}
                                              >
                                                Inspect
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan={7}
                                            className="py-3 text-center text-slate-500"
                                          >
                                            Initial creation checkpoint (v1).
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revision Snapshot Inspection Modal Dialog */}
      {selectedSnapshot && (
        <div
          id="snapshot-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div
            id="snapshot-modal-content"
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-200'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center space-x-2">
                    <span>{selectedSnapshot.costSheetNumber}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                      v{selectedSnapshot.revisionNumber} Snapshot
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Saved by {selectedSnapshot.changedBy} on{' '}
                    {new Date(selectedSnapshot.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-snapshot-modal"
                onClick={() => setSelectedSnapshot(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-4 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  darkMode
                    ? 'bg-slate-800/40 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Change Note / Audit Reason
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedSnapshot.reason || 'No specific reason provided.'}
                </div>
              </div>

              {/* Data Display */}
              {selectedSnapshot.data?.calculated ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Snapshot Commercials & Calculations
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div
                      className={`p-3 rounded-xl border ${
                        darkMode
                          ? 'bg-slate-800/60 border-slate-700'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-slate-500 text-[10px] uppercase font-bold">
                        Mfg Cost
                      </div>
                      <div className="text-sm font-bold mt-1 text-slate-900 dark:text-white">
                        ₹
                        {(
                          selectedSnapshot.data.calculated
                            .totalManufacturingCostPerBox || 0
                        ).toFixed(2)}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        darkMode
                          ? 'bg-slate-800/60 border-slate-700'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-slate-500 text-[10px] uppercase font-bold">
                        Profit Margin
                      </div>
                      <div className="text-sm font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                        {selectedSnapshot.data.calculated.profitMarginPercent}%
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        darkMode
                          ? 'bg-slate-800/60 border-slate-700'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-slate-500 text-[10px] uppercase font-bold">
                        Selling Price
                      </div>
                      <div className="text-sm font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                        ₹
                        {(
                          selectedSnapshot.data.calculated
                            .sellingPricePerBox || 0
                        ).toFixed(2)}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        darkMode
                          ? 'bg-slate-800/60 border-slate-700'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-slate-500 text-[10px] uppercase font-bold">
                        Single Box Wt
                      </div>
                      <div className="text-sm font-bold mt-1 text-slate-900 dark:text-white">
                        {(
                          selectedSnapshot.data.calculated
                            .singleBoxWeightGrams || 0
                        ).toFixed(1)}{' '}
                        g
                      </div>
                    </div>
                  </div>

                  {selectedSnapshot.data.input?.layers && (
                    <div className="mt-4">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Paper Layer Specification at Snapshot:
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                              <th className="py-2 px-3">Layer</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3">GSM</th>
                              <th className="py-2 px-3">BF</th>
                              <th className="py-2 px-3 text-right">Rate/Kg</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {selectedSnapshot.data.input.layers.map(
                              (layer: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="py-2 px-3 font-semibold">
                                    {layer.layerName || `Layer ${idx + 1}`}
                                  </td>
                                  <td className="py-2 px-3">
                                    {layer.layerType}
                                  </td>
                                  <td className="py-2 px-3">{layer.gsm}</td>
                                  <td className="py-2 px-3">{layer.bf}</td>
                                  <td className="py-2 px-3 text-right">
                                    ₹{layer.ratePerKg}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`p-4 rounded-xl border font-mono text-[11px] overflow-x-auto ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <pre>{JSON.stringify(selectedSnapshot.data, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
