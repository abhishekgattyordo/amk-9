import React, { useState, useEffect } from 'react';
import {
  Product,
  RawMaterial,
  Warehouse,
  BillOfMaterial,
  WorkOrder,
  ProductionMetrics,
} from '../../types';
import { ProductionDashboardView } from './ProductionDashboardView';
import { BomListView } from './BomListView';
import { BomDetailView } from './BomDetailView';
import { BomFormView } from './BomFormView';
import { WorkOrderListView } from './WorkOrderListView';
import { WorkOrderDetailView } from './WorkOrderDetailView';
import { WorkOrderFormView } from './WorkOrderFormView';
import { PlanningSchedulingView } from './PlanningSchedulingView';
import { ProductionOrdersView } from './ProductionOrdersView';
import { CreateProductionOrderView } from './CreateProductionOrderView';
import { ProductionOrderDetailView } from './ProductionOrderDetailView';
import { MaterialIndentAllocationView } from './MaterialIndentAllocationView';
import { DailyProductionReportsView } from './DailyProductionReportsView';
import { ApprovalsView } from './ApprovalsView';
import { FinishedGoodsView } from './FinishedGoodsView';
import { MachineManagementView } from './MachineManagementView';
import { FloorOperationsView } from './FloorOperationsView';
import { ProductionQCView } from './ProductionQCView';
import { ScrapDowntimeView } from './ScrapDowntimeView';

