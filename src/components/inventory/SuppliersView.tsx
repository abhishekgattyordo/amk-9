import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Truck, Search, Plus, Phone, Mail, Building, Star, X, Save, Edit3, Trash2, Eye, Upload, RefreshCw, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Supplier } from '../../types';
import { BulkImportModal } from '../common/BulkImportModal';
import { Pagination } from '../common/Pagination';
import { authFetch } from '../../utils/clientApi';

const getRowVal = (row: any, keys: string[]): any => {
  if (!row || typeof row !== 'object') return undefined;
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rk of rowKeys) {
      const rkClean = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rkClean === kClean || rk.toLowerCase() === k.toLowerCase()) {
        return row[rk];
      }
    }
  }
  return undefined;
};

interface SuppliersViewProps {
  suppliers: Supplier[];
  categoriesList?: any[];
  subCategoriesList?: any[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onRefreshSuppliers?: () => Promise<void>;
  darkMode: boolean;
  selectedSupplierId?: string | null;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  categoriesList,
  subCategoriesList,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onRefreshSuppliers,
  darkMode,
  selectedSupplierId,
}) => {
  const [searchSupplier, setSearchSupplier] = useState('');
  const [searchMill, setSearchMill] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<any[]>(categoriesList || []);
  const [subCategories, setSubCategories] = useState<any[]>(subCategoriesList || []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supError, setSupError] = useState<string | null>(null);
  const [supSuccess, setSupSuccess] = useState<string | null>(null);
  const [isSupSubmitting, setIsSupSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [currentSuppliers, setCurrentSuppliers] = useState<Supplier[]>(suppliers || []);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (categoriesList) {
      setCategories(categoriesList);
    }
  }, [categoriesList]);

  React.useEffect(() => {
    if (subCategoriesList) {
      setSubCategories(subCategoriesList);
    }
  }, [subCategoriesList]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchSupplier, searchMill, selectedCategory]);

  React.useEffect(() => {
    setCurrentSuppliers(suppliers || []);
    setIsLoading(false);
  }, [suppliers]);

  const processFile = (file: File) => {
    console.log("Uploaded file:", file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        console.log("Worksheet rows:", json);
        setPreviewData(json);
      } catch (err) {
        console.error("Error reading Excel file:", err);
        alert("Failed to parse Excel file. Please make sure it is a valid .xlsx or .xls file.");
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'SL NO': 1,
        'SUPPLIER': 'Century Paper Mills Ltd',
        'MILL NAME': 'Century Mill Unit 1',
        'CATEGORY': 'Kraft Paper & Reels'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'supplier_import_template.xlsx');
  };

  React.useEffect(() => {
    if (selectedSupplierId) {
      const sup = currentSuppliers.find(s => s.id === selectedSupplierId);
      if (sup) {
        setSelectedSupplier(sup);
        setFormData({ ...sup });
        setSelectedCategoryIds(sup.categories?.map(c => c.id) || []);
        setSelectedSubCategoryIds(sup.subCategories?.map(s => s.id) || []);
        setIsEditMode(true);
        setIsModalOpen(true);
      }
    }
  }, [selectedSupplierId, currentSuppliers]);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    supplierName: '',
    millName: '', // Mandatory Mill Name field
    category: ''
  });

  const filteredSuppliers = currentSuppliers.filter(s => {
    const matchesSupplier = s.supplierName.toLowerCase().includes(searchSupplier.toLowerCase());
    const matchesMill = s.millName.toLowerCase().includes(searchMill.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (
      s.categories?.some(c => c.id === selectedCategory) ||
      s.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      categories.find(c => c.id === selectedCategory)?.name.toLowerCase() === s.category?.toLowerCase()
    );
    return matchesSupplier && matchesMill && matchesCategory;
  });

  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupError(null);
    setSupSuccess(null);
    setIsSupSubmitting(true);

    try {
      if (isEditMode && selectedSupplier) {
        const payload = {
          supplierName: formData.supplierName,
          millName: formData.millName,
          category: formData.category,
          categoryIds: selectedCategoryIds,
          subCategoryIds: selectedSubCategoryIds,
        };
        const res = await authFetch(`/api/suppliers?id=${selectedSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update supplier');
        }
        setSupSuccess('Supplier updated successfully!');
        const updatedSup: Supplier = {
          ...selectedSupplier,
          ...data.data,
        };
        onUpdateSupplier(updatedSup);
      } else {
        const payload = {
          supplierName: formData.supplierName || 'New Supplier',
          millName: formData.millName || 'Default Mill',
          category: formData.category || 'General',
          categoryIds: selectedCategoryIds,
          subCategoryIds: selectedSubCategoryIds,
        };
        const res = await authFetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create supplier');
        }
        setSupSuccess('Supplier created successfully!');
        const createdSup: Supplier = {
          ...data.data
        };
        onAddSupplier(createdSup);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedSupplier(null);
        setIsSupSubmitting(false);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setSupError(err.message || 'An error occurred while saving supplier');
      setIsSupSubmitting(false);
    }
  };

  const triggerDelete = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      id,
      name,
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/suppliers?id=${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete supplier');
      }
      onDeleteSupplier(deleteConfirm.id);
      setCurrentSuppliers(prev => prev.filter(s => s.id !== deleteConfirm.id));
      if (isModalOpen && selectedSupplier?.id === deleteConfirm.id) {
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedSupplier(null);
      }
      if (onRefreshSuppliers) {
        await onRefreshSuppliers();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete supplier');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Suppliers & Mill Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage paper mills, suppliers, credit terms, and outstanding balances.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => {
              setIsEditMode(false);
              setFormData({
                supplierName: '',
                millName: '',
                category: ''
              });
              setSelectedCategoryIds([]);
              setSelectedSubCategoryIds([]);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Search Supplier */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchSupplier}
            onChange={(e) => setSearchSupplier(e.target.value)}
            placeholder="Search Supplier..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Search Mill Name */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Building className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchMill}
            onChange={(e) => setSearchMill(e.target.value)}
            placeholder="Search Mill Name..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Category dropdown */}
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-semibold uppercase tracking-wider text-slate-400`}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="All">All</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSearchSupplier('');
            setSearchMill('');
            setSelectedCategory('All');
          }}
          className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
            darkMode 
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Clear Filters
        </button>
      </div>

      {/* Table Data */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Supplier</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Mill Name</th>
                <th className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Category</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Loading suppliers data, please wait...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    No supplier records found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map(sup => {
                  const getSupplierCategories = (s: Supplier) => {
                    if (!s.rawMaterials || s.rawMaterials.length === 0) return 'N/A';
                    const categoryNames = s.rawMaterials
                      .map((rm: any) => rm.category?.name)
                      .filter(Boolean);
                    const uniqueNames = Array.from(new Set(categoryNames));
                    return uniqueNames.length > 0 ? uniqueNames.join(', ') : 'N/A';
                  };

                  return (
                    <tr 
                      key={sup.id} 
                      onClick={() => {
                        setSelectedSupplier(sup);
                        setFormData(sup);
                        setSelectedCategoryIds(sup.categories?.map(c => c.id) || []);
                        setSelectedSubCategoryIds(sup.subCategories?.map(s => s.id) || []);
                        setIsEditMode(true);
                        setIsModalOpen(true);
                      }}
                      className={`transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{sup.supplierName}</div>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{sup.millName || 'N/A'}</span>
                      </td>
                      <td className={`p-4 border-r last:border-r-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="flex flex-wrap gap-1">
                          {sup.categories && sup.categories.length > 0 ? (
                            sup.categories.map(c => (
                              <span key={c.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {c.name}
                              </span>
                            ))
                          ) : sup.category ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">
                              {sup.category}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSupplier(sup);
                              setFormData(sup);
                              setSelectedCategoryIds(sup.categories?.map(c => c.id) || []);
                              setSelectedSubCategoryIds(sup.subCategories?.map(s => s.id) || []);
                              setIsEditMode(true);
                              setIsModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-100 text-emerald-600'
                            }`}
                            title="Edit Supplier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDelete(sup.id, sup.supplierName)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-rose-400' : 'bg-white border-slate-200 hover:bg-slate-100 text-rose-600'
                            }`}
                            title="Delete Supplier"
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

        {/* Pagination controls footer */}
        {totalItems > 0 && (
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            itemName="entries"
            itemsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-8 relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{isEditMode ? 'Edit Supplier Profile' : 'New Supplier & Mill Registration'}</h2>
              {isEditMode && selectedSupplier && (
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  ID: {selectedSupplier.id}
                </div>
              )}
            </div>

            {supError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{supError}</span>
              </div>
            )}
            {supSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{supSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Mill Name (Mandatory)</label>
                  <input
                    type="text"
                    required
                    value={formData.millName || ''}
                    onChange={(e) => setFormData({ ...formData, millName: e.target.value })}
                    placeholder="e.g. Ballarpur Paper Mills"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/50 text-sm ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-50'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Category (Multi-select)</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCategoryIds.map(id => {
                      const cat = categories.find(c => c.id === id);
                      return (
                        <span key={id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {cat?.name || id}
                          <button
                            type="button"
                            onClick={() => setSelectedCategoryIds(prev => prev.filter(i => i !== id))}
                            className="ml-1.5 hover:text-emerald-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder="Search and add categories..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                    {showCategoryDropdown && (
                      <div className={`absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl shadow-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        {categories
                          .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()) && !selectedCategoryIds.includes(c.id))
                          .map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                                setCategorySearch('');
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()) && !selectedCategoryIds.includes(c.id)).length === 0 && (
                          <div className="px-4 py-2 text-xs text-slate-500">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Subcategory (Multi-select)</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSubCategoryIds.map(id => {
                      const sub = subCategories.find(s => s.id === id);
                      return (
                        <span key={id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {sub?.name || id}
                          <button
                            type="button"
                            onClick={() => setSelectedSubCategoryIds(prev => prev.filter(i => i !== id))}
                            className="ml-1.5 hover:text-blue-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={subCategorySearch}
                      onChange={(e) => {
                        setSubCategorySearch(e.target.value);
                        setShowSubCategoryDropdown(true);
                      }}
                      onFocus={() => setShowSubCategoryDropdown(true)}
                      placeholder="Search and add subcategories..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                    {showSubCategoryDropdown && (
                      <div className={`absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl shadow-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        {subCategories
                          .filter(s => s.name.toLowerCase().includes(subCategorySearch.toLowerCase()) && !selectedSubCategoryIds.includes(s.id))
                          .map(sub => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setSelectedSubCategoryIds([...selectedSubCategoryIds, sub.id]);
                                setSubCategorySearch('');
                                setShowSubCategoryDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-500/10 hover:text-blue-500 transition-colors ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        {subCategories.filter(s => s.name.toLowerCase().includes(subCategorySearch.toLowerCase()) && !selectedSubCategoryIds.includes(s.id)).length === 0 && (
                          <div className="px-4 py-2 text-xs text-slate-500">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                {isEditMode && selectedSupplier ? (
                  <button
                    type="button"
                    onClick={() => triggerDelete(selectedSupplier.id, selectedSupplier.supplierName)}
                    className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Supplier</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSupSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSupSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isEditMode ? 'Update Supplier' : 'Save Supplier'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`} id="delete-supplier-confirm-modal">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold">Confirm Supplier Deletion</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Are you sure you want to delete the supplier{' '}
              <span className="font-bold text-rose-400">"{deleteConfirm.name}"</span>?
              <span className="block mt-2 text-xs text-amber-500 font-semibold">
                This will delete and archive the supplier record from the directory.
              </span>
            </p>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                No, Keep Supplier
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                id="confirm-delete-supplier-btn"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={async () => { 
          if (onRefreshSuppliers) await onRefreshSuppliers(); 
        }} 
        defaultModule="suppliers" 
        darkMode={darkMode} 
      />
    </div>
  );
};
