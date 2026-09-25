'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowLeft,
  Edit2,
  Copy,
  Printer,
  Calculator,
  Trash2,
  Package,
  Building2,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  AlertCircle,
  FileText,
  Tag,
  Scale,
  Calendar,
  User as UserIcon,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import { BillOfMaterial, User } from '@/types';

interface CostingBomDetailProps {
  bomId: string;
  darkMode?: boolean;
  currentUser?: User | null;
  onBack: () => void;
  onEdit: (id: string) => void;
  onCreateCostSheet: (bomId: string, bomData: BillOfMaterial) => void;
  onSelectCostSheet?: (costSheetId: string) => void;
}

export function CostingBomDetail({
  bomId,
  darkMode,
  currentUser,
  onBack,
  onEdit,
  onCreateCostSheet,
  onSelectCostSheet,
}: CostingBomDetailProps) {
  const [bom, setBom] = useState<BillOfMaterial | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchBom = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/costing/bom/${bomId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBom(data.data);
      } else {
        setError(data.error || 'Failed to load BOM details');
      }
    } catch (err: any) {
      console.error('Error fetching BOM detail:', err);
      setError(err.message || 'An error occurred while loading BOM details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBom();
  }, [bomId]);

  const handleDelete = async () => {
    if (!bom) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/costing/bom/${bom.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onBack();
      } else {
        alert(data.error || 'Failed to delete BOM');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete BOM');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Loading Bill of Materials details...
        </p>
      </div>
    );
  }

  if (error || !bom) {
    return (
      <div className="p-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
        <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Failed to Load BOM
        </h3>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {error || 'The requested Bill of Material could not be found.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white cursor-pointer"
        >
          Return to BOM List
        </button>
      </div>
    );
  }

  const items = bom.items || [];
  const costSheets = bom.costSheets || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:p-0 print:max-w-none">
      {/* Top Action & Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
            title="Back to BOM List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {bom.bomNumber}
              </h1>
              {bom.version && (
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  Rev v{bom.version}
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  bom.status === 'Active'
                    ? darkMode
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : bom.status === 'Draft'
                    ? darkMode
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    : darkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {bom.status}
              </span>
            </div>
            <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {bom.name}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Create Cost Sheet CTA */}
          <button
            type="button"
            onClick={() => onCreateCostSheet(bom.id, bom)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Create Costing Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(bom.id)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit BOM</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print BOM</span>
          </button>

          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-rose-400 hover:bg-rose-500/10'
                : 'border-slate-200 bg-white text-rose-600 hover:bg-rose-50 shadow-sm'
            }`}
            title="Delete BOM"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workflow Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between overflow-x-auto ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3 text-xs font-medium">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span>Sales Lead / Quote</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center space-x-1.5 font-bold text-indigo-500">
            <span className="p-1 rounded bg-indigo-500/10">BOM (Current)</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span>Costing Sheet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span>Manager Approval</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span>Customer Quotation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span>Sales Order</span>
          </div>
        </div>

        <div className={`text-[11px] font-medium shrink-0 ml-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Created by <span className="font-semibold">{bom.createdBy || 'System User'}</span> •{' '}
          {bom.createdAt ? new Date(bom.createdAt).toLocaleDateString() : 'Recent'}
        </div>
      </div>

      {/* Top 4 Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Finished Product Card */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 text-indigo-500 font-semibold text-xs">
            <Package className="w-4 h-4" />
            <span>Finished Product</span>
          </div>
          <div className="space-y-1">
            <div className={`font-bold text-sm line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {bom.product?.name || 'Custom Product'}
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Code: <span className="font-mono">{bom.product?.code || 'PRD-001'}</span>
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Type: {bom.product?.boxType || 'Universal Box'}
            </div>
            {bom.product?.dimensions && (
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Dims: <span className="font-semibold">{bom.product.dimensions}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Requirement Card */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 text-emerald-500 font-semibold text-xs">
            <Building2 className="w-4 h-4" />
            <span>Customer & Linkage</span>
          </div>
          <div className="space-y-1">
            <div className={`font-bold text-sm line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {bom.customer?.name || bom.customerName || 'Standard / Generic'}
            </div>
            {bom.lead && (
              <div className="text-xs text-amber-500 font-medium">
                Lead: {bom.lead.leadNumber}
              </div>
            )}
            {bom.quotation && (
              <div className="text-xs text-emerald-500 font-medium">
                Quotation: {bom.quotation.quotationNumber}
              </div>
            )}
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Batch Quantity: <span className="font-bold">{bom.requiredQuantity || 1000} Pcs</span>
            </div>
          </div>
        </div>

        {/* Board Specifications */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 text-sky-500 font-semibold text-xs">
            <Layers className="w-4 h-4" />
            <span>Board Construction</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                bom.ply === 3 ? 'bg-sky-500/10 text-sky-500' : bom.ply === 5 ? 'bg-indigo-500/10 text-indigo-500' : 'bg-purple-500/10 text-purple-500'
              }`}>
                {bom.ply || 5}-Ply
              </span>
              <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {bom.fluteType || 'BC-Flute'}
              </span>
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Deckle Size: <span className="font-semibold">{bom.deckleSizeMm ? `${bom.deckleSizeMm} mm` : 'Auto'}</span>
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Cut Size: <span className="font-semibold">{bom.cutSizeMm ? `${bom.cutSizeMm} mm` : 'Auto'}</span>
            </div>
          </div>
        </div>

        {/* Costing Overview Card */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            darkMode ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2 text-emerald-500 font-semibold text-xs">
            <Calculator className="w-4 h-4" />
            <span>Material Cost / Unit</span>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-black ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              ₹{Number(bom.estimatedCost || 0).toFixed(2)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Single Box Weight:{' '}
              <span className="font-bold">
                {bom.totalWeightGrams ? `${bom.totalWeightGrams} g (${(bom.totalWeightGrams / 1000).toFixed(3)} kg)` : '—'}
              </span>
            </div>
            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Batch Material Cost:{' '}
              <span className="font-bold">
                ₹{(Number(bom.estimatedCost || 0) * (bom.requiredQuantity || 1000)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill of Materials Items Table */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Component & Raw Material Consumption Breakdown ({items.length} Layers)
            </h3>
          </div>

          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Basis: 1 Finished Box
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50/90 border-slate-200 text-slate-600'}`}>
                <th className="py-2.5 px-3 font-semibold text-center w-10">#</th>
                <th className="py-2.5 px-3 font-semibold">Layer / Component</th>
                <th className="py-2.5 px-3 font-semibold">Raw Material Spec & Code</th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">GSM</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Qty / Unit</th>
                <th className="py-2.5 px-3 font-semibold w-16">UOM</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Rate (₹)</th>
                <th className="py-2.5 px-3 font-semibold text-right w-32">Total Cost (₹)</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Current Stock</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200/80 text-slate-700'}`}>
              {items.map((it, idx) => (
                <tr key={it.id || idx} className={darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}>
                  <td className="py-3 px-3 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-200">
                    {it.layer}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-100">{it.materialName}</div>
                    {it.materialCode && (
                      <div className="text-[11px] font-mono text-slate-400">{it.materialCode}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">
                    {it.gsm ? `${it.gsm} GSM` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-indigo-400">
                    {it.quantityPerUnit}
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {it.unit || 'Kg'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    ₹{Number(it.unitCost || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    ₹{Number(it.totalCost || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {it.material?.currentStock !== undefined ? (
                      <span className={`font-semibold ${it.material.currentStock > 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {it.material.currentStock} {it.material.uom || 'Kg'}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 ${darkMode ? 'border-slate-700 bg-slate-800/80 text-white' : 'border-slate-300 bg-slate-100 text-slate-900'} font-bold`}>
                <td colSpan={4} className="py-3 px-3 text-right">
                  Total Material Cost per Unit:
                </td>
                <td colSpan={3} className="py-3 px-3 text-right text-xs">
                  {bom.totalWeightGrams} g / Box
                </td>
                <td className="py-3 px-3 text-right text-emerald-500 text-sm">
                  ₹{Number(bom.estimatedCost || 0).toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Extended 22 Technical Sections if available */}
      {bom.sections && (
        <div
          className={`p-5 rounded-2xl border space-y-6 ${
            darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Boxes className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold">22 Extended Technical & Engineering Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Box Spec & Dimensions */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="font-bold text-blue-500 flex items-center gap-1.5">
                <span>Box Spec &amp; Dimensions</span>
              </div>
              <p>Type: <span className="font-semibold">{bom.sections.boxSpec?.boxType || 'RSC'}</span></p>
              <p>L x W x H: <span className="font-semibold">{bom.sections.dimensions?.lengthMm} x {bom.sections.dimensions?.widthMm} x {bom.sections.dimensions?.heightMm} {bom.sections.dimensions?.dimensionUnit || 'mm'} ({bom.sections.dimensions?.dimensionType || 'Inner'})</span></p>
              <p>Tolerance: ±{bom.sections.dimensions?.toleranceMm || 2} mm</p>
              <p>Target BCT: {bom.sections.boxSpec?.targetBCTKgf || 0} kgf</p>
            </div>

            {/* Sheet & Wastage */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="font-bold text-blue-500 flex items-center gap-1.5">
                <span>Sheet Parameters &amp; Wastage</span>
              </div>
              <p>Gross Deckle x Cut: {bom.sections.sheetSize?.grossDeckleMm} x {bom.sections.sheetSize?.grossCutLengthMm} mm</p>
              <p>Ups: {bom.sections.sheetParameters?.upsAcross} Across x {bom.sections.sheetParameters?.upsAround} Around = {bom.sections.sheetParameters?.totalUps} Total</p>
              <p>Trim Wastage: {bom.sections.wastageCalculations?.trimWastagePercent}% | Total: {bom.sections.wastageCalculations?.totalWastagePercent}%</p>
              <p>Fluting Factor: {bom.sections.wastageCalculations?.flutingFactor || 1.4}</p>
            </div>

            {/* Quality & Client Reqs */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="font-bold text-blue-500 flex items-center gap-1.5">
                <span>Client Quality Reqs</span>
              </div>
              <p>Bursting Strength (BS): {bom.sections.clientRequirements?.burstingStrengthBS} kg/cm²</p>
              <p>ECT: {bom.sections.clientRequirements?.ectKnm} kN/m | Cobb: {bom.sections.clientRequirements?.cobbValueGsm} g/m²</p>
              <p>Moisture Max: {bom.sections.clientRequirements?.moisturePercent}%</p>
              <p>Coating: {bom.sections.clientRequirements?.coatingType || 'Standard'}</p>
            </div>

            {/* Printing & Lamination */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="font-bold text-blue-500 flex items-center gap-1.5">
                <span>Printing &amp; Lamination</span>
              </div>
              <p>Printing: {bom.sections.additionalDetails?.printingType} ({bom.sections.additionalDetails?.colorCount || 0} Colors)</p>
              <p>Ink Consumption: {bom.sections.printingDetails?.inkConsumptionGsm || 0} g/m²</p>
              <p>Lamination: {bom.sections.lamination?.laminationType || 'None'}</p>
              <p>Anilox: {bom.sections.printingDetails?.aniloxLpi || 250} LPI</p>
            </div>

            {/* Joint & Bundling */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="font-bold text-blue-500 flex items-center gap-1.5">
                <span>Joint, Punching &amp; Bundling</span>
              </div>
              <p>Joint: {bom.sections.jointDetails?.jointType || bom.sections.additionalDetails?.jointType}</p>
              <p>Stitch: {bom.sections.jointDetails?.stitchCount || 0} stitches ({bom.sections.jointDetails?.wireGauge || 'Flat Wire'})</p>
              <p>Packing: {bom.sections.bundlingDetails?.packingMode} ({bom.sections.bundlingDetails?.boxesPerBundle} pcs/bundle)</p>
              <p>Corner Protectors: {bom.sections.bundlingDetails?.cornerProtectors ? 'Yes' : 'No'}</p>
            </div>

            {/* Partition & Cost Breakdown */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="font-bold text-blue-500 flex items-center gap-1.5">
                <span>Cost Economics &amp; Parameters</span>
              </div>
              <p>Paper Cost: ₹{Number(bom.sections.bomCostCalculations?.paperCostPerBox || 0).toFixed(2)} | Process: ₹{Number(bom.sections.bomCostCalculations?.processCostPerBox || 0).toFixed(2)}</p>
              <p>Total Mfg Cost: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{Number(bom.sections.bomCostCalculations?.totalMfgCostPerBox || 0).toFixed(2)}</span></p>
              <p>Margin: {bom.sections.bomCostCalculations?.marginPercent || 0}% | Quoted Price: <span className="font-bold text-blue-600 dark:text-blue-400">₹{Number(bom.sections.bomCostCalculations?.quotedPricePerBox || 0).toFixed(2)}</span></p>
              <p>Batch Size: {bom.sections.bomParameters?.batchSize || 0} | Lead Time: {bom.sections.bomParameters?.leadTimeDays || 0} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes & Linked Cost Sheets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes */}
        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Technical Notes & Tolerances
          </h3>
          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {(() => {
              const rawNotes = bom.notes;
              if (rawNotes) {
                if (typeof rawNotes === 'string') {
                  const trimmed = rawNotes.trim();
                  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    try {
                      const parsed = JSON.parse(trimmed);
                      if (parsed?.noteText && typeof parsed.noteText === 'string' && parsed.noteText.trim()) {
                        return parsed.noteText.trim();
                      }
                      if (parsed?.sections?.basicInfo?.notes && typeof parsed.sections.basicInfo.notes === 'string' && parsed.sections.basicInfo.notes.trim()) {
                        return parsed.sections.basicInfo.notes.trim();
                      }
                      return 'No specific technical remarks entered for this Bill of Material.';
                    } catch (e) {
                      return trimmed;
                    }
                  }
                  return trimmed || 'No specific technical remarks entered for this Bill of Material.';
                }
              }
              if (bom.sections?.basicInfo?.notes && typeof bom.sections.basicInfo.notes === 'string' && bom.sections.basicInfo.notes.trim()) {
                return bom.sections.basicInfo.notes.trim();
              }
              return 'No specific technical remarks entered for this Bill of Material.';
            })()}
          </p>
        </div>

        {/* Linked Cost Sheets */}
        <div
          className={`p-5 rounded-2xl border space-y-3 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Linked Costing Sheets ({costSheets.length})
            </h3>
            <button
              type="button"
              onClick={() => onCreateCostSheet(bom.id, bom)}
              className="text-[11px] font-bold text-indigo-500 hover:underline cursor-pointer"
            >
              + Create New Sheet
            </button>
          </div>

          {costSheets.length === 0 ? (
            <p className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              No Cost Sheet generated yet from this BOM. Click &quot;Create Costing Sheet&quot; to calculate manufacturing, operational, and commercial margins.
            </p>
          ) : (
            <div className="space-y-2">
              {costSheets.map((cs) => (
                <div
                  key={cs.id}
                  onClick={() => onSelectCostSheet && onSelectCostSheet(cs.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-indigo-500">{cs.costSheetNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        cs.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : cs.status === 'Pending MD Approval'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {cs.status}
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {cs.title}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ₹{Number(cs.sellingPricePerBox || 0).toFixed(2)}
                    </div>
                    <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Selling Price
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-xl space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-3 rounded-xl bg-rose-500/10">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">Delete Bill of Material</h3>
            </div>

            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Are you sure you want to delete <span className="font-bold text-white">{bom.bomNumber}</span>? It will be moved to Recycle Bin and can be restored if needed.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  darkMode ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
