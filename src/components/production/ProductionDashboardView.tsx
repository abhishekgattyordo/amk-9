import React from 'react';
import {
  Boxes,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Play,
  Calendar,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  Activity,
  Zap,
  RotateCcw,
  Check,
} from 'lucide-react';

interface DashboardMetrics {
  summary: {
    totalWorkOrders: number;
    inProductionWOs: number;
    plannedWOs: number;
    completedWOs: number;
    totalOrdered: number;
    totalProduced: number;
    todayScrapKg: number;
    qcPassRate: number;
    machineUtilizationRate: number;
    runningMachines: number;
    availableMachines: number;
    maintenanceMachines: number;
    totalMachines: number;
  };
  stageDistribution: Record<string, number>;
  recentWorkOrders: any[];
  activePlans: any[];
  machines: any[];
}

interface ProductionDashboardViewProps {
  darkMode: boolean;
  metrics: DashboardMetrics | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: any, subPage?: string, selectedId?: string) => void;
}

export const ProductionDashboardView: React.FC<ProductionDashboardViewProps> = ({
  darkMode,
  metrics,
  loading,
  onRefresh,
  onNavigateTab,
}) => {
  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading production metrics...</p>
      </div>
    );
  }

  const s = metrics?.summary || {
    totalWorkOrders: 0,
    inProductionWOs: 0,
    plannedWOs: 0,
    completedWOs: 0,
    totalOrdered: 0,
    totalProduced: 0,
    todayScrapKg: 0,
    qcPassRate: 100,
    machineUtilizationRate: 0,
    runningMachines: 0,
    availableMachines: 0,
    maintenanceMachines: 0,
    totalMachines: 0,
  };

  const stageDist = metrics?.stageDistribution || {};

  const stages = [
    { key: 'Planning', label: '1. Planning', count: stageDist['Planning'] || stageDist?.Planning || 0, color: 'text-amber-500' },
    { key: 'Corrugation', label: '2. Corrugation', count: stageDist['Corrugation'] || stageDist?.Corrugation || 0, color: 'text-blue-500' },
    { key: 'Printing', label: '3. Printing & Slotting', count: stageDist['Printing'] || stageDist?.Printing || 0, color: 'text-indigo-500' },
    { key: 'Die-Cutting', label: '4. Die-Cut & Pasting', count: stageDist['Die-Cutting'] || stageDist?.['Die-Cutting'] || 0, color: 'text-purple-500' },
    { key: 'Stitching', label: '5. Stitching & Bundling', count: stageDist['Stitching'] || stageDist?.Stitching || 0, color: 'text-teal-500' },
    { key: 'QC', label: '6. QC Inspection', count: stageDist['QC'] || stageDist?.QC || 0, color: 'text-emerald-500' },
  ];

  const totalOrdered = s.totalOrdered || 0;
  const totalProduced = s.totalProduced || 0;
  const completionPercent = totalOrdered > 0 ? Math.min(100, Math.round((totalProduced / totalOrdered) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Production & Corrugation Plant Overview
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time shop floor execution, line capacity, quality control and active work orders
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Refresh Metrics"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('bom', 'bom_new')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>New BOM</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('work_orders', 'wo_new')}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Work Orders */}
        <div
          onClick={() => onNavigateTab('work_orders')}
          className={`cursor-pointer rounded-xl p-4.5 border transition-all hover:shadow-md ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {s.inProductionWOs} In Floor
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {s.totalWorkOrders}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Total Work Orders ({s.plannedWOs} Planned, {s.completedWOs} Completed)
          </div>
        </div>

        {/* Card 2: Plant Output */}
        <div
          onClick={() => onNavigateTab('floor')}
          className={`cursor-pointer rounded-xl p-4.5 border transition-all hover:shadow-md ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {completionPercent}% Output
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {s.totalProduced.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">Pcs</span>
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Target: {s.totalOrdered.toLocaleString()} Pcs across orders
          </div>
        </div>

        {/* Card 3: Machine Utilization */}
        <div
          onClick={() => onNavigateTab('machines')}
          className={`cursor-pointer rounded-xl p-4.5 border transition-all hover:shadow-md ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {s.runningMachines}/{s.totalMachines} Running
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {s.machineUtilizationRate}%
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Machine Utilization ({s.maintenanceMachines} in Maintenance)
          </div>
        </div>

        {/* Card 4: Quality & Scrap */}
        <div
          onClick={() => onNavigateTab('qc')}
          className={`cursor-pointer rounded-xl p-4.5 border transition-all hover:shadow-md ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
              {s.todayScrapKg} kg Scrap Today
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {s.qcPassRate}%
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Quality Inspection Pass Rate
          </div>
        </div>
      </div>

      {/* Production Pipeline Funnel */}
      <div
        className={`rounded-xl p-5 border ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Corrugated Manufacturing Stage Pipeline
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Flow of active work orders across production workstations
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('floor')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center space-x-1"
          >
            <span>Floor Execution Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((st, idx) => (
            <div
              key={st.key}
              onClick={() => onNavigateTab('floor', undefined, st.key)}
              className={`cursor-pointer rounded-lg p-3 border text-center transition-all hover:scale-[1.02] ${
                darkMode ? 'bg-slate-850/60 border-slate-700/80 hover:bg-slate-750' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <span className={`text-[11px] font-bold block truncate ${st.color}`}>
                {st.label}
              </span>
              <div className="text-xl font-extrabold mt-1.5 text-slate-900 dark:text-white">
                {st.count}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Orders in Queue</span>
            </div>
          ))}
        </div>
      </div>

      {/* Machine Floor Status Strip */}
      <div
        className={`rounded-xl p-5 border ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Shop Floor Machines & Line Status
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('machines')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center space-x-1"
          >
            <span>View All Lines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(metrics?.machines || []).map((m: any) => {
            const isRunning = m.status === 'Running';
            const isMaintenance = m.status === 'Maintenance' || m.status === 'Breakdown';
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  darkMode ? 'bg-slate-850/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-emerald-500 animate-pulse' : isMaintenance ? 'bg-rose-500' : 'bg-amber-400'
                      }`}
                    />
                    <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {m.code}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-0.5">
                    {m.name}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {m.line} • {m.capacityPerHour} {m.unit}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isRunning
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : isMaintenance
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {m.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Active Work Orders & Today's Shift Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Work Orders */}
        <div
          className={`lg:col-span-2 rounded-xl p-5 border ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Active Work Orders in Execution
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Orders moving through corrugation, printing, and converting
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('work_orders')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(metrics?.recentWorkOrders || []).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No active work orders found.</div>
            ) : (
              (metrics?.recentWorkOrders || []).map((wo: any) => {
                const progress = wo.orderedQuantity > 0 ? Math.min(100, Math.round((wo.producedQuantity / wo.orderedQuantity) * 100)) : 0;
                return (
                  <div
                    key={wo.id}
                    onClick={() => onNavigateTab('work_orders', 'wo_view', wo.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all hover:border-emerald-500/50 ${
                      darkMode ? 'bg-slate-850/40 border-slate-700/60 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {wo.orderNumber}
                        </span>
                        {wo.priority === 'Urgent' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Urgent
                          </span>
                        )}
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {wo.product?.name} ({wo.product?.code})
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          wo.status === 'In Production'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : wo.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Stage: <strong className="text-slate-700 dark:text-slate-200">{wo.currentStage}</strong>
                      </span>
                      <span>
                        {wo.producedQuantity.toLocaleString()} / {wo.orderedQuantity.toLocaleString()} Pcs ({progress}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Shift Schedule / Plans */}
        <div
          className={`rounded-xl p-5 border ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Today's Production Plans
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Shift targets & scheduling
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('planning')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Plan Details
            </button>
          </div>

          <div className="space-y-3">
            {(metrics?.activePlans || []).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No shift plans scheduled today.</div>
            ) : (
              (metrics?.activePlans || []).map((pl: any) => (
                <div
                  key={pl.id}
                  className={`p-3 rounded-lg border ${
                    darkMode ? 'bg-slate-850/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {pl.shift}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {pl.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                    {pl.line}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>Target: {pl.targetQuantity.toLocaleString()} Pcs</span>
                    <span>Supervisor: {pl.supervisor || 'Shift Lead'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
