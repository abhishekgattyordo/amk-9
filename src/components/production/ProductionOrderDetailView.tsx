import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  PackageCheck,
  Truck,
  Box,
  Cpu,
  User,
  Calendar,
  FileText,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Flame,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { Warehouse } from '../../types';

interface ProductionOrderDetailViewProps {
  orderId: string;
  darkMode: boolean;
  onBack: () => void;
  warehouses?: Warehouse[];
}

export const ProductionOrderDetailView: React.FC<ProductionOrderDetailViewProps> = ({
  orderId,
  darkMode,
  onBack,
  warehouses = [],
}) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'processes' | 'materials' | 'consumption' | 'daily_reports' | 'qc_fg'
  >('processes');

  // Updating Step Modal
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [updatingStep, setUpdatingStep] = useState(false);
  const [stepProducedQty, setStepProducedQty] = useState<number>(0);
  const [stepScrapQty, setStepScrapQty] = useState<number>(0);
  const [stepWastageQty, setStepWastageQty] = useState<number>(0);
  const [stepOperator, setStepOperator] = useState('');
  const [stepMachine, setStepMachine] = useState('');
  const [stepQcStatus, setStepQcStatus] = useState('Passed');
  const [stepRemarks, setStepRemarks] = useState('');

  // Finished Goods Receipt Modal
  const [showFgModal, setShowFgModal] = useState(false);
  const [receivingFg, setReceivingFg] = useState(false);
  const [fgWarehouseId, setFgWarehouseId] = useState('');
  const [fgQuantity, setFgQuantity] = useState<number>(0);
  const [fgRemarks, setFgRemarks] = useState('');

  // Machines list for assignment
  const [machines, setMachines] = useState<any[]>([]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/production/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setFgQuantity(data.data.actualQuantity || data.data.plannedQuantity);
      }
    } catch (err) {
      console.error('Error fetching production order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/production/machines');
      const data = await res.json();
      if (data.success) {
        setMachines(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    fetchMachines();
  }, [orderId]);

  const handleOpenStepUpdate = (step: any) => {
    setSelectedStep(step);
    setStepProducedQty(step.actualProducedQuantity || step.inputQuantity || order?.plannedQuantity || 0);
    setStepScrapQty(step.scrapQuantity || 0);
    setStepWastageQty(step.wastageQuantity || 0);
    setStepOperator(step.operatorName || order?.supervisor || '');
    setStepMachine(step.machineName || '');
    setStepQcStatus(step.qcStatus || 'Passed');
    setStepRemarks(step.remarks || '');
  };

  const handleSaveStepProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStep) return;

    try {
      setUpdatingStep(true);
      const res = await fetch(`/api/production/processes/${selectedStep.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Completed',
          actualProducedQuantity: Number(stepProducedQty),
          scrapQuantity: Number(stepScrapQty),
          wastageQuantity: Number(stepWastageQty),
          operatorName: stepOperator,
          machineName: stepMachine,
          qcStatus: stepQcStatus,
          remarks: stepRemarks,
          autoAdvance: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update process stage');

      setSelectedStep(null);
      fetchOrderDetail();
    } catch (err: any) {
      alert(err.message || 'Error updating stage');
    } finally {
      setUpdatingStep(false);
    }
  };

  const handleReceiveFinishedGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fgWarehouseId) {
      alert('Please select a Finished Goods Warehouse');
      return;
    }

    try {
      setReceivingFg(true);
      const res = await fetch(`/api/production/orders/${orderId}/receive-fg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: fgWarehouseId,
          quantity: Number(fgQuantity),
          remarks: fgRemarks,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to receive finished goods');

      alert(data.message || 'Finished Goods successfully credited to Warehouse inventory!');
      setShowFgModal(false);
      fetchOrderDetail();
    } catch (err: any) {
      alert(err.message || 'Error receiving finished goods');
    } finally {
      setReceivingFg(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
        Loading Production Order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Production Order not found</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 rounded-lg"
        >
          Back to list
        </button>
      </div>
    );
  }

  const steps = order.processSteps || [];
  const completedSteps = steps.filter((s: any) => s.status === 'Completed' || s.qcStatus === 'Passed').length;
  const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Bar with Back and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-lg border transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {order.orderNumber}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Work Order: <span className="font-semibold text-slate-700 dark:text-slate-200">{order.workOrder?.orderNumber}</span> • Product:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{order.product?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrderDetail}
            className={`p-2 rounded-lg border text-xs font-semibold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(order.status === 'QC Approved' || order.status === 'QC Pending' || progressPercent === 100) && order.status !== 'Completed' && (
            <button
              type="button"
              onClick={() => setShowFgModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Receive Finished Goods into Warehouse</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500">Planned Quantity</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {order.plannedQuantity?.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500">Actual Produced</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {order.actualQuantity?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500">Overall Stage Progress</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {progressPercent}% <span className="text-xs font-normal text-slate-400">({completedSteps}/{steps.length} stages)</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500">Scrap & Wastage</div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {(order.scrapQuantity || 0) + (order.wastageQuantity || 0)} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('processes')}
          className={`py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'processes'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          1. Process Stages ({steps.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'materials'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          2. Material Indents & Allocations ({order.materialAllocations?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('consumption')}
          className={`py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'consumption'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          3. Material Consumption Tracking ({order.materialConsumptions?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('daily_reports')}
          className={`py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'daily_reports'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          4. Daily Production Reports ({order.dailyReports?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('qc_fg')}
          className={`py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'qc_fg'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          5. Final QC & Finished Goods Receipt
        </button>
      </div>

      {/* TAB 1: PROCESS EXECUTION STAGES */}
      {activeTab === 'processes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sequential Process Flow & Station Execution
            </h3>
            <p className="text-xs text-slate-500">
              Each stage passes outputs directly to the subsequent station upon completion & QC check
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {steps.map((step: any, index: number) => {
              const isCompleted = step.status === 'Completed' || step.qcStatus === 'Passed';
              const isInProgress = step.status === 'In Progress';
              const isPending = step.status === 'Pending';

              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isInProgress
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-850 opacity-80'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isInProgress
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.sequence}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {step.processName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isInProgress
                                ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {step.status}
                          </span>
                          {step.qcStatus && (
                            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                              QC: {step.qcStatus}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {step.machineName && (
                            <span className="inline-flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" /> {step.machineName}
                            </span>
                          )}
                          {step.operatorName && (
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3.5 h-3.5" /> {step.operatorName}
                            </span>
                          )}
                          {step.startTime && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Started: {new Date(step.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 dark:border-slate-700">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Input Qty</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {step.inputQuantity?.toLocaleString() || 0}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Produced</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {step.actualProducedQuantity?.toLocaleString() || 0}
                        </div>
                      </div>

                      {(step.scrapQuantity > 0 || step.wastageQuantity > 0) && (
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">Scrap / Waste</div>
                          <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {step.scrapQuantity || 0} / {step.wastageQuantity || 0} kg
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenStepUpdate(step)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-all ${
                          isInProgress
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : isCompleted
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        }`}
                      >
                        {isInProgress ? 'Log Progress & Complete' : 'Update Details'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAL INDENTS & ALLOCATIONS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Material Indents & Warehouse Transfers (Godown 1 → Godown 2)
              </h3>
              <p className="text-xs text-slate-500">
                Track material allocation from Main Store to Production Store and Floor Issues
              </p>
            </div>
          </div>

          <div
            className={`rounded-xl border overflow-hidden shadow-xs ${
              darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Allocation #</th>
                  <th className="py-3 px-4">Raw Material</th>
                  <th className="py-3 px-4">Source → Destination</th>
                  <th className="py-3 px-4">Batch / Lot</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Date & User</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(order.materialAllocations || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No material allocations recorded for this order yet.
                    </td>
                  </tr>
                ) : (
                  order.materialAllocations.map((alc: any) => (
                    <tr key={alc.id}>
                      <td className="py-3 px-4 font-semibold text-blue-600">{alc.allocationNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{alc.rawMaterial?.name}</div>
                        <div className="text-[11px] text-slate-400">{alc.rawMaterial?.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {alc.sourceWarehouse?.name || 'Godown 1'}
                        </span>{' '}
                        →{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {alc.destinationWarehouse?.name || 'Godown 2'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{alc.batchLotNumber || 'LOT-2025-01'}</td>
                      <td className="py-3 px-4 text-right font-bold">{alc.quantity} kg</td>
                      <td className="py-3 px-4 text-slate-500">
                        {alc.allocationDate} ({alc.allocatedBy})
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {alc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MATERIAL CONSUMPTION TRACKING */}
      {activeTab === 'consumption' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Material Reconciliation & Consumption Record
            </h3>
          </div>

          <div
            className={`rounded-xl border overflow-hidden shadow-xs ${
              darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4 text-right">Issued Qty</th>
                  <th className="py-3 px-4 text-right">Used Qty</th>
                  <th className="py-3 px-4 text-right">Returned Qty</th>
                  <th className="py-3 px-4 text-right">Wastage Qty</th>
                  <th className="py-3 px-4 text-right">Balance Qty</th>
                  <th className="py-3 px-4">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(order.materialConsumptions || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No consumption records logged yet.
                    </td>
                  </tr>
                ) : (
                  order.materialConsumptions.map((mc: any) => (
                    <tr key={mc.id}>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {mc.rawMaterial?.name} ({mc.rawMaterial?.code})
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{mc.issuedQuantity} kg</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">{mc.usedQuantity} kg</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">{mc.returnedQuantity} kg</td>
                      <td className="py-3 px-4 text-right font-medium text-rose-600">{mc.wastageQuantity} kg</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">{mc.balanceQuantity} kg</td>
                      <td className="py-3 px-4 text-slate-500">{mc.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY PRODUCTION REPORTS */}
      {activeTab === 'daily_reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Production Reports & Manager Approvals
            </h3>
          </div>

          <div
            className={`rounded-xl border overflow-hidden shadow-xs ${
              darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Report #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Planned Qty</th>
                  <th className="py-3 px-4 text-right">Actual Qty</th>
                  <th className="py-3 px-4 text-right">Achievement %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(order.dailyReports || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No daily reports submitted for this order yet.
                    </td>
                  </tr>
                ) : (
                  order.dailyReports.map((rep: any) => (
                    <tr key={rep.id}>
                      <td className="py-3 px-4 font-semibold text-blue-600">{rep.reportNumber}</td>
                      <td className="py-3 px-4">{rep.productionDate}</td>
                      <td className="py-3 px-4 text-right">{rep.plannedQuantity}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{rep.actualProducedQuantity}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">{rep.achievementPercent}%</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            rep.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{rep.approvedBy || 'Pending'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FINAL QC & FINISHED GOODS RECEIPT */}
      {activeTab === 'qc_fg' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-2xl border shadow-xs ${
              darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Finished Goods Receipt & Warehouse Credit
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Once all manufacturing processes and QC approvals pass, move completed corrugated boxes into Finished Goods Warehouse.
                </p>
              </div>

              {order.status !== 'Completed' ? (
                <button
                  type="button"
                  onClick={() => setShowFgModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Receive Finished Goods into Warehouse</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Finished Goods Received & Credited
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PROCESS STAGE MODAL */}
      {selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Update Stage: {selectedStep.processName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input stage production metrics and advance output to the next workstation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStepProgress} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Produced Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stepProducedQty}
                    onChange={(e) => setStepProducedQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stage QC Status
                  </label>
                  <select
                    value={stepQcStatus}
                    onChange={(e) => setStepQcStatus(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Passed">Passed (Approved for Next Stage)</option>
                    <option value="Hold">On Hold (Pending Re-inspection)</option>
                    <option value="Rework">Rework Required</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scrap Generated (Kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stepScrapQty}
                    onChange={(e) => setStepScrapQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Wastage / Trim (Kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stepWastageQty}
                    onChange={(e) => setStepWastageQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Station Operator
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anil Sharma"
                    value={stepOperator}
                    onChange={(e) => setStepOperator(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Machine
                  </label>
                  <select
                    value={stepMachine}
                    onChange={(e) => setStepMachine(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">-- Select Machine --</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.code} - {m.name} ({m.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Flute profile calibrated, print speed 120 sheets/min"
                  value={stepRemarks}
                  onChange={(e) => setStepRemarks(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedStep(null)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border ${
                    darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStep}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {updatingStep ? 'Saving...' : 'Complete & Advance Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINISHED GOODS RECEIPT MODAL */}
      {showFgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Receive Finished Goods
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFgModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveFinishedGoods} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Finished Goods Destination Warehouse *
                </label>
                <select
                  required
                  value={fgWarehouseId}
                  onChange={(e) => setFgWarehouseId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code || 'Warehouse'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Received Quantity (Boxes) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={fgQuantity}
                  onChange={(e) => setFgQuantity(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quality & Stock Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Passed burst index 16.5, moisture 7.2%, stacked on Pallet A1-A4"
                  value={fgRemarks}
                  onChange={(e) => setFgRemarks(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFgModal(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border ${
                    darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receivingFg}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {receivingFg ? 'Receiving...' : 'Confirm Stock In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
