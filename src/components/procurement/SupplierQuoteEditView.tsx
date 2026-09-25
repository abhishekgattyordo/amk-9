import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Sparkles, Plus, Trash2, CheckCircle2, 
  Clock, AlertTriangle, Download, Copy, FileText, ChevronRight,
  DollarSign, Truck, Calendar, ShieldCheck, Building2
} from 'lucide-react';
import { Supplier, RFQItem, RawMaterial, SupplierQuote } from '../../types';
import { UniversalServerSelect } from '../common/UniversalServerSelect';

interface SupplierQuoteEditViewProps {
  darkMode: boolean;
  quoteId: string | null;
  quoteForm: any;
  setQuoteForm: (form: any) => void;
  quoteLineItems: any[];
  setQuoteLineItems: React.Dispatch<React.SetStateAction<any[]>>;
  suppliers: Supplier[];
  rfqs: RFQItem[];
  rawMaterials: RawMaterial[];
  onBack: () => void;
  onSave: (e: React.FormEvent) => void;
  onConvertPo: (q: any) => void;
  onDownloadPdf?: (q: any) => void;
  isSubmitting: boolean;
  submitError: string | null;
  getSupplierDisplayName: (id?: string, name?: string, mill?: string) => string;
}

export const SupplierQuoteEditView: React.FC<SupplierQuoteEditViewProps> = ({
  darkMode,
  quoteId,
  quoteForm,
  setQuoteForm,
  quoteLineItems,
  setQuoteLineItems,
  suppliers,
  rfqs,
  rawMaterials,
  onBack,
  onSave,
  onConvertPo,
  onDownloadPdf,
  isSubmitting,
  submitError,
  getSupplierDisplayName
}) => {
  const isNew = quoteId === 'new' || !quoteId;

  // Standard quotation status progression
  const statusSteps = [
    { key: 'Draft', label: 'Draft', desc: 'Internal preparation' },
    { key: 'Submitted', label: 'Submitted', desc: 'Received from supplier' },
    { key: 'Under Review', label: 'Under Review', desc: 'Evaluating pricing & terms' },
    { key: 'Accepted', label: 'Accepted', desc: 'Approved for order placement' },
    { key: 'Awarded', label: 'Awarded / PO Converted', desc: 'Converted to Purchase Order' }
  ];

  const currentStatusIndex = Math.max(0, statusSteps.findIndex(s => s.key === quoteForm.status));

  // Calculations
  const subtotalAmount = quoteLineItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    return sum + (qty * rate - disc);
  }, 0);

  const totalTaxAmount = quoteLineItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    const base = Math.max(0, qty * rate - disc);
    const taxPct = Number(item.taxPercent) || 18;
    return sum + (base * (taxPct / 100));
  }, 0);

  const grandTotal = subtotalAmount + totalTaxAmount;

  const handleAddLineItem = () => {
    setQuoteLineItems(prev => [
      ...prev,
      {
        materialCode: rawMaterials[0]?.code || 'RM-NEW-001',
        materialName: rawMaterials[0]?.name || 'Kraft Liner Paper',
        quantity: 1000,
        unit: 'Kg',
        unitPrice: 50,
        discount: 0,
        taxPercent: 18,
        taxAmount: 9000,
        totalAmount: 59000,
        remarks: ''
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setQuoteLineItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      if (field === 'materialCode') {
        const mat = rawMaterials.find(r => r.code === value);
        if (mat) {
          item.materialName = mat.name;
          item.unit = mat.uom || 'Kg';
        }
      }

      const qty = Number(field === 'quantity' ? value : item.quantity) || 0;
      const rate = Number(field === 'unitPrice' ? value : item.unitPrice) || 0;
      const disc = Number(field === 'discount' ? value : item.discount) || 0;
      const taxPct = Number(field === 'taxPercent' ? value : item.taxPercent) || 18;

      const baseAmount = Math.max(0, qty * rate - disc);
      const calculatedTax = Number((baseAmount * (taxPct / 100)).toFixed(2));
      const calculatedTotal = Number((baseAmount + calculatedTax).toFixed(2));

      item.taxAmount = calculatedTax;
      item.totalAmount = calculatedTotal;

      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setQuoteLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const selectedSupplierObj = suppliers.find(s => s.id === quoteForm.supplierId);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Bar */}
      <div className={`p-5 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              type="button"
              className="p-2 rounded-2xl border text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Back to Quotations List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {isNew ? 'New Quotation' : (quoteForm.quotationNumber || `QTN-${quoteId}`)}
                </span>
                {quoteForm.rfqId && (
                  <span className="text-xs text-slate-700 dark:text-slate-400 font-medium">
                    Linked RFQ: <strong className="text-slate-900 dark:text-slate-200">{quoteForm.rfqNumber || quoteForm.rfqId}</strong>
                  </span>
                )}
              </div>
              <h1 className={`text-xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {isNew ? 'Create Supplier Quotation Workspace' : `Edit Quotation: ${quoteForm.quotationNumber || quoteId}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDownloadPdf && !isNew && (
              <button
                type="button"
                onClick={() => onDownloadPdf({ ...quoteForm, items: quoteLineItems, totalPrice: grandTotal })}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Export PDF</span>
              </button>
            )}

            {(quoteForm.status === 'Accepted' || quoteForm.status === 'Awarded') && (
              <button
                type="button"
                onClick={() => onConvertPo({ ...quoteForm, id: quoteId, items: quoteLineItems, totalPrice: grandTotal })}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>1-Click Convert to PO</span>
              </button>
            )}

            <button
              onClick={onSave}
              disabled={isSubmitting}
              type="button"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Quotation'}</span>
            </button>
          </div>
        </div>

        {/* Status Stepper Progression */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 text-[10px]">
              Quotation Status Lifecycle Pipeline
            </span>
            <span className="text-emerald-500 font-bold">
              Current Status: {quoteForm.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {statusSteps.map((step, idx) => {
              const isActive = quoteForm.status === step.key;
              const isPassed = currentStatusIndex > idx;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setQuoteForm({ ...quoteForm, status: step.key })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                      : isPassed
                      ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold opacity-75">STEP 0{idx + 1}</span>
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    ) : null}
                  </div>
                  <div className="font-extrabold text-xs mt-1">{step.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{step.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Prominent PO Banner if Accepted or Awarded */}
      {(quoteForm.status === 'Accepted' || quoteForm.status === 'Awarded') && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/40 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Quotation Stage is {quoteForm.status}! Ready for Purchase Order Creation
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                This supplier proposal has passed review. Click below to automatically generate an official Purchase Order.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onConvertPo({ ...quoteForm, id: quoteId, items: quoteLineItems, totalPrice: grandTotal })}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Purchase Order Now</span>
          </button>
        </div>
      )}

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Quotation Form & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Details Card */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-extrabold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>General Quotation Header & Supplier Information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Quotation Number */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Quotation Number *
                </label>
                <input
                  type="text"
                  required
                  value={quoteForm.quotationNumber}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quotationNumber: e.target.value })}
                  placeholder="e.g. QTN-2026-004"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              {/* Linked RFQ */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Linked RFQ Number
                </label>
                <select
                  value={quoteForm.rfqId || ''}
                  onChange={(e) => {
                    const rfq = rfqs.find(r => r.id === e.target.value);
                    setQuoteForm({ 
                      ...quoteForm, 
                      rfqId: e.target.value,
                      rfqNumber: rfq ? rfq.rfqNumber : ''
                    });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="">-- No Linked RFQ --</option>
                  {rfqs.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.rfqNumber} - {(r.materials?.[0]?.name || 'RFQ').substring(0, 30)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">
                  Supplier / Paper Mill *
                </label>
                <UniversalServerSelect
                  value={quoteForm.supplierId}
                  onChange={(id) => {
                    const sup = suppliers.find(s => s.id === id);
                    setQuoteForm({ 
                      ...quoteForm, 
                      supplierId: id,
                      supplierName: sup ? getSupplierDisplayName(sup.id, sup.supplierName, sup.millName) : quoteForm.supplierName
                    });
                  }}
                  endpoint="/api/suppliers"
                  placeholder="Search and select supplier..."
                  darkMode={darkMode}
                  required
                />
              </div>

              {/* Quotation Status Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Quotation Status Edit *
                </label>
                <select
                  value={quoteForm.status}
                  onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    quoteForm.status === 'Submitted'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-500'
                      : quoteForm.status === 'Under Review'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                      : quoteForm.status === 'Accepted'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                      : quoteForm.status === 'Awarded'
                      ? 'bg-green-500/10 border-green-500/40 text-green-500'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Awarded">Awarded / PO Converted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Quotation Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Quotation Date
                </label>
                <input
                  type="date"
                  value={quoteForm.quotationDate || ''}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quotationDate: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Validity Expiry Date
                </label>
                <input
                  type="date"
                  value={quoteForm.validUntil || ''}
                  onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              {/* Delivery Lead Time */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Delivery Lead Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quoteForm.deliveryDays || 7}
                  onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDays: Number(e.target.value) || 1 })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={quoteForm.paymentTerms || ''}
                  onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                  placeholder="e.g. Net 30 Days, 50% Advance"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Currency
                </label>
                <select
                  value={quoteForm.currency || 'INR (₹)'}
                  onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>

              {/* Freight & Shipping */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                  Freight & Shipping Terms
                </label>
                <input
                  type="text"
                  value={quoteForm.freightTerms || ''}
                  onChange={(e) => setQuoteForm({ ...quoteForm, freightTerms: e.target.value })}
                  placeholder="e.g. FOR Destination / Freight Extra"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
            </div>

            {/* Remarks / Terms */}
            <div className="mt-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">
                Remarks & Supplier Notes
              </label>
              <textarea
                rows={2}
                value={quoteForm.remarks || ''}
                onChange={(e) => setQuoteForm({ ...quoteForm, remarks: e.target.value })}
                placeholder="Special instructions, mill quality certifications, tolerances..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
          </div>

          {/* Line Items Workspace */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-extrabold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Quotation Line Items ({quoteLineItems.length})</span>
                </h2>
                <p className="text-[11px] text-slate-700 dark:text-slate-400">
                  Specify raw materials, quantities, rates, discounts, and GST tax percentages.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 shadow transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {quoteLineItems.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-700 dark:text-slate-400">No line items added yet.</p>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="mt-2 text-xs font-bold text-emerald-500 underline cursor-pointer"
                >
                  Click here to add raw material item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className={`font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'bg-slate-800/60 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                      <tr>
                        <th className="p-3">Material Description</th>
                        <th className="p-3 w-24">Qty</th>
                        <th className="p-3 w-20">Unit</th>
                        <th className="p-3 w-28">Rate (₹)</th>
                        <th className="p-3 w-24">Discount</th>
                        <th className="p-3 w-20">GST %</th>
                        <th className="p-3 w-32 text-right">Total (₹)</th>
                        <th className="p-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {quoteLineItems.map((item, idx) => (
                        <tr key={idx} className={darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                          <td className="p-2.5">
                            <select
                              value={item.materialCode || ''}
                              onChange={(e) => handleUpdateItem(idx, 'materialCode', e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            >
                              <option value="">-- Custom Material --</option>
                              {rawMaterials.map(rm => (
                                <option key={rm.id} value={rm.code}>
                                  {rm.code} - {rm.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.materialName || ''}
                              onChange={(e) => handleUpdateItem(idx, 'materialName', e.target.value)}
                              placeholder="Material title / specification"
                              className={`w-full mt-1 px-2.5 py-1 rounded-lg border text-[11px] ${darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-800'}`}
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || ''}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="text"
                              value={item.unit || 'Kg'}
                              onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice || ''}
                              onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono text-emerald-500 font-bold ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) => handleUpdateItem(idx, 'discount', Number(e.target.value))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </td>

                          <td className="p-2.5">
                            <select
                              value={item.taxPercent || 18}
                              onChange={(e) => handleUpdateItem(idx, 'taxPercent', Number(e.target.value))}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>

                          <td className="p-2.5 text-right font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                            ₹{(item.totalAmount || 0).toLocaleString()}
                          </td>

                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Footer */}
                <div className="flex flex-col sm:flex-row justify-end items-end pt-2">
                  <div className={`w-full sm:w-72 p-4 rounded-2xl border space-y-2 text-xs ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between text-slate-700 dark:text-slate-400">
                      <span>Subtotal Base Amount:</span>
                      <span className="font-mono font-bold">₹{subtotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-400">
                      <span>Estimated GST Tax:</span>
                      <span className="font-mono font-bold">₹{totalTaxAmount.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-300 dark:border-slate-800 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                      <span>Grand Total:</span>
                      <span className="font-mono text-emerald-500">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Status Controls & Summary */}
        <div className="space-y-6">
          {/* Quick Status Control Panel */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-extrabold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Status Workflow Controls</span>
            </h2>

            <p className="text-xs text-slate-700 dark:text-slate-400 mb-4">
              Quickly update the quotation stage to transition between procurement review steps.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setQuoteForm({ ...quoteForm, status: 'Submitted' })}
                className={`w-full p-3 rounded-2xl border text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  quoteForm.status === 'Submitted'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="text-blue-500">1. Mark as Submitted</div>
                  <div className="text-[10px] font-normal text-slate-700 dark:text-slate-400">Supplier has submitted quotation</div>
                </div>
                {quoteForm.status === 'Submitted' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
              </button>

              <button
                type="button"
                onClick={() => setQuoteForm({ ...quoteForm, status: 'Under Review' })}
                className={`w-full p-3 rounded-2xl border text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  quoteForm.status === 'Under Review'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                }`}
              >
                <div>
                  <div className="text-amber-500">2. Mark as Under Review</div>
                  <div className="text-[10px] font-normal text-slate-700 dark:text-slate-400">Internal evaluation & pricing check</div>
                </div>
                {quoteForm.status === 'Under Review' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </button>

              <button
                type="button"
                onClick={() => setQuoteForm({ ...quoteForm, status: 'Accepted' })}
                className={`w-full p-3 rounded-2xl border text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  quoteForm.status === 'Accepted'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                }`}
              >
                <div>
                  <div className="text-emerald-500">3. Mark as Accepted</div>
                  <div className="text-[10px] font-normal text-slate-700 dark:text-slate-400">Approved for PO placement</div>
                </div>
                {quoteForm.status === 'Accepted' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </button>
            </div>
          </div>

          {/* Supplier Info Summary */}
          {selectedSupplierObj && (
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-extrabold mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>Supplier Profile Details</span>
              </h2>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 block">Supplier Name</span>
                  <strong className="text-slate-900 dark:text-white">{selectedSupplierObj.supplierName}</strong>
                </div>
                {selectedSupplierObj.millName && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 block">Mill / Brand</span>
                    <span className="text-emerald-500 font-semibold">{selectedSupplierObj.millName}</span>
                  </div>
                )}
                {selectedSupplierObj.contactPerson && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 block">Contact Person</span>
                    <span>{selectedSupplierObj.contactPerson} ({selectedSupplierObj.phone || 'N/A'})</span>
                  </div>
                )}
                {selectedSupplierObj.paymentTerms && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 block">Standard Payment Terms</span>
                    <span>{selectedSupplierObj.paymentTerms}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
