import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Layers, 
  Truck, 
  Warehouse as WarehouseIcon, 
  ArrowLeftRight, 
  BarChart3, 
  ShoppingCart, 
  TrendingUp, 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  ChevronDown, 
  ChevronRight, 
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  BoxesIcon,
  FileText,
  ClipboardCheck,
  Award,
  CheckCircle,
  X,
  Users,
  ShoppingBag,
  Building,
  Clock,
  CheckCircle2,
  History,
  Calculator,
  Trash2,
  PackageCheck,
  FileCheck,
  Cpu,
  Calendar
} from 'lucide-react';
import { ModuleType, User } from '../../types';
import { canAccessModule, canAccessAnyModule } from '../../utils/permissions';

// Persistent global variable to survive re-mounts
let globalSidebarScrollTop = 0;

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  darkMode: boolean;
  currentUser: User | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  darkMode,
  currentUser,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTop = useRef<number>(globalSidebarScrollTop);
  const isNavigatingRef = useRef<boolean>(false);

  // Preserve open/collapsed accordion states across navigation and sessions
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_inventory_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [procurementOpen, setProcurementOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_procurement_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [salesOpen, setSalesOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_sales_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [costingOpen, setCostingOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_costing_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [dispatchOpen, setDispatchOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_dispatch_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [productionOpen, setProductionOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_production_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [qcOpen, setQcOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_qc_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [reportsOpen, setReportsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('amk_sidebar_reports_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const toggleInventory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInventoryOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_inventory_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleProcurement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProcurementOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_procurement_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleSales = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSalesOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_sales_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleCosting = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCostingOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_costing_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleDispatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDispatchOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_dispatch_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleProduction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProductionOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_production_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleQc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQcOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_qc_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleReports = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReportsOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('amk_sidebar_reports_open', String(next));
      } catch (_) {}
      return next;
    });
  };

  // Restore initial scroll position from memory / sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('amk_sidebar_scroll_pos');
      const targetTop = saved ? parseFloat(saved) : globalSidebarScrollTop;
      if (!isNaN(targetTop) && targetTop > 0) {
        savedScrollTop.current = targetTop;
        globalSidebarScrollTop = targetTop;
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = targetTop;
        }
      }
    } catch (_) {}
  }, []);

  // Whenever activeModule changes or re-renders occur, ensure the sidebar scroll position is strictly maintained
  useLayoutEffect(() => {
    const applyScroll = () => {
      if (scrollContainerRef.current && savedScrollTop.current > 0) {
        scrollContainerRef.current.scrollTop = savedScrollTop.current;
      }
    };

    applyScroll();

    const animId1 = requestAnimationFrame(() => {
      applyScroll();
      const animId2 = requestAnimationFrame(() => {
        applyScroll();
        // Done with navigation transition window
        isNavigatingRef.current = false;
      });
      return () => cancelAnimationFrame(animId2);
    });

    return () => cancelAnimationFrame(animId1);
  }, [activeModule, isCollapsed, inventoryOpen, procurementOpen, salesOpen, dispatchOpen]);

  // Track scrolling and immediately record position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    
    // Ignore false reset events during page transitions when navigating
    if (isNavigatingRef.current && top === 0 && savedScrollTop.current > 0) {
      e.currentTarget.scrollTop = savedScrollTop.current;
      return;
    }

    savedScrollTop.current = top;
    globalSidebarScrollTop = top;
    try {
      sessionStorage.setItem('amk_sidebar_scroll_pos', String(top));
    } catch (_) {}
  };

  const handleSelectModule = (module: ModuleType) => {
    isNavigatingRef.current = true;
    if (scrollContainerRef.current) {
      const currentTop = scrollContainerRef.current.scrollTop;
      if (currentTop > 0) {
        savedScrollTop.current = currentTop;
        globalSidebarScrollTop = currentTop;
        try {
          sessionStorage.setItem('amk_sidebar_scroll_pos', String(currentTop));
        } catch (_) {}
      }
    }
    onSelectModule(module);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isInventorySubActive = [
    'dashboard',
    'inventory_raw', 
    'inventory_products', 
    'inventory_categories', 
    'inventory_suppliers', 
    'inventory_warehouses', 
    'inventory_transactions', 
    'inventory_stock'
  ].includes(activeModule);

  const isProcurementSubActive = [
    'procurement',
    'procurement_dashboard',
    'procurement_rfq',
    'procurement_quotes',
    'procurement_po',
    'procurement_gate_entry',
    'procurement_reel_inward',
    'procurement_inward',
    'procurement_qc'
  ].includes(activeModule);

  const isSalesSubActive = [
    'sales',
    'sales_dashboard',
    'sales_leads',
    'sales_quotations',
    'sales_orders',
    'sales_customers'
  ].includes(activeModule);

  const isCostingSubActive = [
    'costing',
    'costing_dashboard',
    'costing_bom',
    'costing_sheets',
    'costing_new',
    'costing_pending',
    'costing_approved',
    'costing_history'
  ].includes(activeModule);

  const isDispatchSubActive = [
    'dispatch',
    'dispatch_dashboard',
    'dispatch_list',
    'dispatch_pending',
    'dispatch_completed',
    'dispatch_history',
    'dispatch_create',
    'dispatch_view',
    'sales_dispatch'
  ].includes(activeModule);

  const isProductionSubActive = [
    'production',
    'production_dashboard',
    'production_planning',
    'production_work_orders',
    'production_orders',
    'production_indents',
    'production_floor_ops',
    'production_floor',
    'production_reports',
    'production_approvals',
    'production_fg',
    'production_machines',
    'production_scrap',
    'production_scrap_downtime',
    'production_qc',
    'production_bom'
  ].includes(activeModule);

  const isQcSubActive = [
    'qc',
    'quality_control',
    'qc_dashboard',
    'qc_inspections',
    'qc_pending',
    'qc_ncr',
    'qc_history'
  ].includes(activeModule);

  const isReportsSubActive = [
    'reports',
    'reports_dashboard',
    'reports_sales',
    'reports_purchase',
    'reports_inventory',
    'reports_production',
    'reports_dispatch',
    'reports_financial'
  ].includes(activeModule);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-72'} border-r flex flex-col transition-all duration-300 select-none
        lg:sticky lg:top-0 lg:h-screen shrink-0
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}
      `}>
        <div className={`h-16 px-4 flex items-center justify-between border-b ${darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl shrink-0">
              AM
            </div>
            {!isCollapsed && (
              <div>
                <h1 className={`font-extrabold text-lg tracking-wide flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  AMK <span className="text-emerald-500 ml-1">ERP</span>
                </h1>
                <p className={`text-[10px] font-medium tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enterprise Manufacturing</p>
              </div>
            )}
          </div>
          {/* Collapse Toggle Button */}
          {!isMobileOpen && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}
          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className={`p-1.5 rounded-lg lg:hidden transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation List with Independent Scroll & Preserved Scroll Offset */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain py-6 px-4 space-y-1.5 custom-scrollbar"
      >
        {/* Dynamic Permission Check Utility */}
        {(() => {
          const canView = (mod: ModuleType | string) => canAccessModule(currentUser, mod);

          const canViewInventorySubmenu = canAccessAnyModule(currentUser, [
            'dashboard',
            'inventory_raw',
            'inventory_products',
            'inventory_categories',
            'inventory_suppliers',
            'inventory_warehouses',
            'inventory_transactions',
            'inventory_stock'
          ]);

          const canViewProcurementSubmenu = canAccessAnyModule(currentUser, [
            'procurement_dashboard',
            'procurement_rfq',
            'procurement_quotes',
            'procurement_po',
            'procurement_gate_entry',
            'procurement_reel_inward',
            'procurement_qc'
          ]);

          const canViewSalesSubmenu = canAccessAnyModule(currentUser, [
            'sales',
            'sales_dashboard',
            'sales_leads',
            'sales_quotations',
            'sales_orders',
            'sales_customers'
          ]);

          const canViewCostingSubmenu = canAccessAnyModule(currentUser, [
            'costing',
            'costing_dashboard',
            'costing_bom',
            'costing_sheets',
            'costing_new',
            'costing_pending',
            'costing_approved',
            'costing_history'
          ]);

          const canViewDispatchSubmenu = canAccessAnyModule(currentUser, [
            'dispatch',
            'dispatch_dashboard',
            'dispatch_list',
            'dispatch_pending',
            'dispatch_completed',
            'dispatch_history',
            'sales_dispatch'
          ]);

          const canViewReportsSubmenu = canAccessAnyModule(currentUser, [
            'reports',
            'reports_dashboard',
            'reports_sales',
            'reports_purchase',
            'reports_inventory',
            'reports_production',
            'reports_dispatch',
            'reports_financial'
          ]);

          const canViewEnterpriseHeader = 
            canViewProcurementSubmenu || 
            canView('production') || 
            canViewSalesSubmenu || 
            canViewCostingSubmenu ||
            canViewDispatchSubmenu ||
            canView('accounts') || 
            canViewReportsSubmenu;

          return (
            <>
              {/* INVENTORY MODULE */}
              {canViewInventorySubmenu && (
                <div>
                  <button
                    type="button"
                    onClick={toggleInventory}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isInventorySubActive
                        ? (darkMode ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-emerald-700 bg-emerald-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Inventory Module" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Package className="w-4 h-4 text-emerald-500" />
                      {!isCollapsed && <span>Inventory Module</span>}
                    </div>
                    {!isCollapsed && (inventoryOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {inventoryOpen && (
                    <div className={`pl-4 mt-1 space-y-1 border-l ml-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {canView('dashboard') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('dashboard')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'dashboard'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Inventory Dashboard" : undefined}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Inventory Dashboard</span>}
                        </button>
                      )}

                      {canView('inventory_raw') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('inventory_raw')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'inventory_raw'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Raw Materials Master" : undefined}
                        >
                          <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Raw Materials Master</span>}
                        </button>
                      )}

                      {canView('inventory_products') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('inventory_products')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'inventory_products'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Products (Finished Goods)" : undefined}
                        >
                          <BoxesIcon className="w-3.5 h-3.5 text-teal-500" />
                          {!isCollapsed && <span>Products (Finished Goods)</span>}
                        </button>
                      )}

                      {canView('inventory_categories') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('inventory_categories')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'inventory_categories'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Categories & Sub-Categories" : undefined}
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-500" />
                          {!isCollapsed && <span>Categories & Sub-Categories</span>}
                        </button>
                      )}

                      {canView('inventory_suppliers') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('inventory_suppliers')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'inventory_suppliers'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Suppliers (Mill Directory)" : undefined}
                        >
                          <Truck className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Suppliers (Mill Directory)</span>}
                        </button>
                      )}

                      {canView('inventory_warehouses') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('inventory_warehouses')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'inventory_warehouses'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Warehouses & Bins" : undefined}
                        >
                          <WarehouseIcon className="w-3.5 h-3.5 text-indigo-500" />
                          {!isCollapsed && <span>Warehouses & Bins</span>}
                        </button>
                      )}

                      {canView('inventory_transactions') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('inventory_transactions')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'inventory_transactions'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Stock Movements" : undefined}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                          {!isCollapsed && <span>Stock Movements</span>}
                        </button>
                      )}

                      {canView('inventory_stock') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('inventory_stock')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'inventory_stock'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Stock Alerts" : undefined}
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-rose-500" />
                          {!isCollapsed && <span>Stock Alerts</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Other Modules (Structured Navigation) */}
              {canViewEnterpriseHeader && (
                <div className="pt-4 pb-2">
                  {!isCollapsed && (
                    <div className="px-3.5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Enterprise Modules
                    </div>
                  )}
                </div>
              )}

              {/* PROCUREMENT MODULE */}
              {canViewProcurementSubmenu && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleProcurement}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isProcurementSubActive
                        ? (darkMode ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-emerald-700 bg-emerald-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Procurement Module" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="w-4 h-4 text-amber-500" />
                      {!isCollapsed && <span>Procurement Module</span>}
                    </div>
                    {!isCollapsed && (procurementOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {procurementOpen && (
                    <div className={`pl-4 mt-1 space-y-1 border-l ml-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {canView('procurement_dashboard') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('procurement_dashboard')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'procurement' || activeModule === 'procurement_dashboard'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Procurement Dashboard" : undefined}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Procurement Dashboard</span>}
                        </button>
                      )}

                      {canView('procurement_rfq') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('procurement_rfq')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'procurement_rfq'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Requisitions & RFQs" : undefined}
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-500" />
                          {!isCollapsed && <span>Requisitions & RFQs</span>}
                        </button>
                      )}

                      {canView('procurement_quotes') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('procurement_quotes')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'procurement_quotes'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Supplier Quotations" : undefined}
                        >
                          <Award className="w-3.5 h-3.5 text-cyan-500" />
                          {!isCollapsed && <span>Supplier Quotations</span>}
                        </button>
                      )}

                      {canView('procurement_po') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('procurement_po')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'procurement_po'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Purchase Orders (POs)" : undefined}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Purchase Orders (POs)</span>}
                        </button>
                      )}

                      {canView('procurement_gate_entry') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('procurement_gate_entry')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'procurement_gate_entry' || activeModule === 'procurement_inward'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Gate Entry" : undefined}
                        >
                          <Truck className="w-3.5 h-3.5 text-indigo-500" />
                          {!isCollapsed && <span>Gate Entry</span>}
                        </button>
                      )}

                      {canView('procurement_reel_inward') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('procurement_reel_inward')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'procurement_reel_inward'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Reel Inward" : undefined}
                        >
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Reel Inward</span>}
                        </button>
                      )}

                      {canView('procurement_qc') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('procurement_qc')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'procurement_qc'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Quality Control (QC)" : undefined}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-rose-500" />
                          {!isCollapsed && <span>Quality Control (QC)</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PRODUCTION & PLANNING MODULE */}
              {canView('production') && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleProduction}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isProductionSubActive
                        ? (darkMode ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-emerald-700 bg-emerald-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Production & Planning" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Boxes className="w-4 h-4 text-emerald-500" />
                      {!isCollapsed && <span>Production & Planning</span>}
                    </div>
                    {!isCollapsed && (productionOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {productionOpen && (
                    <div className={`pl-4 mt-1 space-y-1 border-l ml-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {/* 1. Dashboard */}
                      {canView('production_dashboard') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_dashboard')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production' || activeModule === 'production_dashboard'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dashboard" : undefined}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Dashboard</span>}
                        </button>
                      )}

                      {/* 2. Planning & Scheduling */}
                      {canView('production_planning') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_planning')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_planning'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Planning & Scheduling" : undefined}
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Planning & Scheduling</span>}
                        </button>
                      )}

                      {/* 3. Work Orders */}
                      {canView('production_work_orders') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_work_orders')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_work_orders'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Work Orders" : undefined}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 text-blue-500" />
                          {!isCollapsed && <span>Work Orders</span>}
                        </button>
                      )}

                      {/* 4. Production Orders & WIP */}
                      {canView('production_orders') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_orders')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_orders'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Production Orders & WIP" : undefined}
                        >
                          <Layers className="w-3.5 h-3.5 text-teal-500" />
                          {!isCollapsed && <span>Production Orders & WIP</span>}
                        </button>
                      )}

                      {/* 5. Material Indents */}
                      {canView('production_indents') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_indents')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_indents'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Material Indents" : undefined}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500" />
                          {!isCollapsed && <span>Material Indents</span>}
                        </button>
                      )}

                      {/* 6. Floor Operations */}
                      {canView('production_floor_ops') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_floor_ops')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_floor_ops' || activeModule === 'production_floor'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Floor Operations" : undefined}
                        >
                          <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Floor Operations</span>}
                        </button>
                      )}

                      {/* 7. Daily Production Reports */}
                      {canView('production_reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_reports')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_reports'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Daily Production Reports" : undefined}
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          {!isCollapsed && <span>Daily Production Reports</span>}
                        </button>
                      )}

                      {/* 8. Approvals */}
                      {canView('production_approvals') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_approvals')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_approvals'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Approvals" : undefined}
                        >
                          <FileCheck className="w-3.5 h-3.5 text-rose-500" />
                          {!isCollapsed && <span>Approvals</span>}
                        </button>
                      )}

                      {/* 9. Finished Goods (FG) */}
                      {canView('production_fg') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_fg')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_fg'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Finished Goods (FG)" : undefined}
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Finished Goods (FG)</span>}
                        </button>
                      )}

                      {/* 10. Machines & Lines */}
                      {canView('production_machines') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_machines')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_machines'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Machines & Lines" : undefined}
                        >
                          <BoxesIcon className="w-3.5 h-3.5 text-indigo-500" />
                          {!isCollapsed && <span>Machines & Lines</span>}
                        </button>
                      )}

                      {/* 11. Scrap & Downtime */}
                      {canView('production_scrap') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('production_scrap')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'production_scrap' || activeModule === 'production_scrap_downtime'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Scrap & Downtime" : undefined}
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Scrap & Downtime</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* QUALITY CONTROL (QC) MODULE */}
              {(canView('qc') || canView('quality_control') || canView('procurement_qc') || canView('production_qc')) && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleQc}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isQcSubActive
                        ? (darkMode ? 'text-blue-400 bg-slate-800/80 font-semibold' : 'text-blue-700 bg-blue-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Quality Control (QC)" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      {!isCollapsed && <span>Quality Control (QC)</span>}
                    </div>
                    {!isCollapsed && (qcOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {qcOpen && (
                    <div className={`pl-4 mt-1 space-y-1 border-l ml-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectModule('qc')}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          activeModule === 'qc' || activeModule === 'qc_dashboard' || activeModule === 'quality_control'
                            ? (darkMode ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500' : 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600')
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                        title={isCollapsed ? "QC Dashboard" : undefined}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
                        {!isCollapsed && <span>QC Dashboard</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectModule('qc_pending' as any)}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          activeModule === 'qc_pending'
                            ? (darkMode ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500' : 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600')
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                        title={isCollapsed ? "Pending Queues" : undefined}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
                        {!isCollapsed && <span>Pending Queues</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectModule('qc_inspections' as any)}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          activeModule === 'qc_inspections'
                            ? (darkMode ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500' : 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600')
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                        title={isCollapsed ? "All Inspections" : undefined}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        {!isCollapsed && <span>All Inspections</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectModule('qc_ncr' as any)}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          activeModule === 'qc_ncr'
                            ? (darkMode ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500' : 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600')
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                        title={isCollapsed ? "NCR & Rejections" : undefined}
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                        {!isCollapsed && <span>NCR & Rejections</span>}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SALES MODULE */}
              {canViewSalesSubmenu && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleSales}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSalesSubActive
                        ? (darkMode ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-emerald-700 bg-emerald-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Sales" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      {!isCollapsed && <span>Sales</span>}
                    </div>
                    {!isCollapsed && (salesOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {!isCollapsed && salesOpen && (
                    <div className={`pl-4 mt-1 space-y-1 border-l ml-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {canView('sales_dashboard') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('sales_dashboard')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'sales' || activeModule === 'sales_dashboard'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dashboard" : undefined}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Dashboard</span>}
                        </button>
                      )}

                      {canView('sales_leads') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('sales_leads')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'sales_leads'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Leads" : undefined}
                        >
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          {!isCollapsed && <span>Leads</span>}
                        </button>
                      )}

                      {canView('sales_quotations') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('sales_quotations')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'sales_quotations'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Quotations" : undefined}
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-500" />
                          {!isCollapsed && <span>Quotations</span>}
                        </button>
                      )}

                      {canView('sales_orders') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('sales_orders')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'sales_orders'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Sales Orders" : undefined}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Sales Orders</span>}
                        </button>
                      )}

                      {canView('sales_customers') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('sales_customers')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'sales_customers'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Customers" : undefined}
                        >
                          <Building className="w-3.5 h-3.5 text-indigo-500" />
                          {!isCollapsed && <span>Customers</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* COSTING MODULE */}
              {canViewCostingSubmenu && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleCosting}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isCostingSubActive
                        ? (darkMode ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-emerald-700 bg-emerald-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Costing" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Calculator className="w-4 h-4 text-emerald-500" />
                      {!isCollapsed && <span>Costing</span>}
                    </div>
                    {!isCollapsed && (costingOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {!isCollapsed && costingOpen && (
                    <div className={`pl-4 mt-1 space-y-1 border-l ml-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {canView('costing_dashboard') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('costing_dashboard')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'costing' || activeModule === 'costing_dashboard'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dashboard" : undefined}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Dashboard</span>}
                        </button>
                      )}

                      {canView('costing_bom') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('costing_bom')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'costing_bom'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "BOM" : undefined}
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          {!isCollapsed && <span>BOM</span>}
                        </button>
                      )}

                      {canView('costing_sheets') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('costing_sheets')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'costing_sheets'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Cost Sheets" : undefined}
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-500" />
                          {!isCollapsed && <span>Cost Sheets</span>}
                        </button>
                      )}

                      {canView('costing_new') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('costing_new')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'costing_new'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "New Cost Sheet" : undefined}
                        >
                          <Calculator className="w-3.5 h-3.5 text-blue-500" />
                          {!isCollapsed && <span>New Cost Sheet</span>}
                        </button>
                      )}

                      {canView('costing_pending') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('costing_pending')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'costing_pending'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Pending Approval" : undefined}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Pending Approval</span>}
                        </button>
                      )}

                      {canView('costing_approved') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('costing_approved')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'costing_approved'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Approved" : undefined}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Approved</span>}
                        </button>
                      )}

                      {canView('costing_history') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('costing_history')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'costing_history'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Costing History" : undefined}
                        >
                          <History className="w-3.5 h-3.5 text-purple-500" />
                          {!isCollapsed && <span>Costing History</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DISPATCH MODULE */}
              {canViewDispatchSubmenu && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleDispatch}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isDispatchSubActive
                        ? (darkMode ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-emerald-700 bg-emerald-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Dispatch" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Truck className="w-4 h-4 text-emerald-500" />
                      {!isCollapsed && <span>Dispatch</span>}
                    </div>
                    {!isCollapsed && (dispatchOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {!isCollapsed && dispatchOpen && (
                    <div className={`pl-4 mt-1 space-y-1 border-l ml-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {canView('dispatch_dashboard') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('dispatch_dashboard')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'dispatch_dashboard'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dashboard" : undefined}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Dashboard</span>}
                        </button>
                      )}

                      {canView('dispatch_list') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('dispatch_list')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'dispatch_list' || activeModule === 'dispatch' || activeModule === 'sales_dispatch' || activeModule === 'dispatch_create' || activeModule === 'dispatch_view'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dispatch" : undefined}
                        >
                          <Truck className="w-3.5 h-3.5 text-blue-500" />
                          {!isCollapsed && <span>Dispatch</span>}
                        </button>
                      )}

                      {canView('dispatch_pending') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('dispatch_pending')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'dispatch_pending'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Pending Dispatch" : undefined}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Pending Dispatch</span>}
                        </button>
                      )}

                      {canView('dispatch_completed') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('dispatch_completed')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'dispatch_completed'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Completed Dispatch" : undefined}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Completed Dispatch</span>}
                        </button>
                      )}

                      {canView('dispatch_history') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('dispatch_history')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'dispatch_history'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dispatch History" : undefined}
                        >
                          <History className="w-3.5 h-3.5 text-purple-500" />
                          {!isCollapsed && <span>Dispatch History</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canView('accounts') && (
                <button
                  type="button"
                  onClick={() => handleSelectModule('accounts')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'accounts'
                      ? (darkMode ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-4 border-emerald-600')
                      : (darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                  }`}
                  title={isCollapsed ? "Accounts & Finance" : undefined}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {!isCollapsed && <span>Accounts & Finance</span>}
                </button>
              )}

              {/* REPORTS MODULE */}
              {canViewReportsSubmenu && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleReports}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isReportsSubActive
                        ? (darkMode ? 'text-emerald-400 bg-slate-800/80 font-semibold' : 'text-emerald-700 bg-emerald-50/60 font-semibold')
                        : (darkMode ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }`}
                    title={isCollapsed ? "Reports" : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      {!isCollapsed && <span>Reports</span>}
                    </div>
                    {!isCollapsed && (reportsOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  </button>

                  {!isCollapsed && reportsOpen && (
                    <div className="pl-4 pr-1 py-1 space-y-1">
                      {canView('reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('reports_dashboard')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'reports_dashboard' || activeModule === 'reports'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dashboard" : undefined}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Dashboard</span>}
                        </button>
                      )}

                      {canView('reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('reports_sales')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'reports_sales'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Sales Reports" : undefined}
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                          {!isCollapsed && <span>Sales Reports</span>}
                        </button>
                      )}

                      {canView('reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('reports_purchase')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'reports_purchase'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Purchase Reports" : undefined}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                          {!isCollapsed && <span>Purchase Reports</span>}
                        </button>
                      )}

                      {canView('reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('reports_inventory')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'reports_inventory'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Inventory Reports" : undefined}
                        >
                          <Package className="w-3.5 h-3.5 text-purple-500" />
                          {!isCollapsed && <span>Inventory Reports</span>}
                        </button>
                      )}

                      {canView('reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('reports_production')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'reports_production'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Production Reports" : undefined}
                        >
                          <Boxes className="w-3.5 h-3.5 text-teal-500" />
                          {!isCollapsed && <span>Production Reports</span>}
                        </button>
                      )}

                      {canView('reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('reports_dispatch')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'reports_dispatch'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Dispatch Reports" : undefined}
                        >
                          <Truck className="w-3.5 h-3.5 text-cyan-500" />
                          {!isCollapsed && <span>Dispatch Reports</span>}
                        </button>
                      )}

                      {canView('reports') && (
                        <button
                          type="button"
                          onClick={() => handleSelectModule('reports_financial')}
                          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            activeModule === 'reports_financial'
                              ? (darkMode ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600')
                              : (darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                          }`}
                          title={isCollapsed ? "Financial Reports" : undefined}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                          {!isCollapsed && <span>Financial Reports</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canView('settings') && (
                <button
                  type="button"
                  onClick={() => handleSelectModule('settings')}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeModule === 'settings'
                      ? (darkMode ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold' : 'bg-emerald-50 text-emerald-700 font-semibold border-l-4 border-emerald-600')
                      : (darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                  }`}
                  title={isCollapsed ? "Settings & Roles" : undefined}
                >
                  <SettingsIcon className="w-4 h-4" />
                  {!isCollapsed && <span>Settings & Roles</span>}
                </button>
              )}

              {(() => {
                const canViewAdminSection = canAccessAnyModule(currentUser, [
                  'admin_excel',
                  'user_management',
                  'recycle_bin'
                ]);
                if (!canViewAdminSection) return null;

                return (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                    {!isCollapsed && (
                      <div className="px-3.5 pb-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Admin & Governance</span>
                      </div>
                    )}
                    
                    {canView('admin_excel') && (
                      <button
                        type="button"
                        onClick={() => handleSelectModule('admin_excel')}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          activeModule === 'admin_excel'
                            ? (darkMode ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-semibold' : 'bg-amber-50 text-amber-700 font-semibold border-l-4 border-amber-500')
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                        title={isCollapsed ? "Excel Import / Export" : undefined}
                      >
                        <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                        {!isCollapsed && <span>Excel Import / Export</span>}
                      </button>
                    )}

                    {canView('user_management') && (
                      <button
                        type="button"
                        onClick={() => handleSelectModule('user_management')}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all mt-1.5 ${
                          activeModule === 'user_management'
                            ? (darkMode ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-semibold' : 'bg-amber-50 text-amber-700 font-semibold border-l-4 border-amber-500')
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                        title={isCollapsed ? "User & Role Management" : undefined}
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        {!isCollapsed && <span>User & Role Management</span>}
                      </button>
                    )}

                    {canView('recycle_bin') && (
                      <button
                        type="button"
                        onClick={() => handleSelectModule('recycle_bin')}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all mt-1.5 ${
                          activeModule === 'recycle_bin'
                            ? (darkMode ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-semibold' : 'bg-amber-50 text-amber-700 font-semibold border-l-4 border-amber-500')
                            : (darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                        title={isCollapsed ? "Recycle Bin" : undefined}
                      >
                        <Trash2 className="w-4 h-4 text-amber-500" />
                        {!isCollapsed && <span>Recycle Bin</span>}
                      </button>
                    )}
                  </div>
                );
              })()}
            </>
          );
        })()}
      </div>

      {/* Footer System Status */}
      <div className={`p-4 border-t ${darkMode ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span>
            ERP Server Live
          </span>
          <span className="font-mono text-[10px]">v4.8.2</span>
        </div>
      </div>
    </aside>
    </>
  );
};
