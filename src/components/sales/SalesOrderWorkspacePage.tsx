'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Package,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  Edit3,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Printer,
  ChevronRight,
  ShieldCheck,
  Boxes,
  Activity,
  Check,
  X
} from 'lucide-react';

interface SalesOrderWorkspacePageProps {
  darkMode: boolean;
  orderId?: string;
  orderData?: any;
  onBack: () => void;
  onRefreshParent?: () => void;
  onSelectModule?: (module: string) => void;
}

export const SalesOrderWorkspacePage: React.FC<SalesOrderWorkspacePageProps> = ({
  darkMode,
  orderId,
  orderData: initialOrderData,
  onBack,
  onRefreshParent,
  onSelectModule
}) => {
  const router = useRouter();
  const [order, setOrder] = useState<any>(initialOrderData || null);
  const [loading, setLoading] = useState(!initialOrderData && !!orderId);
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'dispatches' | 'timeline'>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [linkedWorkOrders, setLinkedWorkOrders] = useState<any[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  const effectiveOrderId = order?.id || orderId || initialOrderData?.id;

  const fetchLinkedWorkOrders = async (soId?: string) => {
    const id = soId || effectiveOrderId;
    if (!id) return;
    setLoadingWorkOrders(true);
    try {
      const res = await fetch(`/api/production/work-orders?salesOrderId=${id}`);
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.workOrders)) {
        setLinkedWorkOrders(data.data.workOrders);
      } else if (data.success && Array.isArray(data.data)) {
        setLinkedWorkOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch linked work orders:', err);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const fetchOrderDetails = async (idToFetch?: string) => {
    const id = idToFetch || effectiveOrderId;
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        fetchLinkedWorkOrders(data.data.id);
      } else {
        // Fallback to query
        const listRes = await fetch(`/api/sales/orders`);
        const listData = await listRes.json();
        if (listData.success && Array.isArray(listData.data)) {
          const found = listData.data.find((o: any) => o.id === id || o.soNumber === id);
          if (found) {
            setOrder(found);
            fetchLinkedWorkOrders(found.id);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch sales order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveOrderId) {
      fetchOrderDetails(effectiveOrderId);
      fetchLinkedWorkOrders(effectiveOrderId);
    }
  }, [effectiveOrderId]);

  const handleReleaseToProduction = async () => {
    if (!order?.id) return;
    setActionLoading(true);
    setActionErrorMsg('');
    try {
      // 1. Create or trigger Work Order in Production & Planning
      const woRes = await fetch('/api/production/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesOrderId: order.id,
          productId: order.productId,
          orderedQuantity: order.quantity || 1000,
          priority: 'High',
          remarks: `Auto-generated from Sales Order ${order.soNumber}`,
        }),
      });
      const woData = await woRes.json();

      // 2. Update Sales Order status to "Released to Production"
      await fetch(`/api/sales/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Released to Production' }),
      });

      if (woData.success && woData.data?.orderNumber) {
        setActionSuccessMsg(`Work Order ${woData.data.orderNumber} created & released to Production Floor!`);
      } else {
        setActionSuccessMsg(`Order marked as Released to Production.`);
      }

      await fetchOrderDetails();
      await fetchLinkedWorkOrders();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error releasing order to production');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order?.id) return;
    setActionLoading(true);
    setActionErrorMsg('');
    try {
      const res = await fetch(`/api/sales/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Sales Order status updated to "${newStatus}"`);
        await fetchOrderDetails();
        if (onRefreshParent) onRefreshParent();
      } else {
        setActionErrorMsg(data.error || 'Failed to update order status');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error updating order status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400">Loading Sales Order Workspace...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`p-8 rounded-2xl border text-center my-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Sales Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">The requested sales order record could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Sales Orders
        </button>
      </div>
    );
  }

  const deliveredQty = order.deliveredQuantity || (order.dispatches ? order.dispatches.reduce((acc: number, d: any) => acc + (d.quantity || 0), 0) : 0);
  const totalQty = order.quantity || 1;
  const balanceQty = Math.max(0, totalQty - deliveredQty);
  const fulfillmentPct = Math.min(100, Math.round((deliveredQty / totalQty) * 100));

  return (
    <div className={`space-y-6 pb-20 max-w-7xl mx-auto ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Toast Alert Notifications */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg('')} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-semibold ${
              darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>

          <div className={`hidden sm:flex items-center space-x-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            <span className="cursor-pointer hover:underline" onClick={onBack}>Sales & Dispatch</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="cursor-pointer hover:underline" onClick={onBack}>Sales Orders</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-emerald-500">{order.soNumber}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchOrderDetails()}
            disabled={loading || actionLoading}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => router.push(`/sales/sales-orders/${order.id}/edit`)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Order</span>
          </button>

          <button
            onClick={() => window.print()}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print SO</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-lg font-mono text-sm font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {order.soNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                order.status === 'Completed' || order.status === 'Fully Delivered' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' :
                order.status === 'In Production' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {order.status || 'Confirmed'}
              </span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">{order.productName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>Customer: <strong className="text-slate-800 dark:text-slate-200">{order.customerName}</strong></span>
              <span>•</span>
              <span>Customer PO: <strong className="text-blue-500">{order.customerPoNumber || 'PO Not Provided'}</strong></span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Ordered Qty</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{order.quantity?.toLocaleString()} Pcs</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Delivered</p>
              <p className="text-sm font-extrabold text-blue-500">{deliveredQty.toLocaleString()} Pcs</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Balance</p>
              <p className="text-sm font-extrabold text-amber-500">{balanceQty.toLocaleString()} Pcs</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Order Value</p>
              <p className="text-sm font-extrabold text-emerald-500">₹{(order.totalValue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Fulfillment Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Dispatch Fulfillment Progress</span>
            <span className="text-emerald-500">{fulfillmentPct}% ({deliveredQty.toLocaleString()} / {totalQty.toLocaleString()} units)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${fulfillmentPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'overview'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Specifications & Terms</span>
        </button>

        <button
          onClick={() => setActiveTab('production')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'production'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Production & Work Order</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatches')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'dispatches'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery Challans ({order.dispatches?.length || 0})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Box & Technical Specifications */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-emerald-500" />
                <span>Technical Product & Corrugation Parameters</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Box Type</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.boxType || 'Universal RSC'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Dimensions (L x W x H)</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.dimensions || '450 x 300 x 250 mm'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Ply Structure</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.ply || '5 Ply'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Flute Profile</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.fluteType || 'Narrow Flute (B-Flute)'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Paper Grades / GSM</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.paperSpec || 'Top 200 Kraft / Medium 140'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Printing Colors</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.printingRequirement || '2-Color Flexo'}</p>
                </div>
              </div>
            </div>

            {/* Commercial Terms */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Commercial Terms & Delivery Schedule</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Unit Price</p>
                  <p className="font-bold text-emerald-500 mt-0.5">₹{order.unitPrice || (order.totalValue / (order.quantity || 1)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Total Value (excl. GST)</p>
                  <p className="font-bold text-emerald-500 mt-0.5">₹{(order.totalValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Promised Delivery Date</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.deliveryDate || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Payment Terms</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.paymentTerms || '30 Days Net from Delivery'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Delivery Location / Warehouse</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{order.warehouseId || 'Finished Goods Warehouse - Unit 1'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Sidebar */}
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                Order Lifecycle Actions
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleReleaseToProduction}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Activity className="w-4 h-4" />
                  <span>Release to Production (Create Work Order)</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('In Production')}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Mark In Production</span>
                </button>

                <button
                  onClick={() => {
                    if (onSelectModule) onSelectModule('sales_dispatch');
                    router.push('/sales/delivery-challans/new');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>Generate Delivery Challan</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('Completed')}
                  disabled={actionLoading}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Mark Order as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="space-y-6">
          {/* Active Work Orders Linked to this Sales Order */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-emerald-500" />
                  <span>Linked Production Work Orders</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manufacturing jobs created for Sales Order {order.soNumber}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReleaseToProduction}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>+ Create Work Order</span>
                </button>

                <button
                  onClick={() => {
                    if (onSelectModule) onSelectModule('production_work_orders');
                    else router.push('/production_work_orders');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>Go to Production Module</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {loadingWorkOrders ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                Loading linked work orders...
              </div>
            ) : linkedWorkOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                      <th className="p-3">Work Order #</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Current Stage</th>
                      <th className="p-3">Target Date</th>
                      <th className="p-3">Planned Qty</th>
                      <th className="p-3">Produced Qty</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {linkedWorkOrders.map((wo: any) => {
                      const pct = wo.orderedQuantity > 0 ? Math.min(100, Math.round(((wo.producedQuantity || 0) / wo.orderedQuantity) * 100)) : 0;
                      return (
                        <tr key={wo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-500">{wo.orderNumber}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              wo.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : wo.status === 'In Progress'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {wo.status}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{wo.currentStage || 'Planning'}</td>
                          <td className="p-3 text-slate-500">{wo.targetDate || '—'}</td>
                          <td className="p-3 font-bold">{wo.orderedQuantity.toLocaleString()} Pcs</td>
                          <td className="p-3 font-bold text-emerald-500">{(wo.producedQuantity || 0).toLocaleString()} Pcs</td>
                          <td className="p-3 min-w-[120px]">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (onSelectModule) onSelectModule('production_work_orders');
                                else router.push('/production_work_orders');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Open WO
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Boxes className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No Work Order has been created yet for this Sales Order.</p>
                <button
                  onClick={handleReleaseToProduction}
                  disabled={actionLoading}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Release to Production (Create Work Order)</span>
                </button>
              </div>
            )}
          </div>

          {/* Sequential Corrugation Steps */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              Sequential Corrugation Production Steps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Stage 1</p>
                <h4 className="text-xs font-bold mt-1">Corrugator Reel Fluting</h4>
                <p className="text-[11px] text-slate-500 mt-1">Reel mounting, corrugation heating, 5-ply gluing</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Stage 2</p>
                <h4 className="text-xs font-bold mt-1">Flexo Printing</h4>
                <p className="text-[11px] text-slate-500 mt-1">Stereo mounting, 2-color high-definition ink</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Stage 3</p>
                <h4 className="text-xs font-bold mt-1">Rotary Slotting & Die-Cutting</h4>
                <p className="text-[11px] text-slate-500 mt-1">Precision creasing, flap slotting</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Stage 4</p>
                <h4 className="text-xs font-bold mt-1">Stitching, Bundling & QC</h4>
                <p className="text-[11px] text-slate-500 mt-1">Wire stitching, 25-box strapping, final QC stamp</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dispatches' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold">Delivery Challans & Dispatch History</h3>
            <button
              onClick={() => router.push('/sales/delivery-challans/new')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>New Challan</span>
            </button>
          </div>

          {order.dispatches && order.dispatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                    <th className="p-3">Challan #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Vehicle #</th>
                    <th className="p-3">LR / Waybill #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.dispatches.map((d: any) => (
                    <tr key={d.id}>
                      <td className="p-3 font-mono font-bold text-emerald-500">{d.challanNumber}</td>
                      <td className="p-3">{d.dispatchDate}</td>
                      <td className="p-3 font-bold">{d.quantity} Pcs</td>
                      <td className="p-3 font-mono">{d.vehicleNumber || '—'}</td>
                      <td className="p-3 font-mono">{d.lrNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No delivery challans generated yet for this Sales Order.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
