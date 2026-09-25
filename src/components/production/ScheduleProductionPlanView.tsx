import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
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
  Activity,
  Cpu
} from 'lucide-react';

interface ScheduleProductionPlanViewProps {
  darkMode: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

export const ScheduleProductionPlanView: React.FC<ScheduleProductionPlanViewProps> = ({
  darkMode,
  onBack,
  onSuccess,
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // Form Fields
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('Shift A (Day)');
  const [line, setLine] = useState('Corrugator Line 1 (5-Ply)');
  const [targetQuantity, setTargetQuantity] = useState<number>(5000);
  const [scheduledHours, setScheduledHours] = useState<number>(8);
  const [supervisor, setSupervisor] = useState('Shift Lead');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [notes, setNotes] = useState('');

  // Selected Work Order Breakdown Details
  const [selectedWoDetails, setSelectedWoDetails] = useState<{
    orderedQty: number;
    producedQty: number;
    remainingQty: number;
    productName: string;
    productSku?: string;
    soNumber: string;
    customerName?: string;
    targetDate?: string;
  } | null>(null);

  const availableProcesses = [
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
        orderedQty: ordered,
        producedQty: produced,
        remainingQty: remaining,
        productName: wo.product?.name || wo.productName || 'Corrugated Box',
        productSku: wo.product?.sku || wo.productCode || 'BOX-CORR',
        soNumber: wo.salesOrder?.soNumber || wo.soNumber || 'SO-10024',
        customerName: wo.salesOrder?.customer?.name || wo.customerName || 'General Client',
        targetDate: wo.targetCompletionDate || wo.dueDate || '2026-09-30',
      });

      setTargetQuantity(remaining > 0 ? remaining : 5000);
      if (wo.supervisor) setSupervisor(wo.supervisor);
      if (wo.priority) setPriority(wo.priority);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetQuantity || targetQuantity <= 0) {
      alert('Please enter a valid target output quantity');
      return;
    }

    try {
      setSaving(true);
      const selectedWo = workOrders.find((w) => w.id === selectedWorkOrderId);

      const res = await fetch('/api/production/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: selectedWorkOrderId || undefined,
          salesOrderId: selectedWo?.salesOrderId || undefined,
          productId: selectedWo?.productId || undefined,
          planDate,
          shift,
          line,
          targetQuantity: Number(targetQuantity),
          scheduledHours: Number(scheduledHours),
          supervisor,
          priority,
          notes,
          processes: selectedProcesses,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to schedule production plan');
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error scheduling production plan');
    } finally {
      setSaving(false);
    }
  };

  const speedPerHour = scheduledHours > 0 ? Math.round(targetQuantity / scheduledHours) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shift Scheduling & Plans</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>Schedule Production Plan</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Allocate sales order demand, determine shift targets, configure machine lines, and set supervisor dispatch instructions.
          </p>
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
            <span>{saving ? 'Scheduling Plan...' : 'Save Production Plan'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Demand & Work Order Link */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>1. Work Order & Sales Order Link</span>
              </h2>
              <span className="text-[11px] font-medium text-slate-400">
                {workOrders.length} active work orders available
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Work Order (Auto-calculates remaining balance)
                </label>
                <select
                  value={selectedWorkOrderId}
                  onChange={(e) => handleWorkOrderSelect(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <option value="">-- Manual Standalone Schedule (No Work Order Link) --</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.woNumber} — {wo.product?.name || wo.productName || 'Corrugated Box'} (Remaining: {((wo.orderedQuantity || wo.quantity || 0) - (wo.producedQuantity || 0)).toLocaleString()} units)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecting a Work Order automatically links customer specs, Sales Order numbers, and remaining unproduced quantity.
                </p>
              </div>

              {/* Order Breakdown Banner */}
              {selectedWoDetails ? (
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-900/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs text-blue-950 dark:text-blue-200">
                        {selectedWoDetails.productName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                      SO: {selectedWoDetails.soNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-blue-100'}`}>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Total Ordered</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedWoDetails.orderedQty.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-blue-100'}`}>
                      <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Produced Qty</div>
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

                  {selectedWoDetails.customerName && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      <span>Customer: <strong className="text-slate-900 dark:text-slate-200">{selectedWoDetails.customerName}</strong></span>
                      <span>Target Delivery: <strong className="text-slate-900 dark:text-slate-200">{selectedWoDetails.targetDate}</strong></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-4 rounded-xl border border-dashed text-center ${darkMode ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50/70 text-slate-500'}`}>
                  <Info className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <p className="text-xs">No work order selected. Standalone shift schedule will be generated.</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Shift & Machine Line Setup */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>2. Shift & Line Target Scheduling</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Plan Date *
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={planDate}
                    onChange={(e) => setPlanDate(e.target.value)}
                    className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setPlanDate(new Date().toISOString().split('T')[0])}
                    className={`px-3 py-2 text-[11px] font-semibold rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    Today
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Production Shift *
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
                  Manufacturing Line / Machine *
                </label>
                <select
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
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
                  Target Output (Units) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden font-bold ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Scheduled Shift Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={scheduledHours}
                  onChange={(e) => setScheduledHours(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Supervisor / Shift Incharge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil / Shift Lead"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 3. Included Processes */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>3. Included Processes for Shift Plan</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                {selectedProcesses.length} stages active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableProcesses.map((proc) => {
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
                    <span>{proc}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Speed Estimator, Notes, Actions */}
        <div className="space-y-6">
          {/* Shift Target Estimation Card */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Shift Metrics Estimator</span>
            </h2>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Target Run Speed
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {speedPerHour.toLocaleString()} <span className="text-xs font-medium text-slate-400">units/hour</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Based on {targetQuantity.toLocaleString()} units over {scheduledHours} scheduled hours.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Plan Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
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
                  Shift Notes & Machine Instructions
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Pre-heat corrugator drums, inspect flute paper moisture, calibrate rotary slotter knives."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-hidden transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className={`p-6 rounded-2xl border shadow-xs ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Ready to Dispatch Plan?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Saving will register the shift schedule in the production ledger and make it available for floor operator logging and daily reports.
            </p>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Scheduling Plan...' : 'Save & Publish Plan'}</span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className={`w-full py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Discard / Go Back
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
