import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Play,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { WorkOrder } from '../../types';

interface WorkOrderListViewProps {
  darkMode: boolean;
  workOrders: WorkOrder[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (v: string) => void;
  onViewWorkOrder: (id: string) => void;
  onEditWorkOrder: (id: string) => void;
  onDeleteWorkOrder?: (id: string) => void;
  onReleaseWorkOrder: (id: string) => void;
  onCreateNew: () => void;
}

export const WorkOrderListView: React.FC<WorkOrderListViewProps> = ({
  darkMode,
  workOrders,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onViewWorkOrder,
  onEditWorkOrder,
  onDeleteWorkOrder,
  onReleaseWorkOrder,
  onCreateNew,
}) => {
  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Manufacturing Work Orders
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Production routing, stage-by-stage scheduling, and batch completion tracking
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* Filter bar */}
      <div
        className={`p-3 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search WO #, product, customer, SO #..."
            className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-xs border outline-none transition-colors ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none cursor-pointer ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Planned">Planned</option>
              <option value="In Production">In Production</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border outline-none cursor-pointer ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b ${
                darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-3 px-4 font-semibold">WO Number</th>
                <th className="py-3 px-4 font-semibold">Product & Dimensions</th>
                <th className="py-3 px-4 font-semibold">Sales Order Link</th>
                <th className="py-3 px-4 font-semibold">Current Stage</th>
                <th className="py-3 px-4 font-semibold">Progress / Quantity</th>
                <th className="py-3 px-4 font-semibold">Target Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading Work Orders...
                  </td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No work orders found matching filters.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                  const progress =
                    wo.orderedQuantity > 0
                      ? Math.min(100, Math.round((wo.producedQuantity / wo.orderedQuantity) * 100))
                      : 0;

                  return (
                    <tr
                      key={wo.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onViewWorkOrder(wo.id)}
                          className="font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline"
                        >
                          {wo.orderNumber}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              wo.priority === 'Urgent'
                                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                : wo.priority === 'High'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-500'
                            }`}
                          >
                            {wo.priority}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {wo.assignedLine || 'Line 1'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {wo.product?.name || 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {wo.product?.code} • {wo.product?.dimensions || 'Std'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {wo.salesOrder ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {wo.salesOrder.soNumber}
                            </span>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {wo.salesOrder.customerName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct Make-to-Stock</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {wo.currentStage}
                        </span>
                      </td>

                      <td className="py-3 px-4 w-44">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {wo.producedQuantity.toLocaleString()} / {wo.orderedQuantity.toLocaleString()}
                          </span>
                          <span className="text-slate-400 font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {wo.targetDate ? (
                          <div>
                            <div>{wo.targetDate}</div>
                            <div className="text-[10px] text-slate-400">
                              Start: {wo.startDate || 'Immediate'}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            wo.status === 'In Production'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : wo.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : wo.status === 'Planned'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          {wo.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {(wo.status === 'Draft' || wo.status === 'Planned') && (
                            <button
                              type="button"
                              onClick={() => onReleaseWorkOrder(wo.id)}
                              className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold flex items-center space-x-1 transition-colors"
                              title="Release to Production Floor"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Release</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewWorkOrder(wo.id)}
                            className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                              darkMode ? 'text-slate-300' : 'text-slate-600'
                            }`}
                            title="View Work Order"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditWorkOrder(wo.id)}
                            className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                              darkMode ? 'text-slate-300' : 'text-slate-600'
                            }`}
                            title="Edit Work Order"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                          {onDeleteWorkOrder && (
                            <button
                              type="button"
                              onClick={() => onDeleteWorkOrder(wo.id)}
                              className={`p-1.5 rounded hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer`}
                              title="Delete Work Order (Move to Recycle Bin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
