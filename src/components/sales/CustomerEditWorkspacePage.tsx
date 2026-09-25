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
  User,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';

interface CustomerEditWorkspacePageProps {
  darkMode: boolean;
  customerId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const CustomerEditWorkspacePage: React.FC<CustomerEditWorkspacePageProps> = ({
  darkMode,
  customerId,
  onBack,
  onSuccess
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    pan: '',
    salesExecutive: 'Rajesh Sharma',
    creditDays: 30,
    creditLimit: 500000,
    paymentTerms: '30 Days Net from Delivery'
  });

  useEffect(() => {
    async function loadCustomer() {
      if (!customerId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/sales/customers/${customerId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const c = data.data;
          setForm({
            code: c.code || '',
            name: c.name || '',
            contactPerson: c.contactPerson || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            gstin: c.gstin || '',
            pan: c.pan || '',
            salesExecutive: c.salesExecutive || 'Rajesh Sharma',
            creditDays: c.creditDays || 30,
            creditLimit: c.creditLimit || 500000,
            paymentTerms: c.paymentTerms || '30 Days Net from Delivery'
          });
        } else {
          setError(data.error || 'Failed to load customer');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading customer details');
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Customer name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/sales/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Customer profile updated successfully!');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/sales/customers/${customerId}`);
          }
        }, 600);
      } else {
        setError(data.error || 'Failed to update customer');
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
        <p className="text-sm font-semibold text-slate-400">Loading Customer Form...</p>
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
            <span>Sales & CRM</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="cursor-pointer hover:underline" onClick={() => router.push(`/sales/customers/${customerId}`)}>Customer Profile</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-emerald-500">Edit Customer Account</span>
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
            <span>{saving ? 'Saving Changes...' : 'Save Customer Details'}</span>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Customer Code
              </label>
              <input
                type="text"
                disabled
                value={form.code}
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold opacity-60 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Company / Account Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Primary Contact Person
              </label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Phone / Mobile
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Assigned Sales Executive
              </label>
              <input
                type="text"
                value={form.salesExecutive}
                onChange={e => setForm({ ...form, salesExecutive: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                GSTIN
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={e => setForm({ ...form, gstin: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                PAN
              </label>
              <input
                type="text"
                value={form.pan}
                onChange={e => setForm({ ...form, pan: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Credit Period (Days)
              </label>
              <input
                type="number"
                value={form.creditDays}
                onChange={e => setForm({ ...form, creditDays: Number(e.target.value) || 0 })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Approved Credit Limit (₹)
              </label>
              <input
                type="number"
                value={form.creditLimit}
                onChange={e => setForm({ ...form, creditLimit: Number(e.target.value) || 0 })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Factory / Delivery Address
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
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
            <span>{saving ? 'Saving...' : 'Save Customer Account'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
