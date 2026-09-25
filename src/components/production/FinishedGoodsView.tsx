import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Box,
  Truck,
  CheckCircle2,
  Clock,
  Warehouse as WarehouseIcon,
  ShieldCheck,
  ArrowRight,
  Archive,
  Eye,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Product, Warehouse } from '../../types';

interface FinishedGoodsViewProps {
  darkMode: boolean;
  warehouses?: Warehouse[];
  products?: Product[];
  onNavigateToDispatch?: (orderId?: string) => void;
  onNavigateToOrder?: (orderId: string) => void;
}

export const FinishedGoodsView: React.FC<FinishedGoodsViewProps> = ({
  darkMode,
  warehouses = [],
  products = [],
  onNavigateToDispatch,
  onNavigateToOrder,
}) => {
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qcStatusFilter, setQcStatusFilter] = useState('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('All');

  // Receive FG Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState<number>(0);
  const [receiveBatchNumber, setReceiveBatchNumber] = useState('');
  const [receiveRemarks, setReceiveRemarks] = useState('');
  const [receiving, setReceiving] = useState(false);

  const fetchProductionOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production/orders?limit=100');
      const data = await res.json();
      if (data.success) {
        setProductionOrders(data.data?.productionOrders || data.data || []);
      }
    } catch (err) {
      console.error('Error fetching production orders for FG:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  const openReceiveModal = (po: any) => {
    setSelectedPo(po);
    const produced = po.actualQuantity || po.plannedQuantity || 0;
    setReceiveQuantity(produced);
    setReceiveBatchNumber(`BATCH-FG-${po.orderNumber}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`);
    setReceiveWarehouseId(warehouses[0]?.id || '');
    setReceiveRemarks(`Completed batch transferred from Production Line to FG Warehouse`);
    setShowReceiveModal(true);
  };

  const handleConfirmReceiveFg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;

    try {
      setReceiving(true);
      const res = await fetch(`/api/production/orders/${selectedPo.id}/receive-fg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: receiveWarehouseId,
          quantity: receiveQuantity,
          batchNumber: receiveBatchNumber,
          remarks: receiveRemarks,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to receive Finished Goods');

      alert(`Successfully received ${receiveQuantity} units into Finished Goods Godown!`);
      setShowReceiveModal(false);
      fetchProductionOrders();
    } catch (err: any) {
      alert(err.message || 'Error receiving finished goods');
    } finally {
      setReceiving(false);
    }
  };

  // Filter FG orders (Orders that have completed or have actual quantity)
  const fgBatches = productionOrders.filter((po) => {
    // Only orders that have produced output or are completed / QC approved
    const hasProduced = (po.actualQuantity && po.actualQuantity > 0) || po.status === 'Completed' || po.status === 'QC Approved' || po.status === 'Partially Completed';
    if (!hasProduced) return false;

    if (qcStatusFilter !== 'All') {
      const isApproved = po.status === 'QC Approved' || po.status === 'Completed';
      if (qcStatusFilter === 'Passed' && !isApproved) return false;
      if (qcStatusFilter === 'Pending' && isApproved) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchOrder = po.orderNumber?.toLowerCase().includes(q);
      const matchProd = po.product?.name?.toLowerCase().includes(q) || po.product?.code?.toLowerCase().includes(q);
      const matchCustomer = po.salesOrder?.customer?.name?.toLowerCase().includes(q);
      if (!matchOrder && !matchProd && !matchCustomer) return false;
    }

    return true;
  });

  const totalFgProduced = fgBatches.reduce((acc, b) => acc + (b.actualQuantity || 0), 0);
  const totalFgApproved = fgBatches.filter((b) => b.status === 'QC Approved' || b.status === 'Completed').reduce((acc, b) => acc + (b.actualQuantity || 0), 0);
  const totalBatches = fgBatches.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Finished Goods (FG) Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store verification, Final QC clearance, Godown receipt, and dispatch staging for completed box batches.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchProductionOrders}
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total FG Produced</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {totalFgProduced.toLocaleString()} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{totalBatches} Production Batches</p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">QC Cleared & Staged</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className={`text-2xl font-black mt-2 text-emerald-500`}>
            {totalFgApproved.toLocaleString()} <span className="text-xs font-normal text-slate-400">Pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for Dispatch / Delivery Challan</p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">FG Godown Capacity</span>
            <WarehouseIcon className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {warehouses.length > 0 ? `${warehouses.length} Active Warehouses` : 'Godown 1 & 2'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct inventory sync enabled</p>
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
              placeholder="Search by order #, product, or customer..."
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

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-400 mr-1">QC Status:</span>
            {['All', 'Passed', 'Pending'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setQcStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  qcStatusFilter === status
                    ? 'bg-emerald-600 text-white'
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
      </div>

      {/* FG Batches Table */}
      <div
        className={`rounded-xl border overflow-hidden shadow-xs ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b ${
                  darkMode ? 'border-slate-800 bg-slate-800/50 text-slate-300' : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <th className="py-3 px-4 font-bold">Production Order #</th>
                <th className="py-3 px-4 font-bold">Product Name & Code</th>
                <th className="py-3 px-4 font-bold">Customer / Sales Order</th>
                <th className="py-3 px-4 font-bold text-right">Produced Quantity</th>
                <th className="py-3 px-4 font-bold text-center">Final QC Status</th>
                <th className="py-3 px-4 font-bold text-center">FG Receipt Status</th>
                <th className="py-3 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              {fgBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No Finished Goods batches available currently. Complete a production order to generate FG receipts.
                  </td>
                </tr>
              ) : (
                fgBatches.map((po) => {
                  const isQcApproved = po.status === 'QC Approved' || po.status === 'Completed';
                  const isReceivedInFg = po.status === 'Completed';
                  return (
                    <tr
                      key={po.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-500">
                        {po.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {po.product?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {po.product?.code} • {po.product?.boxType || 'Corrugated Box'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {po.salesOrder?.customer?.name || 'Stock Build'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {po.salesOrder?.soNumber || 'SO-N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {(po.actualQuantity || po.plannedQuantity)?.toLocaleString()} {po.product?.unit || 'Pcs'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Target: {po.plannedQuantity?.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isQcApproved
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{isQcApproved ? 'QC Passed' : 'QC Pending'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReceivedInFg
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          {isReceivedInFg ? 'Received in Godown' : 'Floor Staged'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {!isReceivedInFg && (
                            <button
                              type="button"
                              onClick={() => openReceiveModal(po)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                            >
                              Receive to Godown
                            </button>
                          )}
                          {isReceivedInFg && onNavigateToDispatch && (
                            <button
                              type="button"
                              onClick={() => onNavigateToDispatch(po.id)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}
                          {onNavigateToOrder && (
                            <button
                              type="button"
                              onClick={() => onNavigateToOrder(po.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title="View Production Order"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* RECEIVE FG MODAL */}
      {showReceiveModal && selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold">Receive Finished Goods to Godown</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceiveFg} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order:</span>
                  <span className="font-mono font-bold text-emerald-500">{selectedPo.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Product:</span>
                  <span className="font-semibold">{selectedPo.product?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-semibold">{selectedPo.salesOrder?.customer?.name || 'Internal Stock'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Destination Finished Goods Warehouse *</label>
                <select
                  required
                  value={receiveWarehouseId}
                  onChange={(e) => setReceiveWarehouseId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code || w.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Batch Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={receiveBatchNumber}
                    onChange={(e) => setReceiveBatchNumber(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Received Quantity (Pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Remarks / Quality Certificate</label>
                <textarea
                  rows={2}
                  value={receiveRemarks}
                  onChange={(e) => setReceiveRemarks(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receiving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  {receiving ? 'Processing...' : 'Confirm FG Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
