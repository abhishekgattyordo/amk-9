'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Printer,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Edit2,
  XCircle,
  Package,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Pagination } from '../common/Pagination';
import { DeliveryChallanPrintModal } from './DeliveryChallanPrintModal';

interface DispatchListViewProps {
  darkMode: boolean;
  initialStatusFilter?: string;
  onNavigateTab?: (tab: string, params?: any) => void;
  onSelectDispatch?: (id: string) => void;
  onEditDispatch?: (id: string) => void;
}

export const DispatchListView: React.FC<DispatchListViewProps> = ({
  darkMode,
  initialStatusFilter,
  onNavigateTab,
  onSelectDispatch,
  onEditDispatch,
}) => {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [printModalDispatch, setPrintModalDispatch] = useState<any>(null);
  const [cancelModalDispatch, setCancelModalDispatch] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchDispatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/dispatch', window.location.origin);
      url.searchParams.set('page', String(currentPage));
      url.searchParams.set('limit', String(itemsPerPage));
      if (statusFilter !== 'All') url.searchParams.set('status', statusFilter);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setDispatches(json.data || []);
        setTotalCount(json.pagination?.total || (json.data || []).length);
      } else {
        setError(json.error || 'Failed to load dispatches');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching dispatches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [currentPage, itemsPerPage, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDispatches();
  };

  const handleCancelDispatch = async () => {
    if (!cancelModalDispatch) return;
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/dispatch/${cancelModalDispatch.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (json.success) {
        setCancelModalDispatch(null);
        setCancelReason('');
        fetchDispatches();
      } else {
        setActionError(json.error || 'Failed to cancel dispatch');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error cancelling dispatch');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
      case 'Dispatched':
      case 'In Transit':
      case 'Loaded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300 dark:border-blue-800';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Delivery Challans & Dispatches
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Comprehensive log of all customer shipments, regulatory gate passes, vehicle numbers, and delivery statuses
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchDispatches}
            disabled={loading}
            className={`p-2 rounded-lg border transition ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigateTab?.('dispatch_create')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery Challan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDispatches} className="underline font-semibold hover:text-rose-900">Retry</button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center gap-3 ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Challan #, SO #, Customer name, Vehicle #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        </form>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg text-xs border outline-none ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Ready for Dispatch">Ready for Dispatch</option>
            <option value="Loaded">Loaded</option>
            <option value="Dispatched">Dispatched</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Delivery Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg text-xs border outline-none ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Delivery Types</option>
            <option value="Full Delivery">Full Delivery</option>
            <option value="Partial Delivery">Partial Delivery</option>
          </select>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                darkMode ? 'border-slate-700 text-slate-400 bg-slate-800/40' : 'border-slate-200 text-slate-500 bg-slate-50'
              }`}>
                <th className="py-3 px-4">Challan / Date</th>
                <th className="py-3 px-4">Sales Order</th>
                <th className="py-3 px-4">Customer & Destination</th>
                <th className="py-3 px-4">Transport / Vehicle</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Delivery Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {dispatches.length > 0 ? (
                dispatches.map((d: any) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onSelectDispatch ? onSelectDispatch(d.id) : onNavigateTab?.('dispatch_view', { id: d.id })}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <div>{d.challanNumber}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {d.dispatchDate} {d.dispatchTime && `• ${d.dispatchTime}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {d.soNumber || d.salesOrder?.soNumber}
                      </div>
                      {d.customerPoNumber && (
                        <div className="text-[10px] text-slate-400">PO: {d.customerPoNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[170px]">
                        {d.customerName || d.customer?.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
                        {d.shippingAddress || 'Ex-Factory'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 uppercase">
                        {d.vehicleNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {d.driverName ? `${d.driverName} • ` : ''}{d.transporterName || 'Direct'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {d.totalQuantity?.toLocaleString()} Pcs
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.totalBundles ? `${d.totalBundles} bndl • ` : ''}{Number(d.totalWeightKg || 0).toFixed(0)} kg
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.deliveryType === 'Full Delivery'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {d.deliveryType || 'Full Delivery'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setPrintModalDispatch(d)}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          title="Print Delivery Challan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectDispatch ? onSelectDispatch(d.id) : onNavigateTab?.('dispatch_view', { id: d.id })}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition"
                          title="View Dispatch Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {d.status !== 'Delivered' && d.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => onEditDispatch ? onEditDispatch(d.id) : onNavigateTab?.('dispatch_edit', { id: d.id })}
                              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                              title="Edit Transport Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setCancelModalDispatch(d);
                                setCancelReason('');
                              }}
                              className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition"
                              title="Cancel Delivery Challan & Restock"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    {loading ? 'Retrieving dispatches from database...' : 'No dispatches match the selected filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Showing {dispatches.length} of {totalCount} delivery records
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
              totalItems={totalCount}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>

      {/* Print Delivery Challan Modal */}
      {printModalDispatch && (
        <DeliveryChallanPrintModal
          dispatch={printModalDispatch}
          onClose={() => setPrintModalDispatch(null)}
          darkMode={darkMode}
        />
      )}

      {/* Cancel Delivery Challan Modal */}
      {cancelModalDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md rounded-xl p-5 border shadow-xl ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold">Cancel Delivery Challan</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to cancel challan <strong>#{cancelModalDispatch.challanNumber}</strong>?
              This will automatically restore finished goods stock and reverse the sales order dispatched balance.
            </p>

            {actionError && (
              <div className="mb-3 p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200">
                {actionError}
              </div>
            )}

            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Reason for cancellation (e.g., Vehicle breakdown, customer order amendment)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setCancelModalDispatch(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelDispatch}
                disabled={actionLoading || !cancelReason.trim()}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {actionLoading ? 'Cancelling & Restocking...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
