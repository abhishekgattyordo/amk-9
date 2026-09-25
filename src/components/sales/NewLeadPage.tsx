'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  Package,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Check,
  ChevronRight,
  Home
} from 'lucide-react';

interface NewLeadPageProps {
  darkMode: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const NewLeadPage: React.FC<NewLeadPageProps> = ({
  darkMode,
  onBack,
  onSuccess
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    customerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    productRequirement: '',
    productDescription: '',
    expectedQuantity: 1000,
    requiredDeliveryDate: '',
    specifications: '',
    sampleRequired: false,
    sampleDetails: '',
    assignedSalesExecutive: 'Rajesh Sharma',
    leadSource: 'Direct Enquiry',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleNavigateBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/sales_leads');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.customerName.trim()) {
      setErrorMessage('Customer / Company Name is required.');
      return;
    }
    if (!formData.productRequirement.trim()) {
      setErrorMessage('Product Requirement is required.');
      return;
    }
    if (formData.expectedQuantity <= 0) {
      setErrorMessage('Expected Order Quantity must be greater than 0.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expectedQuantity: Number(formData.expectedQuantity)
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Sales Lead "${formData.customerName}" created successfully!`);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (onBack) {
            onBack();
          } else {
            router.push('/sales_leads');
          }
        }, 800);
      } else {
        setErrorMessage(data.error || 'Failed to create sales lead. Please verify all inputs.');
      }
    } catch (err: any) {
      console.error('Error creating sales lead:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving the sales lead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
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
          Leads Pipeline
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-700 dark:text-slate-300">New Sales Lead</span>
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
            title="Return to Leads Pipeline"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Create New Sales Lead
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                Pipeline Stage 1: Lead
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Capture prospective customer inquiry, carton technical specifications, and initial volume estimates.
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
                <span>Saving Lead...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Create Lead</span>
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
        {/* Section 1: Customer Details */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                1. Customer & Account Profile
              </h2>
              <p className="text-[11px] text-slate-500">Enter organization identity and key buyer contact information.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Customer / Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Hindustan Unilever Limited"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Person Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Singhania"
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. +91 98201 45678"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="procurement@hul-india.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Lead Source
              </label>
              <select
                value={formData.leadSource}
                onChange={e => setFormData({ ...formData, leadSource: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Direct Enquiry">Direct Enquiry</option>
                <option value="Inbound Phone/Email">Inbound Phone/Email</option>
                <option value="Website Portal">Website Portal</option>
                <option value="Client Referral">Client Referral</option>
                <option value="Industrial Expo / Exhibition">Industrial Expo / Exhibition</option>
                <option value="Field Sales Rep">Field Sales Rep</option>
                <option value="Government / PSU Tender">Government / PSU Tender</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Assigned Sales Executive
              </label>
              <input
                type="text"
                placeholder="e.g. Rajesh Sharma"
                value={formData.assignedSalesExecutive}
                onChange={e => setFormData({ ...formData, assignedSalesExecutive: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Product & Technical Specs */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                2. Carton Requirement & Packaging Specs
              </h2>
              <p className="text-[11px] text-slate-500">Define box dimensions, ply structure, expected lot volumes, and delivery targets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Product Requirement / Carton Specification <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Ply Heavy Duty Master Shipper Box (420 x 300 x 280 mm)"
                  value={formData.productRequirement}
                  onChange={e => setFormData({ ...formData, productRequirement: e.target.value })}
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
                Expected Order Quantity (Pcs) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.expectedQuantity}
                onChange={e => setFormData({ ...formData, expectedQuantity: parseInt(e.target.value) || 0 })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Required Delivery Target Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.requiredDeliveryDate}
                  onChange={e => setFormData({ ...formData, requiredDeliveryDate: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Next Follow-Up Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Technical Specifications & GSM Breakdown
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Outer: 180 GSM Kraft Top, Fluting: 140 GSM Semi-Chemical, Inner: 150 GSM Testliner. Bursting Factor > 16. 2-Color Flexo Printing required."
                value={formData.specifications}
                onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                className={`w-full p-3.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Samples & Follow-Up */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                3. Sample Development & Additional Notes
              </h2>
              <p className="text-[11px] text-slate-500">Flag sample requirements for the corrugation design department.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                id="sampleRequired"
                checked={formData.sampleRequired}
                onChange={e => setFormData({ ...formData, sampleRequired: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <label htmlFor="sampleRequired" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                Physical Corrugated Box Sample / Mock-up Required by Client
              </label>
            </div>

            {formData.sampleRequired && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Sample Delivery & Testing Requirements
                </label>
                <input
                  type="text"
                  placeholder="e.g. Provide 3 unprinted blank samples with custom die-cut inner partition within 4 business days."
                  value={formData.sampleDetails}
                  onChange={e => setFormData({ ...formData, sampleDetails: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Internal Sales & Commercial Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Add internal notes on competitor pricing, credit terms expectations, or production line constraints..."
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
                <span>Creating Lead...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Create Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
