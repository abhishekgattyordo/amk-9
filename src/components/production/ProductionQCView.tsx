import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Boxes,
  RotateCcw,
  Scale,
  Activity,
  Layers,
  Sparkles,
  Building2,
  X,
  Save,
} from 'lucide-react';
import { ProductionQC, WorkOrder, Warehouse } from '../../types';

interface ProductionQCViewProps {
  darkMode: boolean;
  warehouses: Warehouse[];
  onRefreshAll?: () => void;
}

export const ProductionQCView: React.FC<ProductionQCViewProps> = ({
  darkMode,
  warehouses,
  onRefreshAll,
}) => {
  const [inspections, setInspections] = useState<ProductionQC[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal for new inspection
  const [showTestForm, setShowTestForm] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState('');
  const [stage, setStage] = useState('Final Finished Box Inspection');
  const [inspectorName, setInspectorName] = useState('QC Lead Inspector');
  const [sampleSize, setSampleSize] = useState<number>(10);
  const [burstingFactor, setBurstingFactor] = useState<number>(24);
  const [burstingStrength, setBurstingStrength] = useState<number>(14.5);
  const [moisturePercent, setMoisturePercent] = useState<number>(8.2);
  const [boxCompressionTest, setBoxCompressionTest] = useState<number>(380);
  const [caliperThicknessMm, setCaliperThicknessMm] = useState<number>(6.5);
  const [dimensionCheck, setDimensionCheck] = useState('Pass');
  const [printQuality, setPrintQuality] = useState('Pass');
  const [testStatus, setTestStatus] = useState('Passed');
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [savingTest, setSavingTest] = useState(false);

  // Modal for Finished Goods Receipt
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingWo, setReceivingWo] = useState<WorkOrder | null>(null);
  const [receivingWarehouseId, setReceivingWarehouseId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState<number>(0);
  const [receiving, setReceiving] = useState(false);
  const [receiveSuccessMsg, setReceiveSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const [qcRes, woRes] = await Promise.all([
        fetch(`/api/production/qc?${params.toString()}`),
        fetch('/api/production/work-orders?limit=100'),
      ]);

      const qcData = await qcRes.json();
      const woData = await woRes.json();

      if (qcData.success) setInspections(qcData.data || []);
      if (woData.success) {
        const wos = woData.data || [];
        setWorkOrders(wos);
        if (wos.length > 0 && !selectedWoId) {
          setSelectedWoId(wos[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Set default warehouse
  useEffect(() => {
    if (warehouses.length > 0 && !receivingWarehouseId) {
      const fg = warehouses.find((w) => w.type === 'Finished Goods' || w.name.toLowerCase().includes('finish')) || warehouses[0];
      setReceivingWarehouseId(fg.id);
    }
  }, [warehouses, receivingWarehouseId]);

  const handleRecordInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId) return alert('Please select a Work Order');

    try {
      setSavingTest(true);
      const res = await fetch('/api/production/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: selectedWoId,
          stage,
          inspectorName,
          sampleSize: Number(sampleSize),
          burstingFactor: Number(burstingFactor) || null,
          burstingStrength: Number(burstingStrength) || null,
          moisturePercent: Number(moisturePercent) || null,
          boxCompressionTest: Number(boxCompressionTest) || null,
          caliperThicknessMm: Number(caliperThicknessMm) || null,
          dimensionCheck,
          printQuality,
          status: testStatus,
          rejectedQty: Number(rejectedQty) || 0,
          remarks,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to record QC inspection');

      setShowTestForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error recording QC test');
    } finally {
      setSavingTest(false);
    }
  };

  const handleOpenReceive = (wo: WorkOrder) => {
    setReceivingWo(wo);
    setReceiveQuantity(wo.producedQuantity || wo.orderedQuantity);
    setShowReceiveModal(true);
    setReceiveSuccessMsg(null);
  };

  const handleExecuteStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingWo || !receivingWarehouseId || receiveQuantity <= 0) {
      return alert('Please select warehouse and valid quantity');
    }

    try {
      setReceiving(true);
      const res = await fetch('/api/production/qc/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: receivingWo.id,
          warehouseId: receivingWarehouseId,
          quantity: Number(receiveQuantity),
          remarks: `Passed final corrugated box laboratory tests and received into inventory.`,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to receive finished goods into warehouse');

      setReceiveSuccessMsg(data.message || 'Successfully moved finished goods to inventory!');
      setTimeout(() => {
        setShowReceiveModal(false);
        setReceivingWo(null);
        fetchData();
        if (onRefreshAll) onRefreshAll();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error receiving finished goods');
    } finally {
      setReceiving(false);
    }
  };

  // Filter orders ready for final QC & warehouse receipt (In stage QC or Finished Goods or In Production)
  const readyToReceiveOrders = workOrders.filter(
    (w) => w.status !== 'Completed' && (w.currentStage.includes('QC') || w.currentStage.includes('Stitch') || w.currentStage.includes('Finish'))
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Corrugated Box Quality Control & Finished Goods Receipt
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Laboratory burst tests (BF/BS), moisture analysis, Box Compression (BCT), and automated warehouse stock-in
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchData}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Refresh Inspections"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowTestForm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record QC Test</span>
          </button>
        </div>
      </div>

      {/* Ready for Finished Goods Receipt Banner / Queue */}
      {readyToReceiveOrders.length > 0 && (
        <div
          className={`p-5 rounded-xl border space-y-3 ${
            darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Orders Awaiting Final QC Approval & Warehouse Stock-In
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {readyToReceiveOrders.length} Ready Batches
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyToReceiveOrders.map((wo) => (
              <div
                key={wo.id}
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {wo.orderNumber}
                  </div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {wo.product?.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Batch: {wo.orderedQuantity.toLocaleString()} Pcs • Stage: {wo.currentStage}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenReceive(wo)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center space-x-1"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Receive FG</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QC Test Inspections History Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Laboratory Test Reports & Inspection Logs
            </h3>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-2.5 py-1 rounded-lg text-xs border outline-none cursor-pointer ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <option value="All">All Results</option>
            <option value="Passed">Passed</option>
            <option value="Conditional Pass">Conditional Pass</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b ${
                darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-3 px-4 font-semibold">QC # & Date</th>
                <th className="py-3 px-4 font-semibold">Work Order & Product</th>
                <th className="py-3 px-4 font-semibold">Inspection Stage</th>
                <th className="py-3 px-4 font-semibold">Bursting Strength / Factor</th>
                <th className="py-3 px-4 font-semibold">Moisture & Thickness</th>
                <th className="py-3 px-4 font-semibold">BCT / Box Compression</th>
                <th className="py-3 px-4 font-semibold">Visual & Print</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading Quality Control inspections...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No QC inspection logs found. Click "Record QC Test" to log box test parameters.
                  </td>
                </tr>
              ) : (
                inspections.map((qc) => (
                  <tr
                    key={qc.id}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {qc.qcNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">{qc.inspectionDate}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {qc.workOrder?.orderNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {qc.workOrder?.product?.name}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{qc.stage}</div>
                      <div className="text-[10px] text-slate-400">
                        Sample Size: {qc.sampleSize} boxes
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {qc.burstingStrength ? `${qc.burstingStrength} kg/cm²` : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        BF: {qc.burstingFactor || '-'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>Moisture: {qc.moisturePercent ? `${qc.moisturePercent}%` : '-'}</div>
                      <div className="text-[10px] text-slate-400">
                        Caliper: {qc.caliperThicknessMm ? `${qc.caliperThicknessMm} mm` : '-'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {qc.boxCompressionTest ? `${qc.boxCompressionTest} kgf` : '-'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px]">Dimensions: {qc.dimensionCheck}</div>
                      <div className="text-[10px] text-slate-400">Print: {qc.printQuality}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          qc.status === 'Passed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : qc.status === 'Conditional Pass'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {qc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record QC Test Modal */}
      {showTestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl rounded-xl border p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Record Corrugated Laboratory Test
              </h3>
              <button
                type="button"
                onClick={() => setShowTestForm(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordInspection} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Select Work Order *
                  </label>
                  <select
                    value={selectedWoId}
                    onChange={(e) => setSelectedWoId(e.target.value)}
                    required
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="">Choose Work Order</option>
                    {workOrders.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.orderNumber} - {w.product?.name} ({w.currentStage})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Inspection Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Final Finished Box Inspection">Final Finished Box Inspection</option>
                    <option value="Corrugator Line Output">Corrugator Line Output</option>
                    <option value="Post-Flexo Printing Check">Post-Flexo Printing Check</option>
                    <option value="Pre-Dispatch Pallet Check">Pre-Dispatch Pallet Check</option>
                  </select>
                </div>
              </div>

              {/* Lab Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Bursting Strength (BS)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={burstingStrength}
                    onChange={(e) => setBurstingStrength(parseFloat(e.target.value) || 0)}
                    placeholder="kg/cm²"
                    className={`w-full px-2 py-1 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Bursting Factor (BF)</label>
                  <input
                    type="number"
                    value={burstingFactor}
                    onChange={(e) => setBurstingFactor(Number(e.target.value))}
                    placeholder="BF"
                    className={`w-full px-2 py-1 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Moisture (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisturePercent}
                    onChange={(e) => setMoisturePercent(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 8.0%"
                    className={`w-full px-2 py-1 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Box Compression (BCT)</label>
                  <input
                    type="number"
                    value={boxCompressionTest}
                    onChange={(e) => setBoxCompressionTest(Number(e.target.value))}
                    placeholder="kgf"
                    className={`w-full px-2 py-1 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Caliper Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={caliperThicknessMm}
                    onChange={(e) => setCaliperThicknessMm(parseFloat(e.target.value) || 0)}
                    placeholder="mm"
                    className={`w-full px-2 py-1 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Sample Size</label>
                  <input
                    type="number"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className={`w-full px-2 py-1 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Dimension Check</label>
                  <select
                    value={dimensionCheck}
                    onChange={(e) => setDimensionCheck(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Print & Barcode</label>
                  <select
                    value={printQuality}
                    onChange={(e) => setPrintQuality(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Overall Verdict *</label>
                  <select
                    value={testStatus}
                    onChange={(e) => setTestStatus(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Passed">Passed</option>
                    <option value="Conditional Pass">Conditional Pass</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Inspector Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Flute profile integrity verified, adhesive bond passed fiber-tear test..."
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestForm(false)}
                  className={`px-3.5 py-2 rounded text-xs font-semibold border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTest}
                  className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingTest ? 'Recording...' : 'Submit QC Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finished Goods Receipt Modal */}
      {showReceiveModal && receivingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border p-5 space-y-4 shadow-xl ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Receive Finished Boxes into Warehouse
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {receiveSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {receiveSuccessMsg}
                </p>
                <p className="text-[11px] text-slate-400">
                  Inventory and Sales Order records updated in PostgreSQL.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteStockIn} className="space-y-3.5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {receivingWo.orderNumber}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {receivingWo.product?.name} ({receivingWo.product?.code})
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Destination Warehouse *
                  </label>
                  <select
                    required
                    value={receivingWarehouseId}
                    onChange={(e) => setReceivingWarehouseId(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Received Quantity (Pcs) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                    className={`w-full px-2.5 py-2 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-slate-400">
                  This will register a formal <strong>Production Receipt</strong> in the Inventory Ledger, increase finished goods stock, mark the Work Order as Completed, and update Sales Order status to <strong>QC Passed</strong>.
                </p>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReceiveModal(false)}
                    className={`px-3.5 py-2 rounded text-xs font-semibold border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={receiving}
                    className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{receiving ? 'Stocking In...' : 'Confirm Warehouse Stock-In'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
