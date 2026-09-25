'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User, ModuleType, RawMaterial, Product, CategoryItem, SubcategoryItem, Supplier, Warehouse, BinLocationItem, InventoryTransaction, NotificationItem, ActivityLog, RFQItem, ProcurementPO, NotificationSettingRule } from '../types';
import { canAccessModule } from '../utils/permissions';
import { WarehouseDetailPage } from '../components/inventory/WarehouseDetailPage';
import { 
  INITIAL_USERS, 
  INITIAL_RAW_MATERIALS, 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_SUBCATEGORIES,
  INITIAL_SUPPLIERS, 
  INITIAL_WAREHOUSES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITIES,
  DEFAULT_PROCUREMENT_NOTIFICATION_RULES
} from '../data/initialData';
import { NotificationSettingsModal } from '../components/notifications/NotificationSettingsModal';
import { EmailToastContainer, EmailToastNotice } from '../components/notifications/EmailToast';
import { LoginScreen } from '../components/auth/LoginScreen';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { DashboardView } from '../components/dashboard/DashboardView';
import { RawMaterialsView } from '../components/inventory/RawMaterialsView';
import { ProductsView } from '../components/inventory/ProductsView';
import { CategoriesView } from '../components/inventory/CategoriesView';
import { SuppliersView } from '../components/inventory/SuppliersView';
import { WarehousesView } from '../components/inventory/WarehousesView';
import { TransactionsView } from '../components/inventory/TransactionsView';
import { StockManagementView } from '../components/inventory/StockManagementView';
import { ProcurementModule } from '../components/procurement/ProcurementModule';
import { ProductionModule } from '../components/production/ProductionModule';
import { QualityControlModule } from '../components/qc/QualityControlModule';
import { SalesModule } from '../components/sales/SalesModule';
import { CostingModule } from '../components/costing/CostingModule';
import { DispatchModule } from '../components/dispatch/DispatchModule';
import { AccountsModule } from '../components/accounts/AccountsModule';
import { ReportsModule } from '../components/reports/ReportsModule';
import { SettingsModule } from '../components/settings/SettingsModule';
import { UserManagementModule } from '../components/user-management/UserManagementModule';
import { AdminExcelView } from '../components/admin/AdminExcelView';
import { RecordDetailPage } from '../components/common/RecordDetailPage';
import { ChangeHistoryPage } from '../components/common/ChangeHistoryPage';
import { RecycleBinPage } from '../components/common/RecycleBinPage';
import { Search, X, Package, Boxes, Truck, Layers, Building2, ShoppingCart, FileText, Warehouse as WarehouseIcon, ShieldAlert, Users, ArrowLeftRight } from 'lucide-react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

interface AppClientProps {
  initialModule: ModuleType;
  salesSubPage?: 'new_lead' | 'new_quotation' | 'new_delivery_challan' | 'new_customer' | 'lead_workspace' | 'lead_edit' | 'quotation_workspace' | 'quotation_edit' | 'sales_order_view' | 'sales_order_edit' | 'customer_view' | 'customer_edit';
  procurementSubPage?: 'rfq_list' | 'rfq_new' | 'rfq_view' | 'rfq_edit' | 'quote_list' | 'quote_view' | 'quote_edit';
  costingSubPage?: 'dashboard' | 'bom' | 'bom_new' | 'bom_view' | 'bom_edit' | 'sheets' | 'new' | 'pending' | 'approved' | 'history' | 'view';
  selectedLeadId?: string;
  selectedQuotationId?: string;
  selectedSalesOrderId?: string;
  selectedCustomerId?: string;
  selectedRfqId?: string;
  selectedQuoteId?: string;
  dispatchSubTab?: string;
  selectedDispatchId?: string;
  selectedBomId?: string;
  selectedCostSheetId?: string;
}

