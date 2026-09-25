'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  Calendar,
  FileText,
  Printer,
  Eye,
  RefreshCw,
  Download,
  Building,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Pagination } from '../common/Pagination';
import { DeliveryChallanPrintModal } from './DeliveryChallanPrintModal';

interface DispatchHistoryViewProps {
  darkMode: boolean;
  onSelectDispatch?: (id: string) => void;
}

export const DispatchHistoryView: React.FC<DispatchHistoryViewProps> = ({
  darkMode,
  onSelectDispatch,
}) => {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [printModalDispatch, setPrintModalDispatch] = useState<any>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/dispatch', window.location.origin);
      url.searchParams.set('page', String(currentPage));
      url.searchParams.set('limit', String(itemsPerPage));
      if (statusFilter !== 'All') url.searchParams.set('status', statusFilter);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      if (dateFrom) url.searchParams.set('dateFrom', dateFrom);
      if (dateTo) url.searchParams.set('dateTo', dateTo);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setDispatches(json.data || []);
        setTotalCount(json.pagination?.total || (json.data || []).length);
      } else {
        setError(json.error || 'Failed to load dispatch history');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, itemsPerPage, statusFilter]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistory();
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('All');
    setCurrentPage(1);
    setTimeout(fetchHistory, 10);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const totalQuantity = dispatches.reduce((s, d) => s + (Number(d.totalQuantity) || 0), 0);
  const deliveredCount = dispatches.filter(d => d.status === 'Delivered').length;
  const cancelledCount = dispatches.filter(d => d.status === 'Cancelled').length;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Dispatch History & Audit Archive
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Chronological audit log of completed, active, and reversed delivery challans with date filters and regulatory records
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchHistory} className="underline font-semibold hover:text-rose-900">Retry</button>
        </div>
      )}

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-3 rounded-lg border ${
          darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
        } flex items-center justify-between`}>
          <div>
            <div className="text-[11px] text-slate-500">Historical Dispatches in View</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{totalCount} Record{totalCount === 1 ? '' : 's'}</div>
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {totalQuantity.toLocaleString()} Pcs
          </span>
        </div>

        <div className={`p-3 rounded-lg border ${
          darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
        } flex items-center justify-between`}>
          <div>
            <div className="text-[11px] text-slate-500">Delivered Shipments</div>
            <div className="text-base font-bold text-emerald-600">{deliveredCount}</div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
            Confirmed Receipts
          </span>
        </div>

        <div className={`p-3 rounded-lg border ${
          darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
        } flex items-center justify-between`}>
          <div>
            <div className="text-[11px] text-slate-500">Cancelled / Restocked</div>
            <div className="text-base font-bold text-rose-600">{cancelledCount}</div>
          </div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
            Stock Reversed
          </span>
        </div>
      </div>

      {/* Date & Search Filters */}
      <form onSubmit={handleApplyFilter} className={`p-4 rounded-xl border flex flex-col lg:flex-row items-center gap-3 ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Challan #, Customer, Sales Order, Vehicle #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-500">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-500">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

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
            <option value="Delivered">Delivered</option>
            <option value="Dispatched">Dispatched</option>
            <option value="In Transit">In Transit</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleResetFilter}
            className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </form>

      {/* History Table */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                darkMode ? 'border-slate-700 text-slate-400 bg-slate-800/40' : 'border-slate-200 text-slate-500 bg-slate-50'
              }`}>
                <th className="py-3 px-4">Challan No</th>
                <th className="py-3 px-4">Dispatch Date</th>
                <th className="py-3 px-4">Sales Order & Customer</th>
                <th className="py-3 px-4">Transport / Vehicle</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dispatched By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {dispatches.length > 0 ? (
                dispatches.map((d: any) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onSelectDispatch?.(d.id)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {d.challanNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {d.dispatchDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                        {d.customerName || d.customer?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">SO: {d.soNumber || d.salesOrder?.soNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold uppercase text-slate-800 dark:text-slate-200">
                      {d.vehicleNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                      {d.totalQuantity?.toLocaleString()} Pcs
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : d.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {d.dispatchedBy || 'Dispatch Supervisor'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setPrintModalDispatch(d)}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          title="Print Delivery Challan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectDispatch?.(d.id)}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    {loading ? 'Retrieving historical archive...' : 'No historical dispatch records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Showing {dispatches.length} of {totalCount} records
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

      {printModalDispatch && (
        <DeliveryChallanPrintModal
          dispatch={printModalDispatch}
          onClose={() => setPrintModalDispatch(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
