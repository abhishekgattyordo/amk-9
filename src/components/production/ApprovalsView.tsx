import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Layers,
  User,
  Check,
  X,
  Eye,
  ShieldAlert,
  ClipboardList,
  ArrowRight,
  Boxes,
} from 'lucide-react';

interface ApprovalsViewProps {
  darkMode: boolean;
  onNavigateToEntity?: (module: string, id?: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  darkMode,
  onNavigateToEntity,
}) => {
  const [activeTab, setActiveTab] = useState<'daily_reports' | 'work_orders' | 'material_indents'>('daily_reports');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [search, setSearch] = useState('');

  // Daily Production Reports data
  const [dprList, setDprList] = useState<any[]>([]);
  // Work orders needing release
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  // Material indents needing approval
  const [indents, setIndents] = useState<any[]>([]);

  // Action modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view'>('view');
  const [managerRemarks, setManagerRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDprList = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production/daily-reports');
      const data = await res.json();
      if (data.success) {
        setDprList(data.data?.reports || data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch('/api/production/work-orders');
      const data = await res.json();
      if (data.success) {
        const list = data.data?.workOrders || data.data || [];
        setWorkOrders(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIndents = async () => {
    try {
      const res = await fetch('/api/production/material-requests');
      const data = await res.json();
      if (data.success) {
        setIndents(data.data?.materialRequests || data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = () => {
    fetchDprList();
    fetchWorkOrders();
    fetchIndents();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Filtered DPRs
  const filteredDprs = dprList.filter((r) => {
    const isPending = r.status?.toLowerCase().includes('pending') || r.status === 'Submitted';
    const isApproved = r.status?.toLowerCase().includes('approved');
    const isRejected = r.status?.toLowerCase().includes('rejected');

    if (statusFilter === 'Pending' && !isPending) return false;
    if (statusFilter === 'Approved' && !isApproved) return false;
    if (statusFilter === 'Rejected' && !isRejected) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchReport = r.reportNumber?.toLowerCase().includes(q);
      const matchProd = r.product?.name?.toLowerCase().includes(q) || r.product?.code?.toLowerCase().includes(q);
      const matchPo = r.productionOrder?.orderNumber?.toLowerCase().includes(q);
      if (!matchReport && !matchProd && !matchPo) return false;
    }
    return true;
  });

  // Filtered WOs (Draft/Planned needing release)
  const filteredWos = workOrders.filter((wo) => {
    if (statusFilter === 'Pending' && wo.status !== 'Draft' && wo.status !== 'Planned') return false;
    if (statusFilter === 'Approved' && wo.status !== 'In Production' && wo.status !== 'Completed') return false;
    if (statusFilter === 'Rejected' && wo.status !== 'Cancelled') return false;

    if (search) {
      const q = search.toLowerCase();
      const matchWo = wo.orderNumber?.toLowerCase().includes(q);
      const matchProd = wo.product?.name?.toLowerCase().includes(q);
      if (!matchWo && !matchProd) return false;
    }
    return true;
  });

  // Filtered Indents
  const filteredIndents = indents.filter((ind) => {
    if (statusFilter === 'Pending' && ind.status !== 'Requested') return false;
    if (statusFilter === 'Approved' && ind.status !== 'Approved' && ind.status !== 'Allocated' && ind.status !== 'Issued') return false;
    if (statusFilter === 'Rejected' && ind.status !== 'Rejected') return false;

    if (search) {
      const q = search.toLowerCase();
      const matchInd = ind.indentNumber?.toLowerCase().includes(q);
      const matchMat = ind.rawMaterial?.name?.toLowerCase().includes(q) || ind.rawMaterial?.code?.toLowerCase().includes(q);
      if (!matchInd && !matchMat) return false;
    }
    return true;
  });

  const handleApproveRejectDpr = async () => {
    if (!selectedItem) return;
    try {
      setActionLoading(true);
      const newStatus = actionType === 'approve' ? 'Approved' : 'Rejected';
      const res = await fetch(`/api/production/daily-reports/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          approvedBy: 'Production Head',
          managerRemarks: managerRemarks || (actionType === 'approve' ? 'Approved for completion register' : 'Returned for correction'),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update report status');

      setSelectedItem(null);
      setManagerRemarks('');
      fetchDprList();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseWorkOrder = async (woId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/production/work-orders/release?id=${woId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to release work order');
      alert('Work Order approved and released to production floor!');
      setSelectedItem(null);
      fetchWorkOrders();
    } catch (err: any) {
      alert(err.message || 'Error releasing work order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveIndent = async (indentId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/production/material-requests/${indentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Approved',
          remarks: 'Approved by Production Manager for Godown 1 to Godown 2 allocation',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to approve indent');
      alert('Material Indent approved for Godown allocation!');
      setSelectedItem(null);
      fetchIndents();
    } catch (err: any) {
      alert(err.message || 'Error approving indent');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingDprCount = dprList.filter((r) => r.status?.toLowerCase().includes('pending') || r.status === 'Submitted').length;
  const pendingWoCount = workOrders.filter((w) => w.status === 'Draft' || w.status === 'Planned').length;
  const pendingIndentCount = indents.filter((i) => i.status === 'Requested').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Production Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Managerial review and sign-off queue for Daily Production Reports (DPR), Work Order releases, and Material Indents.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('daily_reports')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'daily_reports'
              ? darkMode
                ? 'bg-emerald-950/30 border-emerald-500/50'
                : 'bg-emerald-50/70 border-emerald-400'
              : darkMode
              ? 'bg-slate-850 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daily Production Reports (DPR)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500">
              {pendingDprCount} Pending
            </span>
          </div>
          <div className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {dprList.length} Total Reports
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Output, scrap, and material variance sign-off</p>
        </div>

        <div
          onClick={() => setActiveTab('work_orders')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'work_orders'
              ? darkMode
                ? 'bg-blue-950/30 border-blue-500/50'
                : 'bg-blue-50/70 border-blue-400'
              : darkMode
              ? 'bg-slate-850 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Work Order Releases
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500">
              {pendingWoCount} Awaiting
            </span>
          </div>
          <div className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {workOrders.length} Work Orders
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Approval to release to shop floor workstations</p>
        </div>

        <div
          onClick={() => setActiveTab('material_indents')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'material_indents'
              ? darkMode
                ? 'bg-purple-950/30 border-purple-500/50'
                : 'bg-purple-50/70 border-purple-400'
              : darkMode
              ? 'bg-slate-850 border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Material Indents
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-500">
              {pendingIndentCount} Pending
            </span>
          </div>
          <div className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {indents.length} Indent Requests
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sign-off before paper reel & starch allocation</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, product, or indent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? darkMode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: DAILY PRODUCTION REPORTS APPROVAL QUEUE */}
      {activeTab === 'daily_reports' && (
        <div
          className={`rounded-xl border overflow-hidden shadow-xs ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
                  <th className="py-3 px-4 font-bold">Report Number</th>
                  <th className="py-3 px-4 font-bold">Date & Shift</th>
                  <th className="py-3 px-4 font-bold">Production Order / Product</th>
                  <th className="py-3 px-4 font-bold text-right">Planned vs Produced</th>
                  <th className="py-3 px-4 font-bold text-right">Scrap / Wastage</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredDprs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No Daily Production Reports found in this queue.
                    </td>
                  </tr>
                ) : (
                  filteredDprs.map((r) => {
                    const isPending = r.status?.toLowerCase().includes('pending') || r.status === 'Submitted';
                    const isApproved = r.status?.toLowerCase().includes('approved');
                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {r.reportNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {r.productionDate}
                          </div>
                          <div className="text-[11px] text-slate-500">{r.shift || 'Shift A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {r.product?.name || 'Corrugated Box'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {r.productionOrder?.orderNumber || 'Direct Report'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {r.actualProducedQuantity?.toLocaleString()} / {r.plannedQuantity?.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-emerald-500 font-semibold">
                            {Math.round((r.actualProducedQuantity / (r.plannedQuantity || 1)) * 100)}% achieved
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-amber-500 font-semibold">
                            {r.scrapQuantity || 0} kg scrap
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {r.wastageQuantity || 0} pcs waste
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}
                          >
                            {r.status || 'Pending Manager Approval'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedItem(r);
                                    setActionType('approve');
                                    setManagerRemarks('Approved for Finished Goods accounting');
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                  title="Approve Report"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedItem(r);
                                    setActionType('reject');
                                    setManagerRemarks('');
                                  }}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                  title="Reject Report"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItem(r);
                                setActionType('view');
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: WORK ORDERS APPROVAL & RELEASE QUEUE */}
      {activeTab === 'work_orders' && (
        <div
          className={`rounded-xl border overflow-hidden shadow-xs ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
                  <th className="py-3 px-4 font-bold">Work Order #</th>
                  <th className="py-3 px-4 font-bold">Sales Order / Client</th>
                  <th className="py-3 px-4 font-bold">Product Specification</th>
                  <th className="py-3 px-4 font-bold text-right">Target Quantity</th>
                  <th className="py-3 px-4 font-bold">Assigned Line</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredWos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No Work Orders found matching this status.
                    </td>
                  </tr>
                ) : (
                  filteredWos.map((wo) => {
                    const isAwaitingRelease = wo.status === 'Draft' || wo.status === 'Planned';
                    return (
                      <tr
                        key={wo.id}
                        className={`transition-colors ${
                          darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-500">
                          {wo.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {wo.salesOrder?.customer?.name || wo.salesOrder?.soNumber || 'Internal Stock Order'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {wo.salesOrder?.soNumber || 'SO-N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {wo.product?.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {wo.product?.boxType || 'Corrugated Box'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {wo.orderedQuantity?.toLocaleString()} {wo.product?.unit || 'Pcs'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400 font-medium">
                            {wo.assignedLine || 'Corrugator Line 1'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAwaitingRelease
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}
                          >
                            {wo.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isAwaitingRelease ? (
                            <button
                              type="button"
                              onClick={() => handleReleaseWorkOrder(wo.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                            >
                              Release to Floor
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-500 font-semibold">Active Floor</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: MATERIAL INDENTS APPROVAL QUEUE */}
      {activeTab === 'material_indents' && (
        <div
          className={`rounded-xl border overflow-hidden shadow-xs ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
                  <th className="py-3 px-4 font-bold">Indent Number</th>
                  <th className="py-3 px-4 font-bold">Raw Material (Paper / Starch)</th>
                  <th className="py-3 px-4 font-bold">Production Order #</th>
                  <th className="py-3 px-4 font-bold text-right">Required Quantity</th>
                  <th className="py-3 px-4 font-bold">Requested By / Date</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredIndents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No Material Indents found in this queue.
                    </td>
                  </tr>
                ) : (
                  filteredIndents.map((ind) => {
                    const isPending = ind.status === 'Requested';
                    return (
                      <tr
                        key={ind.id}
                        className={`transition-colors ${
                          darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-purple-500">
                          {ind.indentNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {ind.rawMaterial?.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {ind.rawMaterial?.code} • {ind.rawMaterial?.gsm} GSM {ind.rawMaterial?.grade}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 font-medium">
                          {ind.productionOrder?.orderNumber || ind.workOrder?.orderNumber || 'General Indent'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {ind.requiredQuantity?.toLocaleString()} {ind.uom || 'Kg'}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {ind.requestedBy || 'Supervisor'}
                          </div>
                          <div className="text-[11px] text-slate-500">{ind.requiredDate || ind.createdAt?.split('T')[0]}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}
                          >
                            {ind.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleApproveIndent(ind.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                            >
                              Approve Indent
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-500 font-semibold">Approved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVAL / REJECTION / DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold">
                {actionType === 'approve'
                  ? 'Approve Daily Production Report'
                  : actionType === 'reject'
                  ? 'Reject Daily Production Report'
                  : 'Report Details & Sign-off'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                <div>
                  <span className="text-slate-400 block">Report Number:</span>
                  <span className="font-mono font-bold text-emerald-500">{selectedItem.reportNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Shift:</span>
                  <span className="font-semibold">{selectedItem.productionDate} ({selectedItem.shift || 'Shift A'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Product:</span>
                  <span className="font-semibold">{selectedItem.product?.name || 'Corrugated Box'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Supervisor / Operator:</span>
                  <span className="font-semibold">{selectedItem.supervisor || selectedItem.operator || 'Shift Lead'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Planned vs Produced:</span>
                  <span className="font-bold text-emerald-500">
                    {selectedItem.actualProducedQuantity?.toLocaleString()} / {selectedItem.plannedQuantity?.toLocaleString()} Pcs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Scrap / Wastage:</span>
                  <span className="font-bold text-amber-500">
                    {selectedItem.scrapQuantity || 0} kg / {selectedItem.wastageQuantity || 0} pcs
                  </span>
                </div>
              </div>

              {actionType !== 'view' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Manager Review Remarks {actionType === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      actionType === 'approve'
                        ? 'Enter approval notes, warehouse verification, etc.'
                        : 'Explain why this report was returned/rejected...'
                    }
                    value={managerRemarks}
                    onChange={(e) => setManagerRemarks(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Close
              </button>
              {actionType !== 'view' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApproveRejectDpr}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {actionLoading ? 'Saving...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
