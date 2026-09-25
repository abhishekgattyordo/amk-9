import React, { useState } from 'react';
import { Plus, Eye, Trash2, Search, Edit3 } from 'lucide-react';
import { RFQItem, Supplier } from '../../types';

interface RFQViewProps {
  darkMode: boolean;
  rfqs: RFQItem[];
  suppliers: Supplier[];
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  onRaiseNewRfq: () => void;
  onViewRfq: (rfq: RFQItem) => void;
  onEditRfq?: (rfq: RFQItem) => void;
  onCompareQuotes?: (rfq: RFQItem) => void;
  onDuplicateRfq?: (rfq: RFQItem) => void;
  onDeleteRfq: (rfq: RFQItem) => void;
}

export const RFQView: React.FC<RFQViewProps> = ({
  darkMode,
  rfqs,
  suppliers,
  getSupplierDisplayName,
  onRaiseNewRfq,
  onViewRfq,
  onEditRfq,
  onDeleteRfq,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'converted' | 'all'>('active');
  
  const isConvertedRfq = (rfq: RFQItem) => {
    if (!rfq) return false;
    const status = (rfq.status || '').toLowerCase();
    if (status === 'converted' || status === 'awarded' || status === 'po created' || status === 'closed') return true;
    if ((rfq as any).isConverted || (rfq as any).isConvertedToQuote) return true;
    if (Array.isArray((rfq as any).quotations) && (rfq as any).quotations.some((q: any) => !q.isDeleted)) return true;
    return false;
  };

  const safeRfqs = Array.isArray(rfqs) ? rfqs : [];

  const filteredRfqs = safeRfqs.filter(rfq => {
    if (!rfq) return false;

    // Filter by conversion status
    const isConverted = isConvertedRfq(rfq);
    if (activeFilter === 'active' && isConverted) return false;
    if (activeFilter === 'converted' && !isConverted) return false;

    const rfqNum = (rfq.rfqNumber || '').toLowerCase();
    const dept = (rfq.department || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchRfq = rfqNum.includes(query) || dept.includes(query);
    const matchMaterials = (rfq.materials || []).some(m => 
      (m?.name || '').toLowerCase().includes(query) || 
      (m?.materialCode || '').toLowerCase().includes(query)
    );
    const matchSuppliers = (rfq.suppliers || []).some(s => {
      const displayName = getSupplierDisplayName(s?.supplierId || (s as any)?.id, s?.supplierName, (s as any)?.millName, s);
      return (displayName || '').toLowerCase().includes(query);
    });
    return matchRfq || matchMaterials || matchSuppliers;
  });

  const activeCount = safeRfqs.filter(r => !isConvertedRfq(r)).length;
  const convertedCount = safeRfqs.filter(r => isConvertedRfq(r)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            Requests for Quotation (RFQ)
          </h3>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'active'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveFilter('converted')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'converted'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Converted to Quote ({convertedCount})
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({safeRfqs.length})
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Search RFQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 pr-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                />
            </div>
            <button
            onClick={onRaiseNewRfq}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-1 cursor-pointer"
            >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise New RFQ</span>
            </button>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="p-3">RFQ Number / Date</th>
                <th className="p-3">Material Details</th>
                <th className="p-3 text-right">Qty Requested</th>
                <th className="p-3">Department / Target</th>
                <th className="p-3">Invited Suppliers</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredRfqs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {activeFilter === 'active' ? (
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-400">No active pending RFQs found.</p>
                        <p className="text-xs text-slate-500 mt-1">Converted RFQs are now tracked in <strong className="text-emerald-500">Supplier Quotations</strong>.</p>
                        <button onClick={onRaiseNewRfq} className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer">
                          Raise New RFQ
                        </button>
                      </div>
                    ) : (
                      'No RFQs match your filter.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredRfqs.map(rfq => {
                  const materials = rfq.materials || [];
                  const suppliersList = rfq.suppliers || [];
                  const firstMat = materials[0];
                  const isConverted = isConvertedRfq(rfq);

                  return (
                    <tr key={rfq.id || Math.random()} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/35' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-emerald-500">{rfq.rfqNumber || 'N/A'}</div>
                        <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5">{rfq.rfqDate || ''}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {materials.length <= 1 
                            ? (firstMat?.name || 'Item')
                            : `${firstMat?.name || 'Item'} (+${materials.length - 1} more)`}
                        </div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-500 font-mono">
                          {materials.length <= 1 
                            ? (firstMat?.materialCode || '')
                            : `${materials.length} raw materials`}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {materials.length <= 1 
                          ? `${(Number(firstMat?.quantity) || 0).toLocaleString()} ${firstMat?.unit || ''}` 
                          : `${materials.reduce((sum, m) => sum + (Number(m?.quantity) || 0), 0).toLocaleString()} total`}
                      </td>
                      <td className="p-3">
                        <div>{rfq.department || 'Procurement'}</div>
                        <div className="text-[10px] text-slate-700 dark:text-slate-400 font-bold">Target Date: {rfq.deliveryDate || ''}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-400">
                        {suppliersList.map(s => getSupplierDisplayName(s?.supplierId || (s as any)?.id, s?.supplierName, (s as any)?.millName, s)).filter(Boolean).join(', ') || 'None'}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isConverted 
                            ? 'bg-blue-500/15 text-blue-500 border border-blue-500/20'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                        }`}>
                          {isConverted ? 'Converted' : (rfq.status || 'Draft')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onViewRfq(rfq)}
                            className="p-1 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                            title="View RFQ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {onEditRfq && (
                            <button
                              onClick={() => onEditRfq(rfq)}
                              className="p-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Edit RFQ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteRfq(rfq)}
                            className="p-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                            title="Delete RFQ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
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
      </div>
    </div>
  );
};


