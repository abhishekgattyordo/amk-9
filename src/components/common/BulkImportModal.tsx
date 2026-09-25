import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw,
  FileDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  Sparkles,
  Droplets
} from 'lucide-react';
import { COMPANY_INKS_DATA } from '../../data/company-inks-catalog';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultModule?: 'suppliers' | 'raw_materials' | 'products';
  darkMode: boolean;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultModule = 'raw_materials',
  darkMode,
}) => {
  const [step, setStep] = useState<number>(1); // 1: Select Module & Template, 2: Upload & Preview, 3: Import Result
  const [selectedModule, setSelectedModule] = useState<'suppliers' | 'raw_materials' | 'products'>(defaultModule);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'stop'>('skip');
  const [isParsing, setIsParsing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    total: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    detectedHeaders?: string[];
    mappings?: { original: string; field: string; label: string; isMatched: boolean }[];
    unmappedHeaders?: string[];
    hasNameColumn?: boolean;
    hasCodeColumn?: boolean;
    items: any[];
    errors: { row: number; reason: string; code?: string; name?: string }[];
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    total: number;
    imported: number;
    updated?: number;
    skipped: number;
    failed: number;
    errors: { row: number; data?: any; reason: string }[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedModule(defaultModule);
      setStep(1);
      setFile(null);
      setParsedRows([]);
      setValidationResult(null);
      setImportResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultModule]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sampleRows: any[] = [];
    let filename = '';

    if (selectedModule === 'raw_materials') {
      // Business-friendly headers for Raw Materials (NO database IDs, currentStock, or timestamps)
      headers = [
        'Material Code',
        'Material Name',
        'Category',
        'Subcategory',
        'UOM',
        'Purchase Price',
        'Description',
        'Grade',
        'GSM',
        'Thickness',
        'HSN Code',
        'Min Stock',
        'Reorder Level',
        'Supplier Name',
        'Warehouse Name'
      ];
      sampleRows = [
        {
          'Material Code': 'RM-2494',
          'Material Name': 'Kraft Paper 180 GSM',
          'Category': 'Kraft Paper & Reels',
          'Subcategory': 'Kraft Liner 180 GSM',
          'UOM': 'Kg',
          'Purchase Price': 65.50,
          'Description': 'High burst virgin kraft paper roll for outer cartons',
          'Grade': 'BF-18',
          'GSM': 180,
          'Thickness': 240,
          'HSN Code': '48041100',
          'Min Stock': 1000,
          'Reorder Level': 2000,
          'Supplier Name': 'Century Paper Mills Ltd',
          'Warehouse Name': 'Main Warehouse',
        },
        {
          'Material Code': 'RM-2495',
          'Material Name': 'Duplex Board 250 GSM',
          'Category': 'Duplex Sheets & Board',
          'Subcategory': 'White Back Duplex Board',
          'UOM': 'Kg',
          'Purchase Price': 58.00,
          'Description': 'Coated white-back duplex board sheets for offsets',
          'Grade': 'Grade-A',
          'GSM': 250,
          'Thickness': 320,
          'HSN Code': '48109200',
          'Min Stock': 500,
          'Reorder Level': 1500,
          'Supplier Name': 'JK Paper Ltd',
          'Warehouse Name': 'Raw Material Warehouse',
        }
      ];
      filename = 'raw_materials_template.xlsx';
    } else if (selectedModule === 'suppliers') {
      headers = ['Supplier Name', 'Mill Name', 'Category', 'Phone', 'Email', 'Address', 'City', 'State', 'GST Number'];
      sampleRows = [
        {
          'Supplier Name': 'Century Paper Mills Ltd',
          'Mill Name': 'Century Mill Unit 1',
          'Category': 'Kraft Paper & Reels',
          'Phone': '9876543210',
          'Email': 'contact@centurypaper.com',
          'Address': 'Industrial Area, Phase 2',
          'City': 'Mumbai',
          'State': 'Maharashtra',
          'GST Number': '27AAAAA0000A1Z5'
        }
      ];
      filename = 'suppliers_template.xlsx';
    } else {
      headers = [
        'Product Code',
        'Product Name',
        'Category',
        'Subcategory',
        'Box Type',
        'Dimensions',
        'GSM',
        'Unit',
        'HSN Code',
        'Cost Price',
        'Selling Price',
        'Warehouse Name',
        'Description'
      ];
      sampleRows = [
        {
          'Product Code': 'PRD-1001',
          'Product Name': 'Corrugated Master Carton 5-Ply',
          'Category': 'Cartons',
          'Subcategory': 'RSC',
          'Box Type': 'RSC (Regular Slotted Carton)',
          'Dimensions': '400 x 300 x 250 mm',
          'GSM': 250,
          'Unit': 'Pcs',
          'HSN Code': '48191010',
          'Cost Price': 35.00,
          'Selling Price': 48.00,
          'Warehouse Name': 'Main Warehouse',
          'Description': 'Heavy duty 5-ply RSC carton for export cargo'
        }
      ];
      filename = 'products_template.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    // Set auto column width
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Template');
    XLSX.writeFile(wb, filename);
  };

  const handleDownloadCompanyInksTemplate = () => {
    const headers = ['SL.NO', 'INK COLOUR', 'UNIT', 'SUPPLIER', 'CATEGORY', 'SUBCATEGORY', 'HSN CODE', 'PRICE PER KG', 'MIN STOCK'];
    const rows = COMPANY_INKS_DATA.map(ink => ({
      'SL.NO': ink.slNo,
      'INK COLOUR': ink.name,
      'UNIT': ink.uom,
      'SUPPLIER': ink.supplier,
      'CATEGORY': ink.category,
      'SUBCATEGORY': ink.subCategory,
      'HSN CODE': ink.hsnCode,
      'PRICE PER KG': ink.purchasePrice,
      'MIN STOCK': ink.minStock
    }));

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    ws['!cols'] = [
      { wch: 8 },
      { wch: 32 },
      { wch: 10 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Company Printing Inks');
    XLSX.writeFile(wb, 'company_printing_inks_91_items.xlsx');
  };

  const handleLoadCompanyInksDirectly = async () => {
    setSelectedModule('raw_materials');
    const rows = COMPANY_INKS_DATA.map(ink => ({
      'SL.NO': ink.slNo,
      'Material Code': ink.code,
      'INK COLOUR': ink.name,
      'UNIT': ink.uom,
      'Supplier': ink.supplier,
      'Category': ink.category,
      'Subcategory': ink.subCategory,
      'HSN Code': ink.hsnCode,
      'Purchase Price': ink.purchasePrice,
      'Min Stock': ink.minStock,
      'Reorder Level': ink.reorderLevel,
      'Description': ink.description
    }));

    setParsedRows(rows);
    setStep(2);
    await validateRows(rows, duplicateHandling);
  };

  const validateRows = async (rows: any[], dupHandling: 'skip' | 'update' | 'stop') => {
    setIsValidating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: selectedModule,
          rows,
          action: 'validate',
          duplicateHandling: dupHandling,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Validation failed on server');
      }

      setValidationResult(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error validating import data');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsParsing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in uploaded file.');
        }
        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          setErrorMessage('The uploaded file contains no rows or is empty.');
          setIsParsing(false);
          return;
        }

        setParsedRows(data);
        setStep(2);
        setIsParsing(false);
        await validateRows(data, duplicateHandling);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to parse file. Please upload a valid .xlsx, .xls, or .csv file.');
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error reading file from disk.');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleDuplicateHandlingChange = (newVal: 'skip' | 'update' | 'stop') => {
    setDuplicateHandling(newVal);
    if (parsedRows.length > 0) {
      validateRows(parsedRows, newVal);
    }
  };

  const executeImport = async () => {
    setIsImporting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: selectedModule,
          rows: parsedRows,
          action: 'import',
          duplicateHandling,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Import transaction failed');
      }

      setImportResult(json.data);
      setStep(3);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing bulk import');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadErrorReport = () => {
    const errorList = importResult?.errors?.length ? importResult.errors : validationResult?.errors;
    if (!errorList || errorList.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(errorList.map(e => ({
      'Row Number': e.row,
      'Item Code': (e as any).code || '',
      'Item Name': (e as any).name || '',
      'Error Reason': e.reason,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Errors');
    XLSX.writeFile(wb, `${selectedModule}_import_errors.xlsx`);
  };

  const resetModal = () => {
    setFile(null);
    setParsedRows([]);
    setStep(1);
    setValidationResult(null);
    setImportResult(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bulk Master Data Import</h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Import raw materials, suppliers, or products seamlessly with automated validation & inventory stock protection.
              </p>
            </div>
          </div>
          <button 
            onClick={resetModal}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className={`px-6 py-3 border-b flex items-center justify-between text-xs font-semibold ${darkMode ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-100 bg-slate-50/50 text-slate-600'}`}>
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-500 font-bold' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span>Select & Template</span>
          </div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-indigo-500 font-bold' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>Validation & Preview</span>
          </div>
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-indigo-500 font-bold' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>Import Results</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className={`mb-4 p-4 rounded-xl border flex items-center space-x-3 ${
              darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* STEP 1: Select Module & Template */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Select Target Master Module
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'raw_materials', label: 'Raw Materials', desc: 'Import paper reels, chemicals, inks, and packaging raw supplies.' },
                    { id: 'suppliers', label: 'Suppliers / Mills', desc: 'Import supplier and mill contact & GST details.' },
                    { id: 'products', label: 'Finished Products', desc: 'Import corrugated boxes and finished carton specifications.' },
                  ].map((m) => (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedModule(m.id as any)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedModule === m.id 
                          ? darkMode ? 'border-indigo-500 bg-indigo-500/10' : 'border-indigo-600 bg-indigo-50/50 shadow-md'
                          : darkMode ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <h3 className="font-bold text-base mb-1">{m.label}</h3>
                      <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Inks Direct Import Card */}
              {selectedModule === 'raw_materials' && (
                <div className={`p-5 rounded-2xl border ${
                  darkMode ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-emerald-500/30' : 'bg-gradient-to-r from-emerald-50 via-white to-indigo-50 border-emerald-200 shadow-sm'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-md shadow-emerald-600/20">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            Company Printing Inks & Chemicals (91 Items)
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Ready Catalog
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          Pre-compiled 91 inks from <strong>Vijay Maruti (66)</strong>, <strong>SLN Enterprises (10)</strong>, <strong>Sky Aqua Colour (1)</strong>, and <strong>Seven - 11 (14)</strong> with HSN, UOM (Kg), and standard pricing.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={handleDownloadCompanyInksTemplate}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Download Inks Excel</span>
                      </button>
                      <button
                        onClick={handleLoadCompanyInksDirectly}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>1-Click Load 91 Inks</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="font-bold text-sm mb-1">Download Standard Business Template</h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Use our clean template with business headers (Material Code, Name, Category, Subcategory, UOM, Price, etc.). System IDs and stock fields are handled automatically.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Upload Completed File (.xlsx, .xls, .csv)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    darkMode ? 'border-slate-700 hover:border-indigo-500 bg-slate-800/20' : 'border-slate-300 hover:border-indigo-600 bg-slate-50'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      <p className="text-sm font-medium">Uploading & parsing file...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-3 rounded-full ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-sm">Click to upload or drag and drop Excel/CSV file</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Supports .xlsx, .xls, and .csv files</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Validation */}
          {step === 2 && (
            <div className="space-y-6">
              {isValidating ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-base font-bold">Validating...</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Checking master categories, duplicate codes, and numeric values...
                  </p>
                </div>
              ) : (
                <>
                  {/* Top Stats & Duplicate Handling */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-base">Import Preview & Validation</h3>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        File: <span className="italic font-medium">{file?.name}</span> ({parsedRows.length} total rows)
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Duplicate Handling:</label>
                      <select
                        value={duplicateHandling}
                        onChange={(e) => handleDuplicateHandlingChange(e.target.value as any)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border focus:outline-hidden ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="skip">Skip existing records</option>
                        <option value="update">Update existing records (stock untouched)</option>
                        <option value="stop">Stop import on duplicate</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  {validationResult && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Rows</span>
                        <span className="text-lg font-black">{validationResult.total}</span>
                      </div>
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        <span className="text-xs font-semibold">Valid Rows</span>
                        <span className="text-lg font-black">{validationResult.validCount}</span>
                      </div>
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        validationResult.invalidCount > 0 
                          ? darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
                          : darkMode ? 'bg-slate-800/20 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span className="text-xs font-semibold">Invalid Rows</span>
                        <span className="text-lg font-black">{validationResult.invalidCount}</span>
                      </div>
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        validationResult.duplicateCount > 0 
                          ? darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                          : darkMode ? 'bg-slate-800/20 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <span className="text-xs font-semibold">Existing in DB</span>
                        <span className="text-lg font-black">{validationResult.duplicateCount}</span>
                      </div>
                    </div>
                  )}

                  {/* Column Mapping Diagnostics Panel */}
                  {validationResult && validationResult.mappings && validationResult.mappings.length > 0 && (
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-slate-850 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Header Normalization & Column Mapping
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-semibold ${
                            validationResult.hasNameColumn !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {validationResult.hasNameColumn !== false ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            <span>{validationResult.hasNameColumn !== false ? 'Name Column Mapped' : 'Name Column Missing'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Mapped columns chip grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                        {validationResult.mappings.map((m: any, mIdx: number) => (
                          <div 
                            key={mIdx}
                            className={`p-2 rounded-lg border flex items-center justify-between ${
                              m.isMatched 
                                ? darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200' 
                                : darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="truncate mr-1">
                              <span className="font-semibold">{m.original}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">→ {m.label} ({m.field})</span>
                            </div>
                            {m.isMatched ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-slate-400 shrink-0">-</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row-Level Errors Panel */}
                  {validationResult && validationResult.errors.length > 0 && (
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      <div className="flex items-center space-x-2 font-bold text-xs mb-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>Validation Issues Detected ({validationResult.errors.length}):</span>
                      </div>
                      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto pl-5 list-disc font-mono">
                        {validationResult.errors.map((err, idx) => (
                          <li key={idx}>
                            <span className="font-semibold">{err.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Table Preview */}
                  {validationResult?.items && (
                    <div className={`border rounded-xl overflow-hidden max-h-72 overflow-y-auto ${
                      darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className={`sticky top-0 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                          <tr>
                            <th className="p-2.5 font-semibold">Row</th>
                            <th className="p-2.5 font-semibold">Code</th>
                            <th className="p-2.5 font-semibold">Name</th>
                            <th className="p-2.5 font-semibold">Category</th>
                            <th className="p-2.5 font-semibold">Subcategory</th>
                            <th className="p-2.5 font-semibold">Status / Result</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                          {validationResult.items.map((row: any) => (
                            <tr key={row.rowNumber} className={
                              !row.isValid 
                                ? darkMode ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'bg-rose-50/60 hover:bg-rose-50'
                                : darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100/50'
                            }>
                              <td className={`p-2.5 font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                {row.rowNumber}
                              </td>
                              <td className="p-2.5 font-semibold font-mono">{row.code || '-'}</td>
                              <td className="p-2.5 max-w-xs truncate">{row.name || '-'}</td>
                              <td className="p-2.5">{row.category || '-'}</td>
                              <td className="p-2.5">{row.subCategory || '-'}</td>
                              <td className="p-2.5">
                                {row.isValid ? (
                                  row.isDuplicateInDb ? (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      <span>⚠ Existing</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>✓ Valid</span>
                                    </span>
                                  )
                                ) : (
                                  <div className="flex flex-col space-y-0.5">
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 w-fit">
                                      <XCircle className="w-3 h-3" />
                                      <span>✗ Invalid</span>
                                    </span>
                                    {row.errors?.map((e: string, eIdx: number) => (
                                      <span key={eIdx} className="text-[10px] text-rose-500 font-medium">{e}</span>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 3: Import Result Summary */}
          {step === 3 && importResult && (
            <div className="space-y-6 text-center py-6">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                importResult.failed === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {importResult.failed === 0 ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-xl font-black mb-1">Bulk Import Completed</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Database records have been safely updated within an atomic transaction.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Rows</p>
                  <p className="text-2xl font-black">{importResult.total}</p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  <p className="text-xs font-semibold">Imported / Created</p>
                  <p className="text-2xl font-black">{importResult.imported}</p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <p className="text-xs font-semibold">Skipped</p>
                  <p className="text-2xl font-black">{importResult.skipped}</p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                  <p className="text-xs font-semibold">Failed</p>
                  <p className="text-2xl font-black">{importResult.failed}</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={downloadErrorReport}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download Error Report ({importResult.errors.length} errors)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
          {step > 1 && step < 3 && (
            <button
              onClick={() => setStep(step - 1)}
              className={`px-4 py-2 rounded-xl font-bold text-xs border transition-colors flex items-center space-x-2 cursor-pointer ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <div className="ml-auto flex items-center space-x-3">
            <button
              onClick={resetModal}
              className={`px-4 py-2 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {step === 3 ? 'Close' : 'Cancel'}
            </button>
            {step === 2 && (
              <button
                disabled={isImporting || isValidating || !validationResult || validationResult.validCount === 0}
                onClick={executeImport}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing Records...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Import ({validationResult?.validCount || 0} valid rows)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
            {step === 1 && (
              <button
                disabled={!file || isParsing}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next: Validate & Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

