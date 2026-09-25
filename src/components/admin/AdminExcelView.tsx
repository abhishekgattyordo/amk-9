'use client';

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  FileUp, 
  FileDown, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  ArrowRight,
  Database,
  Info,
  Check,
  HelpCircle,
  Droplets,
  Sparkles,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  User, 
  RawMaterial, 
  Product, 
  Supplier, 
  Warehouse, 
  CategoryItem 
} from '../../types';
import { 
  normalizeRawMaterialRow, 
  detectRawMaterialHeaders,
  HeaderDetectionResult
} from '../../utils/import-normalization';
import { COMPANY_INKS_DATA } from '../../data/company-inks-catalog';

interface AdminExcelViewProps {
  currentUser: User | null;
  rawMaterials: RawMaterial[];
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  categories: CategoryItem[];
  
  onUpdateRawMaterials: (materials: RawMaterial[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onUpdateWarehouses: (warehouses: Warehouse[]) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
  onAddActivity: (activity: { action: string; module: string; details: string }) => void;
  
  darkMode: boolean;
  onSelectModule: (module: any) => void;
}

type DataType = 'raw_materials' | 'products' | 'suppliers' | 'warehouses' | 'categories';

interface ImportPreviewItem {
  id: string;
  code?: string;
  name?: string;
  isValid: boolean;
  errors: string[];
  data: any;
}

export const AdminExcelView: React.FC<AdminExcelViewProps> = ({
  currentUser,
  rawMaterials,
  products,
  suppliers,
  warehouses,
  categories,
  onUpdateRawMaterials,
  onUpdateProducts,
  onUpdateSuppliers,
  onUpdateWarehouses,
  onUpdateCategories,
  onAddActivity,
  darkMode,
  onSelectModule,
}) => {
  const [activeTab, setActiveTab] = useState<DataType>('raw_materials');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [parsedData, setParsedData] = useState<ImportPreviewItem[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'info' | ''; message: string }>({ type: '', message: '' });
  const [headerReport, setHeaderReport] = useState<HeaderDetectionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Security check - Admin only
  if (!currentUser || currentUser.role !== 'Administrator') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-xl mx-auto">
        <div className={`p-4 rounded-full mb-6 ${darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
          <ShieldAlert className="w-16 h-16 animate-pulse" />
        </div>
        <h2 className={`text-2xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Access Restricted
        </h2>
        <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          The Excel Import/Export administration portal is strictly restricted to user accounts with the <strong className="text-emerald-500">Administrator</strong> role. If you need access, please contact your systems architect.
        </p>
        <button
          onClick={() => onSelectModule('dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center space-x-2"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Schema definition & validation logic
  const getRequiredColumns = (type: DataType): string[] => {
    switch (type) {
      case 'raw_materials':
        return ['Code (or Material Code)', 'Name (or Material Name)'];
      case 'products':
        return ['Code', 'Name'];
      case 'suppliers':
        return ['Code', 'Supplier Name'];
      case 'warehouses':
        return ['Code', 'Name'];
      case 'categories':
        return ['Name'];
    }
  };

  const getSampleData = (type: DataType): any[] => {
    switch (type) {
      case 'raw_materials':
        return [
          {
            'Code': 'RM-KRAFT-250',
            'Name': 'Virgin Kraft Liner Paper Roll 250 GSM',
            'Category': 'Paper Rolls',
            'Subcategory': 'Kraft Paper',
            'Grade': 'VK-250',
            'GSM': 250,
            'Thickness': 310,
            'UOM': 'Kg',
            'HSN Code': '48041100',
            'Purchase Price': 65.50,
            'Min Stock': 3000,
            'Max Stock': 25000,
            'Reorder Level': 5000,
            'Supplier': 'JK Paper Ltd',
            'Warehouse': 'Main Paper Warehouse (WH-01)',
            'Status': 'Active',
            'Description': 'Ultra high-burst strength virgin liner roll for premium cartons.'
          },
          {
            'Code': 'RM-STARCH-MOD',
            'Name': 'Modified High-Viscosity Maize Starch',
            'Category': 'Chemicals & Adhesives',
            'Subcategory': 'Starch Glue',
            'Grade': 'M-STARCH-3',
            'GSM': 0,
            'Thickness': 0,
            'UOM': 'Kg',
            'HSN Code': '35051000',
            'Purchase Price': 38.00,
            'Min Stock': 1500,
            'Max Stock': 10000,
            'Reorder Level': 2000,
            'Supplier': 'Gujarat Ambuja Exports',
            'Warehouse': 'Chemical & Consumables Store (WH-04)',
            'Status': 'Active',
            'Description': 'Modified starch powder formulated for high-speed automatic pasting.'
          }
        ];
      case 'products':
        return [
          {
            'Code': 'FP-BOX-101',
            'Name': 'Heavy Duty 5-Ply Shipping Carton',
            'Category': 'Corrugated Boxes',
            'Subcategory': 'Shipping Carton',
            'Box Type': 'RSC (Regular Slotted Carton)',
            'Dimensions': '450 x 350 x 300 mm',
            'GSM': 450,
            'UOM': 'Boxes',
            'HSN Code': '48191000',
            'Cost Price': 42.00,
            'Selling Price': 58.50,
            'Warehouse': 'Finished Goods Bay A (WH-03)',
            'Min Stock': 500,
            'Status': 'Active',
            'Specifications': 'Flute Configuration: BC-Double Wall. Max load: 25kg.'
          }
        ];
      case 'suppliers':
        return [
          {
            'Code': 'SUP-JK-001',
            'Supplier Name': 'JK Paper Limited',
            'Mill Name': 'JK Fort Songadh Paper Mill',
            'GST Number': '24AAAAJ0001A1Z0',
            'PAN': 'AAAAJ0001A',
            'Contact Person': 'Arvind Singhal',
            'Phone': '022-24356789',
            'Mobile': '9876543210',
            'Email': 'sales@jkpaper.com',
            'Website': 'www.jkpaper.com',
            'Payment Terms': 'Net 30',
            'Credit Days': 30,
            'Address': '118, Nehru Place, Commercial Plaza',
            'City': 'New Delhi',
            'State': 'Delhi',
            'Pincode': '110019',
            'Status': 'Active',
            'Rating': 5
          }
        ];
      case 'warehouses':
        return [
          {
            'Code': 'WH-CENTRAL-01',
            'Name': 'Central Raw Materials Yard',
            'Location': 'Sector 4, Industrial Area',
            'Manager': 'Vijay Kumar',
            'Capacity SqFt': 50000,
            'Status': 'Operational'
          }
        ];
      case 'categories':
        return [
          {
            'Name': 'Paper Rolls',
            'Type': 'Raw Material',
            'Code': 'CAT-PAPER',
            'Description': 'Virgin Kraft, Semi-Kraft, Test Liner and Fluting Medium reels',
            'Status': 'Active'
          }
        ];
    }
  };

  const getTargetDataList = (type: DataType) => {
    switch (type) {
      case 'raw_materials': return rawMaterials;
      case 'products': return products;
      case 'suppliers': return suppliers;
      case 'warehouses': return warehouses;
      case 'categories': return categories;
    }
  };

  const getTabLabel = (type: DataType): string => {
    switch (type) {
      case 'raw_materials': return 'Raw Materials';
      case 'products': return 'Finished Goods';
      case 'suppliers': return 'Suppliers (Mills)';
      case 'warehouses': return 'Warehouses';
      case 'categories': return 'Categories';
    }
  };

  // 3. Export to Excel functionality
  const handleExport = (type: DataType) => {
    try {
      const dataToExport = getTargetDataList(type);
      if (dataToExport.length === 0) {
        alert('No data available to export.');
        return;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, getTabLabel(type));
      
      // Auto-fit column widths beautifully
      const maxColWidths = dataToExport.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, colIndex) => {
          const val = String(row[key] || '');
          const len = Math.max(val.length, key.length);
          acc[colIndex] = Math.min(Math.max(acc[colIndex] || 10, len + 2), 50);
        });
        return acc;
      }, []);
      
      worksheet['!cols'] = maxColWidths.map((width: number) => ({ wch: width }));
      
      const filename = `AMK_ERP_${type}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      onAddActivity({
        action: 'Exported Data',
        module: 'Admin Excel Hub',
        details: `Exported ${dataToExport.length} rows of ${getTabLabel(type)} to Excel.`
      });
    } catch (error: any) {
      console.error(error);
      alert('Error exporting excel: ' + error.message);
    }
  };

  // 4. Download templates
  const handleDownloadTemplate = (type: DataType) => {
    try {
      const sample = getSampleData(type);
      const worksheet = XLSX.utils.json_to_sheet(sample);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${getTabLabel(type)} Template`);
      
      // Format column headers
      const filename = `AMK_ERP_${type}_Template.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error: any) {
      alert('Template generation error: ' + error.message);
    }
  };

  const handleDownloadCompanyInksTemplate = () => {
    try {
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

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet['!cols'] = [
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
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Inks (91 items)');
      XLSX.writeFile(workbook, 'Company_Printing_Inks_Catalog_91_Items.xlsx');
    } catch (error: any) {
      alert('Template generation error: ' + error.message);
    }
  };

  const handleLoadCompanyInksDirectly = () => {
    try {
      setActiveTab('raw_materials');
      const formattedRows = COMPANY_INKS_DATA.map(ink => ({
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

      const simulatedFile = new File([''], 'Company_Printing_Inks_Catalog_91_Items.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      setSelectedFile(simulatedFile);

      const allHeaderKeys = ['SL.NO', 'Material Code', 'INK COLOUR', 'UNIT', 'Supplier', 'Category', 'Subcategory', 'HSN Code', 'Purchase Price', 'Min Stock', 'Reorder Level', 'Description'];
      const report = detectRawMaterialHeaders(allHeaderKeys);
      setHeaderReport(report);

      const normalizedList: ImportPreviewItem[] = formattedRows.map((row, idx) => {
        const errors: string[] = [];
        const norm = normalizeRowData(row, 'raw_materials', idx);
        if (!norm.name) errors.push(`Row ${idx + 2}: Material Name is required.`);

        return {
          id: norm.id || `INK-${idx + 1}`,
          code: norm.code,
          name: norm.name,
          isValid: errors.length === 0,
          errors,
          data: norm
        };
      });

      setParsedData(normalizedList);
      setImportStatus({
        type: 'success',
        message: `Successfully loaded ${normalizedList.length} company ink materials (${normalizedList.filter(i => i.isValid).length} valid). Ready to import.`
      });
    } catch (error: any) {
      console.error(error);
      alert('Error loading company inks: ' + error.message);
    }
  };

  // 5. Drag-and-drop file upload helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Helper to normalize keys from spreadsheet
  const normalizeRowData = (row: any, type: DataType, idx: number) => {
    if (type === 'raw_materials') {
      const norm = normalizeRawMaterialRow(row, idx);
      const code = norm.code || `RM-${1000 + idx}`;
      const name = norm.name || '';
      const existing = rawMaterials.find(rm => rm.code.toLowerCase() === code.toLowerCase());

      return {
        id: existing?.id || (row.id ? String(row.id) : `RM-IMP-${Date.now()}-${idx}`),
        code,
        name,
        category: norm.category || 'Paper Rolls',
        subCategory: norm.subCategory || '',
        grade: norm.grade || 'Standard',
        gsm: norm.gsm || 0,
        thickness: norm.thickness || 0,
        uom: norm.uom || 'Kg',
        hsnCode: norm.hsnCode || '48041100',
        purchasePrice: norm.purchasePrice || 0,
        minStock: norm.minStock || 1000,
        maxStock: norm.maxStock || 20000,
        reorderLevel: norm.reorderLevel || 2000,
        supplier: norm.supplierName || existing?.supplier || null,
        warehouse: norm.warehouseName || existing?.warehouse || null,
        supplierId: existing?.supplierId || null,
        warehouseId: existing?.warehouseId || null,
        description: norm.description || '',
        status: norm.status === 'Inactive' ? 'Inactive' : 'Active',
        currentStock: existing ? existing.currentStock : 0
      };
    }

    const cleanKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[cleanKey(key)] = val;
    }

    if (type === 'products') {
      const code = String(normalized.code || normalized.productcode || normalized.itemcode || `FP-${1000 + idx}`).trim();
      const name = String(normalized.name || normalized.productname || normalized.itemname || normalized.itemdescription || '').trim();
      const category = String(normalized.category || normalized.categoryname || 'Corrugated Boxes').trim();
      const subCategory = String(normalized.subcategory || normalized.subcat || '').trim();
      const costPrice = Number(normalized.costprice || normalized.cost || 0) || 0;
      const sellingPrice = Number(normalized.sellingprice || normalized.price || normalized.rate || 0) || 0;
      const availableStock = normalized.availablestock !== undefined ? Number(normalized.availablestock) || 0 : 0;
      const existing = products.find(p => p.code.toLowerCase() === code.toLowerCase());

      return {
        id: existing?.id || normalized.id || `PRD-IMP-${Date.now()}-${idx}`,
        code,
        name,
        category,
        subCategory,
        costPrice,
        sellingPrice,
        availableStock: existing ? existing.availableStock : availableStock,
        status: normalized.status === 'Inactive' ? 'Inactive' : 'Active',
        unit: String(normalized.unit || normalized.uom || 'Boxes').trim(),
        hsnCode: String(normalized.hsncode || normalized.hsn || '48191000').trim(),
        warehouse: String(normalized.warehouse || '').trim(),
        minStock: Number(normalized.minstock || 100) || 0,
        specifications: String(normalized.specifications || normalized.description || '').trim()
      };
    } else if (type === 'suppliers') {
      const code = String(normalized.code || normalized.suppliercode || `SUP-${1000 + idx}`).trim();
      const supplierName = String(normalized.suppliername || normalized.name || normalized.companyname || normalized.millname || '').trim();
      const millName = String(normalized.millname || normalized.mill || supplierName).trim();
      const existing = suppliers.find(s => ((s as any).code && (s as any).code.toLowerCase() === code.toLowerCase()) || s.supplierName.toLowerCase() === supplierName.toLowerCase());

      return {
        id: existing?.id || normalized.id || `SUP-IMP-${Date.now()}-${idx}`,
        supplierName,
        millName,
        category: String(normalized.category || 'Paper Mill').trim(),
        gstNumber: String(normalized.gstnumber || normalized.gst || '').trim(),
        pan: String(normalized.pan || '').trim(),
        contactPerson: String(normalized.contactperson || normalized.contact || '').trim(),
        phone: String(normalized.phone || '').trim(),
        mobile: String(normalized.mobile || '').trim(),
        email: String(normalized.email || '').trim(),
        website: String(normalized.website || '').trim(),
        paymentTerms: String(normalized.paymentterms || 'Net 30').trim(),
        creditDays: Number(normalized.creditdays || 30) || 0,
        address: String(normalized.address || '').trim(),
        city: String(normalized.city || '').trim(),
        state: String(normalized.state || '').trim(),
        country: String(normalized.country || 'India').trim(),
        pincode: String(normalized.pincode || '').trim(),
        status: normalized.status === 'Inactive' ? 'Inactive' : 'Active',
        outstandingBalance: Number(normalized.outstandingbalance || 0) || 0,
        rating: Number(normalized.rating || 5) || 5
      };
    } else if (type === 'warehouses') {
      const code = String(normalized.code || normalized.warehousecode || `WH-${1000 + idx}`).trim();
      const name = String(normalized.name || normalized.warehousename || normalized.location || '').trim();
      const existing = warehouses.find(w => w.code.toLowerCase() === code.toLowerCase() || w.name.toLowerCase() === name.toLowerCase());

      return {
        id: existing?.id || normalized.id || `WH-IMP-${Date.now()}-${idx}`,
        code,
        name,
        location: String(normalized.location || normalized.address || '').trim(),
        manager: String(normalized.manager || '').trim(),
        capacitySqFt: Number(normalized.capacitysqft || normalized.capacity || 10000) || 0,
        status: String(normalized.status || 'Operational').trim()
      };
    } else if (type === 'categories') {
      const name = String(normalized.name || normalized.categoryname || '').trim();
      const code = String(normalized.code || normalized.categorycode || `CAT-${1000 + idx}`).trim();
      const typeVal = String(normalized.type || 'Raw Material').trim();
      const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());

      return {
        id: existing?.id || normalized.id || `CAT-IMP-${Date.now()}-${idx}`,
        name,
        code,
        type: typeVal,
        description: String(normalized.description || '').trim(),
        status: normalized.status === 'Inactive' ? 'Inactive' : 'Active',
        itemsCount: existing?.itemsCount || 0
      };
    }

    return row;
  };

  // 6. Process uploaded file & parse with XLSX
  const processFile = (file: File) => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv') {
      setImportStatus({
        type: 'error',
        message: 'Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'
      });
      return;
    }

    setSelectedFile(file);
    setImportStatus({ type: '', message: '' });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'The selected sheet appears to be empty.'
          });
          return;
        }

        // Header detection for diagnostics
        const allHeaderKeys = Array.from(
          new Set(rawJson.flatMap(r => (typeof r === 'object' && r ? Object.keys(r) : [])))
        );
        const report = detectRawMaterialHeaders(allHeaderKeys);
        setHeaderReport(report);

        // Validate and normalize rows
        const items: ImportPreviewItem[] = rawJson.map((row, idx) => {
          const errors: string[] = [];
          const normalized = normalizeRowData(row, activeTab, idx);

          if (activeTab === 'raw_materials') {
            if (!normalized.name) errors.push(`Row ${idx + 2}: Name/Material Name is required.`);
          } else if (activeTab === 'products') {
            if (!normalized.name) errors.push(`Row ${idx + 2}: Product Name is required.`);
          } else if (activeTab === 'suppliers') {
            if (!normalized.supplierName) errors.push(`Row ${idx + 2}: Supplier Name is required.`);
          } else if (activeTab === 'warehouses') {
            if (!normalized.name) errors.push(`Row ${idx + 2}: Warehouse Name is required.`);
          } else if (activeTab === 'categories') {
            if (!normalized.name) errors.push(`Row ${idx + 2}: Category Name is required.`);
          }

          return {
            id: normalized.id || `TEMP-${idx + 1}`,
            code: normalized.code,
            name: normalized.name || normalized.supplierName,
            isValid: errors.length === 0,
            errors,
            data: normalized
          };
        });

        setParsedData(items);
        
        const validCount = items.filter(i => i.isValid).length;
        if (validCount === 0) {
          const detectedNames = allHeaderKeys.join(', ');
          setImportStatus({
            type: 'error',
            message: `Parsed ${items.length} records, but 0 are valid. Detected columns: [${detectedNames}]. Please ensure at least one column maps to Item/Material Name.`
          });
        } else {
          setImportStatus({
            type: 'success',
            message: `Successfully loaded ${items.length} records (${validCount} valid, ${items.length - validCount} with errors). Ready to apply.`
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: 'Error processing Excel file: ' + err.message
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 7. Apply parsed rows to the database and sync state
  const handleApplyImport = async () => {
    const validRows = parsedData.filter(item => item.isValid).map(item => item.data);

    if (validRows.length === 0) {
      alert('No valid records to apply.');
      return;
    }

    setIsProcessing(true);
    setImportStatus({ type: 'info', message: `Persisting ${validRows.length} records directly into database...` });

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_token') || '') : '';
      const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('erp_currentUser') : null;
      let email = currentUser?.email || '';
      if (!email && storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          email = parsed.email || '';
        } catch {}
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (email) headers['x-user-email'] = email;

      const res = await fetch('/api/bulk-import', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          module: activeTab,
          rows: validRows,
          action: 'import',
          duplicateHandling: importMode === 'overwrite' ? 'update' : 'skip',
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Server rejected bulk import transaction');
      }

      const { imported = 0, updated = 0, skipped = 0, failed = 0 } = result.data || {};

      // Refetch latest records from database to ensure fresh IDs, relations, and timestamps
      if (activeTab === 'raw_materials') {
        const freshRes = await fetch('/api/raw-materials', { headers }).then(r => r.json()).catch(() => null);
        if (freshRes && freshRes.success && Array.isArray(freshRes.data)) {
          onUpdateRawMaterials(freshRes.data);
        }
      } else if (activeTab === 'products') {
        const freshRes = await fetch('/api/products', { headers }).then(r => r.json()).catch(() => null);
        if (freshRes && freshRes.success && Array.isArray(freshRes.data)) {
          onUpdateProducts(freshRes.data);
        }
      } else if (activeTab === 'suppliers') {
        const freshRes = await fetch('/api/suppliers', { headers }).then(r => r.json()).catch(() => null);
        if (freshRes && freshRes.success && Array.isArray(freshRes.data)) {
          onUpdateSuppliers(freshRes.data);
        }
      } else if (activeTab === 'warehouses') {
        const freshRes = await fetch('/api/warehouses', { headers }).then(r => r.json()).catch(() => null);
        if (freshRes && freshRes.success && Array.isArray(freshRes.data)) {
          onUpdateWarehouses(freshRes.data);
        }
      } else if (activeTab === 'categories') {
        const freshRes = await fetch('/api/categories', { headers }).then(r => r.json()).catch(() => null);
        if (freshRes && freshRes.success && Array.isArray(freshRes.data)) {
          onUpdateCategories(freshRes.data);
        }
      }

      onAddActivity({
        action: 'Imported Data into Database',
        module: 'Admin Excel Hub',
        details: `Successfully stored ${imported} records into database (${updated} updated, ${skipped} skipped, ${failed} failed) for ${getTabLabel(activeTab)}.`
      });

      setImportStatus({
        type: 'success',
        message: `Database update complete: ${imported} records saved (${updated} updated, ${skipped} skipped, ${failed} failed).`
      });

      alert(`Successfully saved ${imported} records to the database for ${getTabLabel(activeTab)}!`);
      handleClearImport();
    } catch (err: any) {
      console.error('Import failure:', err);
      setImportStatus({
        type: 'error',
        message: `Database import error: ${err.message || 'Unknown failure'}`
      });
      alert('Failed to save imported records to database: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearImport = () => {
    setSelectedFile(null);
    setParsedData([]);
    setImportStatus({ type: '', message: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Administrator Excel Hub
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Complete bulk data import & export system using secure client-side Excel parsing
              </p>
            </div>
          </div>
        </div>
        
        {/* Export quick links */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Export:</span>
          <button 
            onClick={() => handleExport('raw_materials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Raw Materials</span>
          </button>
          <button 
            onClick={() => handleExport('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              darkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Goods</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(['raw_materials', 'products', 'suppliers', 'warehouses', 'categories'] as DataType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              handleClearImport();
            }}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Grid container: Left is Import, Right is Template & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Core import card */}
        <div className={`lg:col-span-8 rounded-2xl border p-6 flex flex-col ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-md font-bold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Upload className="w-5 h-5 text-emerald-500" />
              <span>Bulk Import - {getTabLabel(activeTab)}</span>
            </h3>
            {selectedFile && (
              <button
                onClick={handleClearImport}
                className="text-xs font-bold text-red-500 hover:underline flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear upload</span>
              </button>
            )}
          </div>

          {/* Company Printing Inks quick action for raw materials */}
          {activeTab === 'raw_materials' && !selectedFile && (
            <div className={`mb-5 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              darkMode ? 'bg-gradient-to-r from-emerald-950/30 to-indigo-950/30 border-emerald-500/30' : 'bg-gradient-to-r from-emerald-50 to-indigo-50 border-emerald-200 shadow-xs'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Company Printing Inks Catalog (91 Items Available)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Vijay Maruti (66), SLN Enterprises (10), Sky Aqua Colour (1), and Seven - 11 (14).
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleDownloadCompanyInksTemplate}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Download Inks Excel</span>
                </button>
                <button
                  onClick={handleLoadCompanyInksDirectly}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>1-Click Load (91 Rows)</span>
                </button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            onClick={(e) => e.stopPropagation()}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Drag & Drop Box */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : darkMode ? 'border-slate-700 bg-slate-950/20 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }`}
            >
              <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                <FileUp className="w-10 h-10 text-emerald-500" />
              </div>
              <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Drag and drop your spreadsheet here, or <span className="text-emerald-500 hover:underline">browse files</span>
              </p>
              <p className={`text-xs mt-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Supports Excel (.xlsx, .xls) and standard CSV sheets
              </p>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border flex items-center space-x-4 mb-4 ${
              darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB • Rows found: {parsedData.length}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors`}
                  title="Upload different file"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Import configs (Modes) */}
          {selectedFile && parsedData.length > 0 && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Import Mode Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
                  importMode === 'merge'
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : darkMode ? 'border-slate-800 bg-transparent' : 'border-slate-200 bg-transparent'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className={`block text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Merge & Update (Safe)
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5 leading-normal">
                      Updates matching ID rows with uploaded data; appends non-existing rows. Prevents complete data deletion.
                    </span>
                  </div>
                </label>

                <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
                  importMode === 'overwrite'
                    ? 'border-rose-500/40 bg-rose-500/5'
                    : darkMode ? 'border-slate-800 bg-transparent' : 'border-slate-200 bg-transparent'
                }`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importMode === 'overwrite'}
                    onChange={() => setImportMode('overwrite')}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className={`block text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Full Overwrite (Replace)
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5 leading-normal text-rose-400">
                      WARNING: This completely deletes all current records in {getTabLabel(activeTab)} and replaces them with this file's valid rows.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Status Message */}
          {importStatus.message && (
            <div className={`mt-4 p-3.5 rounded-xl flex items-start space-x-3 border ${
              importStatus.type === 'success'
                ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
                : importStatus.type === 'info'
                ? 'bg-blue-500/5 border-blue-500/30 text-blue-400'
                : 'bg-rose-500/5 border-rose-500/30 text-rose-400'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              ) : importStatus.type === 'info' ? (
                <Loader2 className="w-5 h-5 shrink-0 text-blue-500 animate-spin" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              )}
              <span className="text-xs font-medium leading-relaxed">
                {importStatus.message}
              </span>
            </div>
          )}

          {/* Column Mapping Diagnostics Panel */}
          {headerReport && headerReport.detectedHeaders.length > 0 && (
            <div className={`mt-4 p-4 rounded-xl border ${
              darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Header Normalization & Column Mapping
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-semibold ${
                    headerReport.hasNameColumn
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {headerReport.hasNameColumn ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    <span>{headerReport.hasNameColumn ? 'Name Column Mapped' : 'Name Column Missing'}</span>
                  </span>
                </div>
              </div>

              {/* Mapped columns chip grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {headerReport.mappings.map((m, mIdx) => (
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

          {/* Table Preview */}
          {parsedData.length > 0 && (
            <div className="mt-5 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col">
              <div className={`px-4 py-2.5 border-b font-semibold text-xs uppercase tracking-wider flex items-center justify-between ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <span>Parsed Spreadsheet Rows (Valid: {parsedData.filter(p => p.isValid).length})</span>
                <span className="text-[10px] text-emerald-500 font-bold">Previewing first 10 rows</span>
              </div>
              
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className={darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-semibold">Row UID</th>
                      <th className="p-2 font-semibold">Code / Key</th>
                      <th className="p-2 font-semibold">Display Title / Name</th>
                      <th className="p-2 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-slate-200 dark:border-slate-800/40 hover:bg-slate-800/10 ${
                          !row.isValid ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="p-2 font-mono font-bold text-slate-400">{row.id}</td>
                        <td className="p-2 font-semibold">{row.code || 'N/A'}</td>
                        <td className="p-2 font-medium truncate max-w-xs">{row.name || 'Unknown'}</td>
                        <td className="p-2 text-center">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                              Valid Row
                            </span>
                          ) : (
                            <span 
                              className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 font-bold cursor-help"
                              title={row.errors.join(', ')}
                            >
                              Error: {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {selectedFile && parsedData.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                onClick={handleClearImport}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
                  darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              
              <button
                onClick={handleApplyImport}
                disabled={isProcessing || parsedData.filter(p => p.isValid).length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Import ({parsedData.filter(p => p.isValid).length} Rows)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info & Download Templates Sidebar Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Download Templates Card */}
          <div className={`rounded-2xl border p-6 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-sm font-bold flex items-center space-x-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Download className="w-4.5 h-4.5 text-emerald-500" />
              <span>Reference Templates</span>
            </h3>
            <p className={`text-xs mb-4 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Download pre-structured Excel templates containing the correct column formats and test rows. Simply edit and re-upload!
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleDownloadTemplate(activeTab)}
                className="w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="block text-xs font-bold text-emerald-400">
                      Download {getTabLabel(activeTab)} Template
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Contains exact table headers
                    </span>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-emerald-500" />
              </button>

              {activeTab === 'raw_materials' && (
                <button
                  onClick={handleDownloadCompanyInksTemplate}
                  className="w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="block text-xs font-bold text-indigo-400">
                        Company Inks Catalog (.xlsx)
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        91 Printing Inks & Chemicals
                      </span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-indigo-500" />
                </button>
              )}

              <div className="pt-2 border-t border-slate-800/50 mt-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Other Templates:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['raw_materials', 'products', 'suppliers', 'warehouses', 'categories'] as DataType[])
                    .filter(t => t !== activeTab)
                    .map(tab => (
                      <button
                        key={tab}
                        onClick={() => handleDownloadTemplate(tab)}
                        className={`p-2 rounded-lg border text-left transition-colors flex items-center justify-between ${
                          darkMode ? 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold truncate">{getTabLabel(tab)}</span>
                        <Download className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Secure System Instructions Box */}
          <div className={`rounded-2xl border p-5 space-y-3.5 ${
            darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50/60 border-slate-200 text-slate-600'
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Info className="w-4 h-4 text-emerald-500" />
              <span>ERP Data Integrity Rules</span>
            </h4>
            <ul className="space-y-2 text-[11px] leading-relaxed list-disc list-inside">
              <li>
                System fields like database <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>IDs</strong> and <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>currentStock</strong> are not required — imports use business keys (e.g. Code, Name).
              </li>
              <li>
                Matching records by code will update existing entries in &ldquo;Merge & Update&rdquo; mode; new items are automatically appended.
              </li>
              <li>
                Number columns (Purchase Price, GSM, Dimensions) should contain clean numeric values without currency symbols (₹, $).
              </li>
              <li>
                HSN Code columns should be formatted as text to preserve leading zeros.
              </li>
              <li>
                Categories, Suppliers, and Warehouses are automatically matched by name and linked seamlessly.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
