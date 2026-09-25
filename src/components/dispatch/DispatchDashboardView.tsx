'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  Printer,
  Eye,
  Building,
  BarChart3,
  Calendar,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { DeliveryChallanPrintModal } from './DeliveryChallanPrintModal';

interface DispatchDashboardViewProps {
  darkMode: boolean;
  onNavigateTab?: (tab: string, params?: any) => void;
  onSelectDispatch?: (id: string) => void;
}

export const DispatchDashboardView: React.FC<DispatchDashboardViewProps> = ({
  darkMode,
  onNavigateTab,
  onSelectDispatch
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printModalDispatch, setPrintModalDispatch] = useState<any>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dispatch/metrics');
      const json = await res.json();
      if (json.success) {
        setMetrics(json.data);
      } else {
        setError(json.error || 'Failed to load dispatch dashboard metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Dispatched':
      case 'In Transit':
      case 'Loaded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Dispatch & Logistics Overview
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time finished goods dispatches, transport tracking, delivery challans, and pending order fulfilment
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className={`p-2 rounded-lg border transition ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigateTab?.('dispatch_pending')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
              darkMode
                ? 'border-slate-700 bg-slate-800/80 text-amber-400 hover:bg-slate-700'
                : 'border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Orders ({metrics?.pendingOrdersCount || 0})</span>
          </button>
          <button
            onClick={() => onNavigateTab?.('dispatch_create')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Delivery Challan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchMetrics} className="underline font-semibold hover:text-rose-900">Retry</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Dispatches */}
        <div className={`p-4 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200/90'
        } shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Total Dispatches</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : (metrics?.totalDispatches || 0)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500">
            <span>Month: <strong>{metrics?.monthDispatchesCount || 0}</strong></span>
            <span>Total Wt: <strong>{Number(metrics?.totalWeightDispatched || 0).toFixed(0)} Kg</strong></span>
          </div>
        </div>

        {/* Total Quantity Dispatched */}
        <div className={`p-4 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200/90'
        } shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Total Dispatched Qty</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : `${Number(metrics?.totalQuantityDispatched || 0).toLocaleString()} Pcs`}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500">
            <span>Month Qty: <strong>{Number(metrics?.monthQuantityDispatched || 0).toLocaleString()}</strong></span>
            <span className="text-emerald-600 font-medium">Delivered: {metrics?.deliveredDispatches || 0}</span>
          </div>
        </div>

        {/* Today's Dispatches */}
        <div className={`p-4 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200/90'
        } shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Today's Dispatches</span>
            <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : (metrics?.todayDispatchesCount || 0)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500">
            <span>Today's Qty: <strong>{Number(metrics?.todayQuantityDispatched || 0).toLocaleString()} Pcs</strong></span>
            <span>Active: {metrics?.activeShipments || 0}</span>
          </div>
        </div>

        {/* Pending Orders & Quantity */}
        <div className={`p-4 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200/90'
        } shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Pending Delivery Orders</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? '...' : (metrics?.pendingOrdersCount || 0)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500">
            <span>Pending Qty: <strong>{Number(metrics?.pendingQuantityToDispatch || 0).toLocaleString()} Pcs</strong></span>
            <button
              onClick={() => onNavigateTab?.('dispatch_pending')}
              className="text-blue-600 hover:underline font-semibold"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row: Full vs Partial vs Closed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
          darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="text-xs text-slate-500">Full Deliveries</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {metrics?.fullyDispatchedCount || 0}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Completed in Single Delivery
          </span>
        </div>

        <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
          darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="text-xs text-slate-500">Partial Deliveries</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {metrics?.partiallyDispatchedCount || 0}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            Multiple Installments
          </span>
        </div>

        <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
          darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="text-xs text-slate-500">Closed Sales Orders</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {metrics?.closedOrdersCount || 0}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            Fulfilled or Short-Closed
          </span>
        </div>
      </div>

      {/* Breakdown Grids: By Customer & By Product */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Dispatches by Customer */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Top Dispatches by Customer
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">By Volume</span>
          </div>

          <div className="space-y-3">
            {metrics?.dispatchesByCustomer && metrics.dispatchesByCustomer.length > 0 ? (
              metrics.dispatchesByCustomer.map((c: any, idx: number) => {
                const maxQty = metrics.dispatchesByCustomer[0]?.totalQuantity || 1;
                const pct = Math.min(100, Math.round((c.totalQuantity / maxQty) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                        {idx + 1}. {c.name}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {c.totalQuantity.toLocaleString()} Pcs • {c.count} Dispatches
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No customer dispatch records recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Dispatches by Product */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-emerald-500" />
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Top Dispatches by Finished Good Product
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">By Quantity</span>
          </div>

          <div className="space-y-3">
            {metrics?.dispatchesByProduct && metrics.dispatchesByProduct.length > 0 ? (
              metrics.dispatchesByProduct.map((p: any, idx: number) => {
                const maxQty = metrics.dispatchesByProduct[0]?.totalQuantity || 1;
                const pct = Math.min(100, Math.round((p.totalQuantity / maxQty) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                        {idx + 1}. {p.name}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {p.totalQuantity.toLocaleString()} Pcs
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No product dispatch records recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Dispatches Table */}
      <div className={`rounded-xl border ${
        darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
      } shadow-xs overflow-hidden`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Recent Dispatches & Delivery Challans
            </h3>
            <p className="text-[11px] text-slate-500">Latest shipments processed with live PostgreSQL status</p>
          </div>
          <button
            onClick={() => onNavigateTab?.('dispatch_list')}
            className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <span>View All Dispatches</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                darkMode ? 'border-slate-700 text-slate-400 bg-slate-800/30' : 'border-slate-200 text-slate-500 bg-slate-50/50'
              }`}>
                <th className="py-3 px-4">Challan No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer & Order</th>
                <th className="py-3 px-4">Vehicle / Transporter</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {metrics?.recentDispatches && metrics.recentDispatches.length > 0 ? (
                metrics.recentDispatches.map((d: any) => (
                  <tr
                    key={d.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer`}
                    onClick={() => onSelectDispatch ? onSelectDispatch(d.id) : onNavigateTab?.('dispatch_view', { id: d.id })}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {d.challanNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {d.dispatchDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                        {d.customerName || d.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        SO: {d.soNumber || d.salesOrder?.soNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 uppercase">
                        {d.vehicleNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {d.transporterName || 'Direct'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {d.totalQuantity?.toLocaleString()} Pcs
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {d.totalBundles ? `${d.totalBundles} Bundles` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.deliveryType === 'Full Delivery'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {d.deliveryType || 'Full Delivery'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setPrintModalDispatch(d)}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          title="Print Delivery Challan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectDispatch ? onSelectDispatch(d.id) : onNavigateTab?.('dispatch_view', { id: d.id })}
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition"
                          title="View Dispatch Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {loading ? 'Loading dispatches from PostgreSQL...' : 'No dispatches recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Delivery Challan Modal */}
      {printModalDispatch && (
        <DeliveryChallanPrintModal
          dispatch={printModalDispatch}
          onClose={() => setPrintModalDispatch(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
