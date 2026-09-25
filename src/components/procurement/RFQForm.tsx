import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, ArrowUp, ArrowDown, X, Copy, Trash2, Search, Check, 
  Building2, Package, Calendar, Loader2, Edit2, AlertCircle 
} from 'lucide-react';
import { RawMaterial, Supplier } from '../../types';

interface RFQFormProps {
  newRfq: any;
  setNewRfq: (rfq: any) => void;
  rfqItems: any[];
  setRfqItems: (items: any[]) => void;
  suppliers: Supplier[];
  rawMaterials?: RawMaterial[];
  darkMode: boolean;
  handleAddRfqItem: () => void;
  handleUpdateRfqItem: (index: number, field: string, value: any) => void;
  handleMoveRfqItem: (index: number, direction: 'up' | 'down') => void;
  handleRemoveRfqItem: (index: number) => void;
  handleDuplicateRfqItem: (index: number) => void;
  allowDuplicateMaterials: boolean;
  setAllowDuplicateMaterials: (val: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

// -------------------------------------------------------------
// Searchable Material Picker Component for Line Item Row
// -------------------------------------------------------------
interface MaterialSearchPickerProps {
  item: any;
  index: number;
  darkMode: boolean;
  rawMaterials?: RawMaterial[];
  onSelectMaterial: (mat: RawMaterial) => void;
  onClearMaterial: () => void;
}

const MaterialSearchPicker: React.FC<MaterialSearchPickerProps> = ({
  item,
  index,
  darkMode,
  rawMaterials = [],
  onSelectMaterial,
  onClearMaterial
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce user input
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const performSearch = async () => {
      try {
        const res = await fetch(`/api/raw-materials?search=${encodeURIComponent(trimmed)}&limit=15`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setSearchResults(json.data);
          } else {
            // Fallback to searching the provided database rawMaterials list
            const q = trimmed.toLowerCase();
            const localMatches = rawMaterials.filter(m =>
              (m.name || '').toLowerCase().includes(q) ||
              (m.code || '').toLowerCase().includes(q) ||
              (m.category || '').toLowerCase().includes(q)
            );
            setSearchResults(localMatches);
          }
        }
      } catch (err) {
        if (isMounted) {
          const q = trimmed.toLowerCase();
          const localMatches = rawMaterials.filter(m =>
            (m.name || '').toLowerCase().includes(q) ||
            (m.code || '').toLowerCase().includes(q)
          );
          setSearchResults(localMatches);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, rawMaterials]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSelectedMaterial = Boolean(item.materialId || item.name || item.materialCode);
  const displayCode = item.materialCode || item.materialId;
  const displayName = item.name || (rawMaterials.find(m => m.id === item.materialId || m.code === item.materialCode)?.name);

  return (
    <div className="relative w-full" ref={containerRef}>
      {hasSelectedMaterial && !isOpen ? (
        <div 
          className={`flex items-center justify-between h-9 px-2.5 rounded-lg border text-xs group transition-all ${
            darkMode 
              ? 'bg-slate-800/90 border-slate-700 hover:border-emerald-500/50 text-white' 
              : 'bg-white border-slate-200 hover:border-emerald-500/50 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-1.5 min-w-0 overflow-hidden">
            {displayCode && (
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                darkMode ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {displayCode}
              </span>
            )}
            <span className="truncate font-medium text-xs">
              {displayName || 'Selected Material'}
            </span>
          </div>
          <div className="flex items-center space-x-1 shrink-0 ml-1">
            <button
              type="button"
              onClick={() => {
                setQuery(displayName || '');
                setIsOpen(true);
              }}
              title="Change Material"
              className={`p-1 rounded transition-colors ${
                darkMode ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
              }`}
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onClearMaterial}
              title="Clear Material"
              className={`p-1 rounded transition-colors ${
                darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-700' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search material by name or code..."
              className={`w-full h-9 pl-8 pr-7 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results Popover */}
          {isOpen && (
            <div className={`absolute left-0 top-full mt-1 w-[340px] max-w-[90vw] z-50 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
              darkMode 
                ? 'bg-slate-900 border-slate-700 text-white shadow-black/80' 
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}>
              {/* State 1: User hasn't typed anything yet */}
              {!query.trim() && (
                <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
                  <Search className="w-4 h-4 text-slate-500 opacity-60" />
                  <span>Type material name or code to search</span>
                </div>
              )}

              {/* State 2: Loading search results */}
              {query.trim() && isLoading && (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Searching materials...</span>
                </div>
              )}

              {/* State 3: Search returned no results */}
              {query.trim() && !isLoading && searchResults.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No materials found matching <span className="font-semibold text-emerald-400">"{debouncedQuery}"</span>
                </div>
              )}

              {/* State 4: Matching Results List */}
              {query.trim() && !isLoading && searchResults.length > 0 && (
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/30">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-500/5">
                    {searchResults.length} {searchResults.length === 1 ? 'Match' : 'Matches'} Found
                  </div>
                  {searchResults.map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => {
                        onSelectMaterial(mat);
                        setIsOpen(false);
                        setQuery('');
                        setDebouncedQuery('');
                      }}
                      className={`w-full text-left p-2.5 flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                        darkMode 
                          ? 'hover:bg-slate-800 text-slate-200 hover:text-white' 
                          : 'hover:bg-emerald-50/80 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          {mat.code && (
                            <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                              darkMode ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {mat.code}
                            </span>
                          )}
                          <span className="font-semibold text-xs truncate">{mat.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
                          {mat.category && <span>Category: {mat.category}</span>}
                          {mat.currentStock !== undefined && (
                            <span>• Stock: {mat.currentStock} {mat.uom || 'Kg'}</span>
                          )}
                        </div>
                      </div>
                      {mat.purchasePrice !== undefined && mat.purchasePrice > 0 && (
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            ₹{mat.purchasePrice}
                          </span>
                          <span className="text-[9px] text-slate-400 block">/{mat.uom || 'Kg'}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Main RFQ Form Component
// -------------------------------------------------------------
export const RFQForm: React.FC<RFQFormProps> = ({
  newRfq,
  setNewRfq,
  rfqItems,
  setRfqItems,
  suppliers,
  rawMaterials = [],
  darkMode,
  handleAddRfqItem,
  handleUpdateRfqItem,
  handleMoveRfqItem,
  handleRemoveRfqItem,
  handleDuplicateRfqItem,
  allowDuplicateMaterials,
  setAllowDuplicateMaterials,
  handleSubmit
}) => {
  const selectedSuppliers: string[] = newRfq.selectedSuppliers || [];
  const setSelectedSuppliers = (ids: string[]) => setNewRfq({ ...newRfq, selectedSuppliers: ids });

  // -----------------------------------------------------------
  // Debounced Supplier Search State (No full list by default)
  // -----------------------------------------------------------
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [debouncedSupplierQuery, setDebouncedSupplierQuery] = useState('');
  const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);
  const [searchedSuppliers, setSearchedSuppliers] = useState<Supplier[]>([]);

  const supplierDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce supplier search text
  useEffect(() => {
    if (supplierDebounceRef.current) clearTimeout(supplierDebounceRef.current);
    supplierDebounceRef.current = setTimeout(() => {
      setDebouncedSupplierQuery(supplierSearchQuery);
    }, 300);
    return () => {
      if (supplierDebounceRef.current) clearTimeout(supplierDebounceRef.current);
    };
  }, [supplierSearchQuery]);

  // Fetch / filter matching suppliers when debounced query is present
  useEffect(() => {
    const trimmed = debouncedSupplierQuery.trim();
    if (!trimmed) {
      setSearchedSuppliers([]);
      setIsSearchingSuppliers(false);
      return;
    }

    let isMounted = true;
    setIsSearchingSuppliers(true);

    const fetchSuppliers = async () => {
      try {
        const res = await fetch(`/api/suppliers?search=${encodeURIComponent(trimmed)}&limit=30`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setSearchedSuppliers(json.data);
          } else {
            const q = trimmed.toLowerCase();
            const localMatches = suppliers.filter(s =>
              (s.supplierName || '').toLowerCase().includes(q) ||
              ((s as any).supplierCode || '').toLowerCase().includes(q) ||
              ((s as any).millName || '').toLowerCase().includes(q) ||
              ((s as any).city || '').toLowerCase().includes(q)
            );
            setSearchedSuppliers(localMatches);
          }
        }
      } catch (err) {
        if (isMounted) {
          const q = trimmed.toLowerCase();
          const localMatches = suppliers.filter(s =>
            (s.supplierName || '').toLowerCase().includes(q) ||
            ((s as any).supplierCode || '').toLowerCase().includes(q) ||
            ((s as any).millName || '').toLowerCase().includes(q)
          );
          setSearchedSuppliers(localMatches);
        }
      } finally {
        if (isMounted) setIsSearchingSuppliers(false);
      }
    };

    fetchSuppliers();

    return () => {
      isMounted = false;
    };
  }, [debouncedSupplierQuery, suppliers]);

  // Resolve objects for selected suppliers
  const selectedSupplierObjects = useMemo(() => {
    return selectedSuppliers.map(id => {
      const found = suppliers.find(s => s.id === id) || searchedSuppliers.find(s => s.id === id);
      return found || { id, supplierName: `Supplier ${id}` } as Supplier;
    });
  }, [suppliers, searchedSuppliers, selectedSuppliers]);

  // Handler for selecting a material from search
  const handleSelectMaterial = useCallback((index: number, mat: RawMaterial) => {
    const copy = [...rfqItems];
    const current = { ...copy[index] };
    current.materialId = mat.id;
    current.materialCode = mat.code || mat.id;
    current.name = mat.name;
    if (!current.description) {
      current.description = mat.description || '';
    }
    current.unit = mat.uom || current.unit || 'Kg';
    if (mat.purchasePrice !== undefined && mat.purchasePrice > 0 && !current.expectedPrice) {
      current.expectedPrice = mat.purchasePrice;
    }
    copy[index] = current;
    setRfqItems(copy);
  }, [rfqItems, setRfqItems]);

  // Handler for clearing a material selection on a line item
  const handleClearMaterial = useCallback((index: number) => {
    const copy = [...rfqItems];
    const current = { ...copy[index] };
    current.materialId = '';
    current.materialCode = '';
    current.name = '';
    copy[index] = current;
    setRfqItems(copy);
  }, [rfqItems, setRfqItems]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 flex-1">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header Details Card */}
      {/* ------------------------------------------------------------- */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Originating Department
            </label>
            <select 
              value={newRfq.department || 'Production Plant'} 
              onChange={(e) => setNewRfq({ ...newRfq, department: e.target.value })} 
              className={`w-full h-9 px-3 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="Production Plant">Production Plant</option>
              <option value="Adhesives Dept">Adhesives Dept</option>
              <option value="Corrugation Line">Corrugation Line</option>
              <option value="Printing Section">Printing Section</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Priority Level
            </label>
            <select 
              value={newRfq.priority || 'Medium'} 
              onChange={(e) => setNewRfq({ ...newRfq, priority: e.target.value as any })} 
              className={`w-full h-9 px-3 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Default Target Delivery Date
            </label>
            <input
              type="date"
              value={newRfq.deliveryDate || ''}
              onChange={(e) => setNewRfq({ ...newRfq, deliveryDate: e.target.value })}
              className={`w-full h-9 px-3 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              RFQ Brief Description
            </label>
            <input 
              type="text" 
              value={newRfq.description || ''} 
              onChange={(e) => setNewRfq({ ...newRfq, description: e.target.value })} 
              placeholder="e.g., Raw material replenishment for Box Line 2" 
              className={`w-full h-9 px-3 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
              }`} 
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Raw Materials Line Items Section */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        {/* Section Header with Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Package className="w-4 h-4 text-emerald-500" />
              <span>Requested Raw Materials Line Items</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              {rfqItems.length} {rfqItems.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <div className="flex items-center space-x-3.5">
            <label className={`flex items-center space-x-2 text-xs font-medium cursor-pointer select-none ${
              darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}>
              <input 
                type="checkbox" 
                checked={allowDuplicateMaterials} 
                onChange={(e) => setAllowDuplicateMaterials(e.target.checked)} 
                className="rounded accent-emerald-600 w-3.5 h-3.5 cursor-pointer" 
              />
              <span>Allow duplicate materials</span>
            </label>

            <button
              type="button"
              onClick={handleAddRfqItem}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Raw Material Item</span>
            </button>
          </div>
        </div>

        {/* Line Items Table */}
        <div className={`rounded-2xl border shadow-sm ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {rfqItems.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
              <p className={`text-xs font-medium mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                No raw material line items added to this RFQ yet.
              </p>
              <button
                type="button"
                onClick={handleAddRfqItem}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Raw Material</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[960px]">
                <thead>
                  <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
                    darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-100/90 border-slate-200 text-slate-600'
                  }`}>
                    <th className="p-2.5 w-12 text-center">#</th>
                    <th className="p-2.5 min-w-[280px]">Raw Material *</th>
                    <th className="p-2.5 min-w-[170px]">Specification / Desc</th>
                    <th className="p-2.5 w-20 text-center">UOM</th>
                    <th className="p-2.5 w-28 text-right">Quantity *</th>
                    <th className="p-2.5 w-32 text-right">Expected Price (₹)</th>
                    <th className="p-2.5 w-36 text-center">Req. Delivery Date</th>
                    <th className="p-2.5 min-w-[140px]">Remarks</th>
                    <th className="p-2.5 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {rfqItems.map((item, index) => (
                    <tr 
                      key={index} 
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Row # and Reorder Buttons */}
                      <td className="p-2 text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className={`font-mono text-[10px] font-bold ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex items-center space-x-0.5">
                            <button 
                              type="button" 
                              disabled={index === 0} 
                              onClick={() => handleMoveRfqItem(index, 'up')} 
                              title="Move Up"
                              className={`p-0.5 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                                darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button 
                              type="button" 
                              disabled={index === rfqItems.length - 1} 
                              onClick={() => handleMoveRfqItem(index, 'down')} 
                              title="Move Down"
                              className={`p-0.5 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                                darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                              }`}
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Material Searchable Picker */}
                      <td className="p-2 align-middle">
                        <MaterialSearchPicker
                          item={item}
                          index={index}
                          darkMode={darkMode}
                          rawMaterials={rawMaterials}
                          onSelectMaterial={(mat) => handleSelectMaterial(index, mat)}
                          onClearMaterial={() => handleClearMaterial(index)}
                        />
                      </td>

                      {/* Specification / Description */}
                      <td className="p-2 align-middle">
                        <input 
                          type="text" 
                          value={item.description || ''} 
                          onChange={(e) => handleUpdateRfqItem(index, 'description', e.target.value)} 
                          placeholder="Grade, GSM, specs..."
                          className={`w-full h-9 px-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          }`} 
                        />
                      </td>

                      {/* Unit (UOM) */}
                      <td className="p-2 align-middle">
                        <input 
                          type="text" 
                          value={item.unit || 'Kg'} 
                          onChange={(e) => handleUpdateRfqItem(index, 'unit', e.target.value)} 
                          placeholder="Kg"
                          className={`w-full h-9 px-2 text-center rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`} 
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-2 align-middle">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity || ''} 
                          onChange={(e) => handleUpdateRfqItem(index, 'quantity', Number(e.target.value))} 
                          placeholder="100"
                          className={`w-full h-9 px-2.5 text-right font-medium rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`} 
                        />
                      </td>

                      {/* Expected / Target Price */}
                      <td className="p-2 align-middle">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={item.expectedPrice ?? ''} 
                          onChange={(e) => handleUpdateRfqItem(index, 'expectedPrice', e.target.value ? Number(e.target.value) : undefined)} 
                          placeholder="0.00"
                          className={`w-full h-9 px-2.5 text-right font-mono rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`} 
                        />
                      </td>

                      {/* Required Delivery Date */}
                      <td className="p-2 align-middle">
                        <input 
                          type="date" 
                          value={item.requiredDate || newRfq.deliveryDate || ''} 
                          onChange={(e) => handleUpdateRfqItem(index, 'requiredDate', e.target.value)} 
                          className={`w-full h-9 px-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`} 
                        />
                      </td>

                      {/* Remarks */}
                      <td className="p-2 align-middle">
                        <input 
                          type="text" 
                          value={item.remarks || ''} 
                          onChange={(e) => handleUpdateRfqItem(index, 'remarks', e.target.value)} 
                          placeholder="Special instructions..."
                          className={`w-full h-9 px-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          }`} 
                        />
                      </td>

                      {/* Actions: Duplicate & Delete */}
                      <td className="p-2 text-center align-middle">
                        <div className="flex items-center justify-center space-x-1">
                          <button 
                            type="button" 
                            onClick={() => handleDuplicateRfqItem(index)} 
                            title="Duplicate Line Item"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveRfqItem(index)} 
                            title="Remove Line Item"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Target Suppliers Section (Search-first with checkboxes) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className={`block text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Target Suppliers ({selectedSuppliers.length} Selected)</span>
          </label>
          {selectedSuppliers.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSuppliers([])}
              className="text-[11px] text-rose-500 hover:underline font-semibold cursor-pointer"
            >
              Clear All ({selectedSuppliers.length})
            </button>
          )}
        </div>

        {/* Selected Suppliers Chips/Summary */}
        {selectedSupplierObjects.length > 0 && (
          <div className={`flex flex-wrap gap-2 p-3 rounded-2xl border ${
            darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/60 border-emerald-200'
          }`}>
            <span className="text-[11px] font-bold text-emerald-500 self-center mr-1">
              Selected:
            </span>
            {selectedSupplierObjects.map(s => (
              <span 
                key={s.id} 
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm animate-in fade-in"
              >
                <span>{s.supplierName}</span>
                {((s as any).supplierCode || (s as any).millName) && (
                  <span className="text-[10px] text-emerald-200 font-mono">
                    ({(s as any).supplierCode || (s as any).millName})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSuppliers(selectedSuppliers.filter(id => id !== s.id))}
                  title="Remove Supplier"
                  className="hover:bg-emerald-700 p-0.5 rounded-full transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Supplier Search Box & Results Container */}
        <div className={`rounded-2xl border p-4 space-y-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={supplierSearchQuery}
              onChange={(e) => setSupplierSearchQuery(e.target.value)}
              placeholder="Search suppliers by name, code or mill..."
              className={`w-full h-10 pl-10 pr-9 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
            {supplierSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSupplierSearchQuery('');
                  setDebouncedSupplierQuery('');
                  setSearchedSuppliers([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results / Placeholder Area */}
          <div>
            {/* Condition 1: User has not typed anything yet */}
            {!debouncedSupplierQuery.trim() ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
                <Search className="w-5 h-5 text-slate-500 opacity-40 mb-0.5" />
                <span>Type supplier name, code, or mill above to search and select target suppliers</span>
              </div>
            ) : isSearchingSuppliers ? (
              /* Condition 2: Searching */
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Searching suppliers in database...</span>
              </div>
            ) : searchedSuppliers.length === 0 ? (
              /* Condition 3: No matching suppliers found */
              <div className="py-6 text-center text-xs text-slate-400">
                No suppliers found matching <span className="font-semibold text-emerald-400">"{debouncedSupplierQuery}"</span>
              </div>
            ) : (
              /* Condition 4: Matching suppliers found - displayed with checkboxes */
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/20">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Matching Suppliers ({searchedSuppliers.length})</span>
                  <span>Click to select / unselect</span>
                </div>
                {searchedSuppliers.map(s => {
                  const isSelected = selectedSuppliers.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSuppliers(selectedSuppliers.filter(id => id !== s.id));
                        } else {
                          setSelectedSuppliers([...selectedSuppliers, s.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors select-none ${
                        isSelected
                          ? (darkMode ? 'bg-emerald-950/40 text-emerald-300 font-semibold border border-emerald-800/40' : 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200')
                          : (darkMode ? 'hover:bg-slate-800/60 text-slate-300 border border-transparent' : 'hover:bg-slate-50 text-slate-700 border border-transparent')
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded accent-emerald-600 pointer-events-none w-4 h-4"
                        />
                        <div className="min-w-0">
                          <span className="font-medium">{s.supplierName}</span>
                          {((s as any).supplierCode || (s as any).millName) && (
                            <span className="font-mono text-[10px] text-slate-400 ml-1.5">
                              ({(s as any).supplierCode || (s as any).millName})
                            </span>
                          )}
                          {((s as any).city || (s as any).state) && (
                            <span className="text-[10px] text-slate-500 block">
                              {[(s as any).city, (s as any).state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Form Submit Button */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-400">
          {rfqItems.length} {rfqItems.length === 1 ? 'material item' : 'material items'} &bull; {selectedSuppliers.length} {selectedSuppliers.length === 1 ? 'supplier' : 'suppliers'} selected
        </div>
        <button 
          type="submit" 
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 flex items-center space-x-2"
        >
          <span>Submit Request for Quotation (RFQ)</span>
        </button>
      </div>
    </form>
  );
};
