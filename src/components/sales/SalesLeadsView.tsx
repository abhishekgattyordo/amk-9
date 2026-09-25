'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  ArrowRight,
  Send,
  CheckCircle,
  ShoppingBag,
  X,
  Briefcase,
  Layers,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Pagination } from '../common/Pagination';

interface SalesLeadsViewProps {
  darkMode: boolean;
  leads: any[];
  loading?: boolean;
  onRefresh: () => void;
  onNewLead: () => void;
  onSelectLead: (lead: any) => void;
  showLeadDetailModal: any;
  setShowLeadDetailModal: (lead: any) => void;
  showAddLeadModal: boolean;
  setShowAddLeadModal: (show: boolean) => void;
  leadForm: any;
  setLeadForm: (form: any) => void;
  handleCreateLead: (e: React.FormEvent) => void;
  handleAdvanceStage: (leadId: string, status: string) => void;
  handleSendToCosting: (leadId: string) => void;
  handleConvertToOrder: (leadId: string) => void;
  showCustomerPoModal: any;
  setShowCustomerPoModal: (lead: any) => void;
  poForm: any;
  setPoForm: (form: any) => void;
  handleCapturePo: (e: React.FormEvent) => void;
}

export const SalesLeadsView: React.FC<SalesLeadsViewProps> = ({
  darkMode,
  leads,
  loading = false,
  onRefresh,
  onNewLead,
  onSelectLead,
  showLeadDetailModal,
  setShowLeadDetailModal,
  showAddLeadModal,
  setShowAddLeadModal,
  leadForm,
  setLeadForm,
  handleCreateLead,
  handleAdvanceStage,
  handleSendToCosting,
  handleConvertToOrder,
  showCustomerPoModal,
  setShowCustomerPoModal,
  poForm,
  setPoForm,
  handleCapturePo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredLeads = (leads || [])
    .filter(l => statusFilter === 'All' || l.status === statusFilter)
    .filter(l => 
      !searchQuery || 
      (l.customerName && l.customerName.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (l.leadNumber && l.leadNumber.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (l.productRequirement && l.productRequirement.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.assignedSalesExecutive && l.assignedSalesExecutive.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Won':
        return darkMode
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold';
      case 'Converted':
        return darkMode
          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
          : 'bg-blue-100 text-blue-950 border-blue-400 font-bold';
      case 'Costing':
        return darkMode
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          : 'bg-amber-100 text-amber-950 border-amber-400 font-bold';
      case 'Proposal Sent':
      case 'Negotiation':
        return darkMode
          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
          : 'bg-purple-100 text-purple-950 border-purple-400 font-bold';
      case 'Details Taken / Sample Details':
        return darkMode
          ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
          : 'bg-teal-100 text-teal-950 border-teal-400 font-bold';
      default:
        return darkMode
          ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
          : 'bg-slate-200 text-slate-950 border-slate-400 font-bold';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
            Leads & Pipeline Management
          </h1>
          <p className={`text-sm mt-0.5 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Track customer enquiries, sample requests, costing approvals, proposals, and deal conversions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onNewLead}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
          <input
            type="text"
            placeholder="Search by lead #, customer, product..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-950 placeholder-slate-500 shadow-sm'
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
              className={`px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-950 shadow-sm'
              }`}
            >
              <option value="All">All Stages</option>
              <option value="Lead">Lead</option>
              <option value="Details Taken / Sample Details">Details / Sample Taken</option>
              <option value="Costing">Costing</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won (PO Received)</option>
              <option value="Converted">Converted to SO</option>
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

      {/* Leads Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-xs font-extrabold uppercase tracking-wider ${
                darkMode ? 'border-slate-800 text-slate-200 bg-slate-800/80' : 'border-slate-300 text-slate-950 bg-slate-100'
              }`}>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Lead #</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Customer Name</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Requirement & Carton Specs</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Expected Qty</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Sales Executive</th>
                <th className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Current Stage</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`lead-skel-${i}`} className="animate-pulse">
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`p-12 text-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Briefcase className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
                    <p className="font-bold text-sm">No sales leads found</p>
                    <p className="text-xs mt-0.5">Try modifying your search or filter parameters</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => (
                  <tr key={lead.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-mono font-bold ${darkMode ? 'border-slate-800 text-blue-400' : 'border-slate-200 text-blue-700'}`}>
                      <button
                        onClick={() => onSelectLead(lead)}
                        className={`hover:underline font-extrabold font-mono cursor-pointer flex items-center space-x-1 text-left ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-900'}`}
                        title="Open Lead Workflow Workspace"
                      >
                        <span>{lead.leadNumber}</span>
                      </button>
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-bold ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-950'}`}>
                      {lead.customerName}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-medium ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-900'}`}>
                      {lead.productRequirement}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-bold ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-950'}`}>
                      {lead.expectedQuantity.toLocaleString()} Pcs
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 font-medium ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-900'}`}>
                      {lead.assignedSalesExecutive}
                    </td>
                    <td className={`p-3.5 sm:p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <select
                        value={lead.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus !== lead.status) {
                            handleAdvanceStage(lead.id, newStatus);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${getStatusBadge(lead.status)}`}
                        title="Click to manually change lead stage"
                      >
                        <option value="Lead" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Lead</option>
                        <option value="Details Taken / Sample Details" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Details / Sample Taken</option>
                        <option value="Costing" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Costing</option>
                        <option value="Proposal Sent" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Proposal Sent</option>
                        <option value="Negotiation" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Negotiation</option>
                        <option value="Won" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Won (PO Received)</option>
                        <option value="Converted" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Converted</option>
                        <option value="Lost" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Lost / Disqualified</option>
                      </select>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm ${
                          darkMode
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-600 hover:text-white border-blue-500/40'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-blue-600/20'
                        }`}
                        title="Open full Lead Workflow Workspace separate page"
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
          totalItems={filteredLeads.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          darkMode={darkMode}
          itemName="leads"
        />
      </div>

      {/* MODAL: CUSTOMER PO CAPTURE */}
      {showCustomerPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="text-base font-bold">Capture Official Customer PO</h3>
              <button 
                onClick={() => setShowCustomerPoModal(null)} 
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  darkMode ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Enter official customer purchase order reference to mark this deal as Won.</p>
            <form onSubmit={handleCapturePo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5">Customer PO Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO/2026/8942"
                  value={poForm.customerPoNumber}
                  onChange={e => setPoForm({ ...poForm, customerPoNumber: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5">PO Date</label>
                <input
                  type="date"
                  value={poForm.customerPoDate}
                  onChange={e => setPoForm({ ...poForm, customerPoDate: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerPoModal(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Confirm Deal Won
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
