import React, { useState, useEffect } from 'react';
import {
  Clock,
  Boxes,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Warehouse } from '../../types';

interface QCPendingQueueViewProps {
  darkMode: boolean;
  onOpenInspectModal: (qcType: string, referenceId?: string) => void;
  onRefreshAll: () => void;
}

export const QCPendingQueueView: React.FC<QCPendingQueueViewProps> = ({
  darkMode,
  onOpenInspectModal,
  onRefreshAll,
}) => {
  const [loading, setLoading] = useState(true);
  const [activeQueueTab, setActiveQueueTab] = useState<'reels' | 'samples' | 'production'>('reels');
  const [searchTerm, setSearchTerm] = useState('');

  const [pendingReels, setPendingReels] = useState<any[]>([]);
  const [sampleSalesOrders, setSampleSalesOrders] = useState<any[]>([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState<any[]>([]);

  const fetchPendingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quality-checks?mode=pending-queue');
      const json = await res.json();
      if (json.success && json.data) {
        setPendingReels(json.data.pendingReels || []);
        setSampleSalesOrders(json.data.sampleSalesOrders || []);
        setActiveWorkOrders(json.data.activeWorkOrders || []);
      }
    } catch (e) {
      console.error('Error fetching pending QC queues:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  const totalPending = pendingReels.length + sampleSalesOrders.length + activeWorkOrders.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Pending QC Inspection Queues
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Incoming paper reels, client sample orders, and production batches requiring mandatory QC certification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchPendingData();
              onRefreshAll();
            }}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            Refresh Queues
          </button>
        </div>
      </div>

      {/* Queue Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveQueueTab('reels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeQueueTab === 'reels'
              ? 'bg-indigo-600 text-white shadow-sm'
              : darkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Reel Inward Queue ({pendingReels.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab('samples')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeQueueTab === 'samples'
              ? 'bg-purple-600 text-white shadow-sm'
              : darkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Sample SO Queue ({sampleSalesOrders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab('production')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeQueueTab === 'production'
              ? 'bg-teal-600 text-white shadow-sm'
              : darkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Production & Final Box Queue ({activeWorkOrders.length})
        </button>
      </div>

      {/* Content for Reel Inward Queue */}
      {activeQueueTab === 'reels' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Paper Reels Awaiting Lab & Weight Check
            </h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              {pendingReels.length} reel consignments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="p-3">Inward #</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-center">Declared GSM</th>
                  <th className="p-3 text-center">Declared BF</th>
                  <th className="p-3 text-right">Consignment Weight</th>
                  <th className="p-3 text-center">Reel Count</th>
                  <th className="p-3">Arrival Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingReels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      All paper reel consignments have been inspected and released.
                    </td>
                  </tr>
                ) : (
                  pendingReels.map((reel) => (
                    <tr key={reel.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {reel.inwardNumber || reel.reelNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {reel.supplier?.name || reel.supplierName || 'N/A'}
                      </td>
                      <td className="p-3 text-center font-mono">{reel.gsm || 180}</td>
                      <td className="p-3 text-center font-mono">{reel.bf || 22}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {reel.expectedWeight || reel.weight || 0} Kg
                      </td>
                      <td className="p-3 text-center font-mono">{reel.items?.length || 1} reels</td>
                      <td className="p-3 text-slate-500 font-mono">
                        {reel.inwardDate || (reel.createdAt ? reel.createdAt.split('T')[0] : 'N/A')}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenInspectModal('Reel Inward QC', reel.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
                        >
                          Inspect Reels
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content for Sample SO Queue */}
      {activeQueueTab === 'samples' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Sample Orders Awaiting Approval
            </h3>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              {sampleSalesOrders.length} sample orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="p-3">SO #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-right">Sample Qty</th>
                  <th className="p-3">Special Instructions</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sampleSalesOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      No sample orders pending quality inspection.
                    </td>
                  </tr>
                ) : (
                  sampleSalesOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {so.soNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{so.customerName}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {so.productName || so.product?.name}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {so.quantity} pcs
                      </td>
                      <td className="p-3 text-slate-500 max-w-[200px] truncate">
                        {so.specialInstructions || 'Standard client sample verification'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {so.productionStatus || 'Pending Sample QC'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenInspectModal('Sample SO QC', so.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer"
                        >
                          Inspect Sample
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content for Production & Final Box Queue */}
      {activeQueueTab === 'production' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Work Orders & Finished Boxes Ready for QC Sign-Off
            </h3>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
              {activeWorkOrders.length} active jobs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="p-3">Work Order #</th>
                  <th className="p-3">Product Description</th>
                  <th className="p-3 text-right">Batch Quantity</th>
                  <th className="p-3">Current Stage</th>
                  <th className="p-3 text-center">Stage Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      No active production work orders pending QC evaluation.
                    </td>
                  </tr>
                ) : (
                  activeWorkOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {wo.woNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {wo.productName || wo.product?.name}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {wo.orderedQuantity} pcs
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {wo.currentStage || 'Finished Box Assembly'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {wo.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenInspectModal('Final QC', wo.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-all cursor-pointer"
                        >
                          Perform Final QC
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
