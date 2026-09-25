import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Wrench,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Activity,
  Filter,
} from 'lucide-react';
import { Machine } from '../../types';

interface MachineManagementViewProps {
  darkMode: boolean;
}

export const MachineManagementView: React.FC<MachineManagementViewProps> = ({ darkMode }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [lineFilter, setLineFilter] = useState('All');

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (lineFilter !== 'All') params.append('line', lineFilter);

      const res = await fetch(`/api/production/machines?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMachines(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [statusFilter, lineFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/production/machines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMachines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Manufacturing Machines & Plant Floor Workstations
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Live machine operational health, hourly rated capacities, maintenance scheduling, and downtime states
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMachines}
          className={`p-2 rounded-lg border transition-colors self-start sm:self-auto ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Refresh Machine Statuses"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter bar */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs border outline-none cursor-pointer ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Running">Running</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Breakdown">Breakdown</option>
            <option value="Idle">Idle</option>
          </select>

          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs border outline-none cursor-pointer ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Lines</option>
            <option value="Corrugator Line 1">Corrugator Line 1</option>
            <option value="Corrugator Line 2">Corrugator Line 2</option>
            <option value="Converting Line A">Converting Line A</option>
            <option value="Converting Line B">Converting Line B</option>
            <option value="Finishing Line 1">Finishing Line 1</option>
          </select>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading Machines & Lines...
          </div>
        ) : machines.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No machines found matching filters.
          </div>
        ) : (
          machines.map((m) => {
            const isRunning = m.status === 'Running';
            const isMaintenance = m.status === 'Maintenance' || m.status === 'Breakdown';

            return (
              <div
                key={m.id}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                  isRunning
                    ? darkMode
                      ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm'
                      : 'bg-white border-emerald-500/40 shadow-sm'
                    : isMaintenance
                    ? darkMode
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : 'bg-rose-50/40 border-rose-200'
                    : darkMode
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {m.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isRunning
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isMaintenance
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {m.line} • {m.type}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Rated Capacity</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {m.capacityPerHour.toLocaleString()} {m.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Assigned Operator</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                        {m.operator || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                    <div>Last Serviced: {m.lastMaintenanceDate || 'Recent Inspection'}</div>
                    <div>Next Due: {m.nextMaintenanceDate || 'In 30 Days'}</div>
                  </div>
                </div>

                {/* State Control Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(m.id, 'Running')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                      m.status === 'Running'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Running
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(m.id, 'Available')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                      m.status === 'Available'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(m.id, 'Maintenance')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                      m.status === 'Maintenance'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Service
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(m.id, 'Breakdown')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                      m.status === 'Breakdown'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Fault
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
