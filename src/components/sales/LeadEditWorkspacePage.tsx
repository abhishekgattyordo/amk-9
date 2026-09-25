'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  Phone,
  Mail,
  Package,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Box,
  Truck,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface LeadEditWorkspacePageProps {
  darkMode: boolean;
  leadId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const LeadEditWorkspacePage: React.FC<LeadEditWorkspacePageProps> = ({
  darkMode,
  leadId,
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
    contactPerson: '',
    phone: '',
    email: '',
    productRequirement: '',
    productDescription: '',
    boxType: 'Universal Regular Slotted Container (RSC)',
    dimensions: '',
    ply: '5 Ply',
    paperSpec: '',
    fluteType: 'Narrow Flute (B-Flute)',
    printingRequirement: '2-Color Flexo Printing',
    expectedQuantity: 1000,
    targetPrice: '',
    requiredDeliveryDate: '',
    specifications: '',
    sampleRequired: false,
    sampleDetails: '',
    assignedSalesExecutive: 'Rajesh Sharma',
    leadSource: 'Direct Enquiry',
    followUpDate: '',
    remarks: '',
    status: 'New'
  });

  useEffect(() => {
    async function loadLead() {
      if (!leadId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/sales/leads/${leadId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const l = data.data;
          setForm({
            customerName: l.customerName || '',
            contactPerson: l.contactPerson || '',
            phone: l.phone || '',
            email: l.email || '',
            productRequirement: l.productRequirement || '',
            productDescription: l.productDescription || '',
            boxType: l.boxType || 'Universal Regular Slotted Container (RSC)',
            dimensions: l.dimensions || '',
            ply: l.ply || '5 Ply',
            paperSpec: l.paperSpec || '',
            fluteType: l.fluteType || 'Narrow Flute (B-Flute)',
            printingRequirement: l.printingRequirement || '2-Color Flexo Printing',
            expectedQuantity: l.expectedQuantity || 1000,
            targetPrice: l.targetPrice ? String(l.targetPrice) : '',
            requiredDeliveryDate: l.requiredDeliveryDate || '',
            specifications: l.specifications || '',
            sampleRequired: l.sampleRequired || false,
            sampleDetails: l.sampleDetails || '',
            assignedSalesExecutive: l.assignedSalesExecutive || 'Rajesh Sharma',
            leadSource: l.leadSource || 'Direct Enquiry',
            followUpDate: l.followUpDate || '',
            remarks: l.remarks || '',
            status: l.status || 'New'
          });
        } else {
          setError(data.error || 'Failed to load lead');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading lead details');
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [leadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.productRequirement.trim()) {
      setError('Customer name and product requirement are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Lead details and Requirement Brief saved successfully!');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/sales/leads/${leadId}`);
          }
        }, 600);
      } else {
        setError(data.error || 'Failed to update lead');
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
        <p className="text-sm font-semibold text-slate-400">Loading Lead Edit Form...</p>
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
            <span>Sales & Pipeline</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="cursor-pointer hover:underline" onClick={() => router.push(`/sales/leads/${leadId}`)}>Lead View</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-emerald-500">Edit Lead & Requirement Brief</span>
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
            <span>{saving ? 'Saving Changes...' : 'Save Lead Details'}</span>
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
        {/* Customer & Contact Section */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">1. Customer & Commercial Contact Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Account and contact information for this inquiry</p>
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

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Contact Person
              </label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
                placeholder="e.g. Anand Varma"
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
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
                placeholder="+91 98450 12345"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
                placeholder="procurement@apexpackaging.in"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Lead Source
              </label>
              <select
                value={form.leadSource}
                onChange={e => setForm({ ...form, leadSource: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Direct Enquiry">Direct Enquiry</option>
                <option value="Website">Website / Digital Portal</option>
                <option value="Referral">Client Referral</option>
                <option value="Cold Outreach">Sales Cold Outreach</option>
                <option value="Exhibition">Trade Fair / Exhibition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Assigned Sales Executive
              </label>
              <input
                type="text"
                value={form.assignedSalesExecutive}
                onChange={e => setForm({ ...form, assignedSalesExecutive: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="Sales Officer Name"
              />
            </div>
          </div>
        </div>

        {/* Customer Requirement Brief Section */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">2. Customer Requirement Brief & Packaging Specs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Technical box dimensions, fluting, paper grades, and printing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Product / Box Requirement Title *
              </label>
              <input
                type="text"
                value={form.productRequirement}
                onChange={e => setForm({ ...form, productRequirement: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
                placeholder="e.g. Heavy Duty 5-Ply Master Carton 450x300x250mm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Box / Structure Type
              </label>
              <select
                value={form.boxType}
                onChange={e => setForm({ ...form, boxType: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Universal Regular Slotted Container (RSC)">Universal Regular Slotted Container (RSC)</option>
                <option value="Full Overlap Container (FOL)">Full Overlap Container (FOL)</option>
                <option value="Die-Cut Self Locking Tray">Die-Cut Self Locking Tray</option>
                <option value="Telescopic Box (Top & Bottom)">Telescopic Box (Top & Bottom)</option>
                <option value="Corrugated Sheet / Board">Corrugated Sheet / Board</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Dimensions (L x W x H in mm)
              </label>
              <input
                type="text"
                value={form.dimensions}
                onChange={e => setForm({ ...form, dimensions: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. 450 x 300 x 250 mm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Ply Structure
              </label>
              <select
                value={form.ply}
                onChange={e => setForm({ ...form, ply: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="3 Ply (Single Wall)">3 Ply (Single Wall)</option>
                <option value="5 Ply (Double Wall)">5 Ply (Double Wall)</option>
                <option value="7 Ply (Triple Wall)">7 Ply (Triple Wall)</option>
                <option value="2 Ply (Single Face Roll)">2 Ply (Single Face Roll)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Flute Profile
              </label>
              <select
                value={form.fluteType}
                onChange={e => setForm({ ...form, fluteType: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Narrow Flute (B-Flute)">Narrow Flute (B-Flute)</option>
                <option value="Medium Flute (C-Flute)">Medium Flute (C-Flute)</option>
                <option value="Micro Flute (E-Flute)">Micro Flute (E-Flute)</option>
                <option value="Combination Flute (B/C Flute)">Combination Flute (B/C Flute)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Paper Specifications / GSM / BF
              </label>
              <input
                type="text"
                value={form.paperSpec}
                onChange={e => setForm({ ...form, paperSpec: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. Top 200 GSM Kraft 28 BF, Medium 140 Fluting"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Printing Requirements
              </label>
              <input
                type="text"
                value={form.printingRequirement}
                onChange={e => setForm({ ...form, printingRequirement: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. 2-Color Flexo Printing Black + Green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Expected Order Quantity (Units)
              </label>
              <input
                type="number"
                value={form.expectedQuantity}
                onChange={e => setForm({ ...form, expectedQuantity: Number(e.target.value) || 0 })}
                min="1"
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Required Delivery Date
              </label>
              <input
                type="date"
                value={form.requiredDeliveryDate}
                onChange={e => setForm({ ...form, requiredDeliveryDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Target / Indicative Price per Box (₹)
              </label>
              <input
                type="text"
                value={form.targetPrice}
                onChange={e => setForm({ ...form, targetPrice: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. 42.50"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Special Quality / Bursting Strength / Stacking Requirements
              </label>
              <textarea
                rows={2}
                value={form.specifications}
                onChange={e => setForm({ ...form, specifications: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="e.g. Bursting strength minimum 12 kg/cm2, Compression strength 350 kgf, moisture under 9%"
              />
            </div>

            <div className="md:col-span-3 p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sampleRequired}
                  onChange={e => setForm({ ...form, sampleRequired: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Sample Production & Prototyping Required for Client Approval
                </span>
              </label>
              {form.sampleRequired && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={form.sampleDetails}
                    onChange={e => setForm({ ...form, sampleDetails: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                    placeholder="Provide sample specifications (e.g. 2 physical sample boxes with test fit report before bulk corrugation)"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes & Lifecycle Status */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">3. Notes & Lead Pipeline Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current workflow stage and internal executive comments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Pipeline Stage / Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="New">New</option>
                <option value="Cost Sheet Drafted">Cost Sheet Drafted</option>
                <option value="Cost Sheet Pending Approval">Cost Sheet Pending Approval</option>
                <option value="Cost Sheet Approved">Cost Sheet Approved</option>
                <option value="Sample Production">Sample Production</option>
                <option value="Sample Dispatched">Sample Dispatched</option>
                <option value="Awaiting Customer Feedback">Awaiting Customer Feedback</option>
                <option value="Sample Approved">Sample Approved</option>
                <option value="Sample Rejected">Sample Rejected</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Converted to Sales Order">Converted to Sales Order</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Internal Remarks / Notes
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="Log internal discussions, payment expectations, customer preferences..."
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
            <span>{saving ? 'Saving...' : 'Save & Update Lead'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
