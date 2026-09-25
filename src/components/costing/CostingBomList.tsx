'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Copy,
  FileSpreadsheet,
  Calculator,
  CheckCircle2,
  Clock,
  Archive,
  ArrowUpDown,
  Download,
  Building2,
  Package,
  FileText,
  AlertCircle,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { BillOfMaterial, User } from '@/types';

interface CostingBomListProps {
  darkMode?: boolean;
  currentUser?: User | null;
  onSelectBom: (bomId: string, mode: 'view' | 'edit') => void;
  onCreateNew: () => void;
  onCreateCostSheet?: (bomId: string, bomData: BillOfMaterial) => void;
  onCreateCostSheetFromBom?: (bomId: string, bomData: BillOfMaterial) => void;
}

export function CostingBomList({
  darkMode,
  currentUser,
  onSelectBom,
  onCreateNew,
  onCreateCostSheet,
  onCreateCostSheetFromBom,
}: CostingBomListProps) {
  const handleTriggerCreateCostSheet = (bomId: string, bomData: BillOfMaterial) => {
    if (onCreateCostSheet) {
      onCreateCostSheet(bomId, bomData);
    } else if (onCreateCostSheetFromBom) {
      onCreateCostSheetFromBom(bomId, bomData);
    }
  };
  const [boms, setBoms] = useState<BillOfMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    linkedToQuotation: 0,
    withCostSheets: 0,
  });

  // Modal for delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchBoms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch list and stats concurrently
      const [listRes, statsRes] = await Promise.all([
        fetch('/api/costing/bom?limit=100'),
        fetch('/api/costing/bom?stats=true'),
      ]);

      const listData = await listRes.json();
      const statsData = await statsRes.json();

      if (listData.success) {
        setBoms(listData.data || []);
      } else {
        setError(listData.error || 'Failed to fetch BOMs');
      }

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err: any) {
      console.error('Error fetching BOMs:', err);
      setError(err.message || 'An unexpected error occurred while loading BOMs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoms();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/costing/bom/${deleteId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setBoms((prev) => prev.filter((b) => b.id !== deleteId));
        setDeleteId(null);
        // Refresh stats
        fetch('/api/costing/bom?stats=true')
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.stats) setStats(d.stats);
          })
          .catch(() => {});
      } else {
        alert(data.error || 'Failed to delete BOM');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete BOM');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (bom: BillOfMaterial) => {
    try {
      const duplicateData = {
        name: `${bom.name} (Copy)`,
        productId: bom.productId,
        customerId: bom.customerId,
        customerName: bom.customerName,
        leadId: bom.leadId,
        quotationId: bom.quotationId,
        requiredQuantity: bom.requiredQuantity || 1000,
        version: (bom.version || 1) + 1,
        fluteType: bom.fluteType,
        ply: bom.ply || 5,
        deckleSizeMm: bom.deckleSizeMm,
        cutSizeMm: bom.cutSizeMm,
        totalWeightGrams: bom.totalWeightGrams,
        estimatedCost: bom.estimatedCost,
        status: 'Draft',
        notes: bom.notes ? `Cloned from ${bom.bomNumber}. ${bom.notes}` : `Cloned from ${bom.bomNumber}`,
        items: (bom.items || []).map((item) => ({
          layer: item.layer,
          materialId: item.materialId,
          materialCode: item.materialCode,
          materialName: item.materialName,
          gsm: item.gsm,
          quantityPerUnit: item.quantityPerUnit,
          unit: item.unit,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
        })),
      };

      const res = await fetch('/api/costing/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      });
      const data = await res.json();
      if (data.success) {
        fetchBoms();
        if (data.data?.id) {
          onSelectBom(data.data.id, 'edit');
        }
      } else {
        alert(data.error || 'Failed to duplicate BOM');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate BOM');
    }
  };

  // Unique products and customers for filter dropdowns
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, string>();
    boms.forEach((b) => {
      if (b.product?.id && b.product?.name) {
        map.set(b.product.id, b.product.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [boms]);

  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    boms.forEach((b) => {
      if (b.customerId && (b.customer?.name || b.customerName)) {
        map.set(b.customerId, b.customer?.name || b.customerName || 'Customer');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [boms]);

  // Filtered BOMs
  const filteredBoms = useMemo(() => {
    return boms.filter((bom) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchNumber = bom.bomNumber?.toLowerCase().includes(q);
        const matchName = bom.name?.toLowerCase().includes(q);
        const matchProduct = bom.product?.name?.toLowerCase().includes(q) || bom.product?.code?.toLowerCase().includes(q);
        const matchCustomer = bom.customer?.name?.toLowerCase().includes(q) || bom.customerName?.toLowerCase().includes(q);
        const matchLead = bom.lead?.leadNumber?.toLowerCase().includes(q);
        const matchQuote = bom.quotation?.quotationNumber?.toLowerCase().includes(q);
        if (!matchNumber && !matchName && !matchProduct && !matchCustomer && !matchLead && !matchQuote) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && bom.status !== statusFilter) {
        return false;
      }

      // Product
      if (productFilter !== 'all' && bom.productId !== productFilter) {
        return false;
      }

      // Customer
      if (customerFilter !== 'all' && bom.customerId !== customerFilter) {
        return false;
      }

      return true;
    });
  }, [boms, search, statusFilter, productFilter, customerFilter]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredBoms.length === 0) return;
    const headers = ['BOM Number', 'Name', 'Product', 'Customer', 'Ply', 'Flute', 'Total Weight (g)', 'Est. Cost/Unit (₹)', 'Status', 'Cost Sheets Count'];
    const rows = filteredBoms.map((b) => [
      b.bomNumber,
      `"${(b.name || '').replace(/"/g, '""')}"`,
      `"${(b.product?.name || '').replace(/"/g, '""')}"`,
      `"${(b.customer?.name || b.customerName || '').replace(/"/g, '""')}"`,
      b.ply || '',
      `"${b.fluteType || ''}"`,
      b.totalWeightGrams || 0,
      b.estimatedCost || 0,
      b.status,
      b.costSheets?.length || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AMK_Costing_BOMs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Bill of Materials (BOM)
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Define material breakdown, ply construction, and layer specifications before Cost Sheet generation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={fetchBoms}
            disabled={loading}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              darkMode
                ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
            title="Refresh BOM list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredBoms.length === 0}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              darkMode
                ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            } disabled:opacity-50`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create BOM</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Total BOMs
            </span>
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats.total}
            </span>
            <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              registered
            </span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Active BOMs
            </span>
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {stats.active}
            </span>
            <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              production ready
            </span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Drafts / In-Review
            </span>
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              {stats.draft}
            </span>
            <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              work in progress
            </span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              With Cost Sheets
            </span>
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
              {stats.withCostSheets}
            </span>
            <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              costed
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search BOM #, name, product, customer..."
              className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs outline-none border transition-colors ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600'
              }`}
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200 focus:border-indigo-500'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 focus:border-indigo-600'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>

            {/* Product Filter */}
            {uniqueProducts.length > 0 && (
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className={`max-w-[160px] px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer transition-colors truncate ${
                  darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200 focus:border-indigo-500'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 focus:border-indigo-600'
                }`}
              >
                <option value="all">All Products</option>
                {uniqueProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {/* Customer Filter */}
            {uniqueCustomers.length > 0 && (
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className={`max-w-[160px] px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer transition-colors truncate ${
                  darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200 focus:border-indigo-500'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 focus:border-indigo-600'
                }`}
              >
                <option value="all">All Customers</option>
                {uniqueCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Showing <span className="font-bold text-indigo-500">{filteredBoms.length}</span> of {boms.length} BOMs
        </div>
      </div>

      {/* Main Table / Grid */}
      <div
        className={`rounded-2xl border overflow-hidden transition-all ${
          darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Loading Bills of Materials...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchBoms}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredBoms.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className={`w-12 h-12 mx-auto ${darkMode ? 'text-slate-700' : 'text-slate-300'}`} />
            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              No Bill of Materials Found
            </h3>
            <p className={`text-xs max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {search || statusFilter !== 'all' || productFilter !== 'all' || customerFilter !== 'all'
                ? 'No BOM matches your current search filters. Try adjusting or clearing your filters.'
                : 'Create your first Bill of Material to define the required paper layers, fluting medium, GSM, and operational costs.'}
            </p>
            {(!search && statusFilter === 'all' && productFilter === 'all' && customerFilter === 'all') && (
              <button
                type="button"
                onClick={onCreateNew}
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First BOM</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50/90 border-slate-200 text-slate-600'}`}>
                  <th className="py-3 px-4 font-semibold">BOM Code & Name</th>
                  <th className="py-3 px-4 font-semibold">Finished Product</th>
                  <th className="py-3 px-4 font-semibold">Customer / Linkage</th>
                  <th className="py-3 px-4 font-semibold">Structure & Ply</th>
                  <th className="py-3 px-4 font-semibold text-right">Weight / Box</th>
                  <th className="py-3 px-4 font-semibold text-right">Est. Cost / Unit</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Cost Sheets</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200/80 text-slate-700'}`}>
                {filteredBoms.map((bom) => {
                  const itemsCount = bom.items?.length || 0;
                  const costSheetsCount = bom.costSheets?.length || 0;

                  return (
                    <tr
                      key={bom.id}
                      onClick={() => onSelectBom(bom.id, 'view')}
                      className={`group transition-colors cursor-pointer ${
                        darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-indigo-50/30'
                      }`}
                    >
                      {/* BOM Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-indigo-500 group-hover:underline">
                                {bom.bomNumber}
                              </span>
                              {bom.version && bom.version > 1 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                  darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  v{bom.version}
                                </span>
                              )}
                            </div>
                            <div className={`font-medium line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {bom.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Finished Product */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className={`font-semibold flex items-center space-x-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{bom.product?.name || 'Custom Product'}</span>
                          </div>
                          <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {bom.product?.boxType || 'Universal Box'}
                            {bom.product?.dimensions ? ` • ${bom.product.dimensions}` : ''}
                          </div>
                        </div>
                      </td>

                      {/* Customer / Linkage */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {bom.customer?.name || bom.customerName ? (
                            <div className={`font-medium flex items-center space-x-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{bom.customer?.name || bom.customerName}</span>
                            </div>
                          ) : (
                            <span className={`text-[11px] italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              Standard Product
                            </span>
                          )}

                          {bom.lead && (
                            <div className="flex items-center space-x-1 text-[10px] text-amber-500 font-medium">
                              <Tag className="w-2.5 h-2.5" />
                              <span>Lead: {bom.lead.leadNumber}</span>
                            </div>
                          )}

                          {bom.quotation && (
                            <div className="flex items-center space-x-1 text-[10px] text-emerald-500 font-medium">
                              <FileText className="w-2.5 h-2.5" />
                              <span>Quote: {bom.quotation.quotationNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Structure & Ply */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              bom.ply === 3
                                ? 'bg-sky-500/10 text-sky-500'
                                : bom.ply === 5
                                ? 'bg-indigo-500/10 text-indigo-500'
                                : bom.ply === 7
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}>
                              {bom.ply || 5}-Ply
                            </span>
                            <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {bom.fluteType || 'BC-Flute'}
                            </span>
                          </div>
                          <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {itemsCount} layer item{itemsCount === 1 ? '' : 's'}
                            {bom.deckleSizeMm ? ` • D: ${bom.deckleSizeMm}mm` : ''}
                          </div>
                        </div>
                      </td>

                      {/* Weight / Box */}
                      <td className="py-3.5 px-4 text-right font-medium">
                        <div className={`${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {bom.totalWeightGrams ? `${bom.totalWeightGrams} g` : '—'}
                        </div>
                        {bom.totalWeightGrams && bom.totalWeightGrams > 0 ? (
                          <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {(bom.totalWeightGrams / 1000).toFixed(3)} kg
                          </div>
                        ) : null}
                      </td>

                      {/* Estimated Cost / Unit */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-bold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ₹{Number(bom.estimatedCost || 0).toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          per unit
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
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
                      </td>

                      {/* Linked Cost Sheets Count */}
                      <td className="py-3.5 px-4 text-right">
                        {costSheetsCount > 0 ? (
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                            darkMode ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            <Calculator className="w-3 h-3" />
                            <span>{costSheetsCount} Cost Sheet{costSheetsCount > 1 ? 's' : ''}</span>
                          </span>
                        ) : (
                          <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            None
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          {/* Create Cost Sheet CTA */}
                          <button
                            type="button"
                            onClick={() => handleTriggerCreateCostSheet(bom.id, bom)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
                            title="Create Costing Sheet from this BOM"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectBom(bom.id, 'view')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectBom(bom.id, 'edit')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                            title="Edit BOM"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(bom)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                            title="Duplicate / Create Revision"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteId(bom.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'hover:bg-rose-500/10 text-rose-400' : 'hover:bg-rose-50 text-rose-600'
                            }`}
                            title="Delete BOM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
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
              Are you sure you want to delete this BOM? The BOM will be moved to the Recycle Bin and can be restored if needed.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
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
