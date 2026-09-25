'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ShoppingBag,
  FileText,
  Truck
} from 'lucide-react';

interface SalesOrderEditWorkspacePageProps {
  darkMode: boolean;
  orderId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const SalesOrderEditWorkspacePage: React.FC<SalesOrderEditWorkspacePageProps> = ({
  darkMode,
  orderId,
  onBack,
  onSuccess
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    customerName: '',
    customerPoNumber: '',
    productName: '',
    quantity: 1000,
    unitPrice: 0,
    totalValue: 0,
    deliveryDate: '',
    status: 'Confirmed',
    paymentTerms: '30 Days Net from Delivery',
    warehouseId: 'Finished Goods Warehouse - Unit 1',
    remarks: ''
  });

  const [isInProduction, setIsInProduction] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/sales/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const o = data.data;
          setForm({
            customerName: o.customerName || '',
            customerPoNumber: o.customerPoNumber || '',
            productName: o.productName || '',
            quantity: o.quantity || 1000,
            unitPrice: o.unitPrice || (o.totalValue && o.quantity ? Number((o.totalValue / o.quantity).toFixed(2)) : 0),
            totalValue: o.totalValue || 0,
            deliveryDate: o.deliveryDate || '',
            status: o.status || 'Confirmed',
            paymentTerms: o.paymentTerms || '30 Days Net from Delivery',
            warehouseId: o.warehouseId || 'Finished Goods Warehouse - Unit 1',
            remarks: o.remarks || ''
          });
          if (o.status === 'In Production' || o.status === 'Partially Delivered' || o.status === 'Dispatched') {
            setIsInProduction(true);
          }
        } else {
          setError(data.error || 'Failed to load order');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading sales order');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/sales/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Sales Order updated successfully!');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/sales/sales-orders/${orderId}`);
          }
        }, 600);
      } else {
        setError(data.error || 'Failed to update order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400">Loading Sales Order Form...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-20 max-w-5xl mx-auto ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-semibold ${
              darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <div className={`hidden sm:flex items-center space-x-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            <span>Sales & Dispatch</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="cursor-pointer hover:underline" onClick={() => router.push(`/sales/sales-orders/${orderId}`)}>Order View</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-emerald-500">Edit Sales Order</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving Changes...' : 'Save Order Details'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isInProduction && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Notice: This order is already In Production or Dispatched. Core technical specifications and order quantities are locked to maintain planning integrity.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Customer Name / Account
              </label>
              <input
                type="text"
                disabled={isInProduction}
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                } ${isInProduction ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Customer Purchase Order # (PO)
              </label>
              <input
                type="text"
                value={form.customerPoNumber}
                onChange={e => setForm({ ...form, customerPoNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. PO-APEX-2026-99"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Product Specification / Title
              </label>
              <input
                type="text"
                disabled={isInProduction}
                value={form.productName}
                onChange={e => setForm({ ...form, productName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                } ${isInProduction ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Order Quantity (Units)
              </label>
              <input
                type="number"
                disabled={isInProduction}
                value={form.quantity}
                onChange={e => {
                  const q = Number(e.target.value) || 0;
                  setForm({ ...form, quantity: q, totalValue: Number((q * form.unitPrice).toFixed(2)) });
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                } ${isInProduction ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Unit Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                disabled={isInProduction}
                value={form.unitPrice}
                onChange={e => {
                  const p = Number(e.target.value) || 0;
                  setForm({ ...form, unitPrice: p, totalValue: Number((p * form.quantity).toFixed(2)) });
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                } ${isInProduction ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Total Deal Value Excl. GST (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.totalValue}
                onChange={e => setForm({ ...form, totalValue: Number(e.target.value) || 0 })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold text-emerald-500 outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Promised Delivery Date
              </label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={e => setForm({ ...form, deliveryDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Released to Production">Released to Production</option>
                <option value="In Production">In Production</option>
                <option value="QC Pending">QC Pending</option>
                <option value="QC Approved">QC Approved</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
                <option value="Partially Delivered">Partially Delivered</option>
                <option value="Fully Delivered">Fully Delivered</option>
                <option value="Partially Delivered & Closed">Partially Delivered & Closed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Payment Terms
              </label>
              <input
                type="text"
                value={form.paymentTerms}
                onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Dispatch / Production Remarks
              </label>
              <textarea
                rows={2}
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onBack}
            className={`px-5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Sales Order'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
