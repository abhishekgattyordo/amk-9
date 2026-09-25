import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Filter,
} from 'lucide-react';
import { QualityCheck } from '../../types';

interface QCHistoryViewProps {
  darkMode: boolean;
  history: QualityCheck[];
  loading: boolean;
  onSelectInspection: (inspection: QualityCheck) => void;
  onRefresh: () => void;
}

export const QCHistoryView: React.FC<QCHistoryViewProps> = ({
  darkMode,
  history,
  loading,
  onSelectInspection,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState('All');

  const filtered = history.filter((h) => {
    if (selectedResult !== 'All') {
      const st = (h.result || h.status || '').toUpperCase();
      if (selectedResult === 'Approved' && !st.includes('PASS') && !st.includes('APPROV')) return false;
      if (selectedResult === 'Rejected' && !st.includes('FAIL') && !st.includes('REJECT')) return false;
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      return (
        h.qcNumber?.toLowerCase().includes(s) ||
        h.referenceNumber?.toLowerCase().includes(s) ||
        h.inspector?.toLowerCase().includes(s) ||
        h.remarks?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const exportHistoryCSV = () => {
    const headers = ['Timestamp', 'QC Number', 'Type', 'Reference', 'Inspector', 'Result', 'Inspected Qty', 'Passed Qty', 'Rejected Qty', 'Remarks'];
    const rows = filtered.map((h) => [
      h.testedAt || h.createdAt || 'N/A',
      h.qcNumber,
      h.qcType,
      h.referenceNumber || 'N/A',
      h.inspector,
      h.result || h.status || 'N/A',
      h.inspectedQuantity || 0,
      h.passedQuantity || 0,
      h.rejectedQuantity || 0,
      `"${(h.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QC_Audit_History_${new Date().toISOString().split('T')[0]}.csv`);
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
            <History className="w-5 h-5 text-blue-500" />
            Quality Control Audit & Inspection History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable timeline of quality audits, certifications, releases, and non-conformance logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportHistoryCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Log
          </button>
        </div>
      </div>

      {/* Search & Filters */}
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
              placeholder="Search history by QC#, reference#, inspector, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition-all ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
              }`}
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-all font-medium ${
                darkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="All">All Results</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Timeline / Table */}
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
                <th className="p-3">Inspection Date / Time</th>
                <th className="p-3">QC Number</th>
                <th className="p-3">Category</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Inspector</th>
                <th className="p-3 text-right">Tested</th>
                <th className="p-3 text-right">Passed</th>
                <th className="p-3 text-right">Rejected</th>
                <th className="p-3 text-center">Verdict</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-medium text-xs">
                    {loading ? 'Loading historical log...' : 'No historical quality records matching search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((h) => {
                  const isPass = (h.result || h.status || '').toUpperCase().includes('PASS') || (h.result || h.status || '').toUpperCase().includes('APPROV');
                  return (
                    <tr
                      key={h.id}
                      onClick={() => onSelectInspection(h)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-mono text-slate-500">
                        {h.testedAt ? new Date(h.testedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : (h.inspectionDate || 'N/A')}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{h.qcNumber}</td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{h.qcType}</td>
                      <td className="p-3 font-mono text-slate-800 dark:text-slate-200">{h.referenceNumber || 'N/A'}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{h.inspector}</td>
                      <td className="p-3 text-right font-mono font-bold">{h.inspectedQuantity || h.expectedQuantity || 0}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{h.passedQuantity || 0}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{h.rejectedQuantity || 0}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isPass
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {isPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {h.result || h.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-[200px] truncate">{h.remarks || '-'}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInspection(h);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
