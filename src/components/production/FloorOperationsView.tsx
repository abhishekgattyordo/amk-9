import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Boxes,
  ArrowRight,
  AlertTriangle,
  Save,
  Check,
} from 'lucide-react';
import { WorkOrder, WorkOrderOperation } from '../../types';

interface FloorOperationsViewProps {
  darkMode: boolean;
  workOrders: WorkOrder[];
  loading: boolean;
  onRefresh: () => void;
  onViewWorkOrder: (id: string) => void;
}

export const FloorOperationsView: React.FC<FloorOperationsViewProps> = ({
  darkMode,
  workOrders,
  loading,
  onRefresh,
  onViewWorkOrder,
}) => {
  const [activeStage, setActiveStage] = useState<'Corrugation' | 'Printing' | 'Die-Cutting' | 'Stitching'>('Corrugation');
  const [updatingOpId, setUpdatingOpId] = useState<string | null>(null);
  const [outputQty, setOutputQty] = useState<number>(0);
  const [scrapQty, setScrapQty] = useState<number>(0);
  const [operatorName, setOperatorName] = useState('Floor Lead');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter work orders that have an operation matching activeStage
  const getStageOrders = () => {
    return workOrders.filter((wo) => {
      const matchStage =
        (activeStage === 'Corrugation' && (wo.currentStage.includes('Corrugat') || wo.currentStage === 'Planning')) ||
        (activeStage === 'Printing' && wo.currentStage.includes('Print')) ||
        (activeStage === 'Die-Cutting' && (wo.currentStage.includes('Die') || wo.currentStage.includes('Past'))) ||
        (activeStage === 'Stitching' && (wo.currentStage.includes('Stitch') || wo.currentStage.includes('Bundl')));
      return matchStage && wo.status !== 'Completed';
    });
  };

  const stageOrders = getStageOrders();

  const handleOpenRecord = (wo: WorkOrder) => {
    // Find operation matching activeStage
    const op = wo.operations?.find((o) => {
      if (activeStage === 'Corrugation') return o.stageName.includes('Corrugat');
      if (activeStage === 'Printing') return o.stageName.includes('Print');
      if (activeStage === 'Die-Cutting') return o.stageName.includes('Die') || o.stageName.includes('Past');
      if (activeStage === 'Stitching') return o.stageName.includes('Stitch') || o.stageName.includes('Bundl');
      return false;
    });

    if (op) {
      setUpdatingOpId(op.id);
      setOutputQty(op.outputQuantity || op.inputQuantity || wo.orderedQuantity);
      setScrapQty(op.scrapQuantity || 0);
      setOperatorName(op.operatorName || 'Line Operator');
      setNotes(op.notes || '');
    }
  };

  const handleCompleteOperation = async (opId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/production/operations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId: opId,
          status: 'Completed',
          outputQuantity: Number(outputQty),
          scrapQuantity: Number(scrapQty),
          operatorName,
          notes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to complete stage');

      setUpdatingOpId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating floor progress');
    } finally {
      setSubmitting(false);
    }
  };

  const stageTabs = [
    { id: 'Corrugation', label: '1. Corrugation Line', desc: 'Flute corrugator & sheet board cutoff' },
    { id: 'Printing', label: '2. Printing & Slotting', desc: 'Flexographic branding, slotting & creasing' },
    { id: 'Die-Cutting', label: '3. Die-Cutting & Pasting', desc: 'Punching geometry & high-speed folder gluer' },
    { id: 'Stitching', label: '4. Stitching & Bundling', desc: 'Wire stitching joints & strapping bundles' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Shop Floor Execution & Stage Cockpit
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Workstation dispatch, actual board output recording, trim scrap log, and stage advances
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={`p-2 rounded-lg border transition-colors self-start sm:self-auto ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Refresh Workstations"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Stage Navigation Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stageTabs.map((st) => {
          const isActive = activeStage === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setActiveStage(st.id as any);
                setUpdatingOpId(null);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <div className="text-xs font-bold">{st.label}</div>
              <p
                className={`text-[11px] mt-0.5 ${
                  isActive ? 'text-emerald-100' : 'text-slate-400'
                }`}
              >
                {st.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Workstation Queue List */}
      <div
        className={`rounded-xl border p-5 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Active Batches at {activeStage} Workstation
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Orders currently on machine or queued to run
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {stageOrders.length} Orders in Stage
          </span>
        </div>

        {stageOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No active batches currently queued at {activeStage} workstation.
          </div>
        ) : (
          <div className="space-y-4">
            {stageOrders.map((wo) => {
              const currentOp = wo.operations?.find((o) => {
                if (activeStage === 'Corrugation') return o.stageName.includes('Corrugat');
                if (activeStage === 'Printing') return o.stageName.includes('Print');
                if (activeStage === 'Die-Cutting') return o.stageName.includes('Die') || o.stageName.includes('Past');
                if (activeStage === 'Stitching') return o.stageName.includes('Stitch') || o.stageName.includes('Bundl');
                return false;
              });

              const isEditing = updatingOpId && currentOp && updatingOpId === currentOp.id;

              return (
                <div
                  key={wo.id}
                  className={`p-4 rounded-xl border transition-all ${
                    darkMode ? 'bg-slate-850/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div
                        onClick={() => onViewWorkOrder(wo.id)}
                        className="font-bold text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline"
                      >
                        {wo.orderNumber}
                      </div>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {wo.product?.name} ({wo.product?.code})
                      </span>
                      {wo.priority === 'Urgent' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">
                        Target: <strong>{wo.orderedQuantity.toLocaleString()} Pcs</strong>
                      </span>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleOpenRecord(wo)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Record Stage Output</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Assigned Machine</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {currentOp?.machineName || wo.assignedLine || 'Default Workstation'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Target Sheet / Cut Size</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {wo.product?.dimensions || 'Standard'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Customer / SO Link</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                        {wo.salesOrder ? `${wo.salesOrder.soNumber} (${wo.salesOrder.customerName})` : 'Make-to-Stock'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Operation Status</span>
                      <span className="font-bold text-amber-500">
                        {currentOp?.status || 'Pending Run'}
                      </span>
                    </div>
                  </div>

                  {/* Inline Execution Recorder Form */}
                  {isEditing && currentOp && (
                    <div className="mt-4 p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Log Station Run Output: {currentOp.stageName}</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-slate-400 block mb-1">
                            Good Output (Pcs) *
                          </label>
                          <input
                            type="number"
                            value={outputQty}
                            onChange={(e) => setOutputQty(Number(e.target.value))}
                            className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-slate-400 block mb-1">
                            Edge Trim / Scrap (Pcs)
                          </label>
                          <input
                            type="number"
                            value={scrapQty}
                            onChange={(e) => setScrapQty(Number(e.target.value))}
                            className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-slate-400 block mb-1">
                            Machine Operator
                          </label>
                          <input
                            type="text"
                            value={operatorName}
                            onChange={(e) => setOperatorName(e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Operator remarks: e.g. Corrugator speed 180 m/min, adhesive viscosity ok..."
                          className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setUpdatingOpId(null)}
                          className={`px-3 py-1.5 rounded text-xs font-semibold border ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleCompleteOperation(currentOp.id)}
                          className="px-4 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{submitting ? 'Updating...' : 'Complete Stage & Pass to Next Station'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
