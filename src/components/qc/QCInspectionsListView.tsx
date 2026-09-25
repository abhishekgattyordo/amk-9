import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { QualityCheck } from '../../types';
import { Pagination } from '../common/Pagination';

interface QCInspectionsListViewProps {
  darkMode: boolean;
  inspections: QualityCheck[];
  loading: boolean;
  onRefresh: () => void;
  onSelectInspection: (inspection: QualityCheck) => void;
  onOpenNewInspectionModal: (qcType?: string) => void;
  onDeleteInspection: (id: string) => void;
  filterStatus?: string;
  filterType?: string;
}

export const QCInspectionsListView: React.FC<QCInspectionsListViewProps> = ({
  darkMode,
  inspections,
  loading,
  onRefresh,
  onSelectInspection,
  onOpenNewInspectionModal,
  onDeleteInspection,
  filterStatus = 'All',
  filterType = 'All',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(filterStatus);
  const [selectedType, setSelectedType] = useState(filterType);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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

  // Client-side filtering
  const filtered = inspections.filter((qc) => {
    // Status filter
    if (selectedStatus !== 'All') {
      const st = (qc.result || qc.status || '').toUpperCase();
      if (selectedStatus === 'Approved' && !st.includes('PASS') && !st.includes('APPROV')) return false;
      if (selectedStatus === 'Rejected' && !st.includes('FAIL') && !st.includes('REJECT')) return false;
      if (selectedStatus === 'Pending' && (st.includes('PASS') || st.includes('FAIL') || st.includes('APPROV') || st.includes('REJECT'))) return false;
      if (selectedStatus === 'Partially Approved' && !st.includes('PARTIAL')) return false;
    }

    // Type filter
    if (selectedType !== 'All' && qc.qcType !== selectedType) {
      return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchNumber = qc.qcNumber?.toLowerCase().includes(s);
      const matchRef = qc.referenceNumber?.toLowerCase().includes(s);
      const matchInspector = qc.inspector?.toLowerCase().includes(s);
      const matchCustomer = qc.salesOrder?.customerName?.toLowerCase().includes(s);
      const matchProduct = qc.product?.name?.toLowerCase().includes(s);
      const matchMaterial = qc.rawMaterial?.name?.toLowerCase().includes(s);
      const matchReason = qc.rejectionReason?.toLowerCase().includes(s);
      const matchStage = qc.stage?.toLowerCase().includes(s);
      return matchNumber || matchRef || matchInspector || matchCustomer || matchProduct || matchMaterial || matchReason || matchStage;
    }

    return true;
  });

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedList = filtered.slice(startIndex, startIndex + pageSize);

  const exportCSV = () => {
    const headers = ['QC Number', 'Type', 'Reference', 'Item / Product', 'Expected Qty', 'Inspected Qty', 'Passed Qty', 'Rejected Qty', 'Inspector', 'Date', 'Status', 'Result', 'Rejection Reason'];
    const rows = filtered.map(q => [
      q.qcNumber,
      q.qcType,
      q.referenceNumber || 'N/A',
      q.product?.name || q.rawMaterial?.name || 'N/A',
      q.expectedQuantity || 0,
      q.inspectedQuantity || 0,
      q.passedQuantity || 0,
      q.rejectedQuantity || 0,
      q.inspector,
      q.inspectionDate || q.testedAt?.split('T')[0] || 'N/A',
      q.status,
      q.result || 'Pending',
      `"${(q.rejectionReason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QC_Inspections_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Quality Control Inspections
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete registry of incoming, in-process, sample, and final product quality certifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => onOpenNewInspectionModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Inspection
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-3.5 rounded-2xl border space-y-3 ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by QC#, Order#, Reel#, Inspector, Product, Customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition-all ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
              }`}
            />
          </div>

          {/* QC Type Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-all font-medium ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
              }`}
            >
              <option value="All">All Inspection Types</option>
              <option value="Reel Inward QC">Reel Inward QC</option>
              <option value="Sample SO QC">Sample SO QC</option>
              <option value="Production QC">In-Process Production QC</option>
              <option value="Final QC">Final Box QC</option>
            </select>
          </div>
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-2.5">
          {['All', 'Pending', 'Approved', 'Partially Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setSelectedStatus(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 font-medium">
            Showing {filtered.length} records
          </span>
        </div>
      </div>

      {/* Inspections Table */}
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
                <th className="p-3">QC Number</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reference / Order</th>
                <th className="p-3">Product / Raw Material</th>
                <th className="p-3 text-right">Inspected</th>
                <th className="p-3 text-right">Passed</th>
                <th className="p-3 text-right">Rejected</th>
                <th className="p-3">Inspector</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-medium text-xs">
                    {loading ? 'Loading inspection records...' : 'No quality checks matching the criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((qc) => {
                  const refName =
                    qc.salesOrder?.customerName ||
                    qc.reelInward?.supplier?.name ||
                    qc.product?.name ||
                    qc.rawMaterial?.name ||
                    'N/A';
                  return (
                    <tr
                      key={qc.id}
                      onClick={() => onSelectInspection(qc)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {qc.qcNumber}
                      </td>
                      <td className="p-3">{getTypeBadge(qc.qcType)}</td>
                      <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {qc.referenceNumber || qc.salesOrder?.soNumber || qc.workOrder?.woNumber || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate">
                        {refName}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {qc.inspectedQuantity || qc.expectedQuantity || 0}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {qc.passedQuantity || 0}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {qc.rejectedQuantity || 0}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{qc.inspector}</td>
                      <td className="p-3 text-slate-500 font-mono">
                        {qc.inspectionDate || (qc.testedAt ? qc.testedAt.split('T')[0] : 'N/A')}
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(qc.status, qc.result)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectInspection(qc);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete Inspection"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete QC Inspection ${qc.qcNumber}?`)) {
                                onDeleteInspection(qc.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalRecords > pageSize && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={pageSize}
              onItemsPerPageChange={setPageSize}
              totalItems={totalRecords}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>
    </div>
  );
};
