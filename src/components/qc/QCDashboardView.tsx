import React from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Search,
  Eye,
  FileText,
  Boxes,
  Truck,
  CheckSquare,
  Activity,
  AlertOctagon,
} from 'lucide-react';
import { QCMetrics, QualityCheck } from '../../types';

interface QCDashboardViewProps {
  darkMode: boolean;
  metrics: QCMetrics | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: string, subPage?: string, selectedId?: string) => void;
  onOpenNewInspectionModal: (qcType?: string) => void;
  onSelectInspection: (inspection: QualityCheck) => void;
}

export const QCDashboardView: React.FC<QCDashboardViewProps> = ({
  darkMode,
  metrics,
  loading,
  onRefresh,
  onNavigateTab,
  onOpenNewInspectionModal,
  onSelectInspection,
}) => {
  const getStatusBadge = (status?: string, result?: string) => {
    const st = (result || status || 'Pending').toUpperCase();
    if (st.includes('PASS') || st.includes('APPROV')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          {result || status || 'Approved'}
        </span>
      );
    }
    if (st.includes('FAIL') || st.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" />
          {result || status || 'Rejected'}
        </span>
      );
    }
    if (st.includes('PARTIAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          Partially Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Clock className="w-3 h-3" />
        {result || status || 'Pending'}
      </span>
    );
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'Reel Inward QC':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Reel Inward
          </span>
        );
      case 'Sample SO QC':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Sample SO
          </span>
        );
      case 'Production QC':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            In-Process
          </span>
        );
      case 'Final QC':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            Final Box QC
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {type || 'General QC'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Quality Control & Assurance Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time quality oversight for Reel Inward, Sample Orders, Bulk Production stages, and Final Box inspection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onOpenNewInspectionModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New QC Inspection
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total QC */}
        <div
          onClick={() => onNavigateTab('inspections')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Inspections</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics ? metrics.totalInspections : 0}
          </div>
          <span className="text-[11px] text-blue-500 dark:text-blue-400 font-medium">All logged tests</span>
        </div>

        {/* Pending Inspections */}
        <div
          onClick={() => onNavigateTab('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40' : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending QC</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics ? metrics.pendingCount : 0}
          </div>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">Awaiting sign-off</span>
        </div>

        {/* Approved */}
        <div
          onClick={() => onNavigateTab('approved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics ? metrics.approvedCount : 0}
          </div>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Released to Stock</span>
        </div>

        {/* Rejected & NCR */}
        <div
          onClick={() => onNavigateTab('rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40' : 'bg-white border-slate-200 hover:border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rejected / NCR</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics ? metrics.rejectedCount : 0}
          </div>
          <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">Quarantined / Scrap</span>
        </div>

        {/* Pass Rate */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pass Rate</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-teal-600 dark:text-teal-400">
            {metrics ? `${metrics.passRate}%` : '100%'}
          </div>
          <span className="text-[11px] text-teal-600/80 dark:text-teal-400/80 font-medium">Quality Compliance</span>
        </div>

        {/* Today's Tests */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Today&apos;s Tests</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {metrics ? metrics.todayCount : 0}
          </div>
          <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">Shift inspections</span>
        </div>
      </div>

      {/* Pending Inspection Action Queues (Quick-Start Inspection Banners) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reel Inward Pending */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Reel Inward Queue
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Raw paper reel arrivals</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {metrics ? metrics.reelQcPending : 0} Pending
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Mandatory GSM, BF, Deckle, and Moisture % tests before releasing reels into raw material stock.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onOpenNewInspectionModal('Reel Inward QC')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Inspect Paper Reels
            </button>
          </div>
        </div>

        {/* Sample SO Pending */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Sample SO Queue
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pre-production client samples</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                {metrics ? metrics.sampleQcPending : 0} Pending
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Strict sample sign-off (Dimensions, Printing, Fitment, Joint Strength) prior to customer sample dispatch.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onOpenNewInspectionModal('Sample SO QC')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Inspect Sample Order
            </button>
          </div>
        </div>

        {/* Production In-Process & Final QC */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Production & Final QC
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Corrugation, Stitching & Finished Goods</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                {metrics ? metrics.productionQcPending : 0} Active
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Stage gates (BCT, Caliper, Burst Factor, Drop Test) before final stock-in and dispatch clearance.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onOpenNewInspectionModal('Final QC')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Inspect Production / Final Box
            </button>
          </div>
        </div>
      </div>

      {/* QC Breakdown Distribution & Critical NCR Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QC by Category Breakdown */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Inspection Category Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution across operational stages</p>
            </div>
          </div>

          <div className="space-y-3">
            {metrics?.byType?.map((cat) => {
              const passPct = cat.count > 0 ? Math.round((cat.approved / cat.count) * 100) : 100;
              return (
                <div
                  key={cat.type}
                  className={`p-3 rounded-xl border ${
                    darkMode ? 'bg-slate-850 border-slate-800/80' : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cat.type}</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {cat.count} tests
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${passPct}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${100 - passPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    <span className="text-emerald-600 dark:text-emerald-400">{cat.approved} Approved ({passPct}%)</span>
                    <span className="text-rose-600 dark:text-rose-400">{cat.rejected} Rejected</span>
                    <span className="text-amber-600 dark:text-amber-400">{cat.pending} Pending</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Non-Conformance (NCR) / Rejections Log */}
        <div
          className={`lg:col-span-2 p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                Non-Conformance & Rejection Log (NCR)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Root causes, corrective actions, and quarantine records
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('rejected')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all NCRs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics?.rejectedInspections && metrics.rejectedInspections.length > 0 ? (
              metrics.rejectedInspections.slice(0, 4).map((rej) => (
                <div
                  key={rej.id}
                  onClick={() => onSelectInspection(rej)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-rose-500/50 ${
                    darkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {rej.qcNumber}
                      </span>
                      {getTypeBadge(rej.qcType)}
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Ref: {rej.referenceNumber || 'N/A'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{rej.inspectionDate || rej.testedAt?.split('T')[0]}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium">
                    <strong className="text-rose-600 dark:text-rose-400">Reason:</strong> {rej.rejectionReason || 'Measurement deviation beyond allowable tolerance'}
                  </p>
                  {rej.rootCause && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <strong>Root Cause:</strong> {rej.rootCause}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                No active non-conformance or rejections logged. Quality compliance is nominal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent QC Inspections Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Recent Quality Inspections
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Audit trail of completed and active tests</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('inspections')}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            View all inspections <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b font-bold uppercase tracking-wider ${
                  darkMode ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <th className="p-3">QC Number</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reference / Order</th>
                <th className="p-3">Product / Material</th>
                <th className="p-3 text-right">Sample / Inspected</th>
                <th className="p-3">Inspector</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics?.recentInspections && metrics.recentInspections.length > 0 ? (
                metrics.recentInspections.map((qc) => {
                  const refName =
                    qc.salesOrder?.customerName ||
                    qc.reelInward?.supplier?.name ||
                    qc.product?.name ||
                    qc.rawMaterial?.name ||
                    'N/A';
                  return (
                    <tr
                      key={qc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onSelectInspection(qc)}
                    >
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{qc.qcNumber}</td>
                      <td className="p-3">{getTypeBadge(qc.qcType)}</td>
                      <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {qc.referenceNumber || qc.salesOrder?.soNumber || qc.workOrder?.woNumber || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">{refName}</td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {qc.inspectedQuantity || qc.expectedQuantity || 0}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{qc.inspector}</td>
                      <td className="p-3 text-slate-500 font-mono">{qc.inspectionDate || (qc.testedAt ? qc.testedAt.split('T')[0] : 'N/A')}</td>
                      <td className="p-3 text-center">{getStatusBadge(qc.status, qc.result)}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInspection(qc);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-medium text-xs">
                    No QC inspections found in the database. Click &ldquo;New QC Inspection&rdquo; to start testing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
