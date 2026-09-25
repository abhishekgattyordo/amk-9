'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Building,
  Printer,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { DeliveryChallanPrintModal } from './DeliveryChallanPrintModal';

interface DispatchCreatePageProps {
  darkMode: boolean;
  initialOrder?: any;
  onNavigateTab?: (tab: string, params?: any) => void;
  onDispatchCreated?: (dispatch: any) => void;
}

export const DispatchCreatePage: React.FC<DispatchCreatePageProps> = ({
  darkMode,
  initialOrder,
  onNavigateTab,
  onDispatchCreated,
}) => {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(initialOrder || null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdDispatch, setCreatedDispatch] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    dispatchDate: new Date().toISOString().split('T')[0],
    dispatchTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    transporterName: '',
    lrNumber: '',
    lrDate: new Date().toISOString().split('T')[0],
    ewayBillNumber: '',
    gatePassNumber: '',
    shippingAddress: '',
    deliveryTerm: 'Ex-Factory',
    paymentTerms: '30 Days Net',
    warehouseId: '',
    warehouseName: '',
    binId: 'FG-BAY-1',
    binCode: 'FG-BAY-1',
    batchNumber: '',
    dispatchedBy: 'Dispatch Supervisor',
    verifiedBy: 'Gate Security',
    remarks: '',
    inventoryUpdated: true,
    // Item dispatch fields
    dispatchedQuantity: 0,
    bundlesCount: 0,
    unitsPerBundle: 25,
    boxWeightKg: 0.45,
    totalWeightKg: 0,
    rate: 0,
    // Partial Delivery options
    partialAction: 'Keep Order Open' as 'Keep Order Open' | 'Close Order',
    shortCloseReason: '',
  });

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/dispatch/pending');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPendingOrders(data.data);
        if (!selectedOrder && data.data.length > 0) {
          handleSelectOrder(data.data[0]);
        } else if (selectedOrder) {
          // Sync with fresh data if matching order exists
          const matched = data.data.find((o: any) => o.id === selectedOrder.id);
          if (matched) handleSelectOrder(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load pending orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    const pendingQty = Number(order.quantityPending ?? order.quantity ?? 1000);
    const defaultRate = Number(order.unitPrice || 45);
    const defaultUnitsPerBundle = 25;
    const bundles = Math.ceil(pendingQty / defaultUnitsPerBundle);
    const weightPerBox = 0.45;
    const totalWeight = Math.round(pendingQty * weightPerBox);

    setFormData((prev) => ({
      ...prev,
      dispatchedQuantity: pendingQty,
      rate: defaultRate,
      unitsPerBundle: defaultUnitsPerBundle,
      bundlesCount: bundles,
      boxWeightKg: weightPerBox,
      totalWeightKg: totalWeight,
      shippingAddress: order.shippingAddress || order.customer?.address || '',
      paymentTerms: order.paymentTerms || '30 Days Net',
      warehouseId: order.warehouseId || '',
      warehouseName: order.warehouseName || order.warehouse?.name || 'Main FG Warehouse',
      batchNumber: order.productCode ? `LOT-${order.productCode.substring(0, 4)}-${new Date().getFullYear()}` : '',
      gatePassNumber: `GP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    }));
  };

  const handleQtyChange = (qty: number) => {
    const unitsPerBundle = formData.unitsPerBundle || 25;
    const bundles = Math.ceil(qty / (unitsPerBundle || 1));
    const totalWeight = Math.round(qty * (formData.boxWeightKg || 0.45));

    setFormData((prev) => ({
      ...prev,
      dispatchedQuantity: qty,
      bundlesCount: bundles,
      totalWeightKg: totalWeight,
    }));
  };

  const remainingOrderQty = Number(selectedOrder?.quantityPending || selectedOrder?.quantity || 0);
  const availableFgStock = Number(selectedOrder?.availableStock ?? 999999);
  const isFullDelivery = formData.dispatchedQuantity >= remainingOrderQty;
  const isQcApproved = selectedOrder ? Boolean(selectedOrder.hasApprovedQc) : false;
  const hasSufficientStock = formData.dispatchedQuantity <= availableFgStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      setErrorMessage('Please select a valid Sales Order.');
      return;
    }

    if (!isQcApproved) {
      setErrorMessage('Cannot create dispatch: Final QC has not been approved for this order. Only QC Approved goods can be dispatched.');
      return;
    }

    if (!hasSufficientStock) {
      setErrorMessage(`Cannot create dispatch: Requested quantity (${formData.dispatchedQuantity}) exceeds available finished goods stock (${availableFgStock}).`);
      return;
    }

    if (formData.dispatchedQuantity <= 0) {
      setErrorMessage('Dispatch quantity must be greater than zero.');
      return;
    }

    if (formData.dispatchedQuantity > remainingOrderQty) {
      setErrorMessage(`Dispatch quantity cannot exceed the remaining pending order quantity (${remainingOrderQty}).`);
      return;
    }

    if (!formData.vehicleNumber.trim()) {
      setErrorMessage('Vehicle Number is strictly required for Delivery Challan & Gate Pass compliance.');
      return;
    }

    if (!isFullDelivery && formData.partialAction === 'Close Order' && !formData.shortCloseReason.trim()) {
      setErrorMessage('Please provide a reason for short-closing the remaining order quantity.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        salesOrderId: selectedOrder.id,
        soNumber: selectedOrder.soNumber,
        workOrderId: selectedOrder.workOrderId || selectedOrder.workOrders?.[0]?.id || null,
        qualityCheckId: selectedOrder.qualityCheckId || selectedOrder.qualityChecks?.[0]?.id || null,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        customerPoNumber: selectedOrder.customerPoNumber,
        dispatchDate: formData.dispatchDate,
        dispatchTime: formData.dispatchTime,
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        driverName: formData.driverName?.trim() || null,
        driverPhone: formData.driverPhone?.trim() || null,
        transporterName: formData.transporterName?.trim() || null,
        lrNumber: formData.lrNumber?.trim() || null,
        lrDate: formData.lrDate || null,
        ewayBillNumber: formData.ewayBillNumber?.trim() || null,
        gatePassNumber: formData.gatePassNumber?.trim() || null,
        shippingAddress: formData.shippingAddress?.trim() || null,
        deliveryTerm: formData.deliveryTerm,
        paymentTerms: formData.paymentTerms,
        warehouseId: formData.warehouseId || selectedOrder.warehouseId || null,
        warehouseName: formData.warehouseName || null,
        binId: formData.binId || null,
        batchNumber: formData.batchNumber || null,
        deliveryType: isFullDelivery ? 'Full Delivery' : 'Partial Delivery',
        partialAction: isFullDelivery ? null : formData.partialAction,
        shortCloseReason: (!isFullDelivery && formData.partialAction === 'Close Order') ? formData.shortCloseReason : null,
        status: 'Dispatched',
        totalQuantity: Number(formData.dispatchedQuantity),
        totalBundles: Number(formData.bundlesCount),
        totalWeightKg: Number(formData.totalWeightKg),
        dispatchedBy: formData.dispatchedBy,
        verifiedBy: formData.verifiedBy,
        remarks: formData.remarks,
        inventoryUpdated: formData.inventoryUpdated,
        items: [
          {
            productId: selectedOrder.productId,
            productCode: selectedOrder.productCode || selectedOrder.product?.code || 'FG-BOX',
            productName: selectedOrder.productName || 'Finished Goods Packaging',
            orderedQuantity: Number(selectedOrder.quantity),
            dispatchedQuantity: Number(formData.dispatchedQuantity),
            unit: 'Pcs',
            bundlesCount: Number(formData.bundlesCount),
            unitsPerBundle: Number(formData.unitsPerBundle),
            boxWeightKg: Number(formData.boxWeightKg),
            totalWeightKg: Number(formData.totalWeightKg),
            rate: Number(formData.rate),
            amount: Number(formData.dispatchedQuantity) * Number(formData.rate),
            warehouseId: formData.warehouseId || selectedOrder.warehouseId || null,
            binId: formData.binId || null,
            binCode: formData.binCode || null,
            batchNumber: formData.batchNumber || null,
            remarks: formData.remarks || null,
          },
        ],
      };

      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create delivery challan');
      }

      setCreatedDispatch(result.data);
      onDispatchCreated?.(result.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating the delivery challan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Return Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigateTab?.('dispatch_list')}
          className={`flex items-center space-x-2 text-xs font-semibold ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          } transition`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispatches</span>
        </button>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          GST Rule 55 • Delivery Challan & Gate Pass
        </span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Generate Delivery Challan
        </h1>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Select an eligible QC-approved Sales Order, verify stock allocation, enter transport details, and record dispatch.
        </p>
      </div>

      {/* Success Notification Banner */}
      {createdDispatch && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Delivery Challan {createdDispatch.challanNumber} Created Successfully!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Stock deducted from finished goods inventory. Sales Order status updated to {createdDispatch.deliveryType}.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigateTab?.('dispatch_view', { id: createdDispatch.id })}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              View Details
            </button>
            <button
              onClick={() => onNavigateTab?.('dispatch_list')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-medium border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
            >
              Dispatch List
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Sales Order */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-4`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700/80">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Order & Quality Verification
              </h3>
            </div>
            {selectedOrder && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                isQcApproved
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
              }`}>
                {isQcApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{isQcApproved ? 'QC Approved' : 'QC Pending (Blocking)'}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Sales Order <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedOrder?.id || ''}
                onChange={(e) => {
                  const ord = pendingOrders.find((o) => o.id === e.target.value);
                  if (ord) handleSelectOrder(ord);
                }}
                disabled={loadingOrders}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono font-medium ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {pendingOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.soNumber} • {o.customerName} • {o.quantityPending} Pcs Pending {o.hasApprovedQc ? '(QC OK)' : '(QC Req)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Associated Work Order & QC Ref
              </label>
              <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span>{selectedOrder?.workOrders?.[0]?.orderNumber || selectedOrder?.woNumber || 'Direct Production'}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedOrder?.qualityChecks?.[0]?.qcNumber || 'QC Passed'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Order Details Card */}
          {selectedOrder && (
            <div className={`p-4 rounded-lg border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ${
              darkMode ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div>
                <span className="text-slate-500 block text-[11px]">Customer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Product:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {selectedOrder.productName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{selectedOrder.productCode || 'FG-BOX'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ordered / Pending:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedOrder.quantity} / <span className="text-amber-600">{remainingOrderQty} Pcs</span>
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Finished Goods Stock:</span>
                <span className={`font-bold ${hasSufficientStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {availableFgStock.toLocaleString()} Pcs Available
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Dispatch Quantities & Delivery Type */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-4`}>
          <div className="flex items-center space-x-2.5 border-b pb-3 border-slate-100 dark:border-slate-700/80">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Quantity, Packaging & Partial Delivery Options
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dispatched Quantity (Pcs) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={remainingOrderQty}
                value={formData.dispatchedQuantity || ''}
                onChange={(e) => handleQtyChange(Number(e.target.value))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-bold text-slate-900 dark:text-white ${
                  darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <span className="text-[11px] text-slate-500">Max allowed: {remainingOrderQty} Pcs</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pcs Per Bundle
              </label>
              <input
                type="number"
                min="1"
                value={formData.unitsPerBundle}
                onChange={(e) => {
                  const val = Number(e.target.value) || 25;
                  setFormData((prev) => ({
                    ...prev,
                    unitsPerBundle: val,
                    bundlesCount: Math.ceil(prev.dispatchedQuantity / val),
                  }));
                }}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Calculated Bundles & Total Wt
              </label>
              <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between font-semibold ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <span>{formData.bundlesCount} Bundles</span>
                <span className="text-blue-600 dark:text-blue-400">{formData.totalWeightKg} Kg</span>
              </div>
            </div>
          </div>

          {/* Delivery Type Indicator */}
          <div className={`p-3 rounded-lg border ${
            isFullDelivery
              ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
              : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className={`w-4 h-4 ${isFullDelivery ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Delivery Mode: {isFullDelivery ? 'Full Delivery (Order will be Dispatched)' : 'Partial Delivery (Split Shipment)'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                isFullDelivery ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isFullDelivery ? '100% Fulfilled' : `${remainingOrderQty - formData.dispatchedQuantity} Pcs Remaining`}
              </span>
            </div>

            {/* If Partial Delivery: Choice of Action for remaining balance */}
            {!isFullDelivery && (
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900 space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Action for Remaining {remainingOrderQty - formData.dispatchedQuantity} Units:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-2.5 rounded-lg border flex items-center space-x-3 cursor-pointer transition ${
                    formData.partialAction === 'Keep Order Open'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="partialAction"
                      value="Keep Order Open"
                      checked={formData.partialAction === 'Keep Order Open'}
                      onChange={() => setFormData((prev) => ({ ...prev, partialAction: 'Keep Order Open' }))}
                    />
                    <div>
                      <div className="text-xs">Keep Order Open</div>
                      <div className="text-[10px] text-slate-500 font-normal">Allows subsequent dispatches for remaining units.</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center space-x-3 cursor-pointer transition ${
                    formData.partialAction === 'Close Order'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="partialAction"
                      value="Close Order"
                      checked={formData.partialAction === 'Close Order'}
                      onChange={() => setFormData((prev) => ({ ...prev, partialAction: 'Close Order' }))}
                    />
                    <div>
                      <div className="text-xs">Close Order (Short-Close)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Zero out pending balance and finalize Sales Order.</div>
                    </div>
                  </label>
                </div>

                {formData.partialAction === 'Close Order' && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      Reason for Short-Closing Order <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Customer requested partial cancellation, production completed early"
                      value={formData.shortCloseReason}
                      onChange={(e) => setFormData((prev) => ({ ...prev, shortCloseReason: e.target.value }))}
                      className={`w-full p-2 text-xs rounded-lg border outline-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Transport & Vehicle Information */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-4`}>
          <div className="flex items-center space-x-2.5 border-b pb-3 border-slate-100 dark:border-slate-700/80">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Transport, Logistics & Regulatory Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="MH-04-AB-1234"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono uppercase font-semibold ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Transporter Name
              </label>
              <input
                type="text"
                placeholder="V-Trans, ARC, or Self"
                value={formData.transporterName}
                onChange={(e) => setFormData((prev) => ({ ...prev, transporterName: e.target.value }))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Driver Name & Mobile
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Driver Name"
                  value={formData.driverName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, driverName: e.target.value }))}
                  className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Phone No"
                  value={formData.driverPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, driverPhone: e.target.value }))}
                  className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                E-Way Bill Number
              </label>
              <input
                type="text"
                placeholder="12-digit E-Way Bill Number"
                value={formData.ewayBillNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, ewayBillNumber: e.target.value }))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                L.R. / Bilty Number
              </label>
              <input
                type="text"
                placeholder="LR-89304"
                value={formData.lrNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, lrNumber: e.target.value }))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Delivery Terms
              </label>
              <select
                value={formData.deliveryTerm}
                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryTerm: e.target.value }))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Ex-Factory">Ex-Factory</option>
                <option value="Door Delivery">Door Delivery (FOR Destination)</option>
                <option value="FOB Port">FOB Port</option>
                <option value="CIF">CIF (Cost, Insurance & Freight)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Shipping / Delivery Destination Address
            </label>
            <input
              type="text"
              placeholder="Delivery destination address"
              value={formData.shippingAddress}
              onChange={(e) => setFormData((prev) => ({ ...prev, shippingAddress: e.target.value }))}
              className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Step 4: Storage Bin & Verification Signatures */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-4`}>
          <div className="flex items-center space-x-2.5 border-b pb-3 border-slate-100 dark:border-slate-700/80">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">4</span>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Finished Goods Allocation & Signoff
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Warehouse / Bin
              </label>
              <input
                type="text"
                value={formData.binId}
                onChange={(e) => setFormData((prev) => ({ ...prev, binId: e.target.value, binCode: e.target.value }))}
                placeholder="FG-BAY-1"
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Batch / Lot Number
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="LOT-2026-042"
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dispatched By
              </label>
              <input
                type="text"
                value={formData.dispatchedBy}
                onChange={(e) => setFormData((prev) => ({ ...prev, dispatchedBy: e.target.value }))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gate Security Verified By
              </label>
              <input
                type="text"
                value={formData.verifiedBy}
                onChange={(e) => setFormData((prev) => ({ ...prev, verifiedBy: e.target.value }))}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Remarks / Gate Pass Instructions
            </label>
            <input
              type="text"
              placeholder="e.g., Fragile corrugated boxes, handle with clamps, strap carefully"
              value={formData.remarks}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
              className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onNavigateTab?.('dispatch_list')}
            className="px-4 py-2.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={submitting || !isQcApproved || !hasSufficientStock}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white transition shadow-sm ${
                isQcApproved && hasSufficientStock && !submitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{submitting ? 'Generating Delivery Challan...' : 'Confirm & Generate Delivery Challan'}</span>
            </button>
          </div>
        </div>
      </form>

      {createdDispatch && (
        <DeliveryChallanPrintModal
          dispatch={createdDispatch}
          onClose={() => setCreatedDispatch(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
