import React from 'react';
import {
  ArrowLeft,
  Edit2,
  PlusCircle,
  FileText,
  Boxes,
  Layers,
  Scale,
  DollarSign,
  Maximize2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { BillOfMaterial } from '../../types';

interface BomDetailViewProps {
  darkMode: boolean;
  bom: BillOfMaterial | null;
  loading: boolean;
  onBack: () => void;
  onEdit: (id: string) => void;
  onCreateWorkOrder: (bomId: string, productId: string) => void;
}

export const BomDetailView: React.FC<BomDetailViewProps> = ({
  darkMode,
  bom,
  loading,
  onBack,
  onEdit,
  onCreateWorkOrder,
}) => {
  if (loading || !bom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading BOM details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {bom.bomNumber}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  bom.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {bom.status}
              </span>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {bom.name} • {bom.ply}-Ply Corrugated Recipe
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onEdit(bom.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit BOM</span>
          </button>
          <button
            type="button"
            onClick={() => onCreateWorkOrder(bom.id, bom.productId)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {/* Technical Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-400 font-medium">Finished Product</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
            {bom.product?.name || 'N/A'}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            Code: {bom.product?.code}
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-400 font-medium">Flute & Board Ply</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            {bom.ply}-Ply ({bom.fluteType || 'Standard Flute'})
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Layers: {bom.items?.length || 0} Components
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-400 font-medium">Deckle & Cut Size</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            {bom.deckleSizeMm || '-'} x {bom.cutSizeMm || '-'} mm
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sheet Weight: {bom.totalWeightGrams || '-'} grams
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-400 font-medium">Est. Unit Cost</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${bom.estimatedCost?.toFixed(2) || '0.00'} / Box
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sum of raw materials & adhesives
          </div>
        </div>
      </div>

      {/* Layer breakdown table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Corrugated Multi-Layer Recipe Components
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Material Cost: ${bom.estimatedCost?.toFixed(2) || '0.00'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b ${
                darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-2.5 px-4 font-semibold">#</th>
                <th className="py-2.5 px-4 font-semibold">Board Layer</th>
                <th className="py-2.5 px-4 font-semibold">Paper Grade & Spec</th>
                <th className="py-2.5 px-4 font-semibold">GSM</th>
                <th className="py-2.5 px-4 font-semibold">Qty per Unit</th>
                <th className="py-2.5 px-4 font-semibold">Unit Cost</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Cost / Box</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {(bom.items || []).map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {item.layer}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {item.materialName}
                    </div>
                    {item.materialCode && (
                      <div className="text-[11px] text-slate-400">{item.materialCode}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {item.gsm ? `${item.gsm} GSM` : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {item.quantityPerUnit} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    ${item.unitCost?.toFixed(2) || '0.00'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${item.totalCost?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {bom.notes && (
        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="text-xs text-slate-400 font-medium mb-1">Production Notes & Flute Specifications</div>
          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{bom.notes}</p>
        </div>
      )}
    </div>
  );
};
