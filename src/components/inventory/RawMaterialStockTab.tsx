'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  MinusCircle, 
  Sliders, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock,
  Building2, 
  Warehouse as WarehouseIcon, 
  Tag, 
  Search,
  DollarSign,
  Layers,
  ArrowDownRight,
  Sparkles,
  History,
  Eye,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { RawMaterial, Supplier, Warehouse, RawMaterialStock, BinLocationItem } from '../../types';
import { authFetch } from '../../utils/clientApi';

interface RawMaterialStockTabProps {
  material: RawMaterial;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  darkMode: boolean;
  onStockUpdated?: () => void;
}

export const RawMaterialStockTab: React.FC<RawMaterialStockTabProps> = ({
  material,
  suppliers = [],
  warehouses = [],
  darkMode,
  onStockUpdated,
}) => {
  const [stocks, setStocks] = useState<RawMaterialStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('All');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All');
  const [selectedBinFilter, setSelectedBinFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedStockForDeduct, setSelectedStockForDeduct] = useState<RawMaterialStock | null>(null);
  const [selectedStockForAdjust, setSelectedStockForAdjust] = useState<RawMaterialStock | null>(null);
  const [selectedStockForDelete, setSelectedStockForDelete] = useState<RawMaterialStock | null>(null);
  const [selectedStockForHistory, setSelectedStockForHistory] = useState<RawMaterialStock | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Stock Form Data
  const [newStockData, setNewStockData] = useState({
    supplierId: material.supplierId || (suppliers[0]?.id || ''),
    batchLotNumber: `LOT-${Math.floor(100000 + Math.random() * 900000)}`,
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    originalQuantity: 100,
    purchasePrice: material.purchasePrice || 0,
    warehouseId: material.warehouseId || (warehouses[0]?.id || ''),
    binId: '',
    referenceNumber: '',
    remarks: '',
  });

  // Deduction Form Data
  const [deductData, setDeductData] = useState({
    quantity: 10,
    reason: 'Production Issue',
    referenceNumber: '',
    referenceType: 'Batch Deduction',
    remarks: '',
  });

  // Adjustment Form Data
  const [adjustData, setAdjustData] = useState({
    newRemainingQuantity: 0,
    reason: 'Physical Count Audit',
    remarks: '',
  });

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/raw-materials/${material.id}/stock`);
      if (!res.ok) throw new Error(`Failed to load stocks (${res.status})`);
      const json = await res.json();
      if (json.success) {
        setStocks(json.data || []);
      } else {
        throw new Error(json.error || 'Failed to load raw material stocks');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading stock batches');
    } finally {
      setIsLoading(false);
    }
  }, [material.id]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockData.supplierId) {
      setActionError('Supplier is mandatory for every Raw Material Stock record.');
      return;
    }
    if (newStockData.originalQuantity <= 0) {
      setActionError('Stock quantity must be greater than 0');
      return;
    }
    if (newStockData.purchasePrice < 0) {
      setActionError('Purchase price cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await authFetch(`/api/raw-materials/${material.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStockData,
          originalQuantity: Number(newStockData.originalQuantity),
          purchasePrice: Number(newStockData.purchasePrice),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add stock batch');
      }

      setIsAddStockModalOpen(false);
      await fetchStocks();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeductStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForDeduct) return;
    if (deductData.quantity <= 0) {
      setActionError('Deduction quantity must be greater than 0');
      return;
    }
    if (deductData.quantity > selectedStockForDeduct.remainingQuantity) {
      setActionError(`Cannot deduct more than remaining stock (${selectedStockForDeduct.remainingQuantity} ${material.uom})`);
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await authFetch(`/api/raw-material-stock/${selectedStockForDeduct.id}/deduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: Number(deductData.quantity),
          reason: deductData.reason,
          referenceNumber: deductData.referenceNumber,
          referenceType: deductData.referenceType,
          remarks: deductData.remarks,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to deduct stock');
      }

      setSelectedStockForDeduct(null);
      await fetchStocks();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForAdjust) return;
    if (adjustData.newRemainingQuantity < 0) {
      setActionError('Remaining quantity cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await authFetch(`/api/raw-material-stock/${selectedStockForAdjust.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newRemainingQuantity: Number(adjustData.newRemainingQuantity),
          reason: adjustData.reason,
          remarks: adjustData.remarks,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to adjust stock');
      }

      setSelectedStockForAdjust(null);
      await fetchStocks();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStock = async () => {
    if (!selectedStockForDelete) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await authFetch(`/api/raw-material-stock/${selectedStockForDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete stock');
      }

      setSelectedStockForDelete(null);
      await fetchStocks();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered list
  const filteredStocks = stocks.filter((s) => {
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (selectedSupplierFilter !== 'All' && s.supplierId !== selectedSupplierFilter) return false;
    if (selectedWarehouseFilter !== 'All' && s.warehouseId !== selectedWarehouseFilter) return false;
    if (selectedBinFilter !== 'All' && s.binId !== selectedBinFilter) return false;
    if (dateFilter && s.purchaseDate !== dateFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = s.id.toLowerCase().includes(q);
      const matchBatch = s.batchLotNumber?.toLowerCase().includes(q);
      const matchSupplier = s.supplier?.supplierName?.toLowerCase().includes(q);
      const matchMill = s.supplier?.millName?.toLowerCase().includes(q);
      const matchPO = s.purchaseOrder?.poNumber?.toLowerCase().includes(q);
      const matchRef = s.referenceNumber?.toLowerCase().includes(q);
      const matchWarehouse = s.warehouse?.name?.toLowerCase().includes(q);
      const matchBin = s.bin?.code?.toLowerCase().includes(q);
      const matchRemarks = s.remarks?.toLowerCase().includes(q);
      return (
        matchId ||
        matchBatch ||
        matchSupplier ||
        matchMill ||
        matchPO ||
        matchRef ||
        matchWarehouse ||
        matchBin ||
        matchRemarks
      );
    }
    return true;
  });

  // Pagination calculation
  const totalItems = filteredStocks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedStocks = filteredStocks.slice(startIndex, startIndex + itemsPerPage);

  // Available bins for selected warehouse in create modal
  const selectedWhObj = warehouses.find((w) => w.id === newStockData.warehouseId);
  const availableBins = (selectedWhObj as any)?.bins || [];

  // Calculate Batch Summary Stats
  const totalOriginal = stocks.reduce((acc, s) => acc + (s.originalQuantity || 0), 0);
  const totalRemaining = stocks.reduce((acc, s) => acc + (s.remainingQuantity || 0), 0);
  const totalBatches = stocks.length;
  const activeBatches = stocks.filter((s) => s.remainingQuantity > 0).length;
  const totalValuation = stocks.reduce((acc, s) => acc + (s.remainingQuantity * s.purchasePrice), 0);

  return (
    <div className="space-y-6">
      {/* Top Batch-Wise Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Batches</div>
          <div className="text-xl font-black mt-1 text-emerald-500">
            {totalRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">{material.uom}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{activeBatches} active / {totalBatches} total lots</div>
        </div>

        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Purchased</div>
          <div className="text-xl font-black mt-1 text-cyan-500">
            {totalOriginal.toLocaleString()} <span className="text-xs font-normal text-slate-400">{material.uom}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Historical inbound total</div>
        </div>

        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Holding Valuation</div>
          <div className="text-xl font-black mt-1 text-amber-500">
            ₹{totalValuation.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sum of batch rates</div>
        </div>

        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Total Stock</div>
          <div className="text-xl font-black mt-1 text-purple-400">
            {(material.currentStock || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">{material.uom}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Synchronized with active lots</div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="raw-material-stock-search-input"
                type="text"
                placeholder="Search by Batch, Stock ID, Supplier, PO, Ref..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                } outline-hidden`}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="raw-material-stock-refresh-button"
              type="button"
              onClick={fetchStocks}
              disabled={isLoading}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Refresh stock ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="raw-material-add-stock-button"
              type="button"
              onClick={() => {
                setActionError(null);
                setNewStockData({
                  supplierId: material.supplierId || (suppliers[0]?.id || ''),
                  batchLotNumber: `LOT-${Math.floor(100000 + Math.random() * 900000)}`,
                  purchaseDate: new Date().toISOString().split('T')[0],
                  purchaseTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                  originalQuantity: 100,
                  purchasePrice: material.purchasePrice || 0,
                  warehouseId: material.warehouseId || (warehouses[0]?.id || ''),
                  binId: '',
                  referenceNumber: '',
                  remarks: '',
                });
                setIsAddStockModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Purchase Stock</span>
            </button>
          </div>
        </div>

        {/* Detailed Secondary Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {/* Supplier filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supplier</label>
            <select
              id="raw-material-stock-supplier-filter"
              value={selectedSupplierFilter}
              onChange={(e) => {
                setSelectedSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              } outline-hidden`}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.supplierName}
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Warehouse</label>
            <select
              id="raw-material-stock-warehouse-filter"
              value={selectedWarehouseFilter}
              onChange={(e) => {
                setSelectedWarehouseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              } outline-hidden`}
            >
              <option value="All">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Status</label>
            <select
              id="raw-material-stock-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              } outline-hidden`}
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Low">Low Stock</option>
              <option value="Depleted">Depleted (0 Qty)</option>
              <option value="Reserved">Reserved</option>
              <option value="Quarantined">Quarantined</option>
            </select>
          </div>

          {/* Date filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purchase Date</label>
            <input
              id="raw-material-stock-date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              } outline-hidden`}
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            {(selectedSupplierFilter !== 'All' || selectedWarehouseFilter !== 'All' || statusFilter !== 'All' || dateFilter || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSupplierFilter('All');
                  setSelectedWarehouseFilter('All');
                  setSelectedBinFilter('All');
                  setStatusFilter('All');
                  setDateFilter('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-2 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stocks Table */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
          <p className="text-xs font-semibold text-slate-400">Loading purchase stock batches...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs space-y-3">
          <p className="font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchStocks}
            className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 text-slate-400 space-y-3">
          <Package className="w-10 h-10 mx-auto text-slate-600" />
          <div>
            <p className="text-sm font-bold text-slate-200">No Purchased Stock Entries Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Track supplier-wise, batch-wise, and purchase-wise stock entries for {material.name}. Every purchase lot maintains its own unit price, remaining quantity, and full deduction history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setIsAddStockModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record First Stock Lot</span>
          </button>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  <th className="p-3">Stock ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Batch / Lot</th>
                  <th className="p-3 text-right">Purchase Qty</th>
                  <th className="p-3 text-right">Remaining Qty</th>
                  <th className="p-3 text-right">Purchase Price</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3">Bin</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedStocks.map((stock) => {
                  const percentLeft = stock.originalQuantity > 0 
                    ? Math.round((stock.remainingQuantity / stock.originalQuantity) * 100)
                    : 0;

                  return (
                    <tr 
                      key={stock.id} 
                      id={`raw-material-stock-row-${stock.id}`}
                      className={`hover:bg-slate-800/20 transition-colors ${stock.remainingQuantity === 0 ? 'opacity-60 bg-slate-900/20' : ''}`}
                    >
                      {/* Stock ID */}
                      <td className="p-3">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          {stock.id.slice(0, 8)}...
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-medium text-slate-300 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{stock.purchaseDate}</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-slate-400 flex items-center space-x-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{stock.purchaseTime || new Date(stock.createdAt || '').toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) || '00:00'}</span>
                        </div>
                      </td>

                      {/* Supplier (Mandatory) */}
                      <td className="p-3">
                        <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{stock.supplier?.supplierName || 'Unknown Supplier'}</span>
                        </div>
                        {stock.supplier?.millName && (
                          <div className="text-[10px] text-slate-400 pl-5 truncate max-w-[130px]">
                            {stock.supplier.millName}
                          </div>
                        )}
                      </td>

                      {/* Batch / Lot */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-emerald-400">
                          {stock.batchLotNumber || 'NO-BATCH'}
                        </div>
                      </td>

                      {/* Purchase Quantity */}
                      <td className="p-3 text-right font-bold text-slate-300">
                        {stock.originalQuantity.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{material.uom}</span>
                      </td>

                      {/* Remaining Quantity */}
                      <td className="p-3 text-right font-black">
                        <span className={stock.remainingQuantity === 0 ? 'text-slate-500 line-through' : stock.remainingQuantity <= (stock.originalQuantity * 0.2) ? 'text-amber-400' : 'text-emerald-400'}>
                          {stock.remainingQuantity.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400 ml-1">{material.uom}</span>
                        <div className="text-[9px] text-slate-400 font-mono font-normal">
                          {percentLeft}% in stock
                        </div>
                      </td>

                      {/* Purchase Price */}
                      <td className="p-3 text-right font-mono font-bold text-amber-400">
                        ₹{stock.purchasePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Warehouse */}
                      <td className="p-3">
                        <div className="flex items-center space-x-1 text-slate-300">
                          <WarehouseIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[100px]">{stock.warehouse?.name || 'General'}</span>
                        </div>
                      </td>

                      {/* Bin */}
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {stock.bin?.code || '-'}
                      </td>

                      {/* Reference */}
                      <td className="p-3">
                        {stock.purchaseOrder?.poNumber ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]">
                            {stock.purchaseOrder.poNumber}
                          </span>
                        ) : stock.referenceNumber ? (
                          <span className="text-[11px] font-mono text-slate-400">
                            {stock.referenceNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          stock.status === 'Available'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : stock.status === 'Low'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : stock.status === 'Depleted'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {stock.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* History / Audit */}
                          <button
                            id={`raw-material-stock-history-btn-${stock.id}`}
                            type="button"
                            onClick={() => setSelectedStockForHistory(stock)}
                            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                            title="View Lot History / Movements"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Deduct Stock */}
                          <button
                            id={`raw-material-stock-deduct-btn-${stock.id}`}
                            type="button"
                            disabled={stock.remainingQuantity <= 0}
                            onClick={() => {
                              setSelectedStockForDeduct(stock);
                              setDeductData({
                                quantity: Math.min(10, stock.remainingQuantity),
                                reason: 'Production Issue',
                                referenceNumber: '',
                                referenceType: 'Batch Deduction',
                                remarks: '',
                              });
                              setActionError(null);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              stock.remainingQuantity <= 0
                                ? 'opacity-30 cursor-not-allowed text-slate-600'
                                : 'hover:bg-amber-500/10 text-amber-400 hover:text-amber-300'
                            }`}
                            title="Deduct from this batch"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Adjust Stock */}
                          <button
                            id={`raw-material-stock-adjust-btn-${stock.id}`}
                            type="button"
                            onClick={() => {
                              setSelectedStockForAdjust(stock);
                              setAdjustData({
                                newRemainingQuantity: stock.remainingQuantity,
                                reason: 'Physical Count Audit',
                                remarks: '',
                              });
                              setActionError(null);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Adjust batch balance"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Soft Delete */}
                          <button
                            id={`raw-material-stock-delete-btn-${stock.id}`}
                            type="button"
                            onClick={() => {
                              setSelectedStockForDelete(stock);
                              setActionError(null);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors"
                            title="Delete batch record"
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

          {/* Pagination Footer */}
          <div className={`p-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs ${
            darkMode ? 'border-slate-800 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            <div className="flex items-center space-x-2">
              <span>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries</span>
              <select
                id="raw-material-stock-items-per-page"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                } outline-hidden`}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                id="raw-material-stock-prev-page"
                type="button"
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-300">
                {activePage} / {totalPages}
              </span>
              <button
                id="raw-material-stock-next-page"
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PURCHASE STOCK ================= */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Add Purchase Stock Lot</h3>
                  <p className="text-xs text-slate-400">Create a separate purchase stock record for {material.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStockModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateStock} className="mt-4 space-y-4">
              {/* Supplier (Mandatory) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Supplier <span className="text-rose-400">* (Mandatory)</span>
                </label>
                <select
                  id="add-stock-supplier-select"
                  value={newStockData.supplierId}
                  onChange={(e) => setNewStockData({ ...newStockData, supplierId: e.target.value })}
                  required
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                >
                  <option value="" disabled>-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierName} {s.millName ? `(${s.millName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch / Lot & Purchase Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Batch / Lot Number</label>
                  <input
                    id="add-stock-batch-input"
                    type="text"
                    value={newStockData.batchLotNumber}
                    onChange={(e) => setNewStockData({ ...newStockData, batchLotNumber: e.target.value })}
                    placeholder="e.g. B001, LOT-8942"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'
                    } outline-hidden`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Purchase Date</label>
                  <input
                    id="add-stock-date-input"
                    type="date"
                    value={newStockData.purchaseDate}
                    onChange={(e) => setNewStockData({ ...newStockData, purchaseDate: e.target.value })}
                    required
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } outline-hidden`}
                  />
                </div>
              </div>

              {/* Quantity & Purchase Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Purchased Quantity ({material.uom}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="add-stock-quantity-input"
                    type="number"
                    step="any"
                    min="0.01"
                    value={newStockData.originalQuantity}
                    onChange={(e) => setNewStockData({ ...newStockData, originalQuantity: parseFloat(e.target.value) || 0 })}
                    required
                    className={`w-full p-2.5 rounded-xl border text-xs font-black ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } outline-hidden`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Purchase Price (₹ per {material.uom}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="add-stock-price-input"
                    type="number"
                    step="any"
                    min="0"
                    value={newStockData.purchasePrice}
                    onChange={(e) => setNewStockData({ ...newStockData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    required
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'
                    } outline-hidden`}
                  />
                </div>
              </div>

              {/* Warehouse & Bin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Warehouse</label>
                  <select
                    id="add-stock-warehouse-select"
                    value={newStockData.warehouseId}
                    onChange={(e) => setNewStockData({ ...newStockData, warehouseId: e.target.value, binId: '' })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } outline-hidden`}
                  >
                    <option value="">-- Select Warehouse --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Bin Location</label>
                  <select
                    id="add-stock-bin-select"
                    value={newStockData.binId}
                    onChange={(e) => setNewStockData({ ...newStockData, binId: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } outline-hidden`}
                  >
                    <option value="">-- No Specific Bin --</option>
                    {availableBins.map((bin) => (
                      <option key={bin.id} value={bin.id}>
                        {bin.code} ({bin.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference Number & Remarks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Reference / PO No.</label>
                  <input
                    id="add-stock-ref-input"
                    type="text"
                    value={newStockData.referenceNumber}
                    onChange={(e) => setNewStockData({ ...newStockData, referenceNumber: e.target.value })}
                    placeholder="e.g. PO-2026-0042"
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } outline-hidden`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Remarks</label>
                  <input
                    id="add-stock-remarks-input"
                    type="text"
                    value={newStockData.remarks}
                    onChange={(e) => setNewStockData({ ...newStockData, remarks: e.target.value })}
                    placeholder="e.g. Mill test certified lot"
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } outline-hidden`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="add-stock-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Stock Lot...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Create Stock Entry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DEDUCT STOCK ================= */}
      {selectedStockForDeduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Deduct Stock From Batch</h3>
                  <p className="text-xs text-slate-400">
                    Batch: <span className="font-mono font-bold text-emerald-400">{selectedStockForDeduct.batchLotNumber}</span> (Supplier: {selectedStockForDeduct.supplier?.supplierName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStockForDeduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Available in this batch:</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">
                  {selectedStockForDeduct.remainingQuantity} {material.uom}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Rate:</span>
                <div className="font-mono font-bold text-amber-400 mt-0.5">
                  ₹{selectedStockForDeduct.purchasePrice} / {material.uom}
                </div>
              </div>
            </div>

            {actionError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleDeductStock} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Quantity to Deduct ({material.uom}) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="deduct-stock-quantity-input"
                  type="number"
                  step="any"
                  min="0.01"
                  max={selectedStockForDeduct.remainingQuantity}
                  value={deductData.quantity}
                  onChange={(e) => setDeductData({ ...deductData, quantity: parseFloat(e.target.value) || 0 })}
                  required
                  className={`w-full p-2.5 rounded-xl border text-xs font-black ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Deduction</label>
                <select
                  id="deduct-stock-reason-select"
                  value={deductData.reason}
                  onChange={(e) => setDeductData({ ...deductData, reason: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                >
                  <option value="Production Issue">Production Issue / Work Order Consumption</option>
                  <option value="Machine Testing / Setup">Machine Testing & Setup</option>
                  <option value="Quality Rejection / Scrap">Quality Rejection / Scrap</option>
                  <option value="Sampling">Client Sampling</option>
                  <option value="Internal Transfer">Internal Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reference (Work Order / Requisition No.)</label>
                <input
                  id="deduct-stock-ref-input"
                  type="text"
                  value={deductData.referenceNumber}
                  onChange={(e) => setDeductData({ ...deductData, referenceNumber: e.target.value })}
                  placeholder="e.g. WO-2026-0812"
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Remarks</label>
                <input
                  id="deduct-stock-remarks-input"
                  type="text"
                  value={deductData.remarks}
                  onChange={(e) => setDeductData({ ...deductData, remarks: e.target.value })}
                  placeholder="Additional notes"
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedStockForDeduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="deduct-stock-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deducting Stock...</span>
                    </>
                  ) : (
                    <>
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>Confirm Deduction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADJUST STOCK ================= */}
      {selectedStockForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Adjust Batch Balance</h3>
                  <p className="text-xs text-slate-400">
                    Batch: <span className="font-mono font-bold text-emerald-400">{selectedStockForAdjust.batchLotNumber}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStockForAdjust(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Current Remaining:</span>
                <div className="text-base font-black text-slate-200 mt-0.5">
                  {selectedStockForAdjust.remainingQuantity} {material.uom}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Original Purchased:</span>
                <div className="font-mono font-bold text-cyan-400 mt-0.5">
                  {selectedStockForAdjust.originalQuantity} {material.uom}
                </div>
              </div>
            </div>

            {actionError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAdjustStock} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  New Verified Quantity ({material.uom}) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="adjust-stock-new-qty-input"
                  type="number"
                  step="any"
                  min="0"
                  value={adjustData.newRemainingQuantity}
                  onChange={(e) => setAdjustData({ ...adjustData, newRemainingQuantity: parseFloat(e.target.value) || 0 })}
                  required
                  className={`w-full p-2.5 rounded-xl border text-xs font-black ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Adjustment</label>
                <input
                  id="adjust-stock-reason-input"
                  type="text"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. Physical inventory count discrepancy"
                  required
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Remarks</label>
                <input
                  id="adjust-stock-remarks-input"
                  type="text"
                  value={adjustData.remarks}
                  onChange={(e) => setAdjustData({ ...adjustData, remarks: e.target.value })}
                  placeholder="Additional audit details"
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } outline-hidden`}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedStockForAdjust(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="adjust-stock-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adjusting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Adjustment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SOFT DELETE STOCK ================= */}
      {selectedStockForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Delete Stock Entry?</h3>
                <p className="text-xs text-slate-400">Batch: {selectedStockForDelete.batchLotNumber || selectedStockForDelete.id}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              This will remove this batch record and safely adjust the main Raw Material current stock by{' '}
              <span className="font-bold text-rose-400">-{selectedStockForDelete.remainingQuantity} {material.uom}</span>.
              The history and audit log will be preserved.
            </p>

            {actionError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedStockForDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="delete-stock-confirm-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteStock}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-rose-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BATCH HISTORY / AUDIT ================= */}
      {selectedStockForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Batch Audit Trail & Movement History</h3>
                  <p className="text-xs text-slate-400">
                    Batch: <span className="font-mono font-bold text-emerald-400">{selectedStockForHistory.batchLotNumber}</span> | Supplier: {selectedStockForHistory.supplier?.supplierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStockForHistory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400">Initial Inward:</span>
                <div className="font-bold text-slate-200 mt-0.5">{selectedStockForHistory.originalQuantity} {material.uom}</div>
              </div>
              <div>
                <span className="text-slate-400">Current Balance:</span>
                <div className="font-bold text-emerald-400 mt-0.5">{selectedStockForHistory.remainingQuantity} {material.uom}</div>
              </div>
              <div>
                <span className="text-slate-400">Unit Cost:</span>
                <div className="font-mono font-bold text-amber-400 mt-0.5">₹{selectedStockForHistory.purchasePrice}</div>
              </div>
            </div>

            {/* Transactions Timeline */}
            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {(!(selectedStockForHistory as any).transactions || (selectedStockForHistory as any).transactions.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No individual transaction logs recorded for this batch yet.
                </div>
              ) : (
                (selectedStockForHistory as any).transactions.map((tx: any, idx: number) => (
                  <div key={tx.id || idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.transactionType === 'Stock In'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.transactionType === 'Stock Out'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {tx.transactionType}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">{tx.transactionNumber}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{tx.date} {tx.time}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1">{tx.remarks || tx.reason}</p>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <div className={`font-black font-mono ${tx.transactionType === 'Stock Out' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {tx.transactionType === 'Stock Out' ? '-' : '+'}{tx.quantity} {material.uom}
                      </div>
                      <div className="text-[10px] text-slate-400">By {tx.user}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStockForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
