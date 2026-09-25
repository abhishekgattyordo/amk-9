'use client';

import React, { useState } from 'react';
import { RefreshCw, Search, Filter, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Pagination } from '../common/Pagination';

interface SalesOrdersViewProps {
  darkMode: boolean;
  orders: any[];
  loading?: boolean;
  onRefresh: () => void;
  onGoToLeads?: () => void;
  onGoToQuotations?: () => void;
  onSelectSalesOrder?: (order: any) => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  darkMode,
  orders,
  loading = false,
  onRefresh,
  onGoToLeads,
  onGoToQuotations,
  onSelectSalesOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredOrders = (orders || [])
    .filter(o => statusFilter === 'All' || o.status === statusFilter)
    .filter(o =>
      !searchQuery ||
      (o.soNumber && o.soNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerPoNumber && o.customerPoNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.productName && o.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Released to Production':
        return darkMode
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'In Production':
        return darkMode
          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
          : 'bg-blue-100 text-blue-950 border-blue-300 font-bold';
      case 'Pending Planning':
        return darkMode
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          : 'bg-amber-100 text-amber-950 border-amber-300 font-bold';
      case 'Dispatched':
      case 'Completed':
        return darkMode
          ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
          : 'bg-teal-100 text-teal-950 border-teal-300 font-bold';
      case 'Cancelled':
        return darkMode
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          : 'bg-rose-100 text-rose-950 border-rose-300 font-bold';
      default:
        return darkMode
          ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
          : 'bg-slate-100 text-slate-900 border-slate-300 font-bold';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Confirmed Sales Orders & Planning
          </h1>
          <p className={`text-sm mt-0.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
            Confirmed customer orders integrated with production planning, material requirements, and dispatch.
          </p>
        </div>
        <div>
          <button
            onClick={onRefresh}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
          <input
            type="text"
            placeholder="Search by SO #, PO #, customer, product..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 shadow-sm'
            }`}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
              }`}
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Released to Production">Released to Production</option>
              <option value="In Production">In Production</option>
              <option value="Pending Planning">Pending Planning</option>
              <option value="Dispatched">Dispatched</option>
            </select>
          </div>
          {(searchQuery || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'border-slate-800 text-slate-300 bg-slate-800/80' : 'border-slate-300 text-slate-900 bg-slate-100'
              }`}>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>SO #</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Customer PO #</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Customer Name</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Product Specification</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Quantity</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Total Value (₹)</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Delivery Date</th>
                <th className="p-3.5 sm:p-4">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`so-skel-${i}`} className="animate-pulse">
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-44"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No Confirmed Sales Orders Found</h4>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Sales orders are generated automatically when a customer enquiry/lead is marked as <strong>Won</strong> (after receiving their PO) and converted in the Lead Workflow Workspace.
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-center gap-3">
                        {onGoToLeads && (
                          <button
                            onClick={onGoToLeads}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                          >
                            Go to Leads & Pipeline to Convert
                          </button>
                        )}
                        {onGoToQuotations && (
                          <button
                            onClick={onGoToQuotations}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                              darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            View Quotations
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(o => (
                  <tr
                    key={o.id}
                    onClick={() => onSelectSalesOrder && onSelectSalesOrder(o)}
                    className={`transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-mono font-bold ${darkMode ? 'border-slate-800 text-emerald-400' : 'border-slate-200 text-emerald-700'}`}>
                      {o.soNumber}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-mono font-bold ${darkMode ? 'border-slate-800 text-blue-400' : 'border-slate-200 text-blue-700'}`}>
                      {o.customerPoNumber}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-bold ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}>
                      {o.customerName}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-medium ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-800'}`}>
                      {o.productName}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-bold ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-900'}`}>
                      {o.quantity.toLocaleString()} Pcs
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-extrabold ${darkMode ? 'border-slate-800 text-emerald-400' : 'border-slate-200 text-emerald-700'}`}>
                      ₹{o.totalValue.toLocaleString()}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-medium ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-800'}`}>
                      {o.deliveryDate}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standard ERP Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          darkMode={darkMode}
          itemName="sales orders"
        />
      </div>
    </div>
  );
};
