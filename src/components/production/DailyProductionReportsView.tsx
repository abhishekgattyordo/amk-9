import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
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
} from 'lucide-react';
import { Product } from '../../types';

interface DailyProductionReportsViewProps {
  darkMode: boolean;
  products?: Product[];
}

export const DailyProductionReportsView: React.FC<DailyProductionReportsViewProps> = ({
  darkMode,
  products = [],
}) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('Shift A (Day)');
  const [plannedQty, setPlannedQty] = useState<number>(1000);
  const [actualQty, setActualQty] = useState<number>(950);
  const [scrapQty, setScrapQty] = useState<number>(15);
  const [wastageQty, setWastageQty] = useState<number>(8);
  const [supervisor, setSupervisor] = useState('');
  const [nonCompletionReason, setNonCompletionReason] = useState('');
  const [remarks, setRemarks] = useState('');

  // Approval / Rejection Modal
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view'>('view');
  const [managerRemarks, setManagerRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/production/daily-reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data?.reports || data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      const res = await fetch('/api/production/orders?limit=100');
      const data = await res.json();
      if (data.success) {
        setProductionOrders(data.data?.productionOrders || data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchProductionOrders();
  }, [statusFilter, dateFilter]);

  const handlePoSelect = (poId: string) => {
    setSelectedPoId(poId);
    const po = productionOrders.find((p) => p.id === poId);
    if (po) {
      setSelectedProductId(po.productId);
      setPlannedQty(po.plannedQuantity);
      setActualQty(po.actualQuantity || po.plannedQuantity);
      setScrapQty(po.scrapQuantity || 0);
      setWastageQty(po.wastageQuantity || 0);
      setSupervisor(po.supervisor || '');
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a Product or Production Order');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/production/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionOrderId: selectedPoId || undefined,
          productionDate,
          shift,
          productId: selectedProductId,
          plannedQuantity: Number(plannedQty),
          actualProducedQuantity: Number(actualQty),
          scrapQuantity: Number(scrapQty),
          wastageQuantity: Number(wastageQty),
          supervisor,
          reasonForNonCompletion: actualQty < plannedQty ? nonCompletionReason : undefined,
          remarks,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit report');

      alert('Daily Production Report submitted for Manager Approval!');
      setShowCreateModal(false);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Error creating report');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/production/daily-reports/${reportId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: managerRemarks }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to approve report');

      alert('Daily Production Report approved successfully!');
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Error approving report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReport = async (reportId: string) => {
    if (!managerRemarks) {
      alert('Please provide rejection remarks/reason');
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/production/daily-reports/${reportId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: managerRemarks }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to reject report');

      alert('Daily Production Report returned with rejection remarks');
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Error rejecting report');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Production Reports & Manager Approvals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Shift-wise output tracking, target achievement %, scrap/waste reconciliation, and management sign-off
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReports}
            className={`p-2 rounded-lg border text-xs font-semibold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Daily Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted (Pending Approval)</option>
            <option value="Approved">Approved by Manager</option>
            <option value="Rejected">Rejected / Needs Review</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div
        className={`rounded-xl border overflow-hidden shadow-xs ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading daily reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Daily Reports Submitted</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs"
            >
              Submit Today's Production Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Report #</th>
                  <th className="py-3 px-4">Date & Shift</th>
                  <th className="py-3 px-4">Product / Order</th>
                  <th className="py-3 px-4 text-right">Planned Qty</th>
                  <th className="py-3 px-4 text-right">Actual Qty</th>
                  <th className="py-3 px-4 text-right">Achievement</th>
                  <th className="py-3 px-4 text-right">Scrap / Waste</th>
                  <th className="py-3 px-4">Supervisor</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {reports.map((rep) => {
                  const isApproved = rep.status === 'Approved';
                  const isRejected = rep.status === 'Rejected';
                  const isSubmitted = rep.status === 'Submitted';

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-blue-600">{rep.reportNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{rep.productionDate}</div>
                        <div className="text-[11px] text-slate-400">{rep.shift}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {rep.product?.name || 'Corrugated Box'}
                        </div>
                        {rep.productionOrder && (
                          <div className="text-[11px] text-slate-400">PO: {rep.productionOrder.orderNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{rep.plannedQuantity?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {rep.actualProducedQuantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold ${
                            rep.achievementPercent >= 100
                              ? 'text-emerald-600'
                              : rep.achievementPercent >= 85
                              ? 'text-blue-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {rep.achievementPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {(rep.scrapQuantity || 0) + (rep.wastageQuantity || 0)} kg
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{rep.supervisor}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {rep.status}
                        </span>
                        {rep.approvedBy && (
                          <div className="text-[10px] text-slate-400 mt-0.5">By: {rep.approvedBy}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isSubmitted ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReport(rep);
                                  setActionType('approve');
                                  setManagerRemarks('');
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReport(rep);
                                  setActionType('reject');
                                  setManagerRemarks('');
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReport(rep);
                                setActionType('view');
                              }}
                              className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* CREATE DAILY REPORT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Submit Daily Production Report
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateReport} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Select Production Order (Optional)
                </label>
                <select
                  value={selectedPoId}
                  onChange={(e) => handlePoSelect(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- General / Manual Product Selection --</option>
                  {productionOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderNumber} - {po.product?.name} ({po.plannedQuantity} pcs)
                    </option>
                  ))}
                </select>
              </div>

              {!selectedPoId && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Product *
                  </label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Production Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Shift
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Shift A (Day)">Shift A (Day)</option>
                    <option value="Shift B (Evening)">Shift B (Evening)</option>
                    <option value="Shift C (Night)">Shift C (Night)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Planned Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={plannedQty}
                    onChange={(e) => setPlannedQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Actual Produced Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={actualQty}
                    onChange={(e) => setActualQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Scrap Generated (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scrapQty}
                    onChange={(e) => setScrapQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Wastage (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={wastageQty}
                    onChange={(e) => setWastageQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Verma"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              {actualQty < plannedQty && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-rose-600 dark:text-rose-400">
                    Reason for Shortfall / Target Variance *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g., Die blade replacement caused 45 mins downtime during shift"
                    value={nonCompletionReason}
                    onChange={(e) => setNonCompletionReason(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {saving ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGER APPROVAL / REJECTION MODAL */}
      {selectedReport && actionType !== 'view' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {actionType === 'approve' ? 'Approve Production Report' : 'Reject Production Report'}
              </h3>
              <button type="button" onClick={() => setSelectedReport(null)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
                <div>Report: <span className="font-bold">{selectedReport.reportNumber}</span> ({selectedReport.productionDate})</div>
                <div>Product: <span className="font-semibold">{selectedReport.product?.name}</span></div>
                <div>Target vs Produced: <span className="font-bold">{selectedReport.actualProducedQuantity} / {selectedReport.plannedQuantity}</span> ({selectedReport.achievementPercent}%)</div>
                {selectedReport.reasonForNonCompletion && (
                  <div className="text-rose-600 font-medium">Variance Note: {selectedReport.reasonForNonCompletion}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {actionType === 'approve' ? 'Manager Approval Remarks' : 'Rejection Reason / Guidance *'}
                </label>
                <textarea
                  rows={3}
                  required={actionType === 'reject'}
                  placeholder={actionType === 'approve' ? 'e.g. Verified and approved' : 'e.g. Please re-check scrap quantity recorded from Corrugator'}
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              {actionType === 'approve' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApproveReport(selectedReport.id)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  {actionLoading ? 'Approving...' : 'Confirm Approval'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleRejectReport(selectedReport.id)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Report'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
