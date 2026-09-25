'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface DispatchEditPageProps {
  dispatchId: string;
  darkMode: boolean;
  onNavigateTab?: (tab: string, params?: any) => void;
  onSaved?: () => void;
}

export const DispatchEditPage: React.FC<DispatchEditPageProps> = ({
  dispatchId,
  darkMode,
  onNavigateTab,
  onSaved,
}) => {
  const [dispatch, setDispatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    transporterName: '',
    driverName: '',
    driverPhone: '',
    ewayBillNumber: '',
    lrNumber: '',
    lrDate: '',
    gatePassNumber: '',
    shippingAddress: '',
    deliveryTerm: 'Ex-Factory',
    remarks: '',
  });

  useEffect(() => {
    const fetchDispatch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dispatch/${dispatchId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setDispatch(d);
          setFormData({
            vehicleNumber: d.vehicleNumber || '',
            transporterName: d.transporterName || '',
            driverName: d.driverName || '',
            driverPhone: d.driverPhone || '',
            ewayBillNumber: d.ewayBillNumber || '',
            lrNumber: d.lrNumber || '',
            lrDate: d.lrDate || '',
            gatePassNumber: d.gatePassNumber || '',
            shippingAddress: d.shippingAddress || '',
            deliveryTerm: d.deliveryTerm || 'Ex-Factory',
            remarks: d.remarks || '',
          });
        } else {
          setError(json.error || 'Failed to load dispatch details');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading dispatch');
      } finally {
        setLoading(false);
      }
    };

    if (dispatchId) fetchDispatch();
  }, [dispatchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber.trim()) {
      setError('Vehicle Number is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/dispatch/${dispatchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        if (onSaved) onSaved();
        else onNavigateTab?.('dispatch_view', { id: dispatchId });
      } else {
        setError(json.error || 'Failed to update transport details');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating dispatch');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
        <p>Loading dispatch record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigateTab?.('dispatch_view', { id: dispatchId })}
          className={`flex items-center space-x-2 text-xs font-semibold ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          } transition`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challan Details</span>
        </button>
        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
          Challan #{dispatch?.challanNumber}
        </span>
      </div>

      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Edit Transport & Logistics
        </h1>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Update vehicle, driver, bilty / LR, and regulatory e-way bill details for this delivery challan.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'
        } shadow-xs space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono uppercase font-semibold ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Transporter Name
              </label>
              <input
                type="text"
                value={formData.transporterName}
                onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Driver Phone No
              </label>
              <input
                type="text"
                value={formData.driverPhone}
                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                E-Way Bill Number
              </label>
              <input
                type="text"
                value={formData.ewayBillNumber}
                onChange={(e) => setFormData({ ...formData, ewayBillNumber: e.target.value })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                L.R. / Bilty Number
              </label>
              <input
                type="text"
                value={formData.lrNumber}
                onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Delivery Terms
              </label>
              <select
                value={formData.deliveryTerm}
                onChange={(e) => setFormData({ ...formData, deliveryTerm: e.target.value })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Ex-Factory">Ex-Factory</option>
                <option value="Door Delivery">Door Delivery (FOR Destination)</option>
                <option value="FOB Port">FOB Port</option>
                <option value="CIF">CIF (Cost, Insurance & Freight)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gate Pass Number
              </label>
              <input
                type="text"
                value={formData.gatePassNumber}
                onChange={(e) => setFormData({ ...formData, gatePassNumber: e.target.value })}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none font-mono ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Shipping / Destination Address
            </label>
            <input
              type="text"
              value={formData.shippingAddress}
              onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
              className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Remarks
            </label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className={`w-full p-2.5 text-xs rounded-lg border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => onNavigateTab?.('dispatch_view', { id: dispatchId })}
            className="px-4 py-2 text-xs font-medium border rounded-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Transport Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
