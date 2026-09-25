import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  X,
  Layers,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Box,
  FileCheck,
} from 'lucide-react';
import { ProductionPlan } from '../../types';
import { ScheduleProductionPlanView } from './ScheduleProductionPlanView';

interface PlanningSchedulingViewProps {
  darkMode: boolean;
  onNavigateToProductionOrder?: (id?: string) => void;
}

export const PlanningSchedulingView: React.FC<PlanningSchedulingViewProps> = ({
  darkMode,
  onNavigateToProductionOrder,
}) => {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftFilter, setShiftFilter] = useState('All');
  const [lineFilter, setLineFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append('planDate', selectedDate);
      if (shiftFilter !== 'All') params.append('shift', shiftFilter);
      if (lineFilter !== 'All') params.append('line', lineFilter);

      const res = await fetch(`/api/production/plans?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPlans(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [selectedDate, shiftFilter, lineFilter]);

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to remove this production schedule plan?')) return;
    try {
      const res = await fetch(`/api/production/plans?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/production/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  // Convert Plan into Floor Production Order
  const handleGenerateProductionOrder = async (plan: any) => {
    if (!plan.workOrderId || !plan.productId) {
      alert('This plan is not directly linked to a Work Order. Please create a Production Order manually.');
      return;
    }

    try {
      const res = await fetch('/api/production/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionPlanId: plan.id,
          workOrderId: plan.workOrderId,
          salesOrderId: plan.salesOrderId,
          productId: plan.productId,
          plannedQuantity: plan.targetQuantity,
          productionDate: plan.planDate,
          supervisor: plan.supervisor,
          processNames: plan.processes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate Production Order');

      alert(`Production Order ${data.data?.orderNumber || ''} created on floor!`);
      if (onNavigateToProductionOrder) {
        onNavigateToProductionOrder(data.data?.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error generating production order');
    }
  };

  // Full-page separate screen for scheduling production plan
  if (viewMode === 'create') {
    return (
      <ScheduleProductionPlanView
        darkMode={darkMode}
        onBack={() => setViewMode('list')}
        onSuccess={() => {
          setViewMode('list');
          fetchPlans();
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
            Shift Scheduling & Line Target Planning
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sales Order breakdown, remaining quantity validation, 3-shift line scheduling, and supervisor assignment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPlans}
            className={`p-2 rounded-lg border text-xs font-semibold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('create')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Production Plan</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-blue-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border outline-hidden ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Show All
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Shift:</span>
          </div>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="All">All Shifts</option>
            <option value="Shift A (Day)">Shift A (Day)</option>
            <option value="Shift B (Evening)">Shift B (Evening)</option>
            <option value="Shift C (Night)">Shift C (Night)</option>
          </select>

          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border outline-hidden ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="All">All Lines</option>
            <option value="Corrugator Line 1 (5-Ply)">Corrugator Line 1 (5-Ply)</option>
            <option value="Corrugator Line 2 (3-Ply)">Corrugator Line 2 (3-Ply)</option>
            <option value="Converting Line A">Converting Line A</option>
            <option value="Converting Line B">Converting Line B</option>
          </select>
        </div>
      </div>

      {/* Plan Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading production plans...</div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
          <Box className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Production Plans Scheduled</p>
          <p className="text-xs text-slate-500 mt-1">Select a date or schedule a shift plan for your manufacturing lines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan: any) => {
            const achievement = plan.targetQuantity > 0 ? Math.round(((plan.actualQuantity || 0) / plan.targetQuantity) * 100) : 0;

            return (
              <div
                key={plan.id}
                className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {plan.planDate} • {plan.shift}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {plan.line}
                    </h3>
                  </div>

                  <select
                    value={plan.status}
                    onChange={(e) => handleUpdateStatus(plan.id, e.target.value)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border outline-hidden ${
                      plan.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : plan.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                {/* Target vs Actual Progress */}
                <div className="py-3 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Target vs Actual:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(plan.actualQuantity || 0).toLocaleString()} / {plan.targetQuantity.toLocaleString()} units
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        achievement >= 100
                          ? 'bg-emerald-500'
                          : achievement >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, achievement)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Supervisor: <strong className="text-slate-700 dark:text-slate-300">{plan.supervisor || 'N/A'}</strong></span>
                    <span className="font-semibold">{achievement}% achieved</span>
                  </div>
                </div>

                {/* Processes Chips */}
                {plan.processes && plan.processes.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 mb-1">STAGES SCHEDULED:</div>
                    <div className="flex flex-wrap gap-1">
                      {plan.processes.map((proc: string) => (
                        <span
                          key={proc}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {proc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateProductionOrder(plan)}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Create Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
