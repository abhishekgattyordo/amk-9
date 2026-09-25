'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Building2,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Receipt,
  FileText
} from 'lucide-react';

interface QuotationEditWorkspacePageProps {
  darkMode: boolean;
  quotationId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const QuotationEditWorkspacePage: React.FC<QuotationEditWorkspacePageProps> = ({
  darkMode,
  quotationId,
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
    productName: '',
    amount: 0,
    unitPrice: 0,
    quantity: 1000,
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    salesExecutive: 'Rajesh Sharma',
    costingSummary: '',
    paymentTerms: '30 Days Net from Delivery',
    freightTerms: 'Ex-Factory / Transport extra at actuals',
    deliveryLeadTime: '7 - 10 working days from PO & Artwork approval',
    status: 'Draft',
    remarks: ''
  });

  useEffect(() => {
    async function loadQuotation() {
      if (!quotationId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/sales/quotations/${quotationId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const q = data.data;
          const parsedTerms = q.terms ? (typeof q.terms === 'string' ? JSON.parse(q.terms) : q.terms) : {};
          setForm({
            customerName: q.customerName || '',
            productName: q.productName || '',
            amount: q.amount || 0,
            unitPrice: q.unitPrice || (q.amount && q.quantity ? Number((q.amount / q.quantity).toFixed(2)) : 0),
            quantity: q.quantity || 1000,
            quotationDate: q.quotationDate || new Date().toISOString().split('T')[0],
            validUntil: q.validUntil || '',
            salesExecutive: q.salesExecutive || 'Rajesh Sharma',
            costingSummary: q.costingSummary || '',
            paymentTerms: parsedTerms.paymentTerms || '30 Days Net from Delivery',
            freightTerms: parsedTerms.freightTerms || 'Ex-Factory / Transport extra at actuals',
            deliveryLeadTime: parsedTerms.deliveryLeadTime || '7 - 10 working days from PO & Artwork approval',
            status: q.status || 'Draft',
            remarks: q.remarks || ''
          });
        } else {
          setError(data.error || 'Failed to load quotation');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading quotation details');
      } finally {
        setLoading(false);
      }
    }
    loadQuotation();
  }, [quotationId]);

  // Recalculate total amount when unitPrice or quantity change
  const handleUnitPriceChange = (price: number) => {
    setForm(prev => ({
      ...prev,
      unitPrice: price,
      amount: Number((price * prev.quantity).toFixed(2))
    }));
  };

  const handleQuantityChange = (qty: number) => {
    setForm(prev => ({
      ...prev,
      quantity: qty,
      amount: Number((prev.unitPrice * qty).toFixed(2))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.productName.trim() || form.amount <= 0) {
      setError('Customer name, product name, and valid amount are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        terms: {
          paymentTerms: form.paymentTerms,
          freightTerms: form.freightTerms,
          deliveryLeadTime: form.deliveryLeadTime
        }
      };

      const res = await fetch(`/api/sales/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Commercial Quotation details updated successfully!');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/sales/quotations/${quotationId}`);
          }
        }, 600);
      } else {
        setError(data.error || 'Failed to update quotation');
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
        <p className="text-sm font-semibold text-slate-400">Loading Quotation Edit Form...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-20 max-w-6xl mx-auto ${darkMode ? 'text-white' : 'text-slate-900'}`}>
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
            <span>Sales & Commercials</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="cursor-pointer hover:underline" onClick={() => router.push(`/sales/quotations/${quotationId}`)}>Quotation View</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-emerald-500">Edit Commercial Quotation</span>
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
            <span>{saving ? 'Saving Changes...' : 'Save Quotation Details'}</span>
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
        {/* Core Proposal Header Section */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">1. Proposal Identification & Header</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customer account, product description, and proposal dates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Customer Name / Account *
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
                placeholder="e.g. Apex Packaging Industries"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Product Title / Packaging Description *
              </label>
              <input
                type="text"
                value={form.productName}
                onChange={e => setForm({ ...form, productName: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
                placeholder="e.g. 5-Ply Printed Corrugated Box (450x300x250mm)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Quotation Date
              </label>
              <input
                type="date"
                value={form.quotationDate}
                onChange={e => setForm({ ...form, quotationDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Offer Valid Until
              </label>
              <input
                type="date"
                value={form.validUntil}
                onChange={e => setForm({ ...form, validUntil: e.target.value })}
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
          </div>
        </div>

        {/* Pricing & Commercial Calculations */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">2. Pricing, Order Quantities & Calculation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Unit rate per box, batch quantity, and calculated total deal value</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Order Quantity (Units) *
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => handleQuantityChange(Number(e.target.value) || 0)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Unit Selling Price per Box (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unitPrice}
                onChange={e => handleUnitPriceChange(Number(e.target.value) || 0)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Total Quotation Value Excl. GST (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all text-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Costing Breakdown & Technical Surcharge Notes
              </label>
              <textarea
                rows={2}
                value={form.costingSummary}
                onChange={e => setForm({ ...form, costingSummary: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. Paper raw material ₹28.50, Conversion & Glue ₹6.20, Printing stereos ₹1.80, Profit margin 15%"
              />
            </div>
          </div>
        </div>

        {/* Commercial Terms & Conditions */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">3. Terms of Delivery, Payment & Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Commercial payment credit, freight terms, and workflow stage</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="e.g. 30 Days Net from Delivery"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Freight & Delivery Terms
              </label>
              <input
                type="text"
                value={form.freightTerms}
                onChange={e => setForm({ ...form, freightTerms: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. Ex-Factory / Door Delivery"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Delivery Lead Time
              </label>
              <input
                type="text"
                value={form.deliveryLeadTime}
                onChange={e => setForm({ ...form, deliveryLeadTime: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. 7 - 10 working days"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Quotation Stage / Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Draft">Draft</option>
                <option value="Cost Sheet Pending Approval">Cost Sheet Pending Approval</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Accepted">Accepted</option>
                <option value="Converted to Sales Order">Converted to Sales Order</option>
                <option value="Revised">Revised</option>
                <option value="Rejected">Rejected</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Special Remarks / Notes for Client
              </label>
              <input
                type="text"
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. GST 18% extra as applicable. Printing stereo cost one-time extra."
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
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
            <span>{saving ? 'Saving...' : 'Save & Update Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
