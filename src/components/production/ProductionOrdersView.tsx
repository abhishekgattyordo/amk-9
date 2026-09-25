import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  ArrowRight,
  Eye,
  PackageCheck,
  RefreshCw,
  Box,
  Truck,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { Product, Warehouse } from '../../types';
import { CreateProductionOrderView } from './CreateProductionOrderView';

interface ProductionOrdersViewProps {
  darkMode: boolean;
  onSelectOrder: (id: string) => void;
  onCreateNew?: () => void;
  products?: Product[];
  warehouses?: Warehouse[];
}

export const ProductionOrdersView: React.FC<ProductionOrdersViewProps> = ({
  darkMode,
  onSelectOrder,
  onCreateNew,
  products = [],
  warehouses = [],
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/production/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data?.productionOrders || data.data || []);
      }
    } catch (err) {
      console.error('Error fetching production orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete Production Order "${orderNumber}"? It will be moved to the Recycle Bin.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/production/orders/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.error || 'Failed to delete production order');
      }
    } catch (err: any) {
      console.error('Error deleting production order:', err);
      alert(err.message || 'Error deleting production order');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, dateFilter]);

  const handleOpenCreate = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      setViewMode('create');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'QC Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'In Production':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 animate-pulse';
      case 'Material Allocated':
      case 'Material Issued':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'QC Pending':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // Dedicated Separate Page for Creating Production Order
  if (viewMode === 'create') {
    return (
      <CreateProductionOrderView
        darkMode={darkMode}
        products={products}
        warehouses={warehouses}
        onBack={() => setViewMode('list')}
        onSuccess={(newOrderId) => {
          setViewMode('list');
          fetchOrders();
          if (newOrderId) {
            onSelectOrder(newOrderId);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Production Orders & Shop-Floor Tracking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sequential process execution, live WIP stations, material indents, and stage-by-stage QC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Production Order</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, product, or SO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border outline-hidden transition-all ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Planned">Planned</option>
            <option value="Material Allocated">Material Allocated</option>
            <option value="In Production">In Production</option>
            <option value="QC Pending">QC Pending</option>
            <option value="Completed">Completed</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-xs ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading production orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Production Orders Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Initialize a production order from an approved Work Order to start tracking floor WIP.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Create Production Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                  darkMode ? 'border-slate-800 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <th className="py-3 px-4">Order # & Date</th>
                  <th className="py-3 px-4">Product & Sales Order</th>
                  <th className="py-3 px-4">Work Order</th>
                  <th className="py-3 px-4 text-center">Batch WIP Progress</th>
                  <th className="py-3 px-4 text-right">Output (FG)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {orders.map((order) => {
                  const progress = order.plannedQuantity > 0 
                    ? Math.round(((order.completedQuantity || 0) / order.plannedQuantity) * 100)
                    : 0;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      className={`cursor-pointer transition-colors ${
                        darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.productionDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {order.product?.name || order.productName || 'Corrugated Box'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          {order.salesOrder?.soNumber ? (
                            <span className="text-blue-600 dark:text-blue-400 font-mono">
                              SO: {order.salesOrder.soNumber}
                            </span>
                          ) : (
                            <span>Stock Run</span>
                          )}
                          {order.product?.sku && (
                            <span>• SKU: {order.product.sku}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {order.workOrder?.orderNumber || 'WO-Link'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-full max-w-[140px] mx-auto space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>WIP Steps</span>
                            <span className="font-semibold">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progress >= 100
                                  ? 'bg-emerald-500'
                                  : progress >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {(order.completedQuantity || 0).toLocaleString()}
                        </span>
                        <span className="text-slate-400"> / {order.plannedQuantity.toLocaleString()}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrder(order.id);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Track & Manage</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order.id, order.orderNumber || order.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors cursor-pointer"
                            title="Delete Production Order (Move to Recycle Bin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
