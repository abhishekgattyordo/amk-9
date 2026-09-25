import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Users,
  ShoppingBag,
  Package,
  Boxes,
  Truck,
  Database,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { Pagination } from './Pagination';

interface RecycleBinPageProps {
  darkMode: boolean;
  onBack?: () => void;
}

export const RecycleBinPage: React.FC<RecycleBinPageProps> = ({ darkMode, onBack }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterPage, setFilterPage] = useState<string>('');
  const [filterDeletedBy, setFilterDeletedBy] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  
  // Selection state for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchRestoring, setIsBatchRestoring] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  
  // Confirmation modals
  const [confirmItem, setConfirmItem] = useState<{ action: 'restore' | 'delete'; item?: any; isBatch?: boolean } | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/recycle-bin');
      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
        setSelectedIds([]);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recycle bin');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 on filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, filterModule, filterPage, filterDeletedBy, filterDate, pageSize]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: data.length,
      Sales: 0,
      Production: 0,
      Costing: 0,
      'User Management': 0,
      Inventory: 0,
      'Raw Materials': 0,
      Procurement: 0,
      'Master Data': 0,
    };

    data.forEach(item => {
      if (counts[item.module] !== undefined) {
        counts[item.module] += 1;
      }
    });

    return counts;
  }, [data]);

  const filteredItems = useMemo(() => {
    return data.filter(item => {
      // Tab filter
      if (activeTab !== 'All' && item.module !== activeTab) return false;
      
      // Secondary filters
      if (filterModule && item.module !== filterModule) return false;
      if (filterPage && item.page !== filterPage) return false;
      if (filterDeletedBy && item.deletedBy !== filterDeletedBy) return false;
      if (filterDate && item.deletedAt) {
        const itemDateStr = new Date(item.deletedAt).toISOString().split('T')[0];
        if (itemDateStr !== filterDate) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matchesRecord = item.recordName?.toLowerCase().includes(q);
        const matchesModule = item.module?.toLowerCase().includes(q);
        const matchesPage = item.page?.toLowerCase().includes(q);
        const matchesUser = item.deletedBy?.toLowerCase().includes(q);
        const matchesId = item.id?.toLowerCase().includes(q);
        if (!matchesRecord && !matchesModule && !matchesPage && !matchesUser && !matchesId) return false;
      }
      return true;
    });
  }, [data, activeTab, filterModule, filterPage, filterDeletedBy, filterDate, search]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Toggle single item selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all on current page
  const handleToggleSelectAllPage = () => {
    const pageIds = paginatedItems.map(i => i.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const isAllPageSelected = paginatedItems.length > 0 && paginatedItems.every(i => selectedIds.includes(i.id));

  // Single Item Restore Execution
  const executeRestore = async (type: string, id: string) => {
    setRestoringId(id);
    try {
      const response = await fetch('/api/recycle-bin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      const res = await response.json();
      if (res.success) {
        setActionSuccessMsg('Record restored successfully.');
        setTimeout(() => setActionSuccessMsg(null), 3500);
        fetchData();
      } else {
        alert(`Failed to restore: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Network error while restoring: ${err.message}`);
    } finally {
      setRestoringId(null);
      setConfirmItem(null);
    }
  };

  // Single Item Permanent Delete Execution
  const executePermanentDelete = async (type: string, id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch('/api/recycle-bin/permanent-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, 
          id, 
          userName: 'Administrator',
          userRole: 'Administrator' 
        }),
      });
      const res = await response.json();
      if (res.success) {
        setActionSuccessMsg('Record permanently deleted.');
        setTimeout(() => setActionSuccessMsg(null), 3500);
        fetchData();
      } else {
        alert(`Failed to delete: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Network error while deleting: ${err.message}`);
    } finally {
      setDeletingId(null);
      setConfirmItem(null);
    }
  };

  // Batch Restore Execution
  const executeBatchRestore = async () => {
    setIsBatchRestoring(true);
    try {
      const itemsToRestore = data.filter(d => selectedIds.includes(d.id));
      for (const item of itemsToRestore) {
        await fetch('/api/recycle-bin/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: item.type, id: item.id }),
        });
      }
      setActionSuccessMsg(`${itemsToRestore.length} record(s) restored successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      alert(`Error during batch restore: ${err.message}`);
    } finally {
      setIsBatchRestoring(false);
      setConfirmItem(null);
    }
  };

  // Batch Permanent Delete Execution
  const executeBatchDelete = async () => {
    setIsBatchDeleting(true);
    try {
      const itemsToDelete = data.filter(d => selectedIds.includes(d.id));
      for (const item of itemsToDelete) {
        await fetch('/api/recycle-bin/permanent-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: item.type,
            id: item.id,
            userName: 'Administrator',
            userRole: 'Administrator'
          }),
        });
      }
      setActionSuccessMsg(`${itemsToDelete.length} record(s) permanently removed.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      alert(`Error during batch delete: ${err.message}`);
    } finally {
      setIsBatchDeleting(false);
      setConfirmItem(null);
    }
  };

  // Module Badges Styling
  const getModuleBadge = (module: string) => {
    switch (module) {
      case 'User Management':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Sales':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Production':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Costing':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Inventory':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'Raw Materials':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'Procurement':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'Master Data':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'User Management': return <Users className="w-3.5 h-3.5" />;
      case 'Sales': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'Production': return <Layers className="w-3.5 h-3.5" />;
      case 'Costing': return <Sparkles className="w-3.5 h-3.5" />;
      case 'Inventory': return <Package className="w-3.5 h-3.5" />;
      case 'Raw Materials': return <Boxes className="w-3.5 h-3.5" />;
      case 'Procurement': return <Truck className="w-3.5 h-3.5" />;
      case 'Master Data': return <Database className="w-3.5 h-3.5" />;
      default: return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const uniqueModules = Array.from(new Set(data.map(item => item.module))).filter(Boolean);
  const uniquePages = Array.from(new Set(data.map(item => item.page))).filter(Boolean);
  const uniqueDeletedBy = Array.from(new Set(data.map(item => item.deletedBy))).filter(Boolean);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button 
              onClick={onBack} 
              className={`p-2 rounded-xl border transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Recycle Bin & Data Recovery
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Centralized recovery vault across Sales, Production, Costing, Procurement, Inventory, Master Data, and User Management.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Refresh Vault</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between animate-fade-in text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Module Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Sales', 'Production', 'Costing', 'User Management', 'Inventory', 'Raw Materials', 'Procurement', 'Master Data'].map((tab) => {
          const count = tabCounts[tab] || 0;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? (darkMode 
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                      : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs')
                  : (darkMode 
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs')
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                isActive 
                  ? 'bg-emerald-500 text-white' 
                  : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-center gap-3.5 ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className={`flex items-center px-3.5 py-2 rounded-xl border flex-1 w-full ${
          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search records by name, ID, user, or page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-transparent border-none focus:outline-none text-xs ${
              darkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
            }`}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {activeTab === 'All' && (
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="">All Modules</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="">All Sections</option>
            {uniquePages.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filterDeletedBy}
            onChange={(e) => setFilterDeletedBy(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="">Deleted By</option>
            {uniqueDeletedBy.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
            }`}
          />

          {(filterModule || filterPage || filterDeletedBy || filterDate) && (
            <button
              onClick={() => {
                setFilterModule('');
                setFilterPage('');
                setFilterDeletedBy('');
                setFilterDate('');
              }}
              className="px-2.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Batch Operations Bar */}
      {selectedIds.length > 0 && (
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between animate-fade-in ${
          darkMode ? 'bg-indigo-950/40 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500 text-white font-mono">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">
              records selected for bulk operation
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setConfirmItem({ action: 'restore', isBatch: true })}
              disabled={isBatchRestoring}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {isBatchRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Restore Selected</span>
            </button>
            
            <button
              onClick={() => setConfirmItem({ action: 'delete', isBatch: true })}
              disabled={isBatchDeleting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {isBatchDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Permanent Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className={`p-1.5 rounded-lg border transition-all ${
                darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-white text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-3" />
            <p className="text-xs font-bold text-slate-400">Loading deleted records from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-3" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 border border-slate-200 dark:border-slate-700">
              <Trash2 className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Recycle Bin is Empty
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              No soft-deleted records found matching your filters. When items from User Management, Sales, Inventory, or Procurement are deleted, they will appear here.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={darkMode ? 'bg-slate-800/60' : 'bg-slate-50'}>
                    <th className="px-4 py-3.5 w-10">
                      <button
                        onClick={handleToggleSelectAllPage}
                        className="text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        {isAllPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Module & Section</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Record Title & Identifier</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Deleted By</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Archived Timestamp</th>
                    <th className="px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedItems.map((item: any) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isRestoringThis = restoringId === item.id;
                    const isDeletingThis = deletingId === item.id;

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isSelected 
                            ? (darkMode ? 'bg-emerald-950/20' : 'bg-emerald-50/50') 
                            : (darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80')
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleSelect(item.id)}
                            className="text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getModuleBadge(item.module)}`}>
                              {getModuleIcon(item.module)}
                              <span>{item.module}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 font-medium pl-1">
                            {item.page}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.recordName}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono tracking-tight">
                            ID: {item.id}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="inline-flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            <span>{item.deletedBy || 'Administrator'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setConfirmItem({ action: 'restore', item })}
                              disabled={isRestoringThis || isDeletingThis}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-bold cursor-pointer disabled:opacity-50"
                            >
                              {isRestoringThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => setConfirmItem({ action: 'delete', item })}
                              disabled={isRestoringThis || isDeletingThis}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all text-xs font-bold cursor-pointer disabled:opacity-50"
                            >
                              {isDeletingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setPageSize}
                darkMode={darkMode}
                itemName="records"
                itemsPerPageOptions={[5, 10, 20, 50, 100]}
              />
            )}
          </div>
        )}
      </div>

      {/* ======================== CONFIRMATION MODAL ======================== */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 overflow-hidden ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start space-x-3.5 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmItem.action === 'restore' 
                  ? 'bg-emerald-500/15 text-emerald-500' 
                  : 'bg-rose-500/15 text-rose-500'
              }`}>
                {confirmItem.action === 'restore' ? (
                  <RotateCcw className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">
                  {confirmItem.action === 'restore' 
                    ? (confirmItem.isBatch ? 'Confirm Batch Restoration' : 'Confirm Record Restoration')
                    : (confirmItem.isBatch ? 'Confirm Permanent Deletion' : 'Confirm Permanent Deletion')}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {confirmItem.action === 'restore' ? (
                    confirmItem.isBatch ? (
                      `Are you sure you want to restore all ${selectedIds.length} selected records back to their respective ERP modules?`
                    ) : (
                      `Are you sure you want to restore "${confirmItem.item?.recordName}" (${confirmItem.item?.module}) back into active use?`
                    )
                  ) : (
                    confirmItem.isBatch ? (
                      `WARNING: You are about to permanently remove all ${selectedIds.length} selected records. This action is irreversible.`
                    ) : (
                      `WARNING: Are you sure you want to permanently delete "${confirmItem.item?.recordName}"? This action CANNOT be undone and will purge the data from the database.`
                    )
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  darkMode
                    ? 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmItem.action === 'restore') {
                    if (confirmItem.isBatch) {
                      executeBatchRestore();
                    } else {
                      executeRestore(confirmItem.item.type, confirmItem.item.id);
                    }
                  } else {
                    if (confirmItem.isBatch) {
                      executeBatchDelete();
                    } else {
                      executePermanentDelete(confirmItem.item.type, confirmItem.item.id);
                    }
                  }
                }}
                className={`flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  confirmItem.action === 'restore'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10'
                }`}
              >
                {confirmItem.action === 'restore' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Restore</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanent Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

