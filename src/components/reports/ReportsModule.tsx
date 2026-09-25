'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Package,
  Layers,
  Factory,
  Truck,
  DollarSign,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  Boxes,
  PieChart as PieChartIcon,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { exportToExcel, exportToCSV, triggerPrintWindow } from '@/utils/reportExport';

interface ReportsModuleProps {
  darkMode: boolean;
  initialTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
  onGenerateReport?: (reportTitle: string) => void;
  onNavigateEntity?: (module: string, subPage?: string, id?: string) => void;
}

type MainTab = 'dashboard' | 'sales' | 'purchase' | 'inventory' | 'production' | 'dispatch' | 'financial';
type SalesSubTab = 'leads' | 'salesman';
type PurchaseSubTab = 'monthly' | 'category';
type InventorySubTab = 'finished_goods' | 'sfg' | 'material_status' | 'opening_closing';
type ProductionSubTab = 'consumption' | 'wastage';
type DispatchSubTab = 'scheduled_vs_actual' | 'completion';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  darkMode,
  initialTab,
  onTabChange,
  onGenerateReport,
  onNavigateEntity,
}) => {
  // Navigation Tabs State
  const [mainTab, setMainTab] = useState<MainTab>(initialTab || 'dashboard');
  const [salesSubTab, setSalesSubTab] = useState<SalesSubTab>('leads');
  const [purchaseSubTab, setPurchaseSubTab] = useState<PurchaseSubTab>('monthly');
  const [inventorySubTab, setInventorySubTab] = useState<InventorySubTab>('finished_goods');
  const [productionSubTab, setProductionSubTab] = useState<ProductionSubTab>('consumption');
  const [dispatchSubTab, setDispatchSubTab] = useState<DispatchSubTab>('scheduled_vs_actual');

  // Synchronize when initialTab prop updates from router/URL
  useEffect(() => {
    if (initialTab && initialTab !== mainTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tab: MainTab) => {
    setMainTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Filter States
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState('All');
  const [selectedExecutive, setSelectedExecutive] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [itemTypeFilter, setItemTypeFilter] = useState<'All' | 'Raw Material' | 'Finished Product'>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Data States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<{
    warehouses: { id: string; label: string; code?: string }[];
    categories: { id: string; label: string }[];
    suppliers: { id: string; label: string }[];
    customers: { id: string; label: string }[];
    salesExecutives: string[];
  }>({
    warehouses: [],
    categories: [],
    suppliers: [],
    customers: [],
    salesExecutives: [],
  });

  // Load Filter Options once
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch('/api/reports/filter-options');
        const json = await res.json();
        if (json.success) {
          setFilterOptions({
            warehouses: json.warehouses || [],
            categories: json.categories || [],
            suppliers: json.suppliers || [],
            customers: json.customers || [],
            salesExecutives: json.salesExecutives || [],
          });
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch Report Data based on active tab and filters
  const fetchActiveReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (datePreset !== 'all') queryParams.set('preset', datePreset);
    if (datePreset === 'custom') {
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);
    }
    if (searchText.trim()) queryParams.set('search', searchText.trim());
    queryParams.set('page', String(currentPage));
    queryParams.set('limit', String(pageSize));

    let endpoint = '/api/reports/dashboard';

    if (mainTab === 'dashboard') {
      endpoint = `/api/reports/dashboard?${queryParams.toString()}`;
    } else if (mainTab === 'sales') {
      if (salesSubTab === 'leads') {
        if (selectedExecutive !== 'All') queryParams.set('salesExecutive', selectedExecutive);
        if (selectedCustomer !== 'All') queryParams.set('customerId', selectedCustomer);
        if (selectedStatus !== 'All') queryParams.set('status', selectedStatus);
        endpoint = `/api/reports/sales/leads?${queryParams.toString()}`;
      } else {
        if (selectedExecutive !== 'All') queryParams.set('salesExecutive', selectedExecutive);
        endpoint = `/api/reports/sales/salesman?${queryParams.toString()}`;
      }
    } else if (mainTab === 'purchase') {
      if (purchaseSubTab === 'monthly') {
        if (selectedSupplier !== 'All') queryParams.set('supplierId', selectedSupplier);
        if (selectedStatus !== 'All') queryParams.set('status', selectedStatus);
        endpoint = `/api/reports/purchases/monthly?${queryParams.toString()}`;
      } else {
        if (selectedSupplier !== 'All') queryParams.set('supplierId', selectedSupplier);
        if (selectedCategory !== 'All') queryParams.set('categoryId', selectedCategory);
        endpoint = `/api/reports/purchases/category?${queryParams.toString()}`;
      }
    } else if (mainTab === 'inventory') {
      if (inventorySubTab === 'finished_goods') {
        if (selectedWarehouse !== 'All') queryParams.set('warehouseId', selectedWarehouse);
        endpoint = `/api/reports/inventory/finished-goods?${queryParams.toString()}`;
      } else if (inventorySubTab === 'sfg') {
        if (selectedWarehouse !== 'All') queryParams.set('warehouseId', selectedWarehouse);
        endpoint = `/api/reports/inventory/sfg?${queryParams.toString()}`;
      } else if (inventorySubTab === 'material_status') {
        if (selectedStatus !== 'All') queryParams.set('status', selectedStatus);
        endpoint = `/api/reports/inventory/sales-order-material-status?${queryParams.toString()}`;
      } else {
        if (selectedWarehouse !== 'All') queryParams.set('warehouseId', selectedWarehouse);
        if (itemTypeFilter !== 'All') queryParams.set('itemType', itemTypeFilter);
        endpoint = `/api/reports/inventory/opening-closing-stock?${queryParams.toString()}`;
      }
    } else if (mainTab === 'production') {
      if (productionSubTab === 'consumption') {
        if (selectedStatus !== 'All') queryParams.set('status', selectedStatus);
        endpoint = `/api/reports/production/material-consumption?${queryParams.toString()}`;
      } else {
        endpoint = `/api/reports/production/wastage?${queryParams.toString()}`;
      }
    } else if (mainTab === 'dispatch') {
      if (dispatchSubTab === 'scheduled_vs_actual') {
        if (selectedStatus !== 'All') queryParams.set('status', selectedStatus);
        endpoint = `/api/reports/dispatch/scheduled-vs-actual?${queryParams.toString()}`;
      } else {
        if (selectedStatus !== 'All') queryParams.set('fulfillmentStatus', selectedStatus);
        endpoint = `/api/reports/dispatch/completion?${queryParams.toString()}`;
      }
    } else if (mainTab === 'financial') {
      endpoint = `/api/reports/financial/gross-profit-loss?${queryParams.toString()}`;
    }

    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data !== undefined ? json.data : json);
      } else {
        setError(json.error || 'Failed to fetch report data.');
      }
    } catch (err: any) {
      console.error('Fetch report error:', err);
      setError(err.message || 'Error communicating with report server.');
    } finally {
      setLoading(false);
    }
  }, [
    mainTab,
    salesSubTab,
    purchaseSubTab,
    inventorySubTab,
    productionSubTab,
    dispatchSubTab,
    datePreset,
    startDate,
    endDate,
    searchText,
    currentPage,
    pageSize,
    selectedWarehouse,
    selectedCategory,
    selectedSupplier,
    selectedCustomer,
    selectedExecutive,
    selectedStatus,
    itemTypeFilter,
  ]);

  useEffect(() => {
    fetchActiveReport();
  }, [fetchActiveReport]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchText('');
  }, [mainTab, salesSubTab, purchaseSubTab, inventorySubTab, productionSubTab, dispatchSubTab]);

  // Current report export title & dataset
  const currentExportConfig = useMemo(() => {
    let title = 'Report';
    let dataList: any[] = [];

    if (mainTab === 'dashboard') {
      title = 'ERP_Executive_Dashboard_Summary';
      dataList = reportData?.charts?.monthlyTrends || [];
    } else if (mainTab === 'sales') {
      if (salesSubTab === 'leads') {
        title = 'Sales_Leads_Report';
        dataList = reportData?.data || [];
      } else {
        title = 'Salesman_Performance_Report';
        dataList = reportData?.data || [];
      }
    } else if (mainTab === 'purchase') {
      if (purchaseSubTab === 'monthly') {
        title = 'Monthly_Purchase_Report';
        dataList = reportData?.data || [];
      } else {
        title = 'Category_Wise_Purchase_Report';
        dataList = reportData?.data || [];
      }
    } else if (mainTab === 'inventory') {
      if (inventorySubTab === 'finished_goods') {
        title = 'Finished_Goods_Inventory_Report';
        dataList = reportData?.data || [];
      } else if (inventorySubTab === 'sfg') {
        title = 'Semi_Finished_Goods_WIP_Report';
        dataList = reportData?.data || [];
      } else if (inventorySubTab === 'material_status') {
        title = 'Sales_Order_Material_Status_Report';
        dataList = reportData?.data || [];
      } else {
        title = 'Opening_Closing_Stock_Valuation_Report';
        dataList = reportData?.data || [];
      }
    } else if (mainTab === 'production') {
      if (productionSubTab === 'consumption') {
        title = 'Job_Wise_Material_Consumption_Report';
        dataList = reportData?.data || [];
      } else {
        title = 'Production_Scrap_Wastage_Report';
        dataList = reportData?.data || [];
      }
    } else if (mainTab === 'dispatch') {
      if (dispatchSubTab === 'scheduled_vs_actual') {
        title = 'Scheduled_vs_Actual_Dispatch_Report';
        dataList = reportData?.data || [];
      } else {
        title = 'Dispatch_Fulfillment_Completion_Report';
        dataList = reportData?.data || [];
      }
    } else if (mainTab === 'financial') {
      title = 'Gross_Profit_Loss_Report';
      dataList = reportData?.orderProfitability || [];
    }

    return { title, dataList };
  }, [mainTab, salesSubTab, purchaseSubTab, inventorySubTab, productionSubTab, dispatchSubTab, reportData]);

  const handleExportExcel = () => {
    exportToExcel(currentExportConfig.dataList, currentExportConfig.title);
  };

  const handleExportCSV = () => {
    exportToCSV(currentExportConfig.dataList, currentExportConfig.title);
  };

  const handlePrint = () => {
    triggerPrintWindow();
  };

  // Safe navigation helper
  const navigateTo = (mod: string, subPage?: string, id?: string) => {
    if (onNavigateEntity) {
      onNavigateEntity(mod, subPage, id);
    }
  };

  return (
    <div className={`w-full min-h-screen space-y-6 pb-20 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
      {/* 1. HEADER & TOP CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                Enterprise Reports & Intelligence
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live SQL Data Integration • Corrugated Packaging Metrics • Instant Multi-Format Export
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchActiveReport()}
            disabled={loading}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              darkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
            }`}
            title="Refresh current report with live database query"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            title="Export full table data as formatted Microsoft Excel sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              darkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
            }`}
            title="Download report data as CSV file"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              darkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
            }`}
            title="Open browser print preview with clean print layout"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY MODULE NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'dashboard', label: 'Overview Dashboard', icon: BarChart3 },
          { id: 'sales', label: 'Sales Reports', icon: TrendingUp },
          { id: 'purchase', label: 'Purchase Reports', icon: ShoppingBag },
          { id: 'inventory', label: 'Inventory Reports', icon: Package },
          { id: 'production', label: 'Production Reports', icon: Factory },
          { id: 'dispatch', label: 'Dispatch Reports', icon: Truck },
          { id: 'financial', label: 'Financial Reports', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id as MainTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : darkMode
                  ? 'bg-slate-900/90 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. SECONDARY SUB-TABS (When applicable) */}
      {mainTab !== 'dashboard' && mainTab !== 'financial' && (
        <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 flex-wrap ${
          darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/80 border-slate-200'
        }`}>
          {mainTab === 'sales' && [
            { id: 'leads', label: 'Leads Report' },
            { id: 'salesman', label: 'Salesman-wise Performance' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setSalesSubTab(st.id as SalesSubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                salesSubTab === st.id
                  ? darkMode ? 'bg-slate-800 text-amber-400 shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}

          {mainTab === 'purchase' && [
            { id: 'monthly', label: 'Monthly Purchase Report' },
            { id: 'category', label: 'Category-wise Purchase Report' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setPurchaseSubTab(st.id as PurchaseSubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                purchaseSubTab === st.id
                  ? darkMode ? 'bg-slate-800 text-amber-400 shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}

          {mainTab === 'inventory' && [
            { id: 'finished_goods', label: 'Finished Goods Report' },
            { id: 'sfg', label: 'Semi-Finished Goods (SFG) WIP' },
            { id: 'material_status', label: 'Sales Order-wise Material Status' },
            { id: 'opening_closing', label: 'Opening & Closing Stock' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setInventorySubTab(st.id as InventorySubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                inventorySubTab === st.id
                  ? darkMode ? 'bg-slate-800 text-amber-400 shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}

          {mainTab === 'production' && [
            { id: 'consumption', label: 'Job-wise Material Consumption' },
            { id: 'wastage', label: 'Job-wise Wastage & Scrap' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setProductionSubTab(st.id as ProductionSubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                productionSubTab === st.id
                  ? darkMode ? 'bg-slate-800 text-amber-400 shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}

          {mainTab === 'dispatch' && [
            { id: 'scheduled_vs_actual', label: 'Scheduled vs Actual Dispatch' },
            { id: 'completion', label: 'Dispatch Completion & Fulfillment' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setDispatchSubTab(st.id as DispatchSubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dispatchSubTab === st.id
                  ? darkMode ? 'bg-slate-800 text-amber-400 shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. UNIVERSAL FILTER BAR: DATES, SEARCH & SPECIFIC DROPDOWNS */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_quarter', label: 'This Quarter' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ].map(dp => (
              <button
                key={dp.id}
                onClick={() => setDatePreset(dp.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  datePreset === dp.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dp.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records, SO #, items..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-all ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            />
          </div>
        </div>

        {/* Custom Date Pickers and Specific Context Dropdowns */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-wrap text-xs">
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 bg-amber-500/10 p-1.5 rounded-xl border border-amber-500/20">
              <span className="font-bold text-amber-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`px-2 py-1 rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              />
              <span className="font-bold text-amber-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`px-2 py-1 rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              />
            </div>
          )}

          {/* Sales Executives Dropdown */}
          {mainTab === 'sales' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Executive:</span>
              <select
                value={selectedExecutive}
                onChange={e => setSelectedExecutive(e.target.value)}
                className={`px-2.5 py-1 rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="All">All Executives</option>
                {filterOptions.salesExecutives.map(exec => (
                  <option key={exec} value={exec}>{exec}</option>
                ))}
              </select>
            </div>
          )}

          {/* Suppliers Dropdown */}
          {mainTab === 'purchase' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Supplier:</span>
              <select
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e.target.value)}
                className={`px-2.5 py-1 rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="All">All Suppliers</option>
                {filterOptions.suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Warehouses Dropdown */}
          {mainTab === 'inventory' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Warehouse:</span>
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className={`px-2.5 py-1 rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="All">All Warehouses</option>
                {filterOptions.warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Item Type Dropdown for Opening/Closing */}
          {mainTab === 'inventory' && inventorySubTab === 'opening_closing' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Type:</span>
              <select
                value={itemTypeFilter}
                onChange={e => setItemTypeFilter(e.target.value as any)}
                className={`px-2.5 py-1 rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="All">All Items (RM + FG)</option>
                <option value="Raw Material">Raw Material Only</option>
                <option value="Finished Product">Finished Products Only</option>
              </select>
            </div>
          )}

          {/* Status Dropdown */}
          {(mainTab === 'sales' && salesSubTab === 'leads') && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className={`px-2.5 py-1 rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Won">Won / Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          )}

          {/* Active Data Source Label */}
          <div className="ml-auto text-slate-400 text-[11px] flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PostgreSQL Database Active</span>
          </div>
        </div>
      </div>

      {/* 5. ERROR STATE */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-bold">Error loading report</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* 6. MAIN CONTENT AREA */}
      {loading && !reportData ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Querying and synthesizing enterprise metrics...</p>
        </div>
      ) : (
        <div>
          {/* ============================================================== */}
          {/* TAB 1: EXECUTIVE DASHBOARD                                     */}
          {/* ============================================================== */}
          {mainTab === 'dashboard' && reportData?.summary && (
            <div className="space-y-6">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sales</div>
                  <div className="text-xl font-black text-amber-500 mt-1">
                    ₹{(reportData.summary.totalSales || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Gross booked orders</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Purchases</div>
                  <div className="text-xl font-black text-blue-500 mt-1">
                    ₹{(reportData.summary.totalPurchases || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Reels & Consumables</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Production</div>
                  <div className="text-xl font-black text-emerald-500 mt-1">
                    {(reportData.summary.totalProduction || 0).toLocaleString('en-IN')} <span className="text-xs font-normal">Pcs</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Finished output</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatches</div>
                  <div className="text-xl font-black text-indigo-500 mt-1">
                    {(reportData.summary.totalDispatch || 0).toLocaleString('en-IN')} <span className="text-xs font-normal">Pcs</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {Math.round(reportData.summary.totalDispatchWeight || 0).toLocaleString()} kg weight
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RM Stock Valuation</div>
                  <div className="text-xl font-black text-purple-500 mt-1">
                    ₹{(reportData.summary.rawMaterialValuation || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {(reportData.summary.rawMaterialStock || 0).toLocaleString()} kg paper
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Profit</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    ₹{(reportData.summary.grossProfit || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Operational Gross</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Sales vs Purchases Bar Chart */}
                <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">Sales vs Procurement Trends (6 Months)</h3>
                      <p className="text-xs text-slate-400">Monthly contracted order revenue vs raw material purchasing</p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.charts?.monthlyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
                        <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                            borderColor: darkMode ? '#334155' : '#cbd5e1',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="sales" name="Sales Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Raw Material Category Valuation Breakdown */}
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className="text-sm font-bold tracking-tight mb-1">Raw Material Category Valuation</h3>
                  <p className="text-xs text-slate-400 mb-4">Inventory balance by paper grade</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.charts?.categoryValuation || []}
                          dataKey="valuation"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {(reportData.charts?.categoryValuation || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                            borderColor: darkMode ? '#334155' : '#cbd5e1',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Valuation']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Quick Launch Cards to All 12 Specific Reports */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Direct Report Launchpads
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Leads & Inquiries Report', category: 'Sales', tab: 'sales', sub: 'leads', icon: TrendingUp },
                    { title: 'Salesman-wise Performance', category: 'Sales', tab: 'sales', sub: 'salesman', icon: TrendingUp },
                    { title: 'Monthly Purchase Ledger', category: 'Procurement', tab: 'purchase', sub: 'monthly', icon: ShoppingBag },
                    { title: 'Category Purchase Breakdown', category: 'Procurement', tab: 'purchase', sub: 'category', icon: ShoppingBag },
                    { title: 'Finished Goods Inventory', category: 'Inventory', tab: 'inventory', sub: 'finished_goods', icon: Package },
                    { title: 'Semi-Finished (SFG) WIP', category: 'Inventory', tab: 'inventory', sub: 'sfg', icon: Layers },
                    { title: 'Sales Order Material Status', category: 'Inventory', tab: 'inventory', sub: 'material_status', icon: Boxes },
                    { title: 'Opening & Closing Stock', category: 'Inventory', tab: 'inventory', sub: 'opening_closing', icon: Package },
                    { title: 'Job Material Consumption', category: 'Production', tab: 'production', sub: 'consumption', icon: Factory },
                    { title: 'Job Wastage & Scrap Logs', category: 'Production', tab: 'production', sub: 'wastage', icon: Factory },
                    { title: 'Scheduled vs Actual Dispatch', category: 'Dispatch', tab: 'dispatch', sub: 'scheduled_vs_actual', icon: Truck },
                    { title: 'Gross Profit & Loss Analysis', category: 'Financial', tab: 'financial', sub: '', icon: DollarSign },
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setMainTab(card.tab as MainTab);
                          if (card.sub) {
                            if (card.tab === 'sales') setSalesSubTab(card.sub as SalesSubTab);
                            if (card.tab === 'purchase') setPurchaseSubTab(card.sub as PurchaseSubTab);
                            if (card.tab === 'inventory') setInventorySubTab(card.sub as InventorySubTab);
                            if (card.tab === 'production') setProductionSubTab(card.sub as ProductionSubTab);
                            if (card.tab === 'dispatch') setDispatchSubTab(card.sub as DispatchSubTab);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-500 hover:shadow-md ${
                          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span className="font-mono text-amber-500 font-bold uppercase">{card.category}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-amber-500" />
                          <h4 className="font-bold text-xs">{card.title}</h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: SALES REPORTS                                           */}
          {/* ============================================================== */}
          {mainTab === 'sales' && (
            <div className="space-y-4">
              {salesSubTab === 'leads' && (
                <>
                  {/* Summary Totals Bar */}
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Leads</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalLeads}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Expected Quantity</div>
                        <div className="text-xl font-black text-blue-500">
                          {(reportData.totals.totalExpectedQuantity || 0).toLocaleString()} <span className="text-xs font-normal">Pcs</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Pipeline Value</div>
                        <div className="text-xl font-black text-emerald-500">
                          ₹{(reportData.totals.totalExpectedValue || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Conversion Rate</div>
                        <div className="text-xl font-black text-purple-500">{reportData.totals.conversionRate}%</div>
                      </div>
                    </div>
                  )}

                  {/* Leads Data Table */}
                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <th className="p-3">Lead #</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Sales Executive</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Requirement</th>
                            <th className="p-3 text-right">Expected Qty</th>
                            <th className="p-3 text-right">Expected Value</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Converted SO #</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {(reportData?.data || []).map((lead: any) => (
                            <tr key={lead.id} className="hover:bg-slate-500/5 transition-colors">
                              <td className="p-3 font-mono font-bold text-amber-500">{lead.leadNumber}</td>
                              <td className="p-3 font-semibold">{lead.customerName}</td>
                              <td className="p-3">{lead.salesExecutive}</td>
                              <td className="p-3 text-slate-400">{lead.leadDate}</td>
                              <td className="p-3 max-w-[200px] truncate" title={lead.productRequirement}>
                                {lead.productRequirement}
                              </td>
                              <td className="p-3 text-right font-medium">{(lead.expectedQuantity || 0).toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-emerald-500">₹{(lead.expectedValue || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  lead.status === 'Won' || lead.status === 'Converted'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : lead.status === 'Lost'
                                    ? 'bg-red-500/10 text-red-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-400">
                                {lead.salesOrderReference ? (
                                  <button
                                    onClick={() => navigateTo('sales', 'sales_order_view', lead.salesOrderId)}
                                    className="text-amber-500 hover:underline flex items-center gap-1"
                                  >
                                    <span>{lead.salesOrderReference}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => navigateTo('sales', 'lead_workspace', lead.id)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-950 transition-all"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!reportData?.data || reportData.data.length === 0) && (
                            <tr>
                              <td colSpan={10} className="p-8 text-center text-slate-400">
                                No leads match the selected filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {salesSubTab === 'salesman' && (
                <>
                  {/* Summary Totals */}
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Sales Executives</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalExecutives}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Booked Orders</div>
                        <div className="text-xl font-black text-blue-500">{reportData.totals.totalSalesOrders}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Sales Value</div>
                        <div className="text-xl font-black text-emerald-500">
                          ₹{(reportData.totals.totalSalesValue || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Completed Orders</div>
                        <div className="text-xl font-black text-purple-500">{reportData.totals.totalCompletedOrders}</div>
                      </div>
                    </div>
                  )}

                  {/* Salesman Performance Table */}
                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <th className="p-3">Sales Executive</th>
                            <th className="p-3 text-center">Assigned Leads</th>
                            <th className="p-3 text-center">Quotes Created</th>
                            <th className="p-3 text-right">Quotes Value</th>
                            <th className="p-3 text-center">Orders Won</th>
                            <th className="p-3 text-right">Sales Value</th>
                            <th className="p-3 text-center">Delivered</th>
                            <th className="p-3 text-center">In-Progress</th>
                            <th className="p-3 text-right">Conversion Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {(reportData?.data || []).map((exec: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                              <td className="p-3 font-bold text-slate-200 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-[10px]">
                                  {exec.salesExecutive.slice(0, 1)}
                                </div>
                                <span>{exec.salesExecutive}</span>
                              </td>
                              <td className="p-3 text-center font-medium">{exec.leadsCount}</td>
                              <td className="p-3 text-center font-medium">{exec.quotationsCount}</td>
                              <td className="p-3 text-right font-mono">₹{(exec.quotationsValue || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3 text-center font-bold text-amber-500">{exec.salesOrdersCount}</td>
                              <td className="p-3 text-right font-bold text-emerald-500">₹{(exec.salesValue || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3 text-center text-emerald-400">{exec.completedOrders}</td>
                              <td className="p-3 text-center text-blue-400">{exec.pendingOrders}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, exec.conversionRate)}%` }} />
                                  </div>
                                  <span className="font-bold font-mono">{exec.conversionRate}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: PURCHASE REPORTS                                        */}
          {/* ============================================================== */}
          {mainTab === 'purchase' && (
            <div className="space-y-4">
              {purchaseSubTab === 'monthly' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Active Months</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalMonths}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Purchase Orders</div>
                        <div className="text-xl font-black text-blue-500">{reportData.totals.totalOrders}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Purchased Quantity</div>
                        <div className="text-xl font-black text-emerald-500">
                          {(reportData.totals.totalQuantity || 0).toLocaleString()} <span className="text-xs font-normal">kg</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Procurement Spend</div>
                        <div className="text-xl font-black text-purple-500">
                          ₹{(reportData.totals.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">Month</th>
                          <th className="p-3 text-center">PO Count</th>
                          <th className="p-3 text-right">Quantity Ordered</th>
                          <th className="p-3 text-right">Total Amount (₹)</th>
                          <th className="p-3 text-center">Completed POs</th>
                          <th className="p-3 text-center">Pending / In-Transit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((row: any) => (
                          <tr key={row.monthKey} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-bold">{row.monthLabel}</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-500">{row.ordersCount}</td>
                            <td className="p-3 text-right font-medium">{(row.purchaseQuantity || 0).toLocaleString()} kg</td>
                            <td className="p-3 text-right font-bold text-emerald-500">₹{(row.purchaseAmount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center text-emerald-400 font-semibold">{row.completedPOs}</td>
                            <td className="p-3 text-center text-blue-400 font-semibold">{row.pendingPOs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {purchaseSubTab === 'category' && (
                <>
                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">Material Category</th>
                          <th className="p-3 text-center">Unique Materials</th>
                          <th className="p-3 text-center">Total POs</th>
                          <th className="p-3 text-right">Quantity Ordered</th>
                          <th className="p-3 text-right">Total Spend (₹)</th>
                          <th className="p-3 text-right">Spend Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((cat: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-bold flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                              <span>{cat.category}</span>
                            </td>
                            <td className="p-3 text-center font-mono">{cat.materialCount}</td>
                            <td className="p-3 text-center font-mono text-amber-500 font-bold">{cat.poCount}</td>
                            <td className="p-3 text-right font-medium">{(cat.purchaseQuantity || 0).toLocaleString()} kg</td>
                            <td className="p-3 text-right font-bold text-emerald-500">₹{(cat.purchaseAmount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${cat.sharePercent}%` }} />
                                </div>
                                <span className="font-bold font-mono">{cat.sharePercent}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: INVENTORY REPORTS                                       */}
          {/* ============================================================== */}
          {mainTab === 'inventory' && (
            <div className="space-y-4">
              {inventorySubTab === 'finished_goods' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Products</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalProducts}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Current FG Inventory</div>
                        <div className="text-xl font-black text-blue-500">
                          {(reportData.totals.totalCurrentStock || 0).toLocaleString()} <span className="text-xs font-normal">Pcs</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total FG Valuation</div>
                        <div className="text-xl font-black text-emerald-500">
                          ₹{(reportData.totals.totalValuation || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">Product Code</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Box Type / Specs</th>
                          <th className="p-3">Warehouse / Bin</th>
                          <th className="p-3 text-right">Produced</th>
                          <th className="p-3 text-right">Dispatched</th>
                          <th className="p-3 text-right">Available Stock</th>
                          <th className="p-3 text-right">Cost Price</th>
                          <th className="p-3 text-right">Valuation (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{item.code}</td>
                            <td className="p-3 font-semibold">{item.name}</td>
                            <td className="p-3">{item.category}</td>
                            <td className="p-3 text-slate-400">{item.boxType} ({item.dimensions})</td>
                            <td className="p-3">
                              <span className="font-medium">{item.warehouseName}</span>
                              <span className="text-[10px] text-slate-400 block">{item.binCode}</span>
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-400">{(item.producedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-blue-400">{(item.dispatchedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-amber-400">{(item.currentStock || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono">₹{item.costPrice}</td>
                            <td className="p-3 text-right font-bold text-emerald-500 font-mono">₹{(item.totalValuation || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {inventorySubTab === 'sfg' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Active WIP Stages</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalSFGItems}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Output Units</div>
                        <div className="text-xl font-black text-blue-500">
                          {(reportData.totals.totalProduced || 0).toLocaleString()} <span className="text-xs font-normal">Pcs</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Current WIP Stock</div>
                        <div className="text-xl font-black text-purple-500">
                          {(reportData.totals.totalWIPStock || 0).toLocaleString()} <span className="text-xs font-normal">Pcs</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">SFG Code</th>
                          <th className="p-3">Process / Board Description</th>
                          <th className="p-3">Work Center / Stage</th>
                          <th className="p-3">Plant Location</th>
                          <th className="p-3 text-right">Produced Qty</th>
                          <th className="p-3 text-right">Consumed / Scrapped</th>
                          <th className="p-3 text-right">Current WIP Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((row: any) => (
                          <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{row.sfgCode}</td>
                            <td className="p-3 font-semibold">{row.sfgName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400">
                                {row.stage}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">{row.warehouseName}</td>
                            <td className="p-3 text-right font-mono">{(row.producedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-red-400">{(row.consumedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">{(row.currentStock || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {inventorySubTab === 'material_status' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total SO Material Records</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalRows}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Sufficient Stock Orders</div>
                        <div className="text-xl font-black text-emerald-500">{reportData.totals.sufficientCount}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Shortage / Critical Attention</div>
                        <div className="text-xl font-black text-red-500">{reportData.totals.shortageCount}</div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">SO #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Product</th>
                          <th className="p-3">BOM Material</th>
                          <th className="p-3 text-right">Required (kg)</th>
                          <th className="p-3 text-right">In Stock (kg)</th>
                          <th className="p-3 text-right">Shortage</th>
                          <th className="p-3">Stock Status</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((row: any) => (
                          <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{row.soNumber}</td>
                            <td className="p-3 font-semibold">{row.customerName}</td>
                            <td className="p-3">{row.productName}</td>
                            <td className="p-3 font-medium text-slate-300">{row.materialName}</td>
                            <td className="p-3 text-right font-mono">{(row.requiredQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-blue-400">{(row.availableQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-red-400 font-bold">
                              {row.pendingQuantity > 0 ? `-${row.pendingQuantity.toLocaleString()}` : '0'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.stockStatus === 'Sufficient Stock'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {row.stockStatus}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => navigateTo('sales', 'sales_order_view', row.salesOrderId)}
                                className="px-2 py-1 rounded bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px]"
                              >
                                View SO
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {inventorySubTab === 'opening_closing' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Materials & Goods</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalItems}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Period Inward</div>
                        <div className="text-xl font-black text-blue-500">
                          {(reportData.totals.totalInwardQuantity || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Period Outward</div>
                        <div className="text-xl font-black text-purple-500">
                          {(reportData.totals.totalOutwardQuantity || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Closing Valuation</div>
                        <div className="text-xl font-black text-emerald-500">
                          ₹{(reportData.totals.totalClosingValuation || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">Item Code</th>
                          <th className="p-3">Item Name</th>
                          <th className="p-3">Item Type</th>
                          <th className="p-3">Warehouse</th>
                          <th className="p-3 text-right">Opening</th>
                          <th className="p-3 text-right">Inward</th>
                          <th className="p-3 text-right">Outward</th>
                          <th className="p-3 text-right">Closing</th>
                          <th className="p-3 text-right">Unit Rate</th>
                          <th className="p-3 text-right">Closing Valuation (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((row: any) => (
                          <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{row.code}</td>
                            <td className="p-3 font-semibold">{row.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.itemType === 'Raw Material' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                              }`}>
                                {row.itemType}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">{row.warehouseName}</td>
                            <td className="p-3 text-right font-mono">{(row.openingStock || 0).toLocaleString()} {row.uom}</td>
                            <td className="p-3 text-right font-mono text-emerald-400">+{(row.inwardQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-red-400">-{(row.outwardQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-amber-400">{(row.closingStock || 0).toLocaleString()} {row.uom}</td>
                            <td className="p-3 text-right font-mono">₹{row.unitPrice}</td>
                            <td className="p-3 text-right font-bold text-emerald-500 font-mono">₹{(row.closingValuation || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PRODUCTION REPORTS                                      */}
          {/* ============================================================== */}
          {mainTab === 'production' && (
            <div className="space-y-4">
              {productionSubTab === 'consumption' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Work Orders</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalJobs}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Planned Output</div>
                        <div className="text-xl font-black text-blue-500">
                          {(reportData.totals.totalPlannedQuantity || 0).toLocaleString()} <span className="text-xs font-normal">Pcs</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Produced Output</div>
                        <div className="text-xl font-black text-emerald-500">
                          {(reportData.totals.totalProducedQuantity || 0).toLocaleString()} <span className="text-xs font-normal">Pcs</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Material Cost</div>
                        <div className="text-xl font-black text-purple-500">
                          ₹{(reportData.totals.totalMaterialCost || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">Job / WO #</th>
                          <th className="p-3">SO # / Customer</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3 text-right">Produced Qty</th>
                          <th className="p-3">BOM Materials Consumed</th>
                          <th className="p-3 text-right">Total Material Cost</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((job: any) => (
                          <tr key={job.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{job.workOrderNumber}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-200 block">{job.salesOrderNumber}</span>
                              <span className="text-slate-400 text-[11px]">{job.customerName}</span>
                            </td>
                            <td className="p-3 font-medium">{job.productName}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">
                              {(job.producedQuantity || 0).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {(job.materials || []).map((m: any, mIdx: number) => (
                                  <div key={mIdx} className="flex items-center justify-between text-[11px] bg-slate-800/40 px-2 py-0.5 rounded">
                                    <span className="text-slate-300 truncate max-w-[140px]">{m.materialName}</span>
                                    <span className="font-mono text-amber-400 ml-2">{m.quantityConsumed} {m.unit}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-500 font-mono">
                              ₹{(job.totalMaterialCost || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400">
                                {job.productionStatus}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => navigateTo('production', 'production_work_orders', job.id)}
                                className="px-2 py-1 rounded bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px]"
                              >
                                View Job
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {productionSubTab === 'wastage' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Production Jobs</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalJobs}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Scrap Weight</div>
                        <div className="text-xl font-black text-red-500">
                          {(reportData.totals.totalScrapKg || 0).toLocaleString()} <span className="text-xs font-normal">kg</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Estimated Scrap Value</div>
                        <div className="text-xl font-black text-purple-500">
                          ₹{(reportData.totals.totalWastageCost || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Average Wastage %</div>
                        <div className="text-xl font-black text-amber-400">{reportData.totals.avgWastagePercent}%</div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">Work Order #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3 text-right">Produced Qty</th>
                          <th className="p-3 text-right">Rejected Qty</th>
                          <th className="p-3 text-right">Total Scrap (kg)</th>
                          <th className="p-3 text-right">Wastage %</th>
                          <th className="p-3 text-right">Scrap Cost (₹)</th>
                          <th className="p-3">Stage Scrap Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((w: any) => (
                          <tr key={w.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{w.workOrderNumber}</td>
                            <td className="p-3 font-semibold">{w.customerName}</td>
                            <td className="p-3">{w.productName}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">{(w.producedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-red-400">{(w.rejectedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-red-500">{(w.totalScrapKg || 0).toLocaleString()} kg</td>
                            <td className="p-3 text-right font-mono font-bold text-amber-400">{w.wastagePercentage}%</td>
                            <td className="p-3 text-right font-bold text-purple-400 font-mono">₹{(w.wastageCost || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3">
                              {w.scrapBreakdown && w.scrapBreakdown.length > 0 ? (
                                <div className="space-y-0.5">
                                  {w.scrapBreakdown.slice(0, 2).map((sb: any, idx: number) => (
                                    <div key={idx} className="text-[10px] text-slate-400">
                                      <span className="font-bold text-slate-300">{sb.stage}:</span> {sb.weightKg}kg ({sb.reason || 'Trimming'})
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500">Corrugator edge trims</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: DISPATCH REPORTS                                        */}
          {/* ============================================================== */}
          {mainTab === 'dispatch' && (
            <div className="space-y-4">
              {dispatchSubTab === 'scheduled_vs_actual' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Dispatches</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalDispatches}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">On-Time Dispatches</div>
                        <div className="text-xl font-black text-emerald-500">{reportData.totals.onTimeCount}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Delayed Shipments</div>
                        <div className="text-xl font-black text-red-500">{reportData.totals.delayedCount}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">On-Time Performance</div>
                        <div className="text-xl font-black text-purple-500">{reportData.totals.onTimeRate}%</div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">Challan #</th>
                          <th className="p-3">SO #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Scheduled Date</th>
                          <th className="p-3">Actual Dispatch</th>
                          <th className="p-3">Delivery Status</th>
                          <th className="p-3 text-right">Delay (Days)</th>
                          <th className="p-3 text-right">Dispatched Qty</th>
                          <th className="p-3">Vehicle & Transporter</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((d: any) => (
                          <tr key={d.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{d.challanNumber}</td>
                            <td className="p-3 font-mono text-slate-300">{d.soNumber}</td>
                            <td className="p-3 font-semibold">{d.customerName}</td>
                            <td className="p-3 text-slate-400">{d.scheduledDate ? String(d.scheduledDate).split('T')[0] : '-'}</td>
                            <td className="p-3 text-slate-200 font-medium">{d.actualDate ? String(d.actualDate).split('T')[0] : '-'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.deliveryStatus === 'On-Time' || d.deliveryStatus === 'Early'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {d.deliveryStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold">
                              {d.delayDays > 0 ? `+${d.delayDays}d` : d.delayDays < 0 ? `${d.delayDays}d` : '0d'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">
                              {(d.dispatchedQuantity || 0).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <div className="text-[11px]">
                                <span className="font-bold text-slate-200">{d.vehicleNumber}</span>
                                <span className="text-slate-400 block text-[10px]">{d.transporterName}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {dispatchSubTab === 'completion' && (
                <>
                  {reportData?.totals && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Total Sales Orders</div>
                        <div className="text-xl font-black text-amber-500">{reportData.totals.totalOrders}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Fully Dispatched</div>
                        <div className="text-xl font-black text-emerald-500">{reportData.totals.fullyDispatched}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Partially Dispatched</div>
                        <div className="text-xl font-black text-blue-500">{reportData.totals.partiallyDispatched}</div>
                      </div>
                      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="text-xs text-slate-400">Avg Completion Rate</div>
                        <div className="text-xl font-black text-purple-500">{reportData.totals.averageCompletionRate}%</div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <th className="p-3">SO #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3 text-right">Ordered Qty</th>
                          <th className="p-3 text-right">Dispatched Qty</th>
                          <th className="p-3 text-right">Pending Qty</th>
                          <th className="p-3 text-right">Fulfillment %</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(reportData?.data || []).map((row: any) => (
                          <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-500">{row.soNumber}</td>
                            <td className="p-3 font-semibold">{row.customerName}</td>
                            <td className="p-3">{row.productName}</td>
                            <td className="p-3 text-right font-mono">{(row.orderedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">{(row.dispatchedQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-amber-400">{(row.pendingQuantity || 0).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full ${row.completionPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min(100, row.completionPercentage)}%` }}
                                  />
                                </div>
                                <span className="font-bold font-mono">{row.completionPercentage}%</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.fulfillmentStatus === 'Fully Dispatched'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : row.fulfillmentStatus === 'Short Closed'
                                  ? 'bg-purple-500/10 text-purple-400'
                                  : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {row.fulfillmentStatus}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => navigateTo('sales', 'sales_order_view', row.id)}
                                className="px-2 py-1 rounded bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px]"
                              >
                                View SO
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: FINANCIAL GROSS PROFIT & LOSS                           */}
          {/* ============================================================== */}
          {mainTab === 'financial' && (
            <div className="space-y-6">
              {/* Financial KPI Summary */}
              {reportData?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="text-xs text-slate-400">Total Revenue</div>
                    <div className="text-xl font-black text-amber-500 mt-1">
                      ₹{(reportData.summary.totalRevenue || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500">Contracted Sales</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="text-xs text-slate-400">Direct Material Cost</div>
                    <div className="text-xl font-black text-blue-500 mt-1">
                      ₹{(reportData.summary.totalMaterialCost || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500">Kraft & Adhesive</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="text-xs text-slate-400">Production Overhead</div>
                    <div className="text-xl font-black text-indigo-400 mt-1">
                      ₹{(reportData.summary.totalProductionCost || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500">Conversion Cost</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="text-xs text-slate-400">Total Cost (COGS)</div>
                    <div className="text-xl font-black text-red-400 mt-1">
                      ₹{(reportData.summary.totalCost || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500">Direct + Overhead</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="text-xs text-slate-400">Gross Profit</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">
                      ₹{(reportData.summary.grossProfit || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500">Net Operational Margin</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="text-xs text-slate-400">Gross Margin %</div>
                    <div className="text-xl font-black text-purple-400 mt-1">
                      {reportData.summary.grossMarginPercent}%
                    </div>
                    <div className="text-[10px] text-slate-500">Efficiency Ratio</div>
                  </div>
                </div>
              )}

              {/* Monthly Profitability Bar Chart */}
              {reportData?.monthlyBreakdown && (
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className="text-sm font-bold tracking-tight mb-1">Monthly Gross Revenue vs Gross Profit</h3>
                  <p className="text-xs text-slate-400 mb-4">Tracking monthly margins across corrugated box deliveries</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.monthlyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
                        <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                            borderColor: darkMode ? '#334155' : '#cbd5e1',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="revenue" name="Total Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="materialCost" name="Material Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="grossProfit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Order-Level Profitability Table */}
              <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs flex items-center justify-between">
                  <span>Sales Order Profitability Ledger</span>
                  <span className="text-slate-400 font-normal">Real unit costs calculated from BOM standards</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b font-bold ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <th className="p-3">SO #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Revenue (₹)</th>
                        <th className="p-3 text-right">Material Cost</th>
                        <th className="p-3 text-right">Production Overhead</th>
                        <th className="p-3 text-right">Gross Profit (₹)</th>
                        <th className="p-3 text-right">Margin %</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {(reportData?.orderProfitability || []).map((row: any) => (
                        <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="p-3 font-mono font-bold text-amber-500">{row.soNumber}</td>
                          <td className="p-3 font-semibold">{row.customerName}</td>
                          <td className="p-3">{row.productName}</td>
                          <td className="p-3 text-right font-mono">{(row.quantity || 0).toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-slate-200 font-mono">₹{(row.revenue || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-mono text-blue-400">₹{(row.directMaterialCost || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-mono text-indigo-400">₹{(row.productionCost || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-bold text-emerald-400 font-mono">₹{(row.grossProfit || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-mono font-bold">
                            <span className={row.marginPercent >= 20 ? 'text-emerald-400' : 'text-amber-400'}>
                              {row.marginPercent}%
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => navigateTo('sales', 'sales_order_view', row.id)}
                              className="px-2 py-1 rounded bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px]"
                            >
                              View SO
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
