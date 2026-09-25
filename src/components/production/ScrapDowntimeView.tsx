import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Clock,
  Plus,
  RotateCcw,
  AlertTriangle,
  Cpu,
  Layers,
  Save,
  X,
  TrendingDown,
} from 'lucide-react';
import { WorkOrder, Machine } from '../../types';

interface ScrapDowntimeViewProps {
  darkMode: boolean;
}

export const ScrapDowntimeView: React.FC<ScrapDowntimeViewProps> = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState<'scrap' | 'downtime'>('scrap');
  const [scrapLogs, setScrapLogs] = useState<any[]>([]);
  const [downtimeLogs, setDowntimeLogs] = useState<any[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Scrap Modal
  const [showScrapModal, setShowScrapModal] = useState(false);
  const [scrapWoId, setScrapWoId] = useState('');
  const [scrapStage, setScrapStage] = useState('Corrugator Edge Trim');
  const [scrapReason, setScrapReason] = useState('Trim Waste');
  const [scrapQuantity, setScrapQuantity] = useState<number>(50);
  const [scrapWeightKg, setScrapWeightKg] = useState<number>(25);
  const [scrapCost, setScrapCost] = useState<number>(30);
  const [scrapNotes, setScrapNotes] = useState('');
  const [savingScrap, setSavingScrap] = useState(false);

  // Downtime Modal
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);
  const [downMachineId, setDownMachineId] = useState('');
  const [downMinutes, setDownMinutes] = useState<number>(30);
  const [downReason, setDownReason] = useState('Paper Reel Changeover');
  const [downAction, setDownAction] = useState('Replaced kraft paper roll and re-threaded paper web.');
  const [downOperator, setDownOperator] = useState('Line Tech');
  const [savingDowntime, setSavingDowntime] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scrapRes, downRes, machRes, woRes] = await Promise.all([
        fetch('/api/production/scrap'),
        fetch('/api/production/downtime'),
        fetch('/api/production/machines'),
        fetch('/api/production/work-orders?limit=50'),
      ]);

      const scrapData = await scrapRes.json();
      const downData = await downRes.json();
      const machData = await machRes.json();
      const woData = await woRes.json();

      if (scrapData.success) setScrapLogs(scrapData.data || []);
      if (downData.success) setDowntimeLogs(downData.data || []);
      if (machData.success) {
        const ms = machData.data || [];
        setMachines(ms);
        if (ms.length > 0 && !downMachineId) setDownMachineId(ms[0].id);
      }
      if (woData.success) {
        const ws = woData.data || [];
        setWorkOrders(ws);
        if (ws.length > 0 && !scrapWoId) setScrapWoId(ws[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordScrap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingScrap(true);
      const res = await fetch('/api/production/scrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: scrapWoId || null,
          stage: scrapStage,
          reason: scrapReason,
          quantity: Number(scrapQuantity),
          weightKg: Number(scrapWeightKg),
          estimatedCost: Number(scrapCost),
          notes: scrapNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to record scrap');

      setShowScrapModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error recording scrap');
    } finally {
      setSavingScrap(false);
    }
  };

  const handleRecordDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downMachineId) return alert('Select a machine');
    try {
      setSavingDowntime(true);
      const res = await fetch('/api/production/downtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: downMachineId,
          durationMinutes: Number(downMinutes),
          reason: downReason,
          actionTaken: downAction,
          technician: downOperator,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to record downtime');

      setShowDowntimeModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error recording downtime');
    } finally {
      setSavingDowntime(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Material Scrap Waste & Machine Downtime Tracking
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Quantify trim waste loss, paper roll breaks, blade jams, and machine stoppages
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
            title="Refresh Logs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {activeTab === 'scrap' ? (
            <button
              type="button"
              onClick={() => setShowScrapModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Scrap Waste</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDowntimeModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Machine Downtime</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('scrap')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'scrap'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Paper & Board Scrap Logs ({scrapLogs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('downtime')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'downtime'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Machine Stoppage Logs ({downtimeLogs.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'scrap' ? (
        <div
          className={`rounded-xl border overflow-hidden ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b ${
                  darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4 font-semibold">Date & Stage</th>
                  <th className="py-3 px-4 font-semibold">Work Order</th>
                  <th className="py-3 px-4 font-semibold">Reason Category</th>
                  <th className="py-3 px-4 font-semibold">Quantity / Weight</th>
                  <th className="py-3 px-4 font-semibold">Estimated Cost</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading scrap logs...
                    </td>
                  </tr>
                ) : scrapLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No scrap waste logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  scrapLogs.map((s) => (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {s.stage}
                        </div>
                        <div className="text-[10px] text-slate-400">{s.logDate}</div>
                      </td>

                      <td className="py-3 px-4">
                        {s.workOrder ? (
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {s.workOrder.orderNumber}
                            </span>
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {s.workOrder.product?.name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">General Trim</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          {s.reason}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {s.quantity} Pcs
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.weightKg ? `${s.weightKg} kg` : '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {s.estimatedCost ? `$${s.estimatedCost.toFixed(2)}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {s.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border overflow-hidden ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b ${
                  darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4 font-semibold">Machine & Line</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Downtime Duration</th>
                  <th className="py-3 px-4 font-semibold">Stoppage Reason</th>
                  <th className="py-3 px-4 font-semibold">Action Taken</th>
                  <th className="py-3 px-4 font-semibold">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading downtime records...
                    </td>
                  </tr>
                ) : downtimeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No machine downtime events recorded.
                    </td>
                  </tr>
                ) : (
                  downtimeLogs.map((d) => (
                    <tr
                      key={d.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {d.machine?.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {d.machine?.code} • {d.machine?.line}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {d.downtimeDate}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {d.durationMinutes} Minutes
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {d.reason}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[220px] truncate">
                        {d.actionTaken || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {d.technician || 'Line Tech'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Scrap Modal */}
      {showScrapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border p-5 space-y-4 shadow-xl ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Record Material Scrap Waste
              </h3>
              <button
                type="button"
                onClick={() => setShowScrapModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordScrap} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Work Order (Optional)
                </label>
                <select
                  value={scrapWoId}
                  onChange={(e) => setScrapWoId(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">General Plant Scrap (No WO)</option>
                  {workOrders.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.orderNumber} - {w.product?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Process Stage *
                  </label>
                  <select
                    value={scrapStage}
                    onChange={(e) => setScrapStage(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Corrugator Edge Trim">Corrugator Edge Trim</option>
                    <option value="Printing & Slotting Waste">Printing & Slotting Waste</option>
                    <option value="Die-Cutting Flake Trim">Die-Cutting Flake Trim</option>
                    <option value="Stitching Defect">Stitching Defect</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Defect / Waste Reason *
                  </label>
                  <select
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Trim Waste">Trim Waste</option>
                    <option value="Paper Web Break">Paper Web Break</option>
                    <option value="Ink Smear / Misprint">Ink Smear / Misprint</option>
                    <option value="Flute Crushing / Delamination">Flute Crushing / Delamination</option>
                    <option value="Slotting Offset">Slotting Offset</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Pieces *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={scrapQuantity}
                    onChange={(e) => setScrapQuantity(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={scrapWeightKg}
                    onChange={(e) => setScrapWeightKg(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    value={scrapCost}
                    onChange={(e) => setScrapCost(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Waste Observations
                </label>
                <textarea
                  rows={2}
                  value={scrapNotes}
                  onChange={(e) => setScrapNotes(e.target.value)}
                  placeholder="Roll splice cutoff or machine jamming details..."
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScrapModal(false)}
                  className={`px-3.5 py-2 rounded text-xs font-semibold border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScrap}
                  className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingScrap ? 'Saving...' : 'Save Scrap Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Downtime Modal */}
      {showDowntimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border p-5 space-y-4 shadow-xl ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Record Machine Downtime Stoppage
              </h3>
              <button
                type="button"
                onClick={() => setShowDowntimeModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordDowntime} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Machine Workstation *
                </label>
                <select
                  value={downMachineId}
                  onChange={(e) => setDownMachineId(e.target.value)}
                  required
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) - {m.line}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={downMinutes}
                    onChange={(e) => setDownMinutes(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Stoppage Reason *
                  </label>
                  <select
                    value={downReason}
                    onChange={(e) => setDownReason(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Paper Reel Changeover">Paper Reel Changeover</option>
                    <option value="Blade Jam / Slitter Clean">Blade Jam / Slitter Clean</option>
                    <option value="Anilox Roller Wash / Ink Change">Anilox Roller Wash / Ink Change</option>
                    <option value="Die-Cut Plate Setup">Die-Cut Plate Setup</option>
                    <option value="Mechanical Breakdown">Mechanical Breakdown</option>
                    <option value="Electrical Sensor Fault">Electrical Sensor Fault</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Action Taken to Resolve
                </label>
                <textarea
                  rows={2}
                  value={downAction}
                  onChange={(e) => setDownAction(e.target.value)}
                  placeholder="Replaced worn slitter blade, reset PLC fault code..."
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Lead Technician / Operator
                </label>
                <input
                  type="text"
                  value={downOperator}
                  onChange={(e) => setDownOperator(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDowntimeModal(false)}
                  className={`px-3.5 py-2 rounded text-xs font-semibold border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDowntime}
                  className="px-4 py-2 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingDowntime ? 'Logging...' : 'Save Downtime Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
