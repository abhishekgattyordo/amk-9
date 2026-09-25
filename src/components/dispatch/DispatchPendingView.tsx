'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Warehouse,
  AlertCircle
} from 'lucide-react';
import { Pagination } from '../common/Pagination';

interface DispatchPendingViewProps {
  darkMode: boolean;
  onInitiateDispatch?: (order: any) => void;
}

export const DispatchPendingView: React.FC<DispatchPendingViewProps> = ({
  darkMode,
  onInitiateDispatch
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qcFilter, setQcFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dispatch/pending');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      } else {
        setError(json.error || 'Failed to load pending dispatch orders');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching pending orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const filteredOrders = orders.filter((o: any) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      o.soNumber?.toLowerCase().includes(query) ||
      o.customerName?.toLowerCase().includes(query) ||
      o.productName?.toLowerCase().includes(query) ||
      o.productCode?.toLowerCase().includes(query);

    const isQcApproved = o.hasApprovedQc;
    const matchesQc =
      qcFilter === 'All' ||
      (qcFilter === 'Approved' && isQcApproved) ||
      (qcFilter === 'Pending' && !isQcApproved);

    const hasStock = o.hasAvailableStock;
    const matchesStock =
      stockFilter === 'All' ||
      (stockFilter === 'InStock' && hasStock) ||
      (stockFilter === 'LowStock' && !hasStock);

    return matchesSearch && matchesQc && matchesStock;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Pending Dispatch Queue
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Sales Orders awaiting shipment. Only QC-Approved orders with available finished goods stock can be dispatched.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPendingOrders}
            disabled={loading}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchPendingOrders} className="underline font-semibold hover:text-rose-900">Retry</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center gap-3 ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SO Number, Customer name, or Product code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          {/* QC Status Filter */}
          <select
            value={qcFilter}
            onChange={(e) => {
              setQcFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg text-xs border outline-none ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All QC Statuses</option>
            <option value="Approved">QC Approved Only</option>
            <option value="Pending">QC Pending</option>
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg text-xs border outline-none ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Stock Levels</option>
            <option value="InStock">Sufficient Stock Only</option>
            <option value="LowStock">Insufficient Stock</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                darkMode ? 'border-slate-700 text-slate-400 bg-slate-800/40' : 'border-slate-200 text-slate-500 bg-slate-50'
              }`}>
                <th className="py-3 px-4">Sales Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Order Qty</th>
                <th className="py-3 px-4 text-right">Dispatched</th>
                <th className="py-3 px-4 text-right">Pending</th>
                <th className="py-3 px-4">QC Status</th>
                <th className="py-3 px-4">FG Stock</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((o: any) => {
                  const isReady = o.hasApprovedQc && o.hasAvailableStock;
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        <div>{o.soNumber}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {o.orderDate || 'Recent'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {o.customerName}
                        </div>
                        {o.customerPoNumber && (
                          <div className="text-[10px] text-slate-400">PO: {o.customerPoNumber}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                          {o.productName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {o.productCode || 'FG-BOX'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {o.quantity?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {Number(o.quantityDispatched || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {o.quantityPending?.toLocaleString()} Pcs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {o.hasApprovedQc ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>QC Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300" title="Cannot dispatch until Final QC is approved">
                            <AlertTriangle className="w-3 h-3" />
                            <span>QC Required</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {o.hasAvailableStock ? (
                          <div className="text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                            {o.availableStock?.toLocaleString()} Pcs Avail
                          </div>
                        ) : (
                          <div className="text-rose-600 dark:text-rose-400 font-medium text-xs">
                            {o.availableStock?.toLocaleString()} Pcs (Low)
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onInitiateDispatch?.(o)}
                          disabled={!isReady}
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isReady
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                          }`}
                          title={
                            !o.hasApprovedQc
                              ? 'Dispatch blocked: Final QC is pending'
                              : !o.hasAvailableStock
                              ? 'Dispatch blocked: Insufficient finished goods stock'
                              : 'Create Delivery Challan'
                          }
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    {loading ? 'Scanning pending orders in database...' : 'No pending orders match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Showing {paginatedOrders.length} of {filteredOrders.length} pending orders
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              totalItems={filteredOrders.length}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>
    </div>
  );
};