interface ProductionModuleProps {
  darkMode: boolean;
  products?: Product[];
  warehouses?: Warehouse[];
  salesOrders?: any[];
  onNavigateTab?: (tab: any, subPage?: string, selectedId?: string) => void;
  initialSubTab?: string;
  initialSubPage?: string;
  initialSelectedId?: string;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  darkMode,
  products = [],
  warehouses = [],
  salesOrders = [],
  onNavigateTab,
  initialSubTab = 'dashboard',
  initialSubPage,
  initialSelectedId,
}) => {
  // Navigation State
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab || 'dashboard');
  const [activeSubPage, setActiveSubPage] = useState<string>(initialSubPage || 'list');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(initialSelectedId || null);

  // Core Data States
  const [dashboardMetrics, setDashboardMetrics] = useState<ProductionMetrics | null>(null);
  const [boms, setBoms] = useState<BillOfMaterial[]>([]);
  const [selectedBom, setSelectedBom] = useState<BillOfMaterial | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [warehouseList, setWarehouseList] = useState<any[]>(warehouses || []);

  // Filters & Searching
  const [loading, setLoading] = useState(false);
  const [bomSearch, setBomSearch] = useState('');
  const [bomStatusFilter, setBomStatusFilter] = useState('All');
  const [bomPlyFilter, setBomPlyFilter] = useState('All');

  const [woSearch, setWoSearch] = useState('');
  const [woStatusFilter, setWoStatusFilter] = useState('All');
  const [woPriorityFilter, setWoPriorityFilter] = useState('All');

  // Load Raw Materials & Warehouses
  const loadInitialData = async () => {
    try {
      const [rmRes, whRes] = await Promise.all([
        fetch('/api/inventory/raw-materials'),
        fetch('/api/inventory/warehouses'),
      ]);
      const [rmData, whData] = await Promise.all([rmRes.json(), whRes.json()]);
      if (rmData.success && Array.isArray(rmData.data)) {
        setRawMaterials(rmData.data);
      }
      if (whData.success && Array.isArray(whData.data)) {
        setWarehouseList(whData.data);
      }
    } catch (e) {
      console.error('Error fetching inventory references for production:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle external tab change props
  useEffect(() => {
    if (initialSubTab) {
      // Normalize aliases
      const normalized =
        initialSubTab === 'indents' || initialSubTab === 'material_indents' || initialSubTab === 'material_allocation'
          ? 'material_allocation'
          : initialSubTab === 'floor' || initialSubTab === 'floor_ops'
          ? 'floor_ops'
          : initialSubTab === 'reports' || initialSubTab === 'daily_reports'
          ? 'daily_reports'
          : initialSubTab === 'fg' || initialSubTab === 'finished_goods'
          ? 'finished_goods'
          : initialSubTab === 'scrap' || initialSubTab === 'scrap_downtime'
          ? 'scrap_downtime'
          : initialSubTab === 'orders' || initialSubTab === 'production_orders'
          ? 'production_orders'
          : initialSubTab;
      setActiveSubTab(normalized);
    }
    if (initialSubPage) setActiveSubPage(initialSubPage);
    if (initialSelectedId) setSelectedEntityId(initialSelectedId);
  }, [initialSubTab, initialSubPage, initialSelectedId]);

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production/dashboard');
      const data = await res.json();
      if (data.success && data.data) {
        setDashboardMetrics(data.data);
      }
    } catch (err) {
      console.error('Error fetching production dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load BOMs
  const loadBoms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (bomSearch) params.append('search', bomSearch);
      if (bomStatusFilter !== 'All') params.append('status', bomStatusFilter);
      if (bomPlyFilter !== 'All') params.append('ply', bomPlyFilter);

      const res = await fetch(`/api/production/boms?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBoms(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching BOMs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Single BOM
  const loadBomDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/production/boms?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBom(data.data);
      }
    } catch (err) {
      console.error('Error fetching BOM detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBom = async (id: string) => {
    try {
      const res = await fetch(`/api/production/boms?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadBoms();
      }
    } catch (err) {
      console.error('Error deleting BOM:', err);
    }
  };

  // Load Work Orders
  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (woSearch) params.append('search', woSearch);
      if (woStatusFilter !== 'All') params.append('status', woStatusFilter);
      if (woPriorityFilter !== 'All') params.append('priority', woPriorityFilter);

      const res = await fetch(`/api/production/work-orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setWorkOrders(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching Work Orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Single Work Order
  const loadWorkOrderDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/production/work-orders?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedWorkOrder(data.data);
      }
    } catch (err) {
      console.error('Error fetching Work Order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger loads based on active tabs
  useEffect(() => {
    if (activeSubTab === 'dashboard') {
      loadDashboard();
    } else if (activeSubTab === 'bom') {
      if (activeSubPage === 'view' && selectedEntityId) {
        loadBomDetail(selectedEntityId);
      } else if (activeSubPage === 'list') {
        loadBoms();
      }
    } else if (activeSubTab === 'work_orders') {
      if (activeSubPage === 'view' && selectedEntityId) {
        loadWorkOrderDetail(selectedEntityId);
      } else if (activeSubPage === 'list') {
        loadWorkOrders();
      }
    } else if (activeSubTab === 'floor_ops') {
      loadWorkOrders();
    }
  }, [activeSubTab, activeSubPage, selectedEntityId, bomSearch, bomStatusFilter, bomPlyFilter, woSearch, woStatusFilter, woPriorityFilter]);

  // Release Work Order Action
  const handleReleaseWorkOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/production/work-orders/release?id=${id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to release work order');

      if (activeSubPage === 'view' && selectedEntityId === id) {
        loadWorkOrderDetail(id);
      } else {
        loadWorkOrders();
      }
      alert('Work Order released to production floor workstations!');
    } catch (err: any) {
      alert(err.message || 'Error releasing work order');
    }
  };

  // Delete Work Order Action (Soft Delete to Recycle Bin)
  const handleDeleteWorkOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Work Order? It will be moved to the Recycle Bin.')) {
      return;
    }
    try {
      const res = await fetch(`/api/production/work-orders?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (activeSubPage === 'view') {
          setActiveSubPage('list');
          setSelectedEntityId(null);
        }
        loadWorkOrders();
      } else {
        alert(data.error || 'Failed to delete work order');
      }
    } catch (err: any) {
      console.error('Error deleting work order:', err);
      alert(err.message || 'Error deleting work order');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <ProductionDashboardView
          darkMode={darkMode}
          metrics={dashboardMetrics}
          loading={loading}
          onRefresh={loadDashboard}
          onNavigateTab={(targetTab, subPage, selectedId) => {
            if (onNavigateTab) {
              onNavigateTab(targetTab, subPage, selectedId);
            } else {
              setActiveSubTab(targetTab);
              if (subPage) setActiveSubPage(subPage);
              if (selectedId) setSelectedEntityId(selectedId);
            }
          }}
        />
      )}

      {/* 2. PLANNING & SCHEDULING */}
      {activeSubTab === 'planning' && (
        <PlanningSchedulingView
          darkMode={darkMode}
          onNavigateToProductionOrder={(id) => {
            if (id) {
              setSelectedEntityId(id);
              setActiveSubPage('view');
            }
            if (onNavigateTab) {
              onNavigateTab('orders', id ? 'view' : 'list', id);
            } else {
              setActiveSubTab('production_orders');
            }
          }}
        />
      )}

      {/* 3. WORK ORDERS */}
      {activeSubTab === 'work_orders' && (
        <>
          {activeSubPage === 'list' && (
            <WorkOrderListView
              darkMode={darkMode}
              workOrders={workOrders}
              loading={loading}
              search={woSearch}
              onSearchChange={setWoSearch}
              statusFilter={woStatusFilter}
              onStatusFilterChange={setWoStatusFilter}
              priorityFilter={woPriorityFilter}
              onPriorityFilterChange={setWoPriorityFilter}
              onViewWorkOrder={(id) => {
                setSelectedEntityId(id);
                setActiveSubPage('view');
              }}
              onEditWorkOrder={(id) => {
                setSelectedEntityId(id);
                setActiveSubPage('form');
              }}
              onCreateNew={() => {
                setSelectedEntityId(null);
                setActiveSubPage('form');
              }}
              onReleaseWorkOrder={handleReleaseWorkOrder}
              onDeleteWorkOrder={handleDeleteWorkOrder}
            />
          )}

          {activeSubPage === 'view' && (
            <WorkOrderDetailView
              darkMode={darkMode}
              workOrderId={selectedEntityId || ''}
              workOrder={selectedWorkOrder}
              loading={loading}
              onBack={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
              }}
              onEdit={(id) => {
                setSelectedEntityId(id);
                setActiveSubPage('form');
              }}
              onRelease={handleReleaseWorkOrder}
              onRefresh={loadWorkOrders}
              onNavigateTab={(tab, subPage, id) => {
                if (onNavigateTab) {
                  onNavigateTab(tab, subPage, id);
                } else {
                  setActiveSubTab(tab);
                }
              }}
              warehouses={warehouseList}
            />
          )}

          {activeSubPage === 'form' && (
            <WorkOrderFormView
              darkMode={darkMode}
              workOrderId={selectedEntityId}
              products={products}
              warehouses={warehouseList}
              boms={boms}
              onBack={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
              }}
              onSaved={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
                loadWorkOrders();
              }}
            />
          )}
        </>
      )}

      {/* 4. PRODUCTION ORDERS & WIP */}
      {activeSubTab === 'production_orders' && (
        <>
          {activeSubPage === 'list' && (
            <ProductionOrdersView
              darkMode={darkMode}
              products={products}
              warehouses={warehouseList}
              onCreateNew={() => setActiveSubPage('create')}
              onSelectOrder={(id) => {
                setSelectedEntityId(id);
                setActiveSubPage('view');
              }}
            />
          )}

          {(activeSubPage === 'create' || activeSubPage === 'form') && (
            <CreateProductionOrderView
              darkMode={darkMode}
              products={products}
              warehouses={warehouseList}
              onBack={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
              }}
              onSuccess={(newId) => {
                if (newId) {
                  setSelectedEntityId(newId);
                  setActiveSubPage('view');
                } else {
                  setActiveSubPage('list');
                }
              }}
            />
          )}

          {activeSubPage === 'view' && selectedEntityId && (
            <ProductionOrderDetailView
              orderId={selectedEntityId}
              darkMode={darkMode}
              warehouses={warehouseList}
              onBack={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
              }}
            />
          )}
        </>
      )}

      {/* 5. MATERIAL INDENTS (GODOWN 1 -> GODOWN 2) */}
      {activeSubTab === 'material_allocation' && (
        <MaterialIndentAllocationView
          darkMode={darkMode}
          warehouses={warehouseList}
          rawMaterials={rawMaterials}
        />
      )}

      {/* 6. FLOOR OPERATIONS */}
      {activeSubTab === 'floor_ops' && (
        <FloorOperationsView
          darkMode={darkMode}
          workOrders={workOrders}
          loading={loading}
          onRefresh={loadWorkOrders}
          onViewWorkOrder={(id) => {
            if (onNavigateTab) {
              onNavigateTab('work_orders', 'view', id);
            } else {
              setActiveSubTab('work_orders');
              setActiveSubPage('view');
              setSelectedEntityId(id);
            }
          }}
        />
      )}

      {/* 7. DAILY PRODUCTION REPORTS */}
      {activeSubTab === 'daily_reports' && (
        <DailyProductionReportsView
          darkMode={darkMode}
          products={products}
        />
      )}

      {/* 8. APPROVALS */}
      {activeSubTab === 'approvals' && (
        <ApprovalsView
          darkMode={darkMode}
          onNavigateToEntity={(mod, id) => {
            if (onNavigateTab) {
              onNavigateTab(mod, 'view', id);
            }
          }}
        />
      )}

      {/* 9. FINISHED GOODS (FG) */}
      {activeSubTab === 'finished_goods' && (
        <FinishedGoodsView
          darkMode={darkMode}
          warehouses={warehouseList}
          products={products}
          onNavigateToOrder={(id) => {
            setSelectedEntityId(id);
            setActiveSubTab('production_orders');
            setActiveSubPage('view');
          }}
          onNavigateToDispatch={() => {
            if (onNavigateTab) {
              onNavigateTab('dispatch_list');
            }
          }}
        />
      )}

      {/* 10. MACHINES & LINES */}
      {activeSubTab === 'machines' && (
        <MachineManagementView darkMode={darkMode} />
      )}

      {/* 11. SCRAP & DOWNTIME */}
      {activeSubTab === 'scrap_downtime' && (
        <ScrapDowntimeView darkMode={darkMode} />
      )}

      {/* BILL OF MATERIALS (BOM) Fallback */}
      {activeSubTab === 'bom' && (
        <>
          {activeSubPage === 'list' && (
            <BomListView
              darkMode={darkMode}
              boms={boms}
              loading={loading}
              search={bomSearch}
              onSearchChange={setBomSearch}
              statusFilter={bomStatusFilter}
              onStatusFilterChange={setBomStatusFilter}
              plyFilter={bomPlyFilter}
              onPlyFilterChange={setBomPlyFilter}
              onViewBom={(id) => {
                setSelectedEntityId(id);
                setActiveSubPage('view');
              }}
              onEditBom={(id) => {
                setSelectedEntityId(id);
                setActiveSubPage('form');
              }}
              onDeleteBom={handleDeleteBom}
              onCreateNew={() => {
                setSelectedEntityId(null);
                setActiveSubPage('form');
              }}
            />
          )}

          {activeSubPage === 'view' && (
            <BomDetailView
              darkMode={darkMode}
              bom={selectedBom}
              loading={loading}
              onBack={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
              }}
              onEdit={(id) => {
                setSelectedEntityId(id);
                setActiveSubPage('form');
              }}
              onCreateWorkOrder={() => {
                setSelectedEntityId(null);
                setActiveSubTab('work_orders');
                setActiveSubPage('form');
              }}
            />
          )}

          {activeSubPage === 'form' && (
            <BomFormView
              darkMode={darkMode}
              bomId={selectedEntityId}
              products={products}
              rawMaterials={rawMaterials}
              onBack={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
              }}
              onSaved={() => {
                setActiveSubPage('list');
                setSelectedEntityId(null);
                loadBoms();
              }}
            />
          )}
        </>
      )}

      {/* QUALITY CONTROL Fallback */}
      {activeSubTab === 'quality_control' && (
        <ProductionQCView
          darkMode={darkMode}
          warehouses={warehouseList}
          onRefreshAll={() => {
            loadWorkOrders();
            loadDashboard();
          }}
        />
      )}
    </div>
  );
};
