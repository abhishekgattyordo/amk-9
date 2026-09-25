'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, X, Search, Filter, FileText, Eye } from 'lucide-react';
import { Pagination } from '../common/Pagination';

interface SalesQuotationsViewProps {
  darkMode: boolean;
  quotations: any[];
  loading?: boolean;
  onRefresh: () => void;
  onNewQuotation?: () => void;
  onSelectQuotation?: (quotation: any) => void;
  showAddQuoteModal?: boolean;
  setShowAddQuoteModal?: (show: boolean) => void;
  quoteForm?: any;
  setQuoteForm?: (form: any) => void;
  handleCreateQuotation?: (e: React.FormEvent) => void;
}

export const SalesQuotationsView: React.FC<SalesQuotationsViewProps> = ({
  darkMode,
  quotations,
  loading = false,
  onRefresh,
  onNewQuotation,
  onSelectQuotation
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleOpenNewQuotation = () => {
    if (onNewQuotation) {
      onNewQuotation();
    } else {
      router.push('/sales/quotations/new');
    }
  };

  const filteredQuotations = (quotations || [])
    .filter(q => statusFilter === 'All' || q.status === statusFilter)
    .filter(q =>
      !searchQuery ||
      (q.quotationNumber && q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.customerName && q.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.productName && q.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / itemsPerPage));
  const paginatedQuotes = filteredQuotations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Accepted':
        return darkMode
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'Draft':
        return darkMode
          ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
          : 'bg-slate-100 text-slate-900 border-slate-300 font-bold';
      case 'Sent':
      case 'Active':
      case 'Proposal Sent':
        return darkMode
          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
          : 'bg-blue-100 text-blue-950 border-blue-300 font-bold';
      case 'Under Revision':
      case 'Pending':
        return darkMode
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          : 'bg-amber-100 text-amber-950 border-amber-300 font-bold';
      case 'Rejected':
      case 'Expired':
        return darkMode
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          : 'bg-rose-100 text-rose-950 border-rose-300 font-bold';
      default:
        return darkMode
          ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
          : 'bg-teal-100 text-teal-950 border-teal-300 font-bold';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Sales Quotations & Revisions
          </h1>
          <p className={`text-sm mt-0.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
            Manage formal customer proposals, pricing breakdowns, revisions, and quotation validity tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenNewQuotation}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
          <input
            type="text"
            placeholder="Search by quote #, customer, product..."
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
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Approved">Approved</option>
              <option value="Under Revision">Under Revision</option>
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

      {/* Quotations Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'border-slate-800 text-slate-300 bg-slate-800/80' : 'border-slate-300 text-slate-900 bg-slate-100'
              }`}>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Quotation #</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Customer Name</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Product Specification</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Revision</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Amount (₹)</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Valid Until</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Status</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`quote-skel-${i}`} className="animate-pulse">
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-44"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`p-12 text-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-60 text-slate-500" />
                    <p className="font-bold text-sm">No sales quotations found</p>
                    <p className="text-xs mt-0.5">Create a quotation or adjust your search filters</p>
                  </td>
                </tr>
              ) : (
                paginatedQuotes.map(q => (
                  <tr key={q.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-mono font-bold ${darkMode ? 'border-slate-800 text-teal-400' : 'border-slate-200 text-teal-700'}`}>
                      <button
                        onClick={() => {
                          if (onSelectQuotation) {
                            onSelectQuotation(q);
                          } else {
                            router.push(`/sales/quotations/${q.id}`);
                          }
                        }}
                        className={`hover:underline font-bold font-mono cursor-pointer flex items-center space-x-1 text-left ${darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-700 hover:text-teal-900'}`}
                        title="Open Quotation Workspace"
                      >
                        <span>{q.quotationNumber}</span>
                      </button>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-bold ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'}`}>
                      {q.customerName}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-medium ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-800'}`}>
                      {q.productName}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-bold ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-900'}`}>
                      Rev {q.revision}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-extrabold ${darkMode ? 'border-slate-800 text-emerald-400' : 'border-slate-200 text-emerald-700'}`}>
                      ₹{q.amount.toLocaleString()}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-medium ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-800'}`}>
                      {q.validUntil}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <button
                        onClick={() => {
                          if (onSelectQuotation) {
                            onSelectQuotation(q);
                          } else {
                            router.push(`/sales/quotations/${q.id}`);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm ${
                          darkMode
                            ? 'bg-teal-500/15 text-teal-300 hover:bg-teal-600 hover:text-white border-teal-500/30'
                            : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-600 hover:text-white border-emerald-300'
                        }`}
                        title="Open full Quotation Workspace separate page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Workspace</span>
                      </button>
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
          totalItems={filteredQuotations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          darkMode={darkMode}
          itemName="quotations"
        />
      </div>
    </div>
  );
};
