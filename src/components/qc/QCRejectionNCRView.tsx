import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { QualityCheck } from '../../types';

interface QCRejectionNCRViewProps {
  darkMode: boolean;
  rejections: QualityCheck[];
  loading: boolean;
  onSelectInspection: (inspection: QualityCheck) => void;
  onRefresh: () => void;
}

export const QCRejectionNCRView: React.FC<QCRejectionNCRViewProps> = ({
  darkMode,
  rejections,
  loading,
  onSelectInspection,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = rejections.filter((r) => {
    if (typeFilter !== 'All' && r.qcType !== typeFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchQc = r.qcNumber?.toLowerCase().includes(s);
      const matchRef = r.referenceNumber?.toLowerCase().includes(s);
      const matchReason = r.rejectionReason?.toLowerCase().includes(s);
      const matchRoot = r.rootCause?.toLowerCase().includes(s);
      const matchAction = r.correctiveAction?.toLowerCase().includes(s);
      const matchInspector = r.inspector?.toLowerCase().includes(s);
      return matchQc || matchRef || matchReason || matchRoot || matchAction || matchInspector;
    }
    return true;
  });

  const totalRejectedQty = rejections.reduce((acc, r) => acc + (r.rejectedQuantity || 0), 0);

  const exportNCRCSV = () => {
    const headers = ['NCR / QC Number', 'Type', 'Reference', 'Rejection Reason', 'Root Cause Analysis', 'Corrective Action', 'Rejected Quantity', 'Inspector', 'Date'];
    const rows = filtered.map((r) => [
      r.qcNumber,
      r.qcType,
      r.referenceNumber || 'N/A',
      `"${(r.rejectionReason || '').replace(/"/g, '""')}"`,
      `"${(r.rootCause || '').replace(/"/g, '""')}"`,
      `"${(r.correctiveAction || '').replace(/"/g, '""')}"`,
      r.rejectedQuantity || 0,
      r.inspector,
      r.inspectionDate || r.testedAt?.split('T')[0] || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QC_NCR_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            Non-Conformance Reports (NCR) & Rejection Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quarantined batches, failure root cause investigations, and corrective/preventive actions (CAPA).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportNCRCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export NCR Log
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Total Logged NCRs</span>
          <div className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-300">{rejections.length}</div>
          <span className="text-[11px] text-rose-600/80">Rejection incidences recorded</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Quarantined / Rejected Items</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalRejectedQty.toLocaleString()} units/kg
          </div>
          <span className="text-[11px] text-slate-500">Material diverted to scrap / rework</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Root Cause Documented</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {rejections.filter((r) => r.rootCause).length} of {rejections.length}
          </div>
          <span className="text-[11px] text-emerald-600/80">CAPA Compliance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search NCR#, reason, root cause, order#, inspector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition-all ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500'
              }`}
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-all font-medium ${
                darkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="All">All QC Types</option>
              <option value="Reel Inward QC">Reel Inward QC</option>
              <option value="Sample SO QC">Sample SO QC</option>
              <option value="Production QC">Production In-Process</option>
              <option value="Final QC">Final Box QC</option>
            </select>
          </div>
        </div>
      </div>

      {/* NCR Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b font-bold uppercase tracking-wider ${
                  darkMode ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <th className="p-3">NCR #</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reference Order</th>
                <th className="p-3">Rejection Reason</th>
                <th className="p-3">Root Cause</th>
                <th className="p-3">Corrective Action</th>
                <th className="p-3 text-right">Rejected Qty</th>
                <th className="p-3">Inspector</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-medium text-xs">
                    {loading ? 'Loading NCR records...' : 'No non-conformance records found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelectInspection(r)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">{r.qcNumber}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                        {r.qcType}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {r.referenceNumber || r.salesOrder?.soNumber || r.workOrder?.woNumber || 'N/A'}
                    </td>
                    <td className="p-3 font-semibold text-rose-600 dark:text-rose-400 max-w-[180px] truncate">
                      {r.rejectionReason || 'Deviation from specifications'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                      {r.rootCause || '-'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                      {r.correctiveAction || '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {r.rejectedQuantity || 0}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{r.inspector}</td>
                    <td className="p-3 text-slate-500 font-mono">
                      {r.inspectionDate || (r.testedAt ? r.testedAt.split('T')[0] : 'N/A')}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInspection(r);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
