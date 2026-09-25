import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  User,
  Zap,
  Info,
  Building2,
  Package,
  Calendar,
  Clock,
  Warehouse as WarehouseIcon,
  ShieldAlert,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Product, Warehouse } from '../../types';

interface CreateProductionOrderViewProps {
  darkMode: boolean;
  onBack: () => void;
  onSuccess: (newOrderId?: string) => void;
  products?: Product[];
  warehouses?: Warehouse[];
}

export const CreateProductionOrderView: React.FC<CreateProductionOrderViewProps> = ({
  darkMode,
  onBack,
  onSuccess,
  products = [],
  warehouses = [],
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // Form State
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [plannedQuantity, setPlannedQuantity] = useState<number>(1000);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [shift, setShift] = useState('Shift A (Day)');
  const [machineLine, setMachineLine] = useState('Corrugator Line 1 (5-Ply)');
  const [supervisor, setSupervisor] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [batchNumber, setBatchNumber] = useState(`BATCH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
  const [remarks, setRemarks] = useState('');

  // Selected WO details
  const [selectedWoDetails, setSelectedWoDetails] = useState<{
    orderNumber: string;
    orderedQty: number;
    producedQty: number;
    remainingQty: number;
    productName: string;
    productSku?: string;
    soNumber?: string;
    customerName?: string;
    bomName?: string;
    productId?: string;
    bomId?: string;
  } | null>(null);

  const allAvailableProcesses = [
    'Paper Cutting',
    'Corrugation',
    'Printing & Slotting',
    'Die-Cutting & Pasting',
    'Punching & Scoring',
    'Stitching & Strapping',
    'Folder Gluer',
    'Final QC',
    'Palletizing & Bundling'
  ];

  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([
    'Paper Cutting',
    'Corrugation',
    'Printing & Slotting',
    'Die-Cutting & Pasting',
    'Punching & Scoring',
    'Stitching & Strapping',
    'Folder Gluer',
    'Final QC',
  ]);

  // Fetch Work Orders
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await fetch('/api/production/work-orders');
        const data = await res.json();
        if (data.success) {
          const list = data.data?.workOrders || data.data || [];
          setWorkOrders(list.filter((wo: any) => wo.status !== 'Completed'));
        }
      } catch (err) {
        console.error('Error fetching work orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchWorkOrders();
  }, []);

  // Initialize warehouse defaults
  useEffect(() => {
    if (warehouses && warehouses.length > 0) {
      if (!sourceWarehouseId) {
        const rawStore = warehouses.find(w => w.name.toLowerCase().includes('raw') || w.name.toLowerCase().includes('godown 1')) || warehouses[0];
        setSourceWarehouseId(rawStore.id);
      }
      if (!destWarehouseId) {
        const prodStore = warehouses.find(w => w.name.toLowerCase().includes('production') || w.name.toLowerCase().includes('floor') || w.name.toLowerCase().includes('godown 2')) || warehouses[warehouses.length > 1 ? 1 : 0];
        setDestWarehouseId(prodStore.id);
      }
    }
  }, [warehouses]);

  const handleWorkOrderSelect = (woId: string) => {
    setSelectedWorkOrderId(woId);
    if (!woId) {
      setSelectedWoDetails(null);
      return;
    }
    const wo = workOrders.find((w) => w.id === woId);
    if (wo) {
      const ordered = wo.orderedQuantity || wo.quantity || 0;
      const produced = wo.producedQuantity || 0;
      const remaining = Math.max(0, ordered - produced);

      setSelectedWoDetails({
        orderNumber: wo.orderNumber || wo.woNumber || 'WO-1001',
        orderedQty: ordered,
        producedQty: produced,
        remainingQty: remaining,
        productName: wo.product?.name || wo.productName || 'Corrugated Box',
        productSku: wo.product?.sku || wo.productCode || 'BOX-CORR',
        soNumber: wo.salesOrder?.soNumber || wo.soNumber,
        customerName: wo.salesOrder?.customer?.name || wo.customerName || 'General Client',
        bomName: wo.bom?.name || 'Standard 5-Ply BOM',
        productId: wo.productId,
        bomId: wo.bomId,
      });

      setPlannedQuantity(remaining > 0 ? remaining : ordered > 0 ? ordered : 1000);
      if (wo.supervisor) setSupervisor(wo.supervisor);
      if (wo.targetCompletionDate) setTargetDate(wo.targetCompletionDate.split('T')[0]);
    }
  };

  const handleProcessToggle = (processName: string) => {
    if (selectedProcesses.includes(processName)) {
      if (selectedProcesses.length <= 1) return;
      setSelectedProcesses(selectedProcesses.filter((p) => p !== processName));
    } else {
      setSelectedProcesses([...selectedProcesses, processName]);
    }
  };

  const applyProcessPreset = (preset: 'all' | 'printing_diecut' | 'basic_corrugation') => {
    if (preset === 'all') {
      setSelectedProcesses([...allAvailableProcesses]);
    } else if (preset === 'printing_diecut') {
      setSelectedProcesses(['Paper Cutting', 'Corrugation', 'Printing & Slotting', 'Die-Cutting & Pasting', 'Final QC']);
    } else if (preset === 'basic_corrugation') {
      setSelectedProcesses(['Paper Cutting', 'Corrugation', 'Punching & Scoring', 'Stitching & Strapping', 'Final QC']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrderId) {
      alert('Please select an active Work Order');
      return;
    }

    const wo = workOrders.find((w) => w.id === selectedWorkOrderId);
    if (!wo) {
      alert('Selected Work Order not found');
      return;
    }

    if (!plannedQuantity || plannedQuantity <= 0) {
      alert('Please enter a valid planned output quantity');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/production/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: selectedWorkOrderId,
          salesOrderId: wo.salesOrderId || undefined,
          productId: wo.productId,
          bomId: wo.bomId || undefined,
          plannedQuantity: Number(plannedQuantity),
          productionDate,
          targetCompletionDate: targetDate,
          shift,
          machineLine,
          supervisor: supervisor || 'Shift Supervisor',
          priority,
          sourceWarehouseId: sourceWarehouseId || undefined,
          destWarehouseId: destWarehouseId || undefined,
          batchNumber,
          remarks,
          processNames: selectedProcesses,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create Production Order');
      }

      onSuccess(data.data?.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create Production Order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Production Orders & WIP</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Create New Production Order
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Initialize shop-floor WIP routing, stage-by-stage QC steps, batch assignment, and material reservation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Creating Order...' : 'Create & Initialize Order'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Form Details - 2 Columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Work Order Link */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>1. Select Source Work Order</span>
              </h2>
              <span className="text-[11px] font-medium text-slate-400">
                {loadingOrders ? 'Loading work orders...' : `${workOrders.length} active work orders available`}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Work Order *
                </label>
                <select
                  required
                  value={selectedWorkOrderId}
                  onChange={(e) => handleWorkOrderSelect(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option value="">-- Choose active Work Order --</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.orderNumber || wo.woNumber} — {wo.product?.name || wo.productName} ({wo.orderedQuantity} units) {wo.salesOrder ? `[SO: ${wo.salesOrder.soNumber}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWoDetails ? (
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-900/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs text-blue-950 dark:text-blue-200">
                        {selectedWoDetails.productName}
                      </span>
                      {selectedWoDetails.productSku && (
                        <span className="text-[10px] text-slate-500 font-mono">({selectedWoDetails.productSku})</span>
                      )}
                    </div>
                    {selectedWoDetails.soNumber && (
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                        SO: {selectedWoDetails.soNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-blue-100'}`}>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Total WO Qty</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedWoDetails.orderedQty.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-blue-100'}`}>
                      <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Produced So Far</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {selectedWoDetails.producedQty.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-blue-100'}`}>
                      <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Remaining Balance</div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {selectedWoDetails.remainingQty.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-blue-200/50 dark:border-blue-900/40">
                    <span>Customer: <strong className="text-slate-900 dark:text-slate-200">{selectedWoDetails.customerName}</strong></span>
                    <span>BOM Spec: <strong className="text-slate-900 dark:text-slate-200">{selectedWoDetails.bomName}</strong></span>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border border-dashed text-center ${darkMode ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50/70 text-slate-500'}`}>
                  <Info className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <p className="text-xs">Select a Work Order to load product specifications, remaining batch demand, and customer requirements.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Floor Run & Schedule Targets */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>2. Production Targets & Line Schedule</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Planned Quantity (Units / Boxes) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={plannedQuantity}
                    onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden font-bold ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                  {selectedWoDetails && selectedWoDetails.remainingQty > 0 && (
                    <button
                      type="button"
                      onClick={() => setPlannedQuantity(selectedWoDetails.remainingQty)}
                      className="absolute right-2 top-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/60"
                    >
                      Fill Remaining ({selectedWoDetails.remainingQty})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Production Run Date *
                </label>
                <input
                  type="date"
                  required
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Shift *
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option value="Shift A (Day)">Shift A (Day: 06:00 - 14:00)</option>
                  <option value="Shift B (Evening)">Shift B (Evening: 14:00 - 22:00)</option>
                  <option value="Shift C (Night)">Shift C (Night: 22:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Manufacturing Line / Station *
                </label>
                <select
                  value={machineLine}
                  onChange={(e) => setMachineLine(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option value="Corrugator Line 1 (5-Ply)">Corrugator Line 1 (5-Ply Heavy Duty)</option>
                  <option value="Corrugator Line 2 (3-Ply)">Corrugator Line 2 (3-Ply High Speed)</option>
                  <option value="Converting Line A">Converting Line A (Rotary Slotter & 4-Color Flexo)</option>
                  <option value="Converting Line B">Converting Line B (Auto Folder Gluer)</option>
                  <option value="Die Cutter Line 1">Die Cutter Line 1 (Platen Punching)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Floor Supervisor / Incharge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar / Shift Lead"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Batch Number
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden font-mono ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Sequential Process Selection */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-purple-500" />
                  <span>3. Sequential Shop-Floor Process Routing</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Each selected process automatically initializes WIP stage tracking and QC checklists.
                </p>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyProcessPreset('all')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-md border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  All 8 Stages
                </button>
                <button
                  type="button"
                  onClick={() => applyProcessPreset('printing_diecut')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-md border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Printed Die-Cut
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allAvailableProcesses.map((proc, idx) => {
                const isSelected = selectedProcesses.includes(proc);
                return (
                  <button
                    type="button"
                    key={proc}
                    onClick={() => handleProcessToggle(proc)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-200 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{proc}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Godown Routing & Location Transfer */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <WarehouseIcon className="w-4 h-4 text-indigo-500" />
              <span>4. Warehouse & Godown Routing</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Source Raw Material Godown
                </label>
                <select
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option value="">-- Choose Raw Material Store --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Production / Staging Godown
                </label>
                <select
                  value={destWarehouseId}
                  onChange={(e) => setDestWarehouseId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option value="">-- Choose WIP / Staging Floor --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary, Priority, Quality Instructions, Submit Actions */}
        <div className="space-y-6">
          {/* Priority & Quick Status Card */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Order Configuration</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Order Dispatch Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        priority === p
                          ? p === 'Urgent'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : p === 'High'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Special Quality & Floor Remarks
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Target 3-color flexo print, moisture < 8%, bursting strength test mandatory before palletizing."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Order Routing Summary
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Active Stages:</span>
                <strong className="text-slate-900 dark:text-white font-mono">{selectedProcesses.length} stages</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Target Units:</span>
                <strong className="text-slate-900 dark:text-white font-mono">{plannedQuantity.toLocaleString()} boxes</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Assigned Line:</span>
                <span className="text-slate-900 dark:text-white font-medium truncate max-w-[140px]">{machineLine}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Creating Order...' : 'Create & Initialize Stages'}</span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className={`w-full py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancel / Return to List
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
