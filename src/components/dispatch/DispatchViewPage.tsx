'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ArrowLeft,
  Printer,
  Edit2,
  XCircle,
  CheckCircle2,
  Clock,
  Building,
  Package,
  FileText,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  RefreshCw,
  Layers,
  MapPin,
  ChevronRight,
  History
} from 'lucide-react';
import { DeliveryChallanPrintModal } from './DeliveryChallanPrintModal';

interface DispatchViewPageProps {
  dispatchId: string;
  darkMode: boolean;
  onNavigateTab?: (tab: string, params?: any) => void;
  onEditDispatch?: (id: string) => void;
}

export const DispatchViewPage: React.FC<DispatchViewPageProps> = ({
  dispatchId,
  darkMode,
  onNavigateTab,
  onEditDispatch,
}) => {
  const [dispatch, setDispatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusRemarks, setStatusRemarks] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState('');

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchDispatchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dispatch/${dispatchId}`);
      const json = await res.json();
      if (json.success) {
        setDispatch(json.data);
        setSelectedNewStatus(json.data.status);
      } else {
        setError(json.error || 'Failed to load dispatch details');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dispatch record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dispatchId) {
      fetchDispatchDetails();
    }
  }, [dispatchId]);

  const handleUpdateStatus = async () => {
    if (!selectedNewStatus || selectedNewStatus === dispatch?.status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/dispatch/${dispatchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedNewStatus,
          remarks: statusRemarks || `Status changed to ${selectedNewStatus}`,
          user: 'Dispatch Supervisor',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusRemarks('');
        fetchDispatchDetails();
      } else {
        alert(json.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelDispatch = async () => {
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason.');
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/dispatch/${dispatchId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCancelModal(false);
        fetchDispatchDetails();
      } else {
        alert(json.error || 'Failed to cancel dispatch');
      }
    } catch (err: any) {
      alert(err.message || 'Error cancelling dispatch');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300';
      case 'Dispatched':
      case 'In Transit':
      case 'Loaded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
        <p>Loading dispatch and audit data from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !dispatch) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="text-rose-600 text-sm font-semibold">{error || 'Dispatch record not found'}</div>
        <button
          onClick={() => onNavigateTab?.('dispatch_list')}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
        >
          Return to Dispatch List
        </button>
      </div>
    );
  }

  const items = dispatch.items || [];
  const totalAmount = items.reduce(
    (sum: number, it: any) => sum + (Number(it.amount) || Number(it.dispatchedQuantity) * Number(it.rate || 0)),
    0
  );

  const steps = ['Ready for Dispatch', 'Loaded', 'Dispatched', 'In Transit', 'Delivered'];
  const currentStepIndex = steps.indexOf(dispatch.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigateTab?.('dispatch_list')}
          className={`flex items-center space-x-2 text-xs font-semibold ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          } transition`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispatches</span>
        </button>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Delivery Challan & Gate Pass</span>
          </button>

          {dispatch.status !== 'Delivered' && dispatch.status !== 'Cancelled' && (
            <>
              <button
                onClick={() => onEditDispatch ? onEditDispatch(dispatch.id) : onNavigateTab?.('dispatch_edit', { id: dispatch.id })}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Transport</span>
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Dispatch</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Header Card */}
      <div className={`p-6 rounded-xl border ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      } shadow-xs space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 font-mono">
                {dispatch.challanNumber}
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getStatusBadge(dispatch.status)}`}>
                {dispatch.status}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {dispatch.deliveryType || 'Full Delivery'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dispatched on {dispatch.dispatchDate} {dispatch.dispatchTime && `at ${dispatch.dispatchTime}`} • Gate Pass #{dispatch.gatePassNumber || `GP-${dispatch.challanNumber}`}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-6 text-xs">
            <div>
              <div className="text-slate-400">Total Quantity</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {dispatch.totalQuantity?.toLocaleString()} Pcs
              </div>
            </div>
            <div>
              <div className="text-slate-400">Bundles / Weight</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {dispatch.totalBundles || '-'} Bndl • {Number(dispatch.totalWeightKg || 0).toFixed(0)} Kg
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Tracker Bar (unless Cancelled) */}
        {dispatch.status !== 'Cancelled' ? (
          <div className="py-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Shipment Progress</div>
            <div className="flex items-center w-full">
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPassed
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[10px] mt-1 whitespace-nowrap ${
                        isCurrent ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded ${
                        currentStepIndex > idx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            <strong>Challan Cancelled:</strong> This shipment was cancelled and all stock was returned to Finished Goods inventory.
          </div>
        )}
      </div>

      {/* Grid of Key Info: Order & QA vs Transport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Order & QA Card */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-3`}>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-700">
            <Building className="w-4 h-4 text-blue-500" />
            <span>Customer & Sales Order Details</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{dispatch.customerName || dispatch.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sales Order No:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{dispatch.soNumber || dispatch.salesOrder?.soNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer PO No:</span>
              <span className="font-medium">{dispatch.customerPoNumber || dispatch.salesOrder?.customerPoNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Work Order Ref:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {dispatch.workOrder?.orderNumber || dispatch.salesOrder?.workOrders?.[0]?.orderNumber || 'Production Standard'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Quality Check Status:</span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                <span>FINAL QC APPROVED</span>
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 block mb-0.5">Shipping Destination:</span>
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed block">
                {dispatch.shippingAddress || dispatch.customer?.shippingAddress || 'Ex-Factory Delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* Transport & Gate Pass Details */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-3`}>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-700">
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>Transport & Regulatory Compliance</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle Number:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dispatch.vehicleNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transporter:</span>
              <span className="font-semibold">{dispatch.transporterName || 'Direct / Customer Fleet'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Driver Name & Phone:</span>
              <span>{dispatch.driverName || 'N/A'} {dispatch.driverPhone && `(${dispatch.driverPhone})`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">E-Way Bill Number:</span>
              <span className="font-mono font-medium">{dispatch.ewayBillNumber || 'N/A (Local / Below Threshold)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">L.R. Number & Date:</span>
              <span>{dispatch.lrNumber ? `${dispatch.lrNumber} (${dispatch.lrDate || dispatch.dispatchDate})` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Terms:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{dispatch.deliveryTerm || 'Ex-Factory'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gate Pass Signatory:</span>
              <span>{dispatch.verifiedBy || 'Gate Incharge'} (Dispatched by: {dispatch.dispatchedBy || 'Supervisor'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Items Table */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className={`px-5 py-3 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Dispatched Finished Goods Items
          </h3>
          <span className="text-xs text-slate-500 font-medium">Warehouse: {dispatch.warehouseName || 'Main FG Warehouse'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                darkMode ? 'border-slate-700 text-slate-400 bg-slate-800/40' : 'border-slate-200 text-slate-500 bg-slate-50/50'
              }`}>
                <th className="py-3 px-4">Item & Code</th>
                <th className="py-3 px-4">Bin / Batch</th>
                <th className="py-3 px-4 text-right">Ordered</th>
                <th className="py-3 px-4 text-right">Dispatched</th>
                <th className="py-3 px-4 text-center">Bundles</th>
                <th className="py-3 px-4 text-right">Weight (Kg)</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {items.map((it: any, idx: number) => {
                const qty = Number(it.dispatchedQuantity || it.quantity || 0);
                const rate = Number(it.rate || it.unitPrice || 0);
                const amt = Number(it.amount) || (qty * rate);
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {it.productName || 'Finished Goods Packaging'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {it.productCode || it.product?.code || 'FG-PKG'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <div>Bin: {it.binId || dispatch.binId || 'FG-BAY-1'}</div>
                      <div className="text-[10px] font-mono">{it.batchNumber || dispatch.batchNumber || 'Standard Lot'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {it.orderedQuantity || it.quantity || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {qty.toLocaleString()} {it.unit || 'Pcs'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      {it.bundlesCount || it.bundleCount || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {Number(it.totalWeightKg || it.weightKg || 0).toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {rate > 0 ? `₹${rate.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {amt > 0 ? `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`border-t font-bold ${
                darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs">Total:</td>
                <td className="py-3 px-4 text-right text-xs text-blue-600 dark:text-blue-400">
                  {dispatch.totalQuantity?.toLocaleString()} Pcs
                </td>
                <td className="py-3 px-4 text-center text-xs">{dispatch.totalBundles || '-'}</td>
                <td className="py-3 px-4 text-right text-xs">{Number(dispatch.totalWeightKg || 0).toFixed(1)} Kg</td>
                <td className="py-3 px-4 text-right text-xs">-</td>
                <td className="py-3 px-4 text-right text-xs font-mono">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Status Transition Control (if active) */}
      {dispatch.status !== 'Cancelled' && dispatch.status !== 'Delivered' && (
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-3`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Update Delivery Status
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedNewStatus}
              onChange={(e) => setSelectedNewStatus(e.target.value)}
              className={`p-2 rounded-lg text-xs border outline-none font-semibold ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="Ready for Dispatch">Ready for Dispatch</option>
              <option value="Loaded">Loaded</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>

            <input
              type="text"
              placeholder="Remarks for status update (e.g., Gate exited, Delivered to client store)..."
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
              className={`flex-1 p-2 rounded-lg text-xs border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />

            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus || selectedNewStatus === dispatch.status}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
            >
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      )}

      {/* Audit Log / Activity History Section */}
      <div className={`p-5 rounded-xl border ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      } shadow-xs space-y-3`}>
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-700">
          <History className="w-4 h-4 text-violet-500" />
          <span>Audit Log & Activity History</span>
        </div>

        {dispatch.auditLogs && dispatch.auditLogs.length > 0 ? (
          <div className="space-y-2.5">
            {dispatch.auditLogs.map((log: any) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  darkMode ? 'bg-slate-900/40 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                  <span className="text-slate-400 text-[11px] ml-2 font-mono">by {log.userName || log.userEmail || 'System'}</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-2">
            No audit history recorded yet.
          </div>
        )}
      </div>

      {/* Print Delivery Challan Modal */}
      {showPrintModal && (
        <DeliveryChallanPrintModal
          dispatch={dispatch}
          onClose={() => setShowPrintModal(false)}
          darkMode={darkMode}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md rounded-xl p-5 border shadow-xl ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold">Cancel Delivery Challan</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cancelling Challan <strong>#{dispatch.challanNumber}</strong> will immediately restock {dispatch.totalQuantity} units back to Finished Goods inventory and reverse the dispatched balance on Sales Order {dispatch.soNumber}.
            </p>

            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Specify reason for cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelDispatch}
                disabled={cancelling || !cancelReason.trim()}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {cancelling ? 'Cancelling & Restocking...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
