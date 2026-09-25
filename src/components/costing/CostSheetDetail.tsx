'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit2,
  Printer,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Copy,
  ChevronDown,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { CostSheetItem, CostSheetApprovalItem, CostSheetRevisionItem, User } from '@/types';
import { PlanningCostSheetModal } from './PlanningCostSheetModal';
import { downloadPlanningCostSheetExcel } from '@/lib/planning-sheet-excel';
import { downloadPlanningCostSheetPdf } from '@/lib/planning-sheet-pdf';

interface CostSheetDetailProps {
  costSheetId: string;
  darkMode?: boolean;
  currentUser?: User | null;
  onBack: () => void;
  onEdit: (id: string) => void;
  onQuotationCreated?: (quotationId: string) => void;
  onViewBom?: (bomId: string) => void;
}

export function CostSheetDetail({
  costSheetId,
  darkMode,
  currentUser,
  onBack,
  onEdit,
  onQuotationCreated,
  onViewBom,
}: CostSheetDetailProps) {
  const [costSheet, setCostSheet] = useState<CostSheetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MD Approval action modal/input state
  const [approvalAction, setApprovalAction] = useState<
    'approve' | 'reject' | 'request_revision' | null
  >(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Planning Cost Sheet modal
  const [showPlanningModal, setShowPlanningModal] = useState(false);

  // Conversion loading
  const [converting, setConverting] = useState(false);

  const fetchCostSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/costing/${costSheetId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCostSheet(data.data);
      } else {
        setError(data.error || 'Failed to load cost sheet details');
      }
    } catch (err: any) {
      console.error('Error fetching cost sheet detail:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostSheet();
  }, [costSheetId]);

  const handleMDApproval = async () => {
    if (!approvalAction || !costSheet) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/costing/${costSheet.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalAction,
          remarks: approvalRemarks,
          userName: currentUser?.name || 'Managing Director',
          userRole: currentUser?.role || 'Managing Director',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCostSheet(data.data);
        setApprovalAction(null);
        setApprovalRemarks('');
      } else {
        alert(`Error executing approval: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToQuotation = async () => {
    if (!costSheet) return;
    if (
      !confirm(
        `Convert Approved Cost Sheet ${costSheet.costSheetNumber} into a Sales Quotation?`
      )
    ) {
      return;
    }

    try {
      setConverting(true);
      const res = await fetch(`/api/costing/${costSheet.id}/convert-to-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: currentUser?.name || 'Sales Officer',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Success! Sales Quotation ${data.data?.quotation?.quotationNumber} generated.`
        );
        fetchCostSheet();
        if (onQuotationCreated && data.data?.quotation?.id) {
          onQuotationCreated(data.data.quotation.id);
        }
      } else {
        alert(`Failed to convert: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error converting to quotation: ${err.message}`);
    } finally {
      setConverting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Clock className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Loading Cost Sheet specifications...</p>
      </div>
    );
  }

  if (error || !costSheet) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="text-sm text-rose-500">{error || 'Cost sheet not found'}</p>
        <button
          onClick={onBack}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            darkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          Back to List
        </button>
      </div>
    );
  }

  const formatCurrency = (v?: number) =>
    `₹${(v || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Action Ribbon (Hidden when printing) */}
      <div
        className={`p-5 rounded-2xl border print:hidden ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800 shadow-sm'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                darkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1
                  className={`text-lg font-bold ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {costSheet.costSheetNumber}
                </h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  Revision {costSheet.revision}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    costSheet.status === 'Approved'
                      ? darkMode
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : costSheet.status === 'Pending MD Approval' ||
                        costSheet.status === 'Submitted'
                      ? darkMode
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      : costSheet.status === 'Converted to Quotation'
                      ? darkMode
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                      : costSheet.status === 'Rejected'
                      ? darkMode
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                      : darkMode
                      ? 'bg-slate-700/40 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {costSheet.status}
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Created on{' '}
                {new Date(costSheet.createdAt || '').toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                by {costSheet.preparedBy || 'Costing Engineer'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Planning & Cost Sheet Button (PDF Reference Format & Excel) */}
            <div className="flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all">
              <button
                onClick={() => downloadPlanningCostSheetPdf(costSheet)}
                className="px-3.5 py-2 flex items-center space-x-1.5 cursor-pointer rounded-l-xl hover:bg-emerald-700/30"
                title="Download Cost Sheet PDF (Exact Reference Format)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <div className="h-4 w-[1px] bg-emerald-400/40" />
              <button
                onClick={() => downloadPlanningCostSheetExcel(costSheet)}
                className="px-2.5 py-2 cursor-pointer hover:bg-emerald-700/30 flex items-center space-x-1"
                title="Download Planning Sheet (.xlsx)"
              >
                <span className="text-[11px] font-medium">Excel</span>
              </button>
              <div className="h-4 w-[1px] bg-emerald-400/40" />
              <button
                onClick={() => setShowPlanningModal(true)}
                className="px-2.5 py-2 cursor-pointer rounded-r-xl hover:bg-emerald-700/30 flex items-center space-x-1"
                title="Preview / Print Planning & Cost Sheet Format"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px] font-medium">View Sheet</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                darkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700 bg-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={() => onEdit(costSheet.id)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                darkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700 bg-white'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit / Revise</span>
            </button>

            {/* Convert to Quotation if Approved */}
            {costSheet.status === 'Approved' && (
              <button
                onClick={handleConvertToQuotation}
                disabled={converting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{converting ? 'Converting...' : 'Generate Sales Quotation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MD Approval Action Panel (Visible for Review) */}
      {(costSheet.status === 'Pending MD Approval' ||
        costSheet.status === 'Submitted' ||
        costSheet.status === 'Draft') && (
        <div
          className={`p-5 rounded-2xl border print:hidden ${
            darkMode
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2
                  className={`text-sm font-bold ${
                    darkMode ? 'text-amber-300' : 'text-amber-900'
                  }`}
                >
                  Managing Director (MD) Commercial Approval
                </h2>
                <p
                  className={`text-xs ${
                    darkMode ? 'text-amber-400/80' : 'text-amber-700'
                  }`}
                >
                  Review the cost structure, proposed profit margin (
                  <strong>{costSheet.profitMarginPercent}%</strong>), and quoted
                  selling price (
                  <strong>₹{costSheet.sellingPricePerBox?.toFixed(2)}</strong>).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setApprovalAction('approve')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                onClick={() => setApprovalAction('request_revision')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Revision</span>
              </button>

              <button
                onClick={() => setApprovalAction('reject')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Expanded Approval Remarks Form */}
          {approvalAction && (
            <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-3">
              <label className={`block text-xs font-bold ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                MD Review Remarks ({approvalAction.replace('_', ' ').toUpperCase()}):
              </label>
              <textarea
                rows={2}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Enter approval conditions, margin feedback, or revision instructions..."
                className={`w-full p-3 rounded-xl text-xs font-medium border outline-none ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setApprovalAction(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMDApproval}
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Decision'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Spec Sheet Display */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        {/* Printable Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start pb-6 border-b gap-4 ${
          darkMode ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div>
            <div className={`text-xl font-extrabold uppercase tracking-wide ${
              darkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              AMK Corrugation & Packaging
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              Industrial Corrugated Box Technical & Costing Specification Sheet
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold font-mono ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {costSheet.costSheetNumber}
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Rev: v{costSheet.revision} | Date:{' '}
              {new Date(costSheet.createdAt || '').toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Client & Item Details */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 py-5 border-b text-xs ${
          darkMode ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          <div>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Customer / Client:</span>
            <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {costSheet.customerName || costSheet.customer?.name || 'Standard Client'}
            </span>
          </div>

          <div>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Box Style / Type:</span>
            <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {costSheet.boxType} ({costSheet.ply}-Ply)
            </span>
          </div>

          <div>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Target Batch Quantity:</span>
            <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {(costSheet.targetQuantity || 0).toLocaleString()} {costSheet.unit}
            </span>
          </div>

          <div>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Bill of Material (BOM):</span>
            {costSheet.bom ? (
              <button
                type="button"
                onClick={() => onViewBom && onViewBom(costSheet.bom.id)}
                className={`font-bold text-sm hover:underline flex items-center space-x-1 cursor-pointer ${
                  darkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}
                title="View Bill of Material"
              >
                <Layers className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span>{costSheet.bom.bomNumber}</span>
              </button>
            ) : (
              <span className={`font-medium text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Direct / No BOM
              </span>
            )}
          </div>

          <div>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Lead Reference:</span>
            <span className={`font-bold text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {costSheet.lead ? costSheet.lead.leadNumber : 'N/A (Direct)'}
            </span>
          </div>
        </div>

        {/* Box Physical Dimensions & Sheet Geometry */}
        <div className={`py-5 border-b space-y-3 ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            darkMode ? 'text-emerald-400' : 'text-emerald-700'
          }`}>
            Dimensions & Geometry Specifications
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className={`p-3.5 rounded-xl border ${
              darkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <span className={`block text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Box Length:
              </span>
              <span className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {costSheet.length} {costSheet.dimensionUnit}
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              darkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <span className={`block text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Box Width:
              </span>
              <span className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {costSheet.width} {costSheet.dimensionUnit}
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              darkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <span className={`block text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Box Height:
              </span>
              <span className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {costSheet.height} {costSheet.dimensionUnit}
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              darkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
            }`}>
              <span className={`block text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-emerald-800'}`}>
                Deckle Size:
              </span>
              <span className={`font-bold text-base ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {costSheet.deckleSizeMm} mm
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              darkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
            }`}>
              <span className={`block text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-emerald-800'}`}>
                Cutting Length:
              </span>
              <span className={`font-bold text-base ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {costSheet.cuttingLengthMm} mm
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              darkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-teal-50/70 border-teal-200 shadow-sm'
            }`}>
              <span className={`block text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-teal-800'}`}>
                Sheet Area:
              </span>
              <span className={`font-bold text-base ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                {costSheet.sheetAreaSqM} m²
              </span>
            </div>
          </div>
        </div>

        {/* Paper Layers Breakdown Table */}
        <div className={`py-5 border-b space-y-3 ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            darkMode ? 'text-emerald-400' : 'text-emerald-700'
          }`}>
            Paper Board Architecture & Layer Decomposition
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${
                  darkMode ? 'border-slate-800 text-slate-400 bg-slate-800/40' : 'border-slate-200 text-slate-700 bg-slate-100 font-bold'
                }`}>
                  <th className="py-2.5 px-3 font-semibold">Layer</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Paper Grade</th>
                  <th className="py-2.5 px-3 font-semibold text-right">GSM</th>
                  <th className="py-2.5 px-3 font-semibold text-right">BF</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Flute Factor</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Layer Weight</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Rate (₹/kg)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cost / Box</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-800'
              }`}>
                {costSheet.layers?.map((l) => (
                  <tr key={l.id || l.layerIndex} className={darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                    <td className={`py-2.5 px-3 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {l.layerName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.layerType === 'Fluting'
                            ? darkMode
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-amber-100 text-amber-800 font-bold'
                            : darkMode
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-blue-100 text-blue-800 font-bold'
                        }`}
                      >
                        {l.layerType}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {l.paperGrade || l.material?.name || 'Standard Paper'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">{l.gsm}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{l.bf}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {l.fluteFactor?.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {l.weightGrams?.toFixed(1)} g
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      ₹{l.ratePerKg?.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      ₹{l.costPerBox?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality Prediction & Operational Cost Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 py-5 border-b text-xs ${
          darkMode ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          {/* Quality & Strength Predictions */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              darkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              Predicted Technical & Strength Parameters
            </h3>
            <div className="space-y-2">
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Total Board GSM:</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {costSheet.totalBoardGsm} GSM
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Bursting Strength (BS):</span>
                <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {costSheet.burstingStrength} kg/cm²
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Bursting Factor (BF):</span>
                <span className={`font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                  {costSheet.burstingFactor} BF
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Est. Box Compression (BCT):</span>
                <span className={`font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                  {costSheet.boxCompressionTest} kgf
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Single Box Weight:</span>
                <span className={`font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  {costSheet.singleBoxWeightGrams} g ({costSheet.singleBoxWeightKg}{' '}
                  kg)
                </span>
              </div>
            </div>
          </div>

          {/* Operational & Conversion Breakdown */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              darkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              Conversion & Auxiliary Cost Breakdown
            </h3>
            <div className="space-y-2">
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Paper Cost / Box:</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  ₹{costSheet.paperCostPerBox?.toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>
                  Wastage Allowance ({costSheet.wastagePercent}%):
                </span>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  ₹{costSheet.wastageCostPerBox?.toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Starch & Adhesives:</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  ₹{costSheet.starchCostPerBox?.toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Printing & Conversion:</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  ₹
                  {(
                    (costSheet.printingCostPerBox || 0) +
                    (costSheet.conversionLaborCostPerBox || 0)
                  ).toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Overheads & Logistics:</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  ₹
                  {(
                    (costSheet.overheadCostPerBox || 0) +
                    (costSheet.freightCostPerBox || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Pricing Summary Banner */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Mfg Cost / Box:
            </span>
            <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              ₹{costSheet.totalManufacturingCostPerBox?.toFixed(2)}
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Profit Margin %:
            </span>
            <span
              className={`text-lg font-bold ${
                (costSheet.profitMarginPercent || 0) >= 15
                  ? darkMode
                    ? 'text-emerald-400'
                    : 'text-emerald-700'
                  : darkMode
                  ? 'text-amber-400'
                  : 'text-amber-700'
              }`}
            >
              {costSheet.profitMarginPercent}% (₹
              {costSheet.profitAmountPerBox?.toFixed(2)} / box)
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-emerald-50 border-emerald-200 shadow-sm'
          }`}>
            <span className={`block font-semibold ${
              darkMode ? 'text-emerald-400' : 'text-emerald-800'
            }`}>
              Quoted Selling Price:
            </span>
            <span className={`text-2xl font-extrabold ${
              darkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              ₹{costSheet.sellingPricePerBox?.toFixed(2)}
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <span className={`block font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Grand Total (incl. GST):
            </span>
            <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(costSheet.grandTotalValue)}
            </span>
          </div>
        </div>

        {/* Approval History & Audit Trail */}
        {costSheet.approvals && costSheet.approvals.length > 0 && (
          <div className={`mt-8 pt-6 border-t space-y-3 ${
            darkMode ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${
              darkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span>Approval & Commercial Audit Trail</span>
            </h3>
            <div className="space-y-2">
              {costSheet.approvals.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    darkMode
                      ? 'bg-slate-800/30 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {app.action}
                    </span>
                    <span className={`ml-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      by {app.userName} ({app.userRole})
                    </span>
                    {app.remarks && (
                      <p className={`mt-1 italic ${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                        &quot;{app.remarks}&quot;
                      </p>
                    )}
                  </div>
                  <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {new Date(app.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Planning & Cost Sheet Format Modal */}
      {costSheet && (
        <PlanningCostSheetModal
          costSheet={costSheet}
          isOpen={showPlanningModal}
          onClose={() => setShowPlanningModal(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
