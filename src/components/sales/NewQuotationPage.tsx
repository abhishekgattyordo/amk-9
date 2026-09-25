'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Building2,
  Package,
  Calendar,
  IndianRupee,
  User,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronRight,
  Check,
  Percent,
  Layers,
  HelpCircle
} from 'lucide-react';

interface NewQuotationPageProps {
  darkMode: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const NewQuotationPage: React.FC<NewQuotationPageProps> = ({
  darkMode,
  onBack,
  onSuccess
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    customerName: '',
    productName: '',
    amount: 50000,
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salesExecutive: 'Rajesh Sharma',
    status: 'Proposal Sent',
    costingSummary: 'Standard B2B Box Pricing',
    remarks: ''
  });

  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Load existing customers for auto-suggestions
    fetch('/api/sales/customers')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setExistingCustomers(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleNavigateBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/sales_quotations');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.customerName.trim()) {
      setErrorMessage('Customer Name is required.');
      return;
    }
    if (!formData.productName.trim()) {
      setErrorMessage('Product Name / Carton Specification is required.');
      return;
    }
    if (formData.amount <= 0) {
      setErrorMessage('Quotation Amount must be greater than zero.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/sales/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount.toString()) || 0
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Quotation for "${formData.customerName}" generated successfully!`);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (onBack) {
            onBack();
          } else {
            router.push('/sales_quotations');
          }
        }, 800);
      } else {
        setErrorMessage(data.error || 'Failed to generate quotation. Please verify all required inputs.');
      }
    } catch (err: any) {
      console.error('Error creating quotation:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving the quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={() => router.push('/sales_dashboard')}
          className="hover:text-emerald-500 transition-colors"
        >
          Sales Module
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={handleNavigateBack}
          className="hover:text-emerald-500 transition-colors"
        >
          Sales Quotations
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-700 dark:text-slate-300">New Quotation</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={handleNavigateBack}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
            }`}
            title="Return to Quotations List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Create Sales Quotation
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 border border-teal-500/30 text-teal-400">
                Commercial Proposal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Generate formal packaging pricing estimate, validity dates, and commercial terms for enterprise buyers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNavigateBack}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              darkMode
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Quote...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Create Quotation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Profile */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                1. Customer & Account Information
              </h2>
              <p className="text-[11px] text-slate-500">Select or enter the client company to receive this formal quote.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  list="customer-suggestions"
                  placeholder="e.g. Nestlé India Ltd / Cadbury Kraft"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <datalist id="customer-suggestions">
                  {existingCustomers.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Assigned Sales Executive
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.salesExecutive}
                  onChange={e => setFormData({ ...formData, salesExecutive: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Product & Commercial Terms */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                2. Carton Specification & Commercial Pricing
              </h2>
              <p className="text-[11px] text-slate-500">Provide box product specifications, total quote amount, and validity.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Product Name / Carton Specification <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-Ply Printed Corrugated Box (250 x 180 x 140 mm) with Flute-B"
                  value={formData.productName}
                  onChange={e => setFormData({ ...formData, productName: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Total Quotation Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-extrabold text-emerald-500 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Quotation Issue Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.quotationDate}
                  onChange={e => setFormData({ ...formData, quotationDate: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Proposal Valid Until
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Costing Breakdown & Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Standard B2B Box Pricing: Paper Cost ₹34/box + Conversion ₹8/box + Printing ₹3/box"
                value={formData.costingSummary}
                onChange={e => setFormData({ ...formData, costingSummary: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Commercial Terms & Notes */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                3. Commercial Conditions & Payment Terms
              </h2>
              <p className="text-[11px] text-slate-500">Specify GST application, freight terms, credit period, and delivery lead time.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Special Terms & Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Payment: 30 Days from date of invoice. Delivery: Ex-Works within 7 business days from PO approval. GST @ 18% extra as applicable."
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className={`w-full p-3.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleNavigateBack}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer text-center ${
              darkMode
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            Cancel and Return
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Quotation...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Create Quotation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
