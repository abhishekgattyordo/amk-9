import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Printer,
  FileCheck,
  Building2,
  Boxes,
  Layers,
  MapPin,
  Calendar,
  User,
  Scale,
  Activity,
  AlertOctagon,
  Save,
  Edit,
  Truck,
} from 'lucide-react';
import { QualityCheck, QualityCheckItem } from '../../types';

interface QCDetailViewProps {
  darkMode: boolean;
  inspection: QualityCheck;
  onBack: () => void;
  onUpdateStatus: (id: string, updateData: any) => Promise<void>;
  onNavigateEntity?: (module: string, subPage?: string, entityId?: string) => void;
}

export const QCDetailView: React.FC<QCDetailViewProps> = ({
  darkMode,
  inspection,
  onBack,
  onUpdateStatus,
  onNavigateEntity,
}) => {
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState(inspection.status || 'Approved');
  const [editResult, setEditResult] = useState(inspection.result || 'Approved');
  const [editRejectionReason, setEditRejectionReason] = useState(inspection.rejectionReason || '');
  const [editRootCause, setEditRootCause] = useState(inspection.rootCause || '');
  const [editCorrectiveAction, setEditCorrectiveAction] = useState(inspection.correctiveAction || '');
  const [editRemarks, setEditRemarks] = useState(inspection.remarks || '');

  // Parse parameters
  let items: QualityCheckItem[] = [];
  try {
    if (typeof inspection.parameters === 'string') {
      items = JSON.parse(inspection.parameters);
    } else if (Array.isArray(inspection.parameters)) {
      items = inspection.parameters;
    }
  } catch (e) {
    items = [];
  }

  const getStatusBadge = (status?: string, result?: string) => {
    const st = (result || status || 'Pending').toUpperCase();
    if (st.includes('PASS') || st.includes('APPROV')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {result || status || 'Approved'}
        </span>
      );
    }
    if (st.includes('FAIL') || st.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" />
          {result || status || 'Rejected'}
        </span>
      );
    }
    if (st.includes('PARTIAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Partially Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Clock className="w-3.5 h-3.5" />
        {result || status || 'Pending'}
      </span>
    );
  };

  const handleQuickApprove = async () => {
    if (!window.confirm('Confirm approval and quality release for this inspection?')) return;
    try {
      setUpdating(true);
      await onUpdateStatus(inspection.id, {
        status: 'Approved',
        result: 'Approved',
        passedQuantity: inspection.inspectedQuantity || inspection.expectedQuantity || 1,
        rejectedQuantity: 0,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickReject = async () => {
    const reason = window.prompt('Enter rejection / non-conformance reason:');
    if (reason === null) return;
    try {
      setUpdating(true);
      await onUpdateStatus(inspection.id, {
        status: 'Rejected',
        result: 'Rejected',
        passedQuantity: 0,
        rejectedQuantity: inspection.inspectedQuantity || inspection.expectedQuantity || 1,
        rejectionReason: reason || 'Failed quality threshold specifications',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveModalEdit = async () => {
    try {
      setUpdating(true);
      await onUpdateStatus(inspection.id, {
        status: editStatus,
        result: editResult,
        rejectionReason: editRejectionReason,
        rootCause: editRootCause,
        correctiveAction: editCorrectiveAction,
        remarks: editRemarks,
      });
      setShowEditModal(false);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {inspection.qcNumber}
              </h2>
              {getStatusBadge(inspection.status, inspection.result)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Type: <span className="font-semibold text-slate-700 dark:text-slate-300">{inspection.qcType}</span> | Stage:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{inspection.stage || 'General'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Print QC Certificate
          </button>

          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 shadow-sm'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Inspection
          </button>

          {inspection.status !== 'Approved' && inspection.result !== 'Approved' && (
            <button
              type="button"
              disabled={updating}
              onClick={handleQuickApprove}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Release
            </button>
          )}

          {inspection.status !== 'Rejected' && inspection.result !== 'Rejected' && (
            <button
              type="button"
              disabled={updating}
              onClick={handleQuickReject}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject / NCR
            </button>
          )}
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inspection Header Details */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Inspection Meta Details
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Inspector</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                {inspection.inspector}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Inspection Date</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {inspection.inspectionDate || inspection.testedAt?.split('T')[0] || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Reference Type</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{inspection.referenceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Stage</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{inspection.stage || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Reference & Order Details */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Linked Reference Record
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Reference Number</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {inspection.referenceNumber || 'N/A'}
              </span>
            </div>

            {inspection.salesOrder && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sales Order</span>
                  <button
                    type="button"
                    onClick={() => onNavigateEntity?.('sales', 'orders', inspection.salesOrder?.id)}
                    className="font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    {inspection.salesOrder.soNumber}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Customer</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {inspection.salesOrder.customerName || inspection.salesOrder.customer?.name}
                  </span>
                </div>
              </>
            )}

            {inspection.workOrder && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Work Order</span>
                  <button
                    type="button"
                    onClick={() => onNavigateEntity?.('production', 'work_orders', inspection.workOrder?.id)}
                    className="font-mono font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    {inspection.workOrder.woNumber}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Product</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {inspection.product?.name || inspection.workOrder.productName}
                  </span>
                </div>
              </>
            )}

            {inspection.reelInward && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Reel Inward</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {inspection.reelInward.inwardNumber || inspection.reelInward.reelNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Supplier</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {inspection.reelInward.supplier?.name || inspection.reelInward.supplierName || 'N/A'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quantities & Yield Summary */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Quantities & Yield Summary
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Expected / Ordered Qty</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {inspection.expectedQuantity || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Inspected / Sample Qty</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {inspection.inspectedQuantity || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Passed Quantity</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {inspection.passedQuantity || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Rejected Quantity</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {inspection.rejectedQuantity || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Parameters / Reel Inspections Breakdown Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Test Parameters & Observation Log
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Laboratory measurements, physical strength indices, and optical checks
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="p-3">#</th>
                  <th className="p-3">Reel / Sample ID</th>
                  <th className="p-3 text-center">Declared GSM</th>
                  <th className="p-3 text-center">Observed GSM</th>
                  <th className="p-3 text-center">Observed BF</th>
                  <th className="p-3 text-right">Net Weight (Kg)</th>
                  <th className="p-3 text-center">Moisture %</th>
                  <th className="p-3 text-center">Burst Factor</th>
                  <th className="p-3 text-center">BCT (kgf)</th>
                  <th className="p-3 text-center">Dimension</th>
                  <th className="p-3 text-center">Print Quality</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-400">{it.slNo || idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {it.reelNo || `Sample #${idx + 1}`}
                    </td>
                    <td className="p-3 text-center font-mono">{it.gsm || '-'}</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {it.observationGsm || it.gsm || '-'}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                      {it.observationBf || it.bf || '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {it.netWeight || it.actualWeight || '-'}
                    </td>
                    <td className="p-3 text-center font-mono">{it.moisturePercent ? `${it.moisturePercent}%` : '-'}</td>
                    <td className="p-3 text-center font-mono">{it.burstingFactor || it.burstingStrength || '-'}</td>
                    <td className="p-3 text-center font-mono">{it.boxCompressionTest || '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        it.dimensionCheck === 'Pass' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {it.dimensionCheck || 'Pass'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        it.printQuality === 'Pass' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {it.printQuality || 'Pass'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(it.status, it.result)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            Standard parameter set recorded directly under header summary.
          </div>
        )}
      </div>

      {/* Rejection / Non-Conformance Details (NCR) */}
      {(inspection.rejectionReason || inspection.rootCause || inspection.result === 'Rejected' || inspection.status === 'Rejected') && (
        <div
          className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-3">
            <AlertOctagon className="w-4 h-4" />
            Non-Conformance Report (NCR) & Root Cause Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Rejection Reason</span>
              <p className="text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30 font-medium">
                {inspection.rejectionReason || 'Physical measurement or bursting strength failure.'}
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Root Cause</span>
              <p className="text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30">
                {inspection.rootCause || 'Supplier raw paper moisture inconsistency or fluting temperature drift.'}
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Corrective Action Taken</span>
              <p className="text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30">
                {inspection.correctiveAction || 'Quarantine batch, issue vendor warning notice & calibrate corrugation temperature.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Remarks Card */}
      {inspection.remarks && (
        <div
          className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Inspector Remarks:</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">{inspection.remarks}</p>
        </div>
      )}

      {/* Edit Inspection Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-xl p-6 space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold">Edit Quality Inspection</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Status / Verdict</label>
                <select
                  value={editStatus}
                  onChange={(e) => {
                    setEditStatus(e.target.value);
                    setEditResult(e.target.value);
                  }}
                  className={`w-full p-2 rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="Approved">Approved / Passed</option>
                  <option value="Partially Approved">Partially Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Rejection Reason</label>
                <input
                  type="text"
                  value={editRejectionReason}
                  onChange={(e) => setEditRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason if applicable"
                  className={`w-full p-2 rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Root Cause Analysis</label>
                <textarea
                  rows={2}
                  value={editRootCause}
                  onChange={(e) => setEditRootCause(e.target.value)}
                  placeholder="Describe root cause"
                  className={`w-full p-2 rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Corrective Action</label>
                <textarea
                  rows={2}
                  value={editCorrectiveAction}
                  onChange={(e) => setEditCorrectiveAction(e.target.value)}
                  placeholder="Describe corrective actions taken"
                  className={`w-full p-2 rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Remarks</label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Inspector remarks"
                  className={`w-full p-2 rounded-xl border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleSaveModalEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
