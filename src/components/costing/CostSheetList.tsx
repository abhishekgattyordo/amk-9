'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Download,
  FileText,
  Copy,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { CostSheetItem, CostSheetStatus, BoxType, User } from '@/types';
import { downloadPlanningCostSheetExcel } from '@/lib/planning-sheet-excel';
import { downloadPlanningCostSheetPdf } from '@/lib/planning-sheet-pdf';

interface CostSheetListProps {
  darkMode?: boolean;
  currentUser?: User | null;
  initialStatusFilter?: string;
  onSelectCostSheet: (id: string, mode: 'view' | 'edit') => void;
  onCreateNew: () => void;
}

export function CostSheetList({
  darkMode,
  currentUser,
  initialStatusFilter,
  onSelectCostSheet,
  onCreateNew,
}: CostSheetListProps) {
  const [costSheets, setCostSheets] = useState<CostSheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatusFilter || 'all'
  );
  const [boxTypeFilter, setBoxTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'margin' | 'qty'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCostSheets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (boxTypeFilter !== 'all') params.set('boxType', boxTypeFilter);

      const res = await fetch(`/api/costing?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCostSheets(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching cost sheets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostSheets();
  }, [search, statusFilter, boxTypeFilter]);

  const handleDelete = async (id: string, costSheetNum: string) => {
    if (!confirm(`Are you sure you want to move Cost Sheet ${costSheetNum} to the Recycle Bin?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/costing/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCostSheets((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(`Error deleting cost sheet: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting cost sheet: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConvertToQuotation = async (id: string, costSheetNum: string) => {
    if (!confirm(`Generate a formal Sales Quotation from approved Cost Sheet ${costSheetNum}?`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/costing/${id}/convert-to-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: currentUser?.name || 'Sales Officer',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Quotation ${data.data?.quotation?.quotationNumber || ''} generated successfully!`);
        fetchCostSheets();
      } else {
        alert(`Error generating quotation: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error generating quotation: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const exportToCsv = () => {
    if (costSheets.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Cost Sheet #',
      'Revision',
      'Date',
      'Customer',
      'Box Type',
      'Ply',
      'Dimensions (L x W x H)',
      'Total GSM',
      'BS (kg/cm2)',
      'Target Qty',
      'Mfg Cost/Box',
      'Margin %',
      'Selling Price/Box',
      'Total Value',
      'Status',
    ];

    const rows = costSheets.map((cs) => [
      cs.costSheetNumber,
      `v${cs.revision}`,
      new Date(cs.createdAt || '').toLocaleDateString(),
      cs.customerName || cs.customer?.name || 'N/A',
      cs.boxType,
      `${cs.ply}-Ply`,
      `${cs.length}x${cs.width}x${cs.height} ${cs.dimensionUnit}`,
      cs.totalBoardGsm,
      cs.burstingStrength,
      cs.targetQuantity,
      cs.totalManufacturingCostPerBox,
      cs.profitMarginPercent,
      cs.sellingPricePerBox,
      cs.totalOrderValue,
      cs.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((f) => `"${f}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cost_Sheets_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort logic
  const sortedSheets = [...costSheets].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    } else if (sortBy === 'price') {
      comparison = (b.sellingPricePerBox || 0) - (a.sellingPricePerBox || 0);
    } else if (sortBy === 'margin') {
      comparison = (b.profitMarginPercent || 0) - (a.profitMarginPercent || 0);
    } else if (sortBy === 'qty') {
      comparison = (b.targetQuantity || 0) - (a.targetQuantity || 0);
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  return (
    <div className="space-y-5">
      {/* Top Controls Card */}
      <div
        className={`p-5 rounded-2xl border ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Sheet #, Customer, Box..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none transition-all ${
                  darkMode
                    ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                }`}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending MD Approval">Pending MD Approval</option>
              <option value="Approved">Approved</option>
              <option value="Converted to Quotation">Converted to Quotation</option>
              <option value="Revision Requested">Revision Requested</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Box Type Filter */}
            <select
              value={boxTypeFilter}
              onChange={(e) => setBoxTypeFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">All Box Types</option>
              <option value="Universal Box">Universal Box (RSC)</option>
              <option value="Customized Box">Customized Box</option>
              <option value="Die-Cut">Die-Cut Box</option>
              <option value="Sheet Board">Sheet Board</option>
              <option value="Partition">Partition / Fitment</option>
            </select>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={exportToCsv}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                darkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Cost Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b ${
                  darkMode
                    ? 'bg-slate-800/50 border-slate-800 text-slate-400'
                    : 'bg-slate-50/80 border-slate-200 text-slate-600'
                }`}
              >
                <th className="py-3 px-4 font-semibold">Cost Sheet #</th>
                <th className="py-3 px-4 font-semibold">Customer / Item</th>
                <th className="py-3 px-4 font-semibold">Specifications</th>
                <th className="py-3 px-4 font-semibold text-right">Target Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Mfg Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Margin %</th>
                <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                    <span>Loading Cost Sheets...</span>
                  </td>
                </tr>
              ) : sortedSheets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center space-y-3">
                    <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                    <p
                      className={`text-sm ${
                        darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'
                      }`}
                    >
                      No Cost Sheets found matching your filter criteria.
                    </p>
                    <button
                      onClick={onCreateNew}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Create New Cost Sheet
                    </button>
                  </td>
                </tr>
              ) : (
                sortedSheets.map((cs) => (
                  <tr
                    key={cs.id}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-800/20 text-slate-300' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* Cost Sheet Number & Revision */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {cs.costSheetNumber}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          v{cs.revision}
                        </span>
                      </div>
                      <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                        {new Date(cs.createdAt || '').toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Customer / Lead */}
                    <td className="py-3.5 px-4">
                      <div
                        className={`font-semibold ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {cs.customerName || cs.customer?.name || 'Standard Client'}
                      </div>
                      {cs.lead && (
                        <div className={`text-[10px] mt-0.5 font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Lead: {cs.lead.leadNumber} ({cs.lead.contactPerson})
                        </div>
                      )}
                    </td>

                    {/* Specifications */}
                    <td className="py-3.5 px-4">
                      <div className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        {cs.boxType} ({cs.ply}-Ply)
                      </div>
                      <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {cs.length}x{cs.width}x{cs.height} {cs.dimensionUnit} |{' '}
                        {cs.totalBoardGsm} GSM | {cs.burstingStrength} BS
                      </div>
                    </td>

                    {/* Target Quantity */}
                    <td className="py-3.5 px-4 text-right font-medium">
                      {(cs.targetQuantity || 0).toLocaleString()} {cs.unit}
                    </td>

                    {/* Mfg Cost */}
                    <td className={`py-3.5 px-4 text-right font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      ₹{(cs.totalManufacturingCostPerBox || 0).toFixed(2)}
                    </td>

                    {/* Profit Margin */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          (cs.profitMarginPercent || 0) >= 15
                            ? darkMode
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (cs.profitMarginPercent || 0) >= 10
                            ? darkMode
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                            : darkMode
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {(cs.profitMarginPercent || 0).toFixed(1)}%
                      </span>
                    </td>

                    {/* Selling Price */}
                    <td className={`py-3.5 px-4 text-right font-bold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      ₹{(cs.sellingPricePerBox || 0).toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          cs.status === 'Approved'
                            ? darkMode
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cs.status === 'Pending MD Approval' ||
                              cs.status === 'Submitted'
                            ? darkMode
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            : cs.status === 'Converted to Quotation'
                            ? darkMode
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                            : cs.status === 'Revision Requested'
                            ? darkMode
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : cs.status === 'Rejected'
                            ? darkMode
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                            : darkMode
                            ? 'bg-slate-700/40 text-slate-300 border-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cs.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {/* Download PDF (Reference Format) */}
                        <button
                          onClick={() => downloadPlanningCostSheetPdf(cs)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Download Planning and Cost Sheet PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* View */}
                        <button
                          onClick={() => onSelectCostSheet(cs.id, 'view')}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="View Spec Sheet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onSelectCostSheet(cs.id, 'edit')}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit Cost Sheet"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Convert to Quotation if Approved */}
                        {cs.status === 'Approved' && (
                          <button
                            onClick={() =>
                              handleConvertToQuotation(cs.id, cs.costSheetNumber)
                            }
                            disabled={actionLoadingId === cs.id}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                            title="Generate Quotation"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(cs.id, cs.costSheetNumber)}
                          disabled={actionLoadingId === cs.id}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between text-xs ${
            darkMode
              ? 'bg-slate-900 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <div>
            Showing <strong>{sortedSheets.length}</strong> Cost Sheet records
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span>
              Total Quoted Value:{' '}
              <strong className="text-emerald-500">
                ₹
                {sortedSheets
                  .reduce((sum, c) => sum + (c.totalOrderValue || 0), 0)
                  .toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
