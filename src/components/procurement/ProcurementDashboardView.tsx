import React, { useState, useMemo } from 'react';
import { 
  FileText, ShoppingCart, Award, Truck, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Search, X, AlertTriangle 
} from 'lucide-react';
import { RawMaterial } from '../../types';
import { Pagination } from '../common/Pagination';

interface ProcurementDashboardViewProps {
  darkMode: boolean;
  totalRfqCount: number;
  pendingRfqCount: number;
  approvedPoCount: number;
  pendingDelCount: number;
  totalProcValue: number;
  activeSups: number;
  lowStockItems: RawMaterial[];
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  handleInitiateRfq: (rm: RawMaterial) => void;
}

export const ProcurementDashboardView: React.FC<ProcurementDashboardViewProps> = ({
  darkMode,
  totalRfqCount,
  pendingRfqCount,
  approvedPoCount,
  pendingDelCount,
  totalProcValue,
  activeSups,
  lowStockItems,
  getSupplierDisplayName,
  handleInitiateRfq,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter low stock items based on search
  const filteredLowStockItems = useMemo(() => {
    if (!searchQuery.trim()) return lowStockItems;
    const query = searchQuery.trim().toLowerCase();
    return lowStockItems.filter(rm => {
      const code = (rm.code || '').toLowerCase();
      const name = (rm.name || '').toLowerCase();
      const grade = (rm.grade || '').toLowerCase();
      const category = (rm.category || '').toLowerCase();
      const supplierName = getSupplierDisplayName(rm.supplierId, rm.supplier?.supplierName, (rm.supplier as any)?.millName, rm.supplier).toLowerCase();
      return code.includes(query) || name.includes(query) || grade.includes(query) || category.includes(query) || supplierName.includes(query);
    });
  }, [lowStockItems, searchQuery, getSupplierDisplayName]);

  // Pagination calculations
  const totalItems = filteredLowStockItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filteredLowStockItems.slice(startIndex, endIndex);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* KPI Widget Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total RFQs Sent', val: totalRfqCount, detail: `${pendingRfqCount} Pending response`, icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
          { title: 'Approved POs Raised', val: approvedPoCount, detail: `${pendingDelCount} Pending delivery`, icon: ShoppingCart, color: 'text-emerald-500 bg-emerald-500/10' },
          { title: 'Procurement Value', val: `₹${(totalProcValue / 1000).toFixed(1)}k`, detail: 'Total spending year-to-date', icon: Award, color: 'text-blue-500 bg-blue-500/10' },
          { title: 'Active Suppliers', val: activeSups, detail: '100% on-time delivery metric', icon: Truck, color: 'text-rose-500 bg-rose-500/10' },
        ].map((kpi, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">{kpi.title}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-slate-950'}`}>{kpi.val}</div>
            <p className="text-[10px] text-slate-700 dark:text-slate-400 mt-1">{kpi.detail}</p>
          </div>
        ))}
      </div>

      {/* Charts & Trends panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Purchase Trend Chart (SVG) */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Monthly Purchases Trend (₹)</h3>
          <div className="h-44 flex items-end justify-between space-x-2 px-2 pt-2 border-b border-l border-slate-700/30">
            {[
              { month: 'Mar', val: 120000, h: 'h-[30%]' },
              { month: 'Apr', val: 180000, h: 'h-[45%]' },
              { month: 'May', val: 240000, h: 'h-[60%]' },
              { month: 'Jun', val: 190000, h: 'h-[48%]' },
              { month: 'Jul', val: 310000, h: 'h-[78%]' },
              { month: 'Aug', val: totalProcValue, h: 'h-[95%]' }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
                  ₹{bar.val.toLocaleString()}
                </div>
                <div className={`w-full ${bar.h} bg-emerald-600 group-hover:bg-emerald-500 rounded-t-md transition-colors`}></div>
                <span className="text-[10px] text-slate-700 dark:text-slate-400 mt-2">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Spending Share */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Procurement Material Breakdown</h3>
          <div className="space-y-3.5">
            {[
              { label: 'Virgin Kraft reels (180 GSM / 200 GSM)', val: '₹312,500', share: '75%', color: 'bg-emerald-500' },
              { label: 'Semi-Chemical Fluting Medium', val: '₹96,000', share: '20%', color: 'bg-blue-500' },
              { label: 'Adhesives (Modified Corn Starch)', val: '₹12,200', share: '5%', color: 'bg-amber-500' }
            ].map((item, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between font-medium mb-1">
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700 dark:text-slate-400'}>{item.label}</span>
                  <span className="font-bold">{item.val} ({item.share})</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.share }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Suggested Procurement */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>Low Stock Purchase Suggestions</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500">
                {lowStockItems.length} Materials Flagged
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-400 mt-0.5">Calculated based on real-time inventory minimum stock and reorder thresholds</p>
          </div>

          {/* Quick Search for Low Stock Items */}
          {lowStockItems.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search suggestions..."
                className={`w-full pl-8 pr-8 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {lowStockItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-700 dark:text-slate-400">
            ✓ All raw materials are well stocked above reorder levels.
          </div>
        ) : filteredLowStockItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No suggestions match your search filter "{searchQuery}".
          </div>
        ) : (
          <div>
            <div className="divide-y divide-slate-800/40">
              {paginatedItems.map((rm) => {
                const deficit = Math.max(0, (rm.reorderLevel || 0) - (rm.currentStock || 0));
                const isCritical = (rm.currentStock || 0) <= (rm.minStock || 0);

                return (
                  <div key={rm.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/5 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">{rm.code}</span>
                        <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-950'}`}>{rm.name}</span>
                        {rm.category && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            {rm.category}
                          </span>
                        )}
                        {isCritical ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center">
                            <AlertTriangle className="w-2.5 h-2.5 mr-1" /> Critical Stock
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Below Reorder Level
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Current Stock: <strong className="text-rose-500 font-bold">{rm.currentStock} {rm.uom}</strong></span>
                        <span>Reorder Threshold: <strong className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{rm.reorderLevel} {rm.uom}</strong></span>
                        {deficit > 0 && (
                          <span>Suggested Min Purchase: <strong className="text-emerald-500 font-bold">+{deficit} {rm.uom}</strong></span>
                        )}
                        <span>Supplier: <strong className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{getSupplierDisplayName(rm.supplierId, rm.supplier?.supplierName, (rm.supplier as any)?.millName, rm.supplier)}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInitiateRfq(rm)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all self-start sm:self-center cursor-pointer flex items-center space-x-1 whitespace-nowrap"
                    >
                      <span>Raise Suggestion RFQ</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <Pagination
                currentPage={validCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                darkMode={darkMode}
                itemName="suggestions"
                itemsPerPageOptions={[5, 10, 20, 50]}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

