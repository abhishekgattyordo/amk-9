import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Layers,
  FileText,
  DollarSign,
  Boxes,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { BillOfMaterial } from '../../types';

interface BomListViewProps {
  darkMode: boolean;
  boms: BillOfMaterial[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  plyFilter?: string;
  onPlyFilterChange?: (v: string) => void;
  onViewBom: (id: string) => void;
  onEditBom: (id: string) => void;
  onDeleteBom?: (id: string) => void;
  onCreateNew: () => void;
}

export const BomListView: React.FC<BomListViewProps> = ({
  darkMode,
  boms,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  plyFilter = 'All',
  onPlyFilterChange,
  onViewBom,
  onEditBom,
  onDeleteBom,
  onCreateNew,
}) => {
  const filteredBoms = boms.filter((b) => {
    if (plyFilter && plyFilter !== 'All') {
      const targetPly = parseInt(plyFilter, 10);
      if (!isNaN(targetPly) && b.ply !== targetPly) return false;
    }
    return true;
  });
  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Bill of Materials (BOM) & Corrugated Recipes
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Technical multi-layer corrugated formulas, paper GSM recipes, flute specifications, and unit costs
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New BOM</span>
        </button>
      </div>

      {/* Filter bar */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search BOM #, name, product, flute..."
            className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-xs border outline-none transition-colors ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={plyFilter}
            onChange={(e) => onPlyFilterChange && onPlyFilterChange(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs border outline-none cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Ply Types</option>
            <option value="3-Ply">3-Ply Single Wall</option>
            <option value="5-Ply">5-Ply Double Wall</option>
            <option value="7-Ply">7-Ply Triple Wall</option>
            <option value="Mono Wall">Mono Wall</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs border outline-none cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b ${
                darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-3 px-4 font-semibold">BOM Code & Name</th>
                <th className="py-3 px-4 font-semibold">Finished Product</th>
                <th className="py-3 px-4 font-semibold">Flute & Ply</th>
                <th className="py-3 px-4 font-semibold">Sheet Dimensions</th>
                <th className="py-3 px-4 font-semibold">Unit Weight / Cost</th>
                <th className="py-3 px-4 font-semibold">Layers</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading BOM recipes...
                  </td>
                </tr>
              ) : filteredBoms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No Bill of Materials found. Click "Create New BOM" to set up a corrugated formula.
                  </td>
                </tr>
              ) : (
                filteredBoms.map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div
                        onClick={() => onViewBom(b.id)}
                        className="font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline"
                      >
                        {b.bomNumber}
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {b.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {b.product?.name || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {b.product?.code}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {b.ply}-Ply
                      </span>
                      <div className="text-[11px] text-slate-400">{b.fluteType || 'Standard'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>Deckle: {b.deckleSizeMm ? `${b.deckleSizeMm} mm` : '-'}</div>
                      <div className="text-[11px] text-slate-400">
                        Cut: {b.cutSizeMm ? `${b.cutSizeMm} mm` : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        ${b.estimatedCost?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {b.totalWeightGrams ? `${b.totalWeightGrams} g` : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {b.items?.length || 0} Layers
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : b.status === 'Draft'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onViewBom(b.id)}
                          className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                            darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditBom(b.id)}
                          className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                            darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                          title="Edit BOM"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBom(b.id)}
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors"
                          title="Delete BOM"
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
      </div>
    </div>
  );
};