export default function AppClient({ 
  initialModule, 
  salesSubPage: initialSalesSubPage, 
  procurementSubPage: initialProcurementSubPage,
  costingSubPage: initialCostingSubPage,
  selectedLeadId: initialLeadId, 
  selectedQuotationId: initialQuotationId,
  selectedSalesOrderId: initialSalesOrderId,
  selectedCustomerId: initialCustomerId,
  selectedRfqId: initialRfqId,
  selectedQuoteId: initialQuoteId,
  dispatchSubTab: initialDispatchSubTab,
  selectedDispatchId: initialDispatchId,
  selectedBomId: initialBomId,
  selectedCostSheetId: initialCostSheetId
}: AppClientProps) {
  const router = useRouter();
  const params = useParams();
  const urlModule = (params?.tab || params?.module) as ModuleType;
  const currentModule = urlModule || initialModule || 'dashboard';

  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [activeModule, setActiveModuleState] = useState<ModuleType>(currentModule);
  const [salesSubPage, setSalesSubPage] = useState<'new_lead' | 'new_quotation' | 'new_delivery_challan' | 'new_customer' | 'lead_workspace' | 'lead_edit' | 'quotation_workspace' | 'quotation_edit' | 'sales_order_view' | 'sales_order_edit' | 'customer_view' | 'customer_edit' | null>(initialSalesSubPage || null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(initialQuotationId || null);
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState<string | null>(initialSalesOrderId || null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || null);
  const [dispatchSubTab, setDispatchSubTab] = useState<string | null>(initialDispatchSubTab || null);
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(initialDispatchId || null);
  const [selectedBomId, setSelectedBomId] = useState<string | null>(initialBomId || null);
  const [selectedCostSheetId, setSelectedCostSheetId] = useState<string | null>(initialCostSheetId || null);
  const [costingSubPage, setCostingSubPage] = useState<string | null>(initialCostingSubPage || null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeCompany, setActiveCompany] = useState('AMK Carton Mills Ltd - HQ');
  const [globalSearchText, setGlobalSearchText] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ERP State
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubcategoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [binLocations, setBinLocations] = useState<BinLocationItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notificationRules, setNotificationRules] = useState<NotificationSettingRule[]>(DEFAULT_PROCUREMENT_NOTIFICATION_RULES);
  const [emailToasts, setEmailToasts] = useState<EmailToastNotice[]>([]);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState<ProcurementPO[]>([]);
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const loadedApisRef = useRef<Set<string>>(new Set());
  const inFlightApisRef = useRef<Map<string, Promise<any>>>(new Map());
  const hasSyncedUserRef = useRef<boolean>(false);

  const fetchApiData = async (endpoint: string): Promise<any> => {
    if (loadedApisRef.current.has(endpoint)) {
      return { api: endpoint, success: true, cached: true };
    }

    if (inFlightApisRef.current.has(endpoint)) {
      return inFlightApisRef.current.get(endpoint);
    }

    const promise = (async () => {
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

        const res = await fetch(endpoint, {
          headers,
          credentials: 'include',
        });

        const data = await res.json();
        const isSuccess = data.success ?? true;

        if (isSuccess) {
          loadedApisRef.current.add(endpoint);
        }

        return { api: endpoint, success: isSuccess, data: data.data || data };
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        return { api: endpoint, success: false, data: [] };
      } finally {
        inFlightApisRef.current.delete(endpoint);
      }
    })();

    inFlightApisRef.current.set(endpoint, promise);
    return promise;
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadDataForActiveModule() {
      const getRequiredApis = (mod: ModuleType): string[] => {
        const req = new Set<string>();

        switch (mod) {
          case 'dashboard':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            break;

          case 'inventory_raw':
            req.add('/api/raw-materials');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/categories');
            req.add('/api/subcategories');
            break;

          case 'inventory_products':
            req.add('/api/products');
            req.add('/api/warehouses');
            req.add('/api/categories');
            req.add('/api/subcategories');
            break;

          case 'inventory_categories':
            req.add('/api/categories');
            req.add('/api/subcategories');
            break;

          case 'inventory_suppliers':
            req.add('/api/suppliers');
            req.add('/api/categories');
            req.add('/api/subcategories');
            break;

          case 'inventory_warehouses':
            req.add('/api/warehouses');
            req.add('/api/bins');
            break;

          case 'inventory_transactions':
            req.add('/api/stock-movements');
            req.add('/api/warehouses');
            req.add('/api/raw-materials');
            req.add('/api/products');
            break;

          case 'inventory_stock':
            req.add('/api/raw-materials');
            break;

          case 'procurement':
          case 'procurement_dashboard':
            req.add('/api/purchase-orders');
            req.add('/api/rfqs');
            req.add('/api/suppliers');
            req.add('/api/raw-materials');
            req.add('/api/warehouses');
            req.add('/api/bins');
            break;

          case 'procurement_rfq':
            req.add('/api/rfqs');
            req.add('/api/suppliers');
            req.add('/api/raw-materials');
            break;

          case 'procurement_quotes':
            req.add('/api/rfqs');
            req.add('/api/suppliers');
            break;

          case 'procurement_po':
            req.add('/api/purchase-orders');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/raw-materials');
            break;

          case 'procurement_gate_entry':
          case 'procurement_reel_inward':
          case 'procurement_inward':
            req.add('/api/purchase-orders');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/bins');
            req.add('/api/gate-entries');
            req.add('/api/reel-inwards');
            break;

          case 'procurement_qc':
            req.add('/api/purchase-orders');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/bins');
            break;

          case 'production':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/warehouses');
            break;

          case 'sales':
          case 'sales_leads':
          case 'sales_quotations':
          case 'sales_orders':
          case 'sales_dispatch':
          case 'sales_customers':
            req.add('/api/products');
            req.add('/api/warehouses');
            break;

          case 'reports':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/suppliers');
            req.add('/api/purchase-orders');
            break;

          case 'user_management':
            req.add('/api/users');
            req.add('/api/roles');
            break;

          case 'recycle_bin':
            req.add('/api/recycle-bin');
            break;

          case 'admin_excel':
            req.add('/api/raw-materials');
            req.add('/api/products');
            req.add('/api/suppliers');
            req.add('/api/warehouses');
            req.add('/api/categories');
            req.add('/api/subcategories');
            req.add('/api/bins');
            break;

          default:
            break;
        }

        return Array.from(req);
      };

      const requiredApis = getRequiredApis(activeModule);
      const apisToFetch = requiredApis.filter(api => !loadedApisRef.current.has(api));

      if (apisToFetch.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const fetchPromises = apisToFetch.map(api => fetchApiData(api));
      const results = await Promise.all(fetchPromises);

      if (isCancelled) return;

      results.forEach(res => {
        if (!res || !res.success || res.cached) return;

        if (res.api === '/api/bins' && Array.isArray(res.data)) {
          setBinLocations(res.data.map((bin: any) => ({
            id: bin.id,
            code: bin.code,
            name: bin.name,
            warehouseId: bin.warehouseId,
            type: bin.type || 'Storage',
            status: bin.status || 'Active',
            createdAt: bin.createdAt ? bin.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
          })));
        } else if (res.api === '/api/subcategories' && Array.isArray(res.data)) {
          setSubCategories(res.data.map((sub: any) => ({
            id: sub.id,
            code: sub.code,
            name: sub.name,
            parentCategoryId: sub.categoryId,
            description: sub.description || '',
            status: sub.status || 'Active',
            createdAt: sub.createdAt ? sub.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
          })));
        } else if (res.api === '/api/categories' && Array.isArray(res.data)) {
          setCategories(res.data.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            type: c.type,
            description: c.description || '',
            itemsCount: c.itemsCount || 0,
            status: c.status || 'Active',
            createdAt: c.createdAt ? c.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16)
          })));
        } else if (res.api === '/api/suppliers' && Array.isArray(res.data)) {
          setSuppliers(res.data.map((s: any) => ({
            id: s.id,
            supplierName: s.supplierName,
            millName: s.millName || '',
            category: s.category || '',
            rawMaterials: s.rawMaterials || []
          })));
        } else if (res.api === '/api/raw-materials' && Array.isArray(res.data)) {
          setRawMaterials(res.data);
        } else if (res.api === '/api/products' && Array.isArray(res.data)) {
          setProducts(res.data);
        } else if (res.api === '/api/warehouses' && Array.isArray(res.data)) {
          setWarehouses(res.data);
        } else if (res.api === '/api/purchase-orders' && Array.isArray(res.data)) {
          setPurchaseOrders(res.data.map((po: any) => ({
            ...po,
            supplierName: po.supplier?.supplierName || po.supplierName || 'Unknown Supplier'
          })));
        } else if (res.api === '/api/rfqs' && Array.isArray(res.data)) {
          setRfqs(res.data);
        } else if (res.api === '/api/stock-movements' && Array.isArray(res.data)) {
          setTransactions(res.data.map((t: any) => ({
            id: t.id,
            transactionNumber: t.transactionNumber || `TRX-${t.id}`,
            itemCode: t.itemCode || t.rawMaterial?.code || t.product?.code || '',
            itemName: t.itemName || t.rawMaterial?.name || t.product?.name || '',
            itemType: t.itemType || 'Raw Material',
            warehouse: t.warehouse?.name || '',
            destinationWarehouse: t.destinationWarehouse?.name || undefined,
            quantity: t.quantity,
            previousStock: t.previousStock,
            currentStock: t.currentStock,
            transactionType: t.transactionType,
            user: t.user || 'System User',
            date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
            time: t.time || (t.createdAt ? t.createdAt.split('T')[1]?.substring(0, 5) : new Date().toTimeString().substring(0, 5)),
            reason: t.reason || '',
            remarks: t.remarks || '',
            referenceNumber: t.referenceNumber || undefined,
            referenceType: t.referenceType || undefined
          })));
        }
      });

      setIsLoading(false);
    }

    loadDataForActiveModule();

    return () => {
      isCancelled = true;
    };
  }, [activeModule]);

  const handleTriggerEventNotification = (
    eventKey: 'rfq_created' | 'rfq_sent' | 'quote_received' | 'po_created' | 'po_approved' | 'po_rejected' | 'goods_received' | 'po_completed',
    details: { title: string; message: string; poNumber?: string; rfqNumber?: string; supplierName?: string; recipientEmail?: string }
  ) => {
    const rule = notificationRules.find(r => r.eventKey === eventKey);
    const ruleInApp = rule ? rule.inAppEnabled : true;
    const ruleEmail = rule ? rule.emailEnabled : true;
    const rulePriority = rule ? rule.priority : 'Info';
    const ruleRecipients = rule ? rule.recipients : 'Purchase Manager';

    const targetEmail = details.recipientEmail || 'sunita.menon@amkerp.com';

    if (ruleInApp) {
      const notifType = rulePriority === 'Error' ? 'alert' : rulePriority === 'Warning' ? 'warning' : rulePriority === 'Success' ? 'success' : 'info';
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        title: details.title,
        message: details.message,
        type: notifType,
        time: 'Just now',
        read: false,
        module: 'Procurement',
        priority: rulePriority,
        recipientRole: ruleRecipients,
        emailSent: ruleEmail,
        emailRecipient: targetEmail
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    if (ruleEmail) {
      const newToast: EmailToastNotice = {
        id: `EMAIL-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        recipient: targetEmail,
        subject: `[AMK ERP] ${details.title} - ${details.poNumber || details.rfqNumber || 'Procurement Alert'}`,
        preview: details.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setEmailToasts(prev => [newToast, ...prev]);

      setTimeout(() => {
        setEmailToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 6000);
    }
  };

  const handleUpdateNotificationRule = (updatedRule: NotificationSettingRule) => {
    setNotificationRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
  };

  const handleResetNotificationRules = () => {
    setNotificationRules(DEFAULT_PROCUREMENT_NOTIFICATION_RULES);
  };

  const isFetchingNotificationsRef = useRef<boolean>(false);
  const fetchNotificationsFromDb = async () => {
    if (!currentUser?.id || isFetchingNotificationsRef.current) return;
    isFetchingNotificationsRef.current = true;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&recipientRole=${currentUser.role || ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.time || new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: n.type || 'info',
          priority: n.priority || 'Info',
          read: n.read || false,
          module: n.module || undefined,
          recipientRole: n.recipientRole || undefined,
          emailSent: n.emailSent || false,
          emailRecipient: n.emailRecipient || undefined,
          entityId: n.entityId || undefined,
          entityType: n.entityType || undefined
        })));
      }
    } catch (err) {
      console.error('Failed to fetch notifications from DB:', err);
    } finally {
      isFetchingNotificationsRef.current = false;
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'PUT' });
    } catch (err) {
      console.error('Failed to mark notification as read in DB:', err);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (notif.entityType === 'po' && notif.entityId) {
      setSelectedMaterialId(null);
      setSelectedProductId(null);
      setSelectedSupplierId(null);
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
      setSelectedWarehouseId(null);
      setSelectedRfqId(null);
      setSelectedPoId(notif.entityId);
      setActiveModule('procurement_po');
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchNotificationsFromDb();
  }, [currentUser?.id]);



  // Selection states for opening detail views from Global Search
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [productionSubTab, setProductionSubTab] = useState<string | null>(null);
  const [productionSubPage, setProductionSubPage] = useState<string | null>(null);
  const [selectedProductionEntityId, setSelectedProductionEntityId] = useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<{ entity: string, entityId: string, entityName?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      if (path.includes('/history')) {
        if (parts[0] === 'inventory' && parts[3] === 'history') {
          const entityMap: Record<string, string> = {
            'raw-materials': 'RawMaterial',
            'products': 'Product',
          };
          setSelectedHistory({
            entity: entityMap[parts[1]] || 'RawMaterial',
            entityId: parts[2]
          });
        } else if (parts[0] === 'history') {
          setSelectedHistory({
            entity: parts[1] || 'Record',
            entityId: parts[2] || parts[1]
          });
        }
      }
    }
  }, []);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [groupedResults, setGroupedResults] = useState<Record<string, any[]>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = globalSearchText.trim();
    if (!trimmed) {
      setSearchResults([]);
      setGroupedResults({});
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('erp_token') || '') : '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (currentUser?.email) headers['x-user-email'] = currentUser.email;

        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          headers,
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.data) {
          setSearchResults(data.data.results || []);
          setGroupedResults(data.data.grouped || {});
        } else {
          setSearchResults([]);
          setGroupedResults({});
          if (data.error) {
            setSearchError(typeof data.error === 'string' ? data.error : 'Failed to search records');
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Global search error:', err);
          setSearchResults([]);
          setGroupedResults({});
          setSearchError('Search failed. Please try again.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [globalSearchText, currentUser]);

  const handleSelectResult = (item: any) => {
    setGlobalSearchText('');
    setSearchResults([]);
    setGroupedResults({});
    setSearchError(null);
    
    // Reset all selection IDs first to avoid lingering states
    setSelectedMaterialId(null);
    setSelectedProductId(null);
    setSelectedSupplierId(null);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedWarehouseId(null);
    setSelectedPoId(null);
    setSelectedRfqId(null);
    setSelectedCustomerId(null);
    setSelectedSalesOrderId(null);
    setSelectedQuotationId(null);
    setSelectedLeadId(null);
    setSelectedBomId(null);
    setSelectedCostSheetId(null);
    setSelectedDispatchId(null);
    setSelectedProductionEntityId(null);
    setSalesSubPage(null);
    setProductionSubPage(null);
    setProductionSubTab(null);
    setCostingSubPage(null);
    setSelectedHistory(null);

    const moduleKey = item.module;

    if (moduleKey === 'raw-materials') {
      setSelectedMaterialId(item.id);
      setActiveModuleState('inventory_raw');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/inventory_raw');
    } else if (moduleKey === 'products') {
      setSelectedProductId(item.id);
      setActiveModuleState('inventory_products');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/inventory_products');
    } else if (moduleKey === 'suppliers') {
      setSelectedSupplierId(item.id);
      setActiveModuleState('inventory_suppliers');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/inventory_suppliers');
    } else if (moduleKey === 'customers') {
      setSelectedCustomerId(item.id);
      setSalesSubPage('customer_view');
      setActiveModuleState('sales_customers');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/sales_customers');
    } else if (moduleKey === 'sales-orders') {
      setSelectedSalesOrderId(item.id);
      setSalesSubPage('sales_order_view');
      setActiveModuleState('sales_orders');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/sales_orders');
    } else if (moduleKey === 'sales-quotations') {
      setSelectedQuotationId(item.id);
      setSalesSubPage('quotation_workspace');
      setActiveModuleState('sales_quotations');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/sales_quotations');
    } else if (moduleKey === 'sales-leads') {
      setSelectedLeadId(item.id);
      setSalesSubPage('lead_workspace');
      setActiveModuleState('sales_leads');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/sales_leads');
    } else if (moduleKey === 'purchase-orders') {
      setSelectedPoId(item.id);
      setActiveModuleState('procurement_po');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/procurement_po');
    } else if (moduleKey === 'rfqs') {
      setSelectedRfqId(item.id);
      setActiveModuleState('procurement_rfq');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/procurement_rfq');
    } else if (moduleKey === 'work-orders') {
      setSelectedProductionEntityId(item.id);
      setProductionSubTab('work_orders');
      setProductionSubPage('view');
      setActiveModuleState('production_work_orders');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/production_work_orders');
    } else if (moduleKey === 'cost-sheets') {
      setSelectedCostSheetId(item.id);
      setCostingSubPage('view');
      setActiveModuleState('costing_sheets');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/costing_sheets');
    } else if (moduleKey === 'boms') {
      setSelectedBomId(item.id);
      setCostingSubPage('bom-view');
      setActiveModuleState('costing_bom');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/costing_bom');
    } else if (moduleKey === 'dispatches') {
      setSelectedDispatchId(item.id);
      setDispatchSubTab('dispatch_view');
      setActiveModuleState('dispatch_list');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/dispatch_list');
    } else if (moduleKey === 'gate-entries') {
      setActiveModuleState('procurement_gate_entry');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/procurement_gate_entry');
    } else if (moduleKey === 'reel-inwards') {
      setActiveModuleState('procurement_reel_inward');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/procurement_reel_inward');
    } else if (moduleKey === 'quality-checks') {
      setActiveModuleState('procurement_qc');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/procurement_qc');
    } else if (moduleKey === 'warehouses') {
      setSelectedWarehouseId(item.id);
      setActiveModuleState('inventory_warehouses');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/inventory_warehouses');
    } else if (moduleKey === 'categories' || moduleKey === 'subcategories') {
      setSelectedCategoryId(item.id);
      setActiveModuleState('inventory_categories');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/inventory_categories');
    } else if (moduleKey === 'stock-movements') {
      setActiveModuleState('inventory_transactions');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/inventory_transactions');
    } else if (moduleKey === 'users') {
      setActiveModuleState('user_management');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/user_management');
    } else if (item.route) {
      setActiveModuleState(item.route as any);
      if (typeof window !== 'undefined') window.history.pushState({}, '', `/${item.route}`);
    }
  };

  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Load state from localStorage on initial client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('erp_currentUser');
        const storedToken = localStorage.getItem('erp_token');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          
          const headers: Record<string, string> = {};
          if (storedToken || parsed.token) {
            headers['Authorization'] = `Bearer ${storedToken || parsed.token}`;
          }
          if (parsed.email) {
            headers['x-user-email'] = parsed.email;
          }

          if (!hasSyncedUserRef.current && parsed.email) {
            hasSyncedUserRef.current = true;
            // Dynamically sync and refresh roles/permissions from database
            fetch(`/api/users?email=${encodeURIComponent(parsed.email)}`, {
              headers,
              credentials: 'include',
            })
              .then(r => r.json())
              .then(res => {
                if (res.success && res.data) {
                  const refreshedUser = {
                    ...parsed,
                    id: res.data.id || parsed.id,
                    name: res.data.name || parsed.name,
                    role: res.data.role?.name || res.data.role || parsed.role,
                    permissions: res.data.role?.permissions?.map((p: any) => p.name) || parsed.permissions || [],
                  };
                  setCurrentUser(refreshedUser);
                  localStorage.setItem('erp_currentUser', JSON.stringify(refreshedUser));
                }
              })
              .catch(err => console.warn('Could not refresh user role from API:', err));
          }
        }

        const storedNotifications = localStorage.getItem('erp_notifications');
        if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

        const storedActivities = localStorage.getItem('erp_activities');
        if (storedActivities) setActivities(JSON.parse(storedActivities));

        const storedDark = localStorage.getItem('erp_darkMode');
        if (storedDark !== null) {
          setDarkMode(JSON.parse(storedDark));
        } else {
          setDarkMode(false);
        }

        const storedCompany = localStorage.getItem('erp_activeCompany');
        if (storedCompany) setActiveCompany(JSON.parse(storedCompany));
      } catch (e) {
        console.error('Error loading ERP state from localStorage:', e);
      } finally {
        setIsStateLoaded(true);
      }
    }
  }, []);

  // Sync state changes back to localStorage (only after loading is complete to prevent overwrites)
  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser, isStateLoaded]);

  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_notifications', JSON.stringify(notifications));
    }
  }, [notifications, isStateLoaded]);

  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_activities', JSON.stringify(activities));
    }
  }, [activities, isStateLoaded]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode, isStateLoaded]);

  useEffect(() => {
    if (isStateLoaded && typeof window !== 'undefined') {
      localStorage.setItem('erp_activeCompany', JSON.stringify(activeCompany));
    }
  }, [activeCompany, isStateLoaded]);

  // Sync initial props on page transitions
  useEffect(() => {
    if (initialModule) {
      setActiveModuleState(initialModule);
    }
  }, [initialModule]);

  useEffect(() => {
    if (initialSalesSubPage !== undefined) {
      setSalesSubPage(initialSalesSubPage);
    }
  }, [initialSalesSubPage]);

  useEffect(() => {
    if (initialLeadId !== undefined) {
      setSelectedLeadId(initialLeadId);
    }
  }, [initialLeadId]);

  useEffect(() => {
    if (initialQuotationId !== undefined) {
      setSelectedQuotationId(initialQuotationId);
    }
  }, [initialQuotationId]);

  useEffect(() => {
    if (initialSalesOrderId !== undefined) {
      setSelectedSalesOrderId(initialSalesOrderId);
    }
  }, [initialSalesOrderId]);

  useEffect(() => {
    if (initialCustomerId !== undefined) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Sync active module state with URL changes (e.g. Back button)
  useEffect(() => {
    if (urlModule && urlModule !== activeModule) {
      setActiveModuleState(urlModule);
    }
  }, [urlModule]);

  const setActiveModule = (mod: ModuleType) => {
    setActiveModuleState(mod);
    
    if (mod === 'dashboard') {
      router.push('/');
    } else if (mod === 'reports' || mod === 'reports_dashboard') {
      router.push('/reports');
    } else if (mod === 'reports_sales') {
      router.push('/reports/sales');
    } else if (mod === 'reports_purchase') {
      router.push('/reports/purchase');
    } else if (mod === 'reports_inventory') {
      router.push('/reports/inventory');
    } else if (mod === 'reports_production') {
      router.push('/reports/production');
    } else if (mod === 'reports_dispatch') {
      router.push('/reports/dispatch');
    } else if (mod === 'reports_financial') {
      router.push('/reports/financial');
    } else {
      router.push(`/${mod}`);
    }
  };

  // Handlers for Categories
  const handleAddCategory = (cat: CategoryItem) => {
    setCategories([cat, ...categories]);
  };
  const handleUpdateCategory = (updated: CategoryItem) => {
    setCategories(categories.map(c => c.id === updated.id ? updated : c));
  };
  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        alert(`Failed to delete category: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete category');
    }
  };

  // Handlers for Subcategories
  const handleAddSubcategory = (sub: SubcategoryItem) => {
    setSubCategories([sub, ...subCategories]);
  };
  const handleUpdateSubcategory = (updated: SubcategoryItem) => {
    setSubCategories(subCategories.map(s => s.id === updated.id ? updated : s));
  };
  const handleDeleteSubcategory = (id: string) => {
    setSubCategories(subCategories.filter(s => s.id !== id));
  };

  // Handlers for Raw Materials
  const handleAddRawMaterial = (rm: RawMaterial) => {
    setRawMaterials([rm, ...rawMaterials]);
    setActivities([
      {
        id: `ACT-${Date.now()}`,
        action: 'Added Raw Material',
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: `Created master entry for ${rm.name} (${rm.code})`
      },
      ...activities
    ]);
  };

  const handleUpdateRawMaterial = (updated: RawMaterial) => {
    setRawMaterials(rawMaterials.map(rm => rm.id === updated.id ? updated : rm));
  };

  const handleDeleteRawMaterial = async (id: string) => {
    try {
      const res = await fetch(`/api/raw-materials?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setRawMaterials(rawMaterials.filter(rm => rm.id !== id));
      } else {
        alert(`Failed to delete raw material: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete raw material');
    }
  };

  // Handlers for Products
  const handleAddProduct = (p: Product) => {
    setProducts([p, ...products]);
  };
  const handleUpdateProduct = (updated: Product) => {
    setProducts(products.map(p => p.id === updated.id ? updated : p));
  };
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert(`Failed to delete product: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete product');
    }
  };

  // Handlers for Suppliers
  const handleRefreshSuppliers = async () => {
    try {
      const supRes = await fetch('/api/suppliers').then(r => r.json()).catch(() => ({ success: false, data: [] }));
      if (supRes.success && Array.isArray(supRes.data)) {
        setSuppliers(supRes.data.map((s: any) => ({
          id: s.id,
          supplierName: s.supplierName,
          millName: s.millName || '',
          category: s.category || '',
          rawMaterials: s.rawMaterials || []
        })));
      }
    } catch (err) {
      console.error('Error refreshing suppliers:', err);
    }
  };

  const handleAddSupplier = (sup: Supplier) => {
    setSuppliers([sup, ...suppliers]);
  };
  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === updated.id ? updated : s));
  };
  const handleDeleteSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setSuppliers(suppliers.filter(s => s.id !== id));
      } else {
        alert(`Failed to delete supplier: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      alert(`Error deleting supplier: ${err.message || err}`);
    }
  };

  const handleAddActivity = (act: { action: string; module: string; details: string }) => {
    setActivities([
      {
        id: `ACT-${Date.now()}`,
        action: act.action,
        module: act.module,
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: act.details
      },
      ...activities
    ]);
  };



  // Handlers for Warehouses
  const handleAddWarehouse = (wh: Warehouse) => {
    const formatted: Warehouse = {
      ...wh,
      currentUtilizationPercent: wh.currentUtilizationPercent ?? 0,
      activeItemsCount: wh.activeItemsCount ?? 0,
      totalBins: wh.totalBins ?? 0,
      capacitySqFt: wh.capacitySqFt ?? 0,
    };
    setWarehouses(prev => [formatted, ...prev]);
    setActivities(prev => [
      {
        id: `ACT-${Date.now()}`,
        action: 'Added Warehouse',
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: `Created new warehouse: ${formatted.name} (${formatted.code})`
      },
      ...prev
    ]);
  };

  const handleUpdateWarehouse = (updated: Warehouse) => {
    setWarehouses(prev => prev.map(wh => wh.id === updated.id ? updated : wh));
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      const res = await fetch(`/api/warehouses?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setWarehouses(warehouses.filter(w => w.id !== id));
      } else {
        alert(`Failed to delete warehouse: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete warehouse');
    }
  };

  const handleDeletePurchaseOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/purchase-orders?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setPurchaseOrders(purchaseOrders.filter(po => po.id !== id));
      } else {
        alert(`Failed to delete purchase order: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete purchase order');
    }
  };

  const handleDeleteRfq = async (id: string) => {
    try {
      const res = await fetch(`/api/rfqs?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setRfqs(rfqs.filter(r => r.id !== id));
      } else {
        alert(`Failed to delete RFQ: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete RFQ');
    }
  };

  const handleAddBin = (bin: BinLocationItem) => {
    setBinLocations(prev => [bin, ...prev]);
    setActivities(prev => [
      {
        id: `ACT-${Date.now()}`,
        action: 'Added Bin Location',
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        details: `Created new bin location: ${bin.name} (${bin.code})`
      },
      ...prev
    ]);
  };

  const handleUpdateBin = (updated: BinLocationItem) => {
    setBinLocations(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const handleDeleteBin = async (id: string) => {
    try {
      const res = await fetch(`/api/bins?id=${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setBinLocations(binLocations.filter(b => b.id !== id));
      } else {
        alert(`Failed to delete bin: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete bin');
    }
  };

  // Handlers for Transactions
  const handleAddTransaction = (txn: InventoryTransaction) => {
    // Utility for safe warehouse comparison
    const getWhName = (wh: any): string => {
      if (!wh) return '';
      if (typeof wh === 'string') return wh;
      return wh.name || '';
    };

    const getWhId = (wh: any): string => {
      if (!wh) return '';
      if (typeof wh === 'object' && wh.id) return wh.id;
      return '';
    };

    const isWhMatch = (wh1: any, wh2: any): boolean => {
      if (!wh1 || !wh2) return false;
      const id1 = getWhId(wh1);
      const id2 = getWhId(wh2);
      if (id1 && id2) return id1 === id2;
      
      const n1 = getWhName(wh1).toLowerCase();
      const n2 = getWhName(wh2).toLowerCase();
      if (!n1 || !n2) return false;
      return n1 === n2 || n1.includes(n2) || n2.includes(n1);
    };

    const isOutflow = [
      'Stock Out',
      'Production Issue',
      'Sales Return'
    ].includes(txn.transactionType);

    const isInflow = [
      'Stock In',
      'Production Issue',
      'Sales Return'
    ].includes(txn.transactionType);

    let finalQuantity = txn.quantity;
    if (isOutflow && finalQuantity > 0) {
      finalQuantity = -finalQuantity;
    } else if (isInflow && finalQuantity < 0) {
      finalQuantity = Math.abs(finalQuantity);
    }

    if (txn.transactionType === 'Warehouse Transfer' && txn.destinationWarehouse) {
      const sourceWh = txn.warehouse;
      const destWh = txn.destinationWarehouse;
      const qty = Math.abs(txn.quantity);

      if (txn.itemType === 'Raw Material') {
        let sourceItem = rawMaterials.find(rm => rm.code === txn.itemCode && isWhMatch(rm.warehouse, sourceWh));
        if (!sourceItem) {
          // fallback to matching code only
          sourceItem = rawMaterials.find(rm => rm.code === txn.itemCode);
        }

        if (sourceItem) {
          txn.previousStock = sourceItem.currentStock;
          txn.currentStock = Math.max(0, sourceItem.currentStock - qty);
          txn.quantity = -qty;

          // Update rawMaterials
          setRawMaterials(prev => {
            // Decrease source
            const updated = prev.map(rm => {
              if (rm.id === sourceItem!.id) {
                return { ...rm, currentStock: Math.max(0, rm.currentStock - qty), lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
              }
              return rm;
            });

            // Check if item exists in dest
            const destItemIndex = updated.findIndex(rm => rm.code === txn.itemCode && isWhMatch(rm.warehouse, destWh));
            if (destItemIndex > -1) {
              return updated.map((rm, idx) => {
                if (idx === destItemIndex) {
                  return { ...rm, currentStock: rm.currentStock + qty, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
                }
                return rm;
              });
            } else {
              // Create copy in dest warehouse
              const newItem: RawMaterial = {
                ...sourceItem!,
                id: `RM-${Date.now()}`,
                warehouse: destWh,
                currentStock: qty,
                lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
              };
              return [newItem, ...updated];
            }
          });
        }
      } else {
        let sourceItem = products.find(p => p.code === txn.itemCode && isWhMatch(p.warehouse, sourceWh));
        if (!sourceItem) {
          // fallback to matching code only
          sourceItem = products.find(p => p.code === txn.itemCode);
        }

        if (sourceItem) {
          txn.previousStock = sourceItem.availableStock;
          txn.currentStock = Math.max(0, sourceItem.availableStock - qty);
          txn.quantity = -qty;

          // Update products
          setProducts(prev => {
            const updated = prev.map(p => {
              if (p.id === sourceItem!.id) {
                return { ...p, availableStock: Math.max(0, p.availableStock - qty) };
              }
              return p;
            });

            const destItemIndex = updated.findIndex(p => p.code === txn.itemCode && isWhMatch(p.warehouse, destWh));
            if (destItemIndex > -1) {
              return updated.map((p, idx) => {
                if (idx === destItemIndex) {
                  return { ...p, availableStock: p.availableStock + qty };
                }
                return p;
              });
            } else {
              const newItem: Product = {
                ...sourceItem!,
                id: `PRD-${Date.now()}`,
                warehouse: destWh,
                availableStock: qty
              } as Product;
              return [newItem, ...updated];
            }
          });
        }
      }
    } else {
      // Normal transaction (Inflow, Outflow, Adjustment)
      if (txn.itemType === 'Raw Material') {
        let item = rawMaterials.find(rm => rm.code === txn.itemCode && isWhMatch(rm.warehouse, txn.warehouse));
        if (!item) {
          // fallback to matching code only
          item = rawMaterials.find(rm => rm.code === txn.itemCode);
        }

        if (item) {
          const newStock = Math.max(0, item.currentStock + finalQuantity);
          txn.previousStock = item.currentStock;
          txn.currentStock = newStock;
          txn.quantity = finalQuantity;
          setRawMaterials(prev => prev.map(rm => {
            if (rm.id === item!.id) {
              return { ...rm, currentStock: newStock, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) };
            }
            return rm;
          }));
        } else {
          txn.previousStock = 0;
          txn.currentStock = finalQuantity > 0 ? finalQuantity : 0;
        }
      } else {
        let item = products.find(p => p.code === txn.itemCode && isWhMatch(p.warehouse, txn.warehouse));
        if (!item) {
          // fallback to matching code only
          item = products.find(p => p.code === txn.itemCode);
        }

        if (item) {
          const newStock = Math.max(0, item.availableStock + finalQuantity);
          txn.previousStock = item.availableStock;
          txn.currentStock = newStock;
          txn.quantity = finalQuantity;
          setProducts(prev => prev.map(p => {
            if (p.id === item!.id) {
              return { ...p, availableStock: newStock };
            }
            return p;
          }));
        } else {
          txn.previousStock = 0;
          txn.currentStock = finalQuantity > 0 ? finalQuantity : 0;
        }
      }
    }

    const displayTxn = {
      ...txn,
      warehouse: getWhName(txn.warehouse),
      destinationWarehouse: txn.destinationWarehouse ? getWhName(txn.destinationWarehouse) : undefined
    };

    setTransactions(prev => [displayTxn, ...prev]);
    setActivities(prev => [
      {
        id: `ACT-${Date.now()}`,
        action: `Transaction: ${txn.transactionType}`,
        module: 'Inventory',
        user: currentUser?.name || 'System User',
        timestamp: `${txn.date} ${txn.time}`,
        details: txn.transactionType === 'Warehouse Transfer'
          ? `Transferred ${Math.abs(txn.quantity)} units of ${txn.itemName} from ${displayTxn.warehouse} to ${displayTxn.destinationWarehouse}`
          : `Recorded ${txn.quantity > 0 ? '+' : ''}${txn.quantity} units for ${txn.itemName} (${displayTxn.warehouse})`
      },
      ...prev
    ]);
  };

  const handleAddNotification = (
    titleOrObj: string | Omit<NotificationItem, 'id' | 'read'>,
    message?: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => {
    if (typeof titleOrObj === 'object') {
      const newNotif: NotificationItem = {
        ...titleOrObj,
        id: `NOTIF-${Date.now()}`,
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    } else {
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        title: titleOrObj,
        message: message || '',
        type: type === 'error' ? 'alert' : type === 'success' ? 'success' : 'info',
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleClearNotifications = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    try {
      if (currentUser?.id) {
        await fetch(`/api/notifications?action=markAllRead&userId=${currentUser.id}`, { method: 'PUT' });
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read in DB:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_currentUser');
    localStorage.removeItem('erp_token');
    document.cookie = 'erp_token=; Max-Age=0; path=/;';
    document.cookie = 'token=; Max-Age=0; path=/;';
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={async (user) => {
      try {
        const token = (user as any).token || localStorage.getItem('erp_token') || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        if (user.email) {
          headers['x-user-email'] = user.email;
        }

        const res = await fetch(`/api/users?email=${encodeURIComponent(user.email)}`, {
          headers,
          credentials: 'include',
        }).then(r => r.json());

        if (res.success && res.data) {
          const fullUser = {
            ...user,
            id: res.data.id || user.id,
            name: res.data.name || user.name,
            role: res.data.role?.name || res.data.role || user.role,
            permissions: res.data.role?.permissions?.map((p: any) => p.name) || user.permissions || [],
            department: res.data.department || user.department,
            token,
          };
          setCurrentUser(fullUser);
          localStorage.setItem('erp_currentUser', JSON.stringify(fullUser));
        } else {
          setCurrentUser(user);
          localStorage.setItem('erp_currentUser', JSON.stringify(user));
        }
      } catch (e) {
        setCurrentUser(user);
        localStorage.setItem('erp_currentUser', JSON.stringify(user));
      }
    }} />;
  }

  const handleGenerateReport = async (reportTitle: string) => {
    console.log(`Generating report: ${reportTitle}`);
    let endpoint = '';
    
    switch (reportTitle) {
      case 'Inventory Valuation Report':
        endpoint = '/api/reports/inventory-valuation';
        break;
      case 'Low Stock & Reorder Analysis':
        endpoint = '/api/reports/low-stock-reorder';
        break;
      case 'Mill Supplier Outstanding Ledger':
        endpoint = '/api/reports/supplier-outstanding';
        break;
      case 'Corrugator Material Consumption Report':
        endpoint = '/api/reports/material-consumption';
        break;
      case 'Finished Goods Dispatch Register':
        endpoint = '/api/reports/dispatch-register';
        break;
      case 'GST Output vs Input Tax Report':
        endpoint = '/api/reports/gst-report';
        break;
      default:
        alert(`Report "${reportTitle}" functionality coming soon!`);
        return;
    }

    try {
      const res = await fetch(endpoint);
      const result = await res.json();
      
      if (result.success) {
        console.log(`${reportTitle} Data:`, result.data);
        alert(`Report "${reportTitle}" generated successfully! Check console for data.`);
        // Implement export logic here (PDF/Excel)
      } else {
        alert(`Failed to generate report: ${result.error}`);
      }
    } catch (err) {
      console.error(`Error generating ${reportTitle}:`, err);
      alert(`Error generating report: ${err.message || err}`);
    }
  };

  const hasViewPermission = (mod: ModuleType): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Administrator') return true;

    if (mod.startsWith('procurement_')) {
      const sub = mod.replace('procurement_', '');
      const subMap: Record<string, string> = {
        'dashboard': 'procurement_dashboard:view',
        'rfq': 'procurement_rfq:view',
        'quotes': 'procurement_quotes:view',
        'po': 'procurement_po:view',
        'gate_entry': 'procurement_gate_entry:view',
        'reel_inward': 'procurement_reel_inward:view',
        'inward': 'procurement_inward:view',
        'qc': 'procurement_qc:view',
      };
      return ((currentUser as any).permissions || []).includes(subMap[sub] || 'procurement_dashboard:view');
    }

    if (mod.startsWith('dispatch_') || mod === 'dispatch') {
      return ((currentUser as any).permissions || []).includes('dispatch:view') || ((currentUser as any).permissions || []).includes('sales:view');
    }

    if (mod.startsWith('sales_') || mod === 'sales') {
      return ((currentUser as any).permissions || []).includes('sales:view');
    }

    // Map module type to permission name
    const permissionMap: Record<string, string> = {
      'dashboard': 'dashboard:view',
      'inventory_raw': 'inventory_raw:view',
      'inventory_products': 'inventory_products:view',
      'inventory_categories': 'inventory_categories:view',
      'inventory_suppliers': 'inventory_suppliers:view',
      'inventory_warehouses': 'inventory_warehouses:view',
      'inventory_transactions': 'inventory_transactions:view',
      'inventory_stock': 'inventory_stock:view',
      'procurement': 'procurement_dashboard:view',
      'production': 'production:view',
      'sales': 'sales:view',
      'dispatch': 'dispatch:view',
      'accounts': 'accounts:view',
      'reports': 'reports:view',
      'settings': 'settings:view',
      'user_management': 'settings:view',
    };

    const permissionName = permissionMap[mod];
    if (!permissionName) return true; // Default allow for non-mapped modules

    const permissions = (currentUser as any).permissions || [];
    return permissions.includes(permissionName);
  };

  const isAuthorized = activeModule === 'recycle_bin' ? ((currentUser?.role as any)?.name === 'Administrator' || (currentUser?.role as any) === 'Administrator') : hasViewPermission(activeModule);

  return (
    <ErrorBoundary>
      <div className={`h-screen overflow-hidden flex ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-900'}`}>
      {/* Left Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setIsMobileSidebarOpen(false);
        }} 
        darkMode={darkMode} 
        currentUser={currentUser}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar 
          currentUser={currentUser}
          onLogout={handleLogout}
          notifications={notifications}
          onClearNotifications={handleClearNotifications}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          activeCompany={activeCompany}
          onSelectCompany={(comp) => setActiveCompany(comp)}
          globalSearchText={globalSearchText}
          setGlobalSearchText={setGlobalSearchText}
          searchResults={searchResults}
          groupedResults={groupedResults}
          isSearching={isSearching}
          searchError={searchError}
          onSelectResult={handleSelectResult}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
          onMarkNotificationRead={handleMarkNotificationRead}
          onNotificationClick={handleNotificationClick}
          onFetchNotifications={fetchNotificationsFromDb}
        />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {!isAuthorized ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg shadow-red-500/15">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Access Restricted</h2>
              <p className="text-xs text-slate-500">
                You do not have the required "View" permissions to access the <strong>{activeModule.replace('_', ' ').replace('procurement_', '').toUpperCase()}</strong> module. Please contact your system Administrator to request authorization.
              </p>
              <button
                onClick={() => setActiveModule('dashboard')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          ) : selectedHistory ? (
            <ChangeHistoryPage
              entity={selectedHistory.entity}
              entityId={selectedHistory.entityId}
              entityName={selectedHistory.entityName}
              darkMode={darkMode}
              onBack={() => {
                setSelectedHistory(null);
                window.history.pushState({}, '', activeModule === 'dashboard' ? '/' : `/${activeModule}`);
              }}
            />
          ) : (
            <>
              {selectedMaterialId && (
                <RecordDetailPage
                  entityType="raw"
                  recordId={selectedMaterialId}
                  rawMaterials={rawMaterials}
                  products={products}
                  categories={categories}
                  subCategories={subCategories}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  purchaseOrders={purchaseOrders}
                  rfqs={rfqs}
                  darkMode={darkMode}
                  currentUser={currentUser}
                  onBack={() => setSelectedMaterialId(null)}
                  onEdit={() => setSelectedMaterialId(null)}
                  onDelete={(id) => {
                    handleDeleteRawMaterial(id);
                    setSelectedMaterialId(null);
                  }}
                  onAddNotification={handleAddNotification}
                  onStockUpdated={async () => {
                    try {
                      const res = await fetch('/api/raw-materials', {
                        headers: {
                          'Content-Type': 'application/json',
                          ...(typeof window !== 'undefined' && localStorage.getItem('amk_token') ? { 'Authorization': `Bearer ${localStorage.getItem('amk_token')}` } : {}),
                        }
                      });
                      if (res.ok) {
                        const data = await res.json();
                        const list = data.data || data;
                        if (Array.isArray(list)) setRawMaterials(list);
                      }
                    } catch (e) {
                      console.error('Failed to reload raw materials:', e);
                    }
                  }}
                />
              )}
          {selectedProductId && (
            <RecordDetailPage
              entityType="product"
              recordId={selectedProductId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedProductId(null)}
              onEdit={() => setSelectedProductId(null)}
              onDelete={(id) => {
                handleDeleteProduct(id);
                setSelectedProductId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedSupplierId && (
            <RecordDetailPage
              entityType="supplier"
              recordId={selectedSupplierId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedSupplierId(null)}
              onEdit={() => setSelectedSupplierId(null)}
              onDelete={(id) => {
                handleDeleteSupplier(id);
                setSelectedSupplierId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedCategoryId && (
            <RecordDetailPage
              entityType="category"
              recordId={selectedCategoryId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedCategoryId(null)}
              onEdit={() => setSelectedCategoryId(null)}
              onDelete={(id) => {
                handleDeleteCategory(id);
                setSelectedCategoryId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedSubcategoryId && (
            <RecordDetailPage
              entityType="subcategory"
              recordId={selectedSubcategoryId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedSubcategoryId(null)}
              onEdit={() => setSelectedSubcategoryId(null)}
              onDelete={(id) => {
                handleDeleteSubcategory(id);
                setSelectedSubcategoryId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedWarehouseId && (
            <RecordDetailPage
              entityType="warehouse"
              recordId={selectedWarehouseId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedWarehouseId(null)}
              onEdit={() => setSelectedWarehouseId(null)}
              onDelete={(id) => {
                handleDeleteWarehouse(id);
                setSelectedWarehouseId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedPoId && (
            <RecordDetailPage
              entityType="po"
              recordId={selectedPoId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedPoId(null)}
              onEdit={() => setSelectedPoId(null)}
              onDelete={(id) => {
                handleDeletePurchaseOrder(id);
                setSelectedPoId(null);
              }}
              onAddNotification={handleAddNotification}
            />
          )}

          {selectedRfqId && (
            <RecordDetailPage
              entityType="rfq"
              recordId={selectedRfqId}
              rawMaterials={rawMaterials}
              products={products}
              categories={categories}
              subCategories={subCategories}
              suppliers={suppliers}
              warehouses={warehouses}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              darkMode={darkMode}
              currentUser={currentUser}
              onBack={() => setSelectedRfqId(null)}
              onEdit={() => setSelectedRfqId(null)}
              onDelete={(id) => {
                handleDeleteRfq(id);
                setSelectedRfqId(null);
              }}
              onUpdateRfq={(updated) => setRfqs(rfqs.map(r => r.id === updated.id ? updated : r))}
              onAddNotification={handleAddNotification}
            />
          )}

          {(!selectedMaterialId && !selectedProductId && !selectedSupplierId && !selectedCategoryId && !selectedSubcategoryId && !selectedWarehouseId && !selectedPoId && !selectedRfqId) && (
            <>
              {isStateLoaded && currentUser && !canAccessModule(currentUser, activeModule) ? (
                <div className={`p-8 rounded-2xl border text-center my-12 max-w-lg mx-auto shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    You do not have permission to access the <strong>{activeModule.replace(/_/g, ' ')}</strong> module based on your current role and user management settings.
                  </p>
                  <button
                    onClick={() => setActiveModule('dashboard')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20"
                  >
                    Return to Available Modules
                  </button>
                </div>
              ) : (
                <>
                  {activeModule === 'dashboard' && (
                <DashboardView 
                  rawMaterials={rawMaterials}
                  products={products}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  activities={activities}
                  onSelectModule={setActiveModule}
                  onSelectProduct={setSelectedProductId}
                  onSelectMaterial={setSelectedMaterialId}
                  darkMode={darkMode}
                />
              )}

              {activeModule === 'inventory_raw' && (
                <RawMaterialsView 
                  rawMaterials={rawMaterials}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  categoriesList={categories}
                  subCategoriesList={subCategories}
                  onAddRawMaterial={handleAddRawMaterial}
                  onUpdateRawMaterial={handleUpdateRawMaterial}
                  onDeleteRawMaterial={handleDeleteRawMaterial}
                  darkMode={darkMode}
                  selectedMaterialId={selectedMaterialId}
                  onSelectMaterial={setSelectedMaterialId}
                  isLoading={isLoading}
                  onViewHistory={(entity, id, name) => {
                    console.log('DEBUG: onViewHistory RawMaterial called with:', { entity, id, name });
                    setSelectedHistory({ entity, entityId: id, entityName: name });
                    if (entity === 'RawMaterial') {
                      window.history.pushState({}, '', `/inventory/raw-materials/${id}/history`);
                    } else if (entity === 'Product') {
                      window.history.pushState({}, '', `/inventory/products/${id}/history`);
                    } else {
                      window.history.pushState({}, '', `/history/${entity}/${id}`);
                    }
                  }}
                />
              )}

              {activeModule === 'inventory_products' && (
                <ProductsView 
                  products={products}
                  warehouses={warehouses}
                  categoriesList={categories}
                  subCategoriesList={subCategories}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  darkMode={darkMode}
                  selectedProductId={selectedProductId}
                  onSelectProduct={setSelectedProductId}
                  isLoading={isLoading}
                  onViewHistory={(entity, id, name) => {
                    console.log('DEBUG: onViewHistory Product called with:', { entity, id, name });
                    setSelectedHistory({ entity, entityId: id, entityName: name });
                    if (entity === 'RawMaterial') {
                      window.history.pushState({}, '', `/inventory/raw-materials/${id}/history`);
                    } else if (entity === 'Product') {
                      window.history.pushState({}, '', `/inventory/products/${id}/history`);
                    } else {
                      window.history.pushState({}, '', `/history/${entity}/${id}`);
                    }
                  }}
                />
              )}

          {activeModule === 'inventory_categories' && (
            <CategoriesView 
              categories={categories} 
              onAddCategory={handleAddCategory} 
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              subCategories={subCategories}
              onAddSubcategory={handleAddSubcategory}
              onUpdateSubcategory={handleUpdateSubcategory}
              onDeleteSubcategory={handleDeleteSubcategory}
              darkMode={darkMode} 
              selectedCategoryId={selectedCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              isLoading={isLoading}
            />
          )}

          {activeModule === 'inventory_suppliers' && (
            <SuppliersView 
              suppliers={suppliers}
              categoriesList={categories}
              subCategoriesList={subCategories}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onRefreshSuppliers={handleRefreshSuppliers}
              darkMode={darkMode}
              selectedSupplierId={selectedSupplierId}
            />
          )}

          {activeModule === 'inventory_warehouses' && (
            selectedWarehouseId ? (
              <WarehouseDetailPage
                warehouse={warehouses.find(w => w.id === selectedWarehouseId) || null}
                warehouseId={selectedWarehouseId}
                rawMaterials={rawMaterials}
                products={products}
                binLocations={binLocations}
                darkMode={darkMode}
                onBack={() => setSelectedWarehouseId(null)}
                onSelectProduct={setSelectedProductId}
                onSelectMaterial={setSelectedMaterialId}
              />
            ) : (
              <WarehousesView 
                warehouses={warehouses} 
                onAddWarehouse={handleAddWarehouse}
                onUpdateWarehouse={handleUpdateWarehouse}
                onDeleteWarehouse={handleDeleteWarehouse}
                binLocations={binLocations}
                onAddBin={handleAddBin}
                onUpdateBin={handleUpdateBin}
                onDeleteBin={handleDeleteBin}
                onViewWarehouse={setSelectedWarehouseId}
                darkMode={darkMode} 
                selectedWarehouseId={selectedWarehouseId}
              />
            )
          )}

          {activeModule === 'inventory_transactions' && (
            <TransactionsView 
              transactions={transactions}
              warehouses={warehouses}
              rawMaterials={rawMaterials}
              products={products}
              onAddTransaction={handleAddTransaction}
              onSelectProduct={setSelectedProductId}
              onSelectMaterial={setSelectedMaterialId}
              darkMode={darkMode}
              isLoading={isLoading}
              currentUser={currentUser}
            />
          )}

          {activeModule === 'inventory_stock' && (
            <StockManagementView rawMaterials={rawMaterials} darkMode={darkMode} isLoading={isLoading} />
          )}

          {(activeModule === 'procurement' || activeModule.startsWith('procurement_')) && (
            <ProcurementModule 
              darkMode={darkMode} 
              rawMaterials={rawMaterials}
              suppliers={suppliers}
              warehouses={warehouses}
              onAddTransaction={handleAddTransaction}
              onAddNotification={handleAddNotification}
              onUpdateRawMaterials={setRawMaterials}
              onUpdateSuppliers={setSuppliers}
              onUpdateWarehouses={setWarehouses}
              onUpdateBins={setBinLocations}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              onUpdatePurchaseOrders={setPurchaseOrders}
              onUpdateRfqs={setRfqs}
              selectedPoId={selectedPoId}
              selectedRfqId={initialRfqId || selectedRfqId}
              selectedQuoteId={initialQuoteId}
              procurementSubPage={initialProcurementSubPage}
              activeSubTab={
                activeModule === 'procurement' ? 'dashboard' :
                activeModule === 'procurement_gate_entry' ? 'gate_entry' :
                activeModule === 'procurement_reel_inward' ? 'reel_inward' :
                (activeModule.replace('procurement_', '') as any)
              }
              onSelectSubTab={(tab) => {
                if (tab === 'rfq') {
                  router.push('/procurement/rfq');
                } else if (tab === 'quotes') {
                  router.push('/procurement/supplier-quotations');
                } else {
                  setActiveModule(`procurement_${tab}` as any);
                }
              }}
              onTriggerEventNotification={handleTriggerEventNotification}
              onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
              notificationRules={notificationRules}
              onSelectMaterial={setSelectedMaterialId}
              onSelectPo={setSelectedPoId}
              binLocations={binLocations}
            />
          )}

          {(activeModule === 'sales' || (activeModule.startsWith('sales_') && activeModule !== 'sales_dispatch')) && (
            <SalesModule 
              darkMode={darkMode} 
              products={products}
              warehouses={warehouses}
              onAddTransaction={handleAddTransaction}
              onSelectProduct={setSelectedProductId}
              onSelectModule={setActiveModule}
              salesSubPage={salesSubPage}
              selectedLeadId={selectedLeadId}
              selectedQuotationId={selectedQuotationId}
              selectedSalesOrderId={selectedSalesOrderId}
              selectedCustomerId={selectedCustomerId}
              onSetSalesSubPage={(page) => {
                setSalesSubPage(page);
                if (page === 'new_lead') window.history.pushState({}, '', '/sales/leads/new');
                else if (page === 'new_quotation') window.history.pushState({}, '', '/sales/quotations/new');
                else if (page === 'new_delivery_challan') window.history.pushState({}, '', '/sales/delivery-challans/new');
                else if (page === 'new_customer') window.history.pushState({}, '', '/sales/customers/new');
                else if (page === 'lead_workspace') window.history.pushState({}, '', '/sales/leads/workspace');
                else if (page === 'quotation_workspace') window.history.pushState({}, '', '/sales/quotations/workspace');
                else {
                  if (activeModule === 'sales_leads') window.history.pushState({}, '', '/sales_leads');
                  else if (activeModule === 'sales_quotations') window.history.pushState({}, '', '/sales_quotations');
                  else if (activeModule === 'sales_customers') window.history.pushState({}, '', '/sales_customers');
                  else if (activeModule === 'sales_orders') window.history.pushState({}, '', '/sales_orders');
                  else if (activeModule === 'sales_dashboard') window.history.pushState({}, '', '/sales_dashboard');
                  else window.history.pushState({}, '', `/${activeModule}`);
                }
              }}
              activeSubTab={
                activeModule === 'sales' ? 'dashboard' :
                (activeModule.replace('sales_', '') as any)
              }
              onNavigateToCostingBom={(leadId, customerId) => {
                setSelectedLeadId(leadId);
                if (customerId) setSelectedCustomerId(customerId);
                setCostingSubPage('bom-new');
                setActiveModule('costing_bom');
              }}
              onNavigateToQuotation={(quotationId) => {
                setSelectedQuotationId(quotationId);
                setSalesSubPage('quotation_workspace');
                setActiveModule('sales_quotations');
              }}
              onSelectSubTab={(tab) => {
                setSalesSubPage(null);
                if (tab === 'dispatch') {
                  setActiveModule('dispatch_list');
                } else {
                  setActiveModule(`sales_${tab}` as any);
                }
              }}
            />
          )}

          {(activeModule === 'costing' || activeModule.startsWith('costing_')) && (
            <CostingModule
              darkMode={darkMode}
              currentUser={currentUser}
              initialTab={
                costingSubPage ||
                initialCostingSubPage ||
                (activeModule === 'costing_bom'
                  ? 'bom'
                  : activeModule === 'costing' || activeModule === 'costing_dashboard'
                  ? 'dashboard'
                  : activeModule === 'costing_sheets'
                  ? 'sheets'
                  : activeModule === 'costing_new'
                  ? 'new'
                  : activeModule === 'costing_pending'
                  ? 'pending'
                  : activeModule === 'costing_approved'
                  ? 'approved'
                  : activeModule === 'costing_history'
                  ? 'history'
                  : 'dashboard')
              }
              initialBomId={selectedBomId || undefined}
              initialCostSheetId={selectedCostSheetId || undefined}
              initialLeadId={selectedLeadId || undefined}
              onNavigateToQuotation={(quotationId) => {
                setSelectedQuotationId(quotationId);
                setSalesSubPage('quotation_workspace');
                setActiveModule('sales_quotations');
              }}
            />
          )}

          {(activeModule === 'production' || activeModule.startsWith('production_')) && (
            <ProductionModule
              darkMode={darkMode}
              products={products}
              warehouses={warehouses}
              initialSubTab={
                productionSubTab ||
                (activeModule === 'production'
                  ? 'dashboard'
                  : (activeModule.replace('production_', '') as any))
              }
              initialSubPage={productionSubPage || undefined}
              initialSelectedId={selectedProductionEntityId || undefined}
              onNavigateTab={(tab, subPage, selectedId) => {
                if (tab) {
                  setActiveModule(`production_${tab}` as any);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', `/production_${tab}`);
                  }
                }
              }}
            />
          )}

          {(activeModule === 'qc' || activeModule.startsWith('qc_') || activeModule === 'quality_control') && (
            <QualityControlModule
              darkMode={darkMode}
              warehouses={warehouses}
              onNavigateEntity={(mod, subPage, id) => {
                if (mod === 'sales') {
                  if (id) setSelectedSalesOrderId(id);
                  setActiveModule('sales_orders' as any);
                } else if (mod === 'production') {
                  setActiveModule('production_work_orders' as any);
                } else {
                  setActiveModule(mod as any);
                }
              }}
            />
          )}

          {(activeModule === 'dispatch' || activeModule.startsWith('dispatch_') || activeModule === 'sales_dispatch') && (
            <DispatchModule
              darkMode={darkMode}
              currentSubTab={dispatchSubTab || (activeModule === 'dispatch' ? 'dispatch_dashboard' : activeModule === 'sales_dispatch' ? 'dispatch_list' : activeModule)}
              selectedDispatchId={selectedDispatchId}
              onSubTabChange={(tab) => {
                setActiveModule(tab as any);
                setDispatchSubTab(tab);
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', `/${tab}`);
                }
              }}
            />
          )}

          {activeModule === 'accounts' && (
            <AccountsModule darkMode={darkMode} />
          )}

          {(activeModule === 'reports' || activeModule.startsWith('reports_')) && (
            <ReportsModule
              darkMode={darkMode}
              initialTab={
                activeModule === 'reports' || activeModule === 'reports_dashboard'
                  ? 'dashboard'
                  : (activeModule.replace('reports_', '') as any)
              }
              onTabChange={(tab) => {
                const targetMod = tab === 'dashboard' ? 'reports_dashboard' : (`reports_${tab}` as ModuleType);
                setActiveModule(targetMod);
              }}
              onGenerateReport={handleGenerateReport}
              onNavigateEntity={(mod, subPage, id) => {
                if (mod === 'sales') {
                  if (id) {
                    if (subPage === 'lead_workspace') {
                      setSelectedLeadId(id);
                      setSalesSubPage('lead_workspace');
                      setActiveModule('sales_leads' as any);
                    } else if (subPage === 'quotation_workspace') {
                      setSelectedQuotationId(id);
                      setSalesSubPage('quotation_workspace');
                      setActiveModule('sales_quotations' as any);
                    } else {
                      setSelectedSalesOrderId(id);
                      setSalesSubPage('sales_order_view');
                      setActiveModule('sales_orders' as any);
                    }
                  } else {
                    setActiveModule('sales_orders' as any);
                  }
                } else if (mod === 'purchase' || mod === 'procurement') {
                  if (id) setSelectedPoId(id);
                  setActiveModule('procurement_po' as any);
                } else if (mod === 'inventory') {
                  if (subPage === 'products') setActiveModule('inventory_products' as any);
                  else if (subPage === 'raw_materials') setActiveModule('inventory_raw' as any);
                  else setActiveModule('inventory_stock' as any);
                } else if (mod === 'production') {
                  setActiveModule('production_work_orders' as any);
                } else if (mod === 'dispatch') {
                  setActiveModule('dispatch' as any);
                }
              }}
            />
          )}

          {activeModule === 'settings' && (
            <SettingsModule 
              darkMode={darkMode} 
              currentUser={currentUser}
              onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
            />
          )}

          {activeModule === 'user_management' && (
            <UserManagementModule darkMode={darkMode} currentUser={currentUser} />
          )}

              {activeModule === 'recycle_bin' && (
            <RecycleBinPage darkMode={darkMode} />
          )}
          
          {activeModule === 'admin_excel' && (
                <AdminExcelView 
                  currentUser={currentUser}
                  rawMaterials={rawMaterials}
                  products={products}
                  suppliers={suppliers}
                  warehouses={warehouses}
                  categories={categories}
                  onUpdateRawMaterials={setRawMaterials}
                  onUpdateProducts={setProducts}
                  onUpdateSuppliers={setSuppliers}
                  onUpdateWarehouses={setWarehouses}
                  onUpdateCategories={setCategories}
                  onAddActivity={handleAddActivity}
                  darkMode={darkMode}
                  onSelectModule={setActiveModule}
                />
              )}
                </>
              )}
            </>
          )}
            </>
          )}
        </main>
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        rules={notificationRules}
        onUpdateRule={handleUpdateNotificationRule}
        onResetRules={handleResetNotificationRules}
        darkMode={darkMode}
      />

      {/* Outbound Email Toast Container */}
      <EmailToastContainer
        toasts={emailToasts}
        onDismiss={(id) => setEmailToasts(prev => prev.filter(t => t.id !== id))}
      />
    </div>
    </ErrorBoundary>
  );
}
