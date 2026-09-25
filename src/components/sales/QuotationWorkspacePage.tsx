'use client';

import React, { useState, useEffect } from 'react';
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
  Clock,
  Send,
  RotateCcw,
  ShoppingBag,
  Check,
  CheckCircle,
  Copy,
  Printer,
  Edit3,
  Plus,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  X,
  MessageSquare,
  Percent,
  Download,
  IndianRupee,
  Sliders,
  DollarSign
} from 'lucide-react';

interface QuotationWorkspacePageProps {
  darkMode: boolean;
  quotationId?: string;
  quotationData?: any;
  onBack: () => void;
  onRefreshParent?: () => void;
  onSelectModule?: (module: string) => void;
}

export const QuotationWorkspacePage: React.FC<QuotationWorkspacePageProps> = ({
  darkMode,
  quotationId,
  quotationData: initialQuoteData,
  onBack,
  onRefreshParent,
  onSelectModule
}) => {
  const [quote, setQuote] = useState<any>(initialQuoteData || null);
  const [loading, setLoading] = useState(!initialQuoteData && !!quotationId);
  const [activeTab, setActiveTab] = useState<'summary' | 'costing' | 'revisions' | 'timeline'>('summary');
  const [copiedId, setCopiedId] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Revision Modal State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionForm, setRevisionForm] = useState({
    amount: 0,
    reason: '',
    remarks: ''
  });

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('Proposal Sent');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Edit Quotation Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    productName: '',
    amount: 0,
    quotationDate: '',
    validUntil: '',
    salesExecutive: '',
    costingSummary: '',
    remarks: ''
  });

  // Convert to Order Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertForm, setConvertForm] = useState({
    customerPoNumber: '',
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 1000,
    unitPrice: 0,
    remarks: ''
  });

  const effectiveQuoteId = quote?.id || quotationId || initialQuoteData?.id;

  const fetchQuotationDetails = async (idToFetch?: string) => {
    const id = idToFetch || effectiveQuoteId;
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/quotations/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setQuote(data.data);
      } else {
        // Try query by id in list if single fetch fails
        const listRes = await fetch(`/api/sales/quotations?id=${id}`);
        const listData = await listRes.json();
        if (listData.success && listData.data) {
          setQuote(listData.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quotation details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveQuoteId) {
      fetchQuotationDetails(effectiveQuoteId);
    }
  }, [effectiveQuoteId]);

  // Set default values when quote loads
  useEffect(() => {
    if (quote) {
      setRevisionForm({
        amount: quote.amount || 0,
        reason: 'Client requested price renegotiation',
        remarks: ''
      });
      setEditForm({
        customerName: quote.customerName || '',
        productName: quote.productName || '',
        amount: quote.amount || 0,
        quotationDate: quote.quotationDate || new Date().toISOString().split('T')[0],
        validUntil: quote.validUntil || new Date().toISOString().split('T')[0],
        salesExecutive: quote.salesExecutive || 'Rajesh Sharma',
        costingSummary: quote.costingSummary || '',
        remarks: quote.remarks || ''
      });
      setConvertForm({
        customerPoNumber: quote.lead?.customerPoNumber || `PO-${quote.quotationNumber || 'AUTO'}`,
        deliveryDate: quote.lead?.requiredDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity: quote.lead?.expectedQuantity || 1000,
        unitPrice: quote.amount ? Number((quote.amount / (quote.lead?.expectedQuantity || 1000)).toFixed(2)) : 50,
        remarks: `Converted from Quotation ${quote.quotationNumber}`
      });
    }
  }, [quote]);

  const handleCopyId = () => {
    if (!quote?.quotationNumber) return;
    navigator.clipboard.writeText(quote.quotationNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionForm.amount || revisionForm.amount <= 0) {
      setActionErrorMsg('Please enter a valid revision amount.');
      return;
    }
    setActionLoading(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await fetch(`/api/sales/quotations/${quote.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(revisionForm.amount),
          reason: revisionForm.reason || 'Price adjustment',
          createdBy: quote.salesExecutive || 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Quotation successfully revised to Rev ${(quote.revision || 1) + 1} with amount ₹${Number(revisionForm.amount).toLocaleString('en-IN')}`);
        setShowRevisionModal(false);
        await fetchQuotationDetails(quote.id);
        if (onRefreshParent) onRefreshParent();
      } else {
        setActionErrorMsg(data.error?.message || 'Failed to create quotation revision.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Network error while creating revision.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: string, remarksText?: string) => {
    setActionLoading(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await fetch(`/api/sales/quotations/${quote.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          remarks: remarksText || `Status updated to ${targetStatus}`,
          user: quote.salesExecutive || 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Quotation status updated to ${targetStatus}`);
        setShowStatusModal(false);
        await fetchQuotationDetails(quote.id);
        if (onRefreshParent) onRefreshParent();
      } else {
        setActionErrorMsg(data.error?.message || 'Failed to update quotation status.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await fetch(`/api/sales/quotations/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          amount: Number(editForm.amount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg('Quotation details updated successfully.');
        setShowEditModal(false);
        await fetchQuotationDetails(quote.id);
        if (onRefreshParent) onRefreshParent();
      } else {
        setActionErrorMsg(data.error?.message || 'Failed to update quotation.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error updating quotation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionErrorMsg('');
    try {
      const res = await fetch(`/api/sales/quotations/${quote.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPoNumber: convertForm.customerPoNumber || `PO-${quote.quotationNumber}`,
          deliveryDate: convertForm.deliveryDate,
          quantity: Number(convertForm.quantity) || undefined,
          unitPrice: Number(convertForm.unitPrice) || undefined,
          remarks: convertForm.remarks,
          user: quote.salesExecutive || 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Quotation successfully converted to Sales Order ${data.data?.soNumber || ''}! Redirecting to Orders...`);
        setShowConvertModal(false);
        if (onRefreshParent) onRefreshParent();
        setTimeout(() => {
          if (onSelectModule) onSelectModule('sales_orders');
        }, 1200);
      } else {
        setActionErrorMsg(data.error?.message || data.error || 'Failed to convert to Sales Order.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error converting quotation to sales order.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Accepted':
      case 'Won':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'Draft':
      case 'Pending Costing':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      case 'Sent':
      case 'Proposal Sent':
      case 'Active':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Under Revision':
      case 'Revised':
      case 'Negotiation':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Rejected':
      case 'Expired':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
    }
  };

  // Mock calculated commercial figures for presentation
  const baseAmount = Number(quote?.amount) || 50000;
  const gstRate = 18;
  const gstAmount = Math.round((baseAmount * gstRate) / 100);
  const grandTotal = baseAmount + gstAmount;
  const expectedQty = quote?.lead?.expectedQuantity || 1000;
  const unitPriceCalculated = (baseAmount / expectedQty).toFixed(2);

  // Costing breakdown estimates for corrugated cartons
  const paperCost = Math.round(baseAmount * 0.62);
  const conversionCost = Math.round(baseAmount * 0.16);
  const transportCost = Math.round(baseAmount * 0.05);
  const totalCost = paperCost + conversionCost + transportCost;
  const grossProfit = baseAmount - totalCost;
  const grossProfitMargin = ((grossProfit / (baseAmount || 1)) * 100).toFixed(1);

  const stages = [
    { key: 'Draft', label: '1. Costing & Draft' },
    { key: 'Proposal Sent', label: '2. Proposal Sent' },
    { key: 'Under Revision', label: '3. Negotiation / Revision' },
    { key: 'Accepted', label: '4. Customer Accepted' },
    { key: 'Won', label: '5. Sales Order Created' }
  ];

  const getStageIndex = (st: string) => {
    if (st === 'Draft' || st === 'Pending Costing') return 0;
    if (st === 'Proposal Sent' || st === 'Sent' || st === 'Active') return 1;
    if (st === 'Under Revision' || st === 'Revised' || st === 'Negotiation') return 2;
    if (st === 'Accepted' || st === 'Approved') return 3;
    if (st === 'Won' || st === 'Converted') return 4;
    return 1;
  };

  const currentStageIdx = getStageIndex(quote?.status || 'Proposal Sent');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-slate-400">Loading Quotation Workspace & Commercials...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Quotation Record Not Found</h3>
        <p className="text-xs text-slate-400">The requested sales quotation may have been deleted or does not exist.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
        >
          Return to Quotations Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Messages */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg('')} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-xs mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <button onClick={onBack} className="hover:text-emerald-600 flex items-center gap-1 cursor-pointer font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quotations Directory</span>
            </button>
            <ChevronRight className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
            <span className={`font-mono font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{quote.quotationNumber}</span>
            <span className={darkMode ? 'text-slate-600' : 'text-slate-400'}>/</span>
            <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{quote.customerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {quote.quotationNumber}
            </h1>
            <button
              onClick={handleCopyId}
              className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                darkMode ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-800/60' : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-white'
              }`}
              title="Copy Quotation Number"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedId ? <span className="text-emerald-500 text-[10px] font-bold">Copied!</span> : null}
            </button>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
              darkMode ? 'bg-teal-500/15 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-300'
            }`}>
              Rev {quote.revision || 1}
            </span>

            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold border ${getStatusBadge(quote.status)}`}>
              {quote.status}
            </span>
          </div>
        </div>

        {/* Quick Action Toolbars */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowPrintModal(true)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Printer className={`w-3.5 h-3.5 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`} />
            <span>Formal Quote Letter / Print</span>
          </button>

          <button
            onClick={() => setShowRevisionModal(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm ${
              darkMode ? 'bg-amber-600/15 text-amber-400 hover:bg-amber-600 hover:text-white border-amber-500/30' : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Create Revision</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Edit3 className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <span>Edit</span>
          </button>

          {quote.status !== 'Won' && quote.status !== 'Converted' ? (
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Convert to Sales Order</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectModule && onSelectModule('sales_orders')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>View in Sales Orders</span>
              </button>
              <button
                onClick={() => setShowConvertModal(true)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                }`}
                title="Update or Re-generate Sales Order"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Converted</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quotation Lifecycle Stepper Bar */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`} />
            Quotation Lifecycle & Commercial Pipeline
          </span>
          <span className={`text-[11px] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
            Valid Until: <strong className={darkMode ? 'text-slate-300' : 'text-slate-900'}>{quote.validUntil || 'N/A'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {stages.map((stg, idx) => {
            const isDone = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <button
                key={stg.key}
                onClick={() => {
                  setNewStatus(stg.key);
                  setShowStatusModal(true);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isCurrent
                    ? 'bg-teal-600 border-teal-500 text-white font-bold shadow-md shadow-teal-600/20'
                    : isDone
                    ? darkMode
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : darkMode
                    ? 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 font-semibold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{stg.label}</span>
                  {isDone && <Check className={`w-3.5 h-3.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </div>
                <span className="text-[10px] opacity-90 mt-0.5 block font-medium">
                  {isCurrent ? 'Current Active State' : isDone ? 'Completed' : 'Click to Set'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`flex items-center justify-between mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
            <span className="text-xs">Total Quoted Value</span>
            <IndianRupee className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
          </div>
          <div className={`text-xl font-black ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>₹{baseAmount.toLocaleString('en-IN')}</div>
          <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>₹{grandTotal.toLocaleString('en-IN')} incl. 18% GST</div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`flex items-center justify-between mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
            <span className="text-xs">Unit Price / Box</span>
            <Package className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`} />
          </div>
          <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>₹{unitPriceCalculated}</div>
          <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Based on {expectedQty.toLocaleString()} units</div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`flex items-center justify-between mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
            <span className="text-xs">Gross Profit Margin</span>
            <Percent className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`} />
          </div>
          <div className={`text-xl font-black ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{grossProfitMargin}%</div>
          <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Est. Contribution: ₹{grossProfit.toLocaleString('en-IN')}</div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`flex items-center justify-between mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
            <span className="text-xs">Executive & Validity</span>
            <User className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`} />
          </div>
          <div className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {quote.salesExecutive || 'Rajesh Sharma'}
          </div>
          <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Quote Date: {quote.quotationDate || 'N/A'}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex items-center space-x-2 border-b pb-1 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        {[
          { id: 'summary', label: 'Quotation Dossier & Specs', icon: FileText },
          { id: 'costing', label: 'Costing & Profitability Matrix', icon: TrendingUp },
          { id: 'revisions', label: `Revisions & History (${(quote.revisions?.length || 1)})`, icon: RotateCcw },
          { id: 'timeline', label: 'Audit Log & Activity', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: SUMMARY & LINE ITEMS */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Commercial Proposal & Specs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commercial Line Item Table */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <FileSpreadsheet className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`} />
                  Commercial Proposal & Line Item Schedule
                </h3>
                <span className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Currency: INR (₹)</span>
              </div>

              <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'border-slate-800 bg-slate-800/80 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                      <th className="p-3">#</th>
                      <th className="p-3">Item Description / Corrugated Specification</th>
                      <th className="p-3 text-right">Order Qty</th>
                      <th className="p-3 text-right">Rate (₹/Unit)</th>
                      <th className="p-3 text-right">Basic Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    <tr>
                      <td className={`p-3 font-mono ${darkMode ? 'text-slate-500' : 'text-slate-600 font-bold'}`}>01</td>
                      <td className="p-3 font-semibold">
                        <div className={darkMode ? 'text-white' : 'text-slate-900 font-bold'}>{quote.productName}</div>
                        <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {quote.costingSummary || 'Standard 3-Ply / 5-Ply Corrugated Box with flexo printing & varnishing'}
                        </div>
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                        {expectedQty.toLocaleString()} Pcs
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                        ₹{unitPriceCalculated}
                      </td>
                      <td className={`p-3 text-right font-mono font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        ₹{baseAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pricing Totals Box */}
              <div className={`mt-4 pt-4 border-t flex flex-col sm:flex-row sm:justify-end ${darkMode ? 'border-slate-700/60' : 'border-slate-200'}`}>
                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    <span>Taxable Basic Amount:</span>
                    <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>₹{baseAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    <span>CGST (9%):</span>
                    <span className={`font-mono font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    <span>SGST / IGST (9%):</span>
                    <span className={`font-mono font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`pt-2 border-t flex justify-between font-bold text-sm ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <span className={darkMode ? 'text-white' : 'text-slate-900'}>Net Quotation Total:</span>
                    <span className={`font-mono text-base ${darkMode ? 'text-emerald-400' : 'text-emerald-700 font-extrabold'}`}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manufacturing & Corrugation Box Specs */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Package className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                Packaging Box Engineering Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Box Dimensions</span>
                  <p className="font-bold font-mono mt-1">450 × 300 × 280 mm</p>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Outer Box (OD)</span>
                </div>
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Board Structure</span>
                  <p className={`font-bold mt-1 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>5-Ply Universal</p>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Narrow + Broad Flute</span>
                </div>
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Paper GSM Combination</span>
                  <p className="font-bold font-mono mt-1">180K / 140F / 140K</p>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Virgin Kraft Liner</span>
                </div>
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Bursting Strength</span>
                  <p className={`font-bold font-mono mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>12.5 kg/cm²</p>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Burst Factor: 22 BF</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Printing & Finishing</span>
                  <p className="font-semibold mt-1">2-Color Flexographic Printing (Water-based ink) + Varnishing</p>
                </div>
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Joint & Binding</span>
                  <p className="font-semibold mt-1">Glue Lap Joint + Copper Coated Stitching (Heavy Duty)</p>
                </div>
              </div>
            </div>

            {/* Standard Terms & Conditions */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <ShieldCheck className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`} />
                Commercial Terms & Packaging Guidelines
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Payment Terms:</span>
                  <p className={darkMode ? 'text-slate-200' : 'text-slate-800 font-medium'}>30 Days Net from date of Delivery Challan / Invoice</p>
                </div>
                <div className="space-y-1">
                  <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Delivery Lead Time:</span>
                  <p className={darkMode ? 'text-slate-200' : 'text-slate-800 font-medium'}>7-10 Business Days post PO & artwork approval</p>
                </div>
                <div className="space-y-1">
                  <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Freight & Transit:</span>
                  <p className={darkMode ? 'text-slate-200' : 'text-slate-800 font-medium'}>Door delivery included within 50 KM radius of Plant</p>
                </div>
                <div className="space-y-1">
                  <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Quantity Tolerance:</span>
                  <p className={darkMode ? 'text-slate-200' : 'text-slate-800 font-medium'}>±5% variation in final dispatched quantity acceptable</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Customer & Workflow Linking */}
          <div className="space-y-6">
            {/* Customer Dossier Card */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Building2 className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`} />
                Customer Account Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Customer Name</span>
                  <p className={`font-bold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {quote.customerName}
                  </p>
                  {quote.customer?.code && (
                    <span className={`text-[10px] font-mono font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{quote.customer.code}</span>
                  )}
                </div>

                <div className={`pt-2 border-t space-y-2 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className={`flex items-center gap-2 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                    <User className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`} />
                    <span>{quote.customer?.contactPerson || quote.lead?.contactPerson || 'Procurement Manager'}</span>
                  </div>
                  <div className={`flex items-center gap-2 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                    <Phone className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`} />
                    <span>{quote.customer?.phone || quote.lead?.phone || '+91 98450 12345'}</span>
                  </div>
                  <div className={`flex items-center gap-2 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                    <Mail className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`} />
                    <span>{quote.customer?.email || quote.lead?.email || 'procurement@client.com'}</span>
                  </div>
                </div>

                <div className={`pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Delivery & Billing Plant</span>
                  <p className={`mt-0.5 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                    {quote.customer?.address || 'Industrial Area Phase 2, Peenya, Bengaluru'}
                  </p>
                </div>
              </div>
            </div>

            {/* Linked Lead & Production Pipeline Card */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Layers className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`} />
                Pipeline & Lead Traceability
              </h3>

              {quote.leadId ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Originated from Lead:</span>
                    <span className={`font-mono font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{quote.lead?.leadNumber || quote.leadId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Current Lead Status:</span>
                    <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{quote.lead?.status || 'Active'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>Customer PO Ref:</span>
                    <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{quote.lead?.customerPoNumber || 'Pending PO'}</span>
                  </div>
                </div>
              ) : (
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Direct quotation created from quotation module without prior lead tracking.
                </p>
              )}
            </div>

            {/* Quick Status Action Panel */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Sparkles className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`} />
                Quick Stage Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange('Proposal Sent', 'Proposal dispatched to customer email')}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all cursor-pointer ${
                    darkMode ? 'bg-blue-600/15 hover:bg-blue-600 hover:text-white text-blue-400 border-blue-500/20' : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                  }`}
                >
                  <span>Mark as "Proposal Sent"</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleStatusChange('Accepted', 'Customer accepted terms and confirmed pricing')}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all cursor-pointer ${
                    darkMode ? 'bg-emerald-600/15 hover:bg-emerald-600 hover:text-white text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                  }`}
                >
                  <span>Mark as "Customer Accepted"</span>
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all cursor-pointer ${
                    darkMode ? 'bg-amber-600/15 hover:bg-amber-600 hover:text-white text-amber-400 border-amber-500/20' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  <span>Revise Pricing (Negotiation)</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: COSTING & PROFITABILITY */}
      {activeTab === 'costing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`md:col-span-2 p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <DollarSign className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                Detailed Cost Breakdown & Raw Material Estimation
              </h3>

              <div className="space-y-3 text-xs">
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>1. Kraft Paper & Fluting Medium Board Cost</span>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>180 GSM Kraft + 140 GSM Fluting (Calculated by Reel deckle & weight)</p>
                  </div>
                  <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>₹{paperCost.toLocaleString('en-IN')} (62%)</span>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>2. Conversion, Starch Glue & Processing</span>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Corrugator steam, maize starch adhesive, electricity & labor</p>
                  </div>
                  <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>₹{conversionCost.toLocaleString('en-IN')} (16%)</span>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>3. Printing Plates, Inks & Strapping Materials</span>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Polymer flexo stereo, water ink, wire stitching & strapping</p>
                  </div>
                  <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>₹{(transportCost * 0.6).toFixed(0)} (3%)</span>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>4. Freight, Palletization & Logistics</span>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Direct truck delivery to customer plant site</p>
                  </div>
                  <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>₹{transportCost.toLocaleString('en-IN')} (5%)</span>
                </div>
              </div>

              <div className={`pt-4 border-t flex justify-between items-center text-xs ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Total Factory Manufacturing Cost:</span>
                <span className={`font-mono font-extrabold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>₹{totalCost.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Profit & Margin Card */}
            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <TrendingUp className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`} />
                Profitability & Margin Summary
              </h3>

              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className={`text-[11px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Gross Margin %</span>
                  <div className={`text-3xl font-black mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{grossProfitMargin}%</div>
                  <p className={`text-[10px] font-bold mt-0.5 ${darkMode ? 'text-emerald-500' : 'text-emerald-800'}`}>Healthy Manufacturing Margin</p>
                </div>

                <div className="space-y-2">
                  <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    <span>Quoted Selling Price:</span>
                    <span className={`font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>₹{baseAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    <span>Estimated Total Cost:</span>
                    <span className={`font-mono font-bold ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>- ₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`pt-2 border-t flex justify-between font-bold ${darkMode ? 'border-slate-800 text-emerald-400' : 'border-slate-200 text-emerald-800'}`}>
                    <span>Gross Contribution:</span>
                    <span className="font-mono text-sm">₹{grossProfit.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                  darkMode ? 'bg-slate-800/40 border-slate-700 text-slate-400' : 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
                }`}>
                  💡 <strong>Corrugation Tip:</strong> Minimum target margin for customized 5-Ply corrugated boxes is 15-18%. This quote exceeds healthy benchmark targets.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: REVISIONS HISTORY */}
      {activeTab === 'revisions' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <RotateCcw className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`} />
              Quotation Revision History & Version Control
            </h3>
            <button
              onClick={() => setShowRevisionModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-sm"
            >
              + Create New Revision
            </button>
          </div>

          <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'border-slate-800 bg-slate-800/80 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                  <th className="p-3">Revision</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3">Quotation Amount (₹)</th>
                  <th className="p-3">Reason / Commercial Change</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {quote.revisions && quote.revisions.length > 0 ? (
                  quote.revisions.map((rev: any, idx: number) => (
                    <tr key={rev.id || idx} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className={`p-3 font-mono font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                        Rev {rev.revisionNumber}
                        {rev.revisionNumber === quote.revision && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>Current</span>
                        )}
                      </td>
                      <td className={`p-3 ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{rev.createdDate || 'N/A'}</td>
                      <td className={`p-3 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{rev.createdBy || 'Sales Executive'}</td>
                      <td className={`p-3 font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>₹{(rev.amount || baseAmount).toLocaleString('en-IN')}</td>
                      <td className={`p-3 ${darkMode ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>{rev.reason || 'Initial quotation base proposal'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(rev.status || 'Active')}`}>
                          {rev.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={`p-3 font-mono font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>Rev 1 (Base)</td>
                    <td className={`p-3 ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{quote.quotationDate || 'N/A'}</td>
                    <td className={`p-3 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{quote.salesExecutive || 'Sales Executive'}</td>
                    <td className={`p-3 font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>₹{baseAmount.toLocaleString('en-IN')}</td>
                    <td className={`p-3 ${darkMode ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>Initial Commercial Quote generated from Costing Model</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: AUDIT LOG & ACTIVITY */}
      {activeTab === 'timeline' && (
        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Clock className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`} />
            Activity Log & Quotation Audit Trail
          </h3>

          <div className="space-y-2 text-xs">
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <span className={`font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>Quotation Created: {quote.quotationNumber}</span>
                <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Initial revision base created for {quote.customerName} with total value ₹{baseAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <span className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-bold'}`}>{quote.quotationDate || 'Recent'}</span>
            </div>

            {quote.lead?.timeline?.map((t: any) => (
              <div key={t.id} className={`p-3.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{t.action}</span>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{t.remarks || `Action by ${t.user}`}</p>
                </div>
                <span className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-bold'}`}>{new Date(t.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE REVISION */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
              <div>
                <h3 className="text-base font-extrabold">Create New Quotation Revision</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revision {(quote.revision || 1) + 1} for {quote.quotationNumber}
                </p>
              </div>
              <button onClick={() => setShowRevisionModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRevision} className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>New Total Quotation Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={revisionForm.amount}
                  onChange={e => setRevisionForm({ ...revisionForm, amount: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Reason for Revision *</label>
                <select
                  value={revisionForm.reason}
                  onChange={e => setRevisionForm({ ...revisionForm, reason: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Client requested price renegotiation">Client requested price renegotiation</option>
                  <option value="Quantity batch size increased/decreased">Quantity batch size increased/decreased</option>
                  <option value="Paper GSM specification updated">Paper GSM specification updated</option>
                  <option value="Competitive rate matching">Competitive rate matching</option>
                  <option value="Freight terms revised to Delivered">Freight terms revised to Delivered</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Remarks & Commercial Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Discount of 3% provided on volume commitment of 5000 pcs"
                  value={revisionForm.remarks}
                  onChange={e => setRevisionForm({ ...revisionForm, remarks: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Revision {(quote.revision || 1) + 1}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE STATUS */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className="text-base font-extrabold">Change Quotation Status</h3>
              <button onClick={() => setShowStatusModal(false)} className={`p-1 cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Target Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Draft">Draft</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Under Revision">Under Revision / Negotiation</option>
                  <option value="Accepted">Customer Accepted</option>
                  <option value="Won">Won (Convert to Sales Order)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Status Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter remarks for audit history..."
                  value={statusRemarks}
                  onChange={e => setStatusRemarks(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(newStatus, statusRemarks)}
                  className="px-4 py-2 rounded-xl font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Status Update</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONVERT TO SALES ORDER */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Convert Quotation to Sales Order</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Forward confirmed specifications to Production Scheduling</p>
                </div>
              </div>
              <button onClick={() => setShowConvertModal(false)} className={`p-1 cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertToOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Customer PO Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO/2026/8942"
                    value={convertForm.customerPoNumber}
                    onChange={e => setConvertForm({ ...convertForm, customerPoNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Target Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={convertForm.deliveryDate}
                    onChange={e => setConvertForm({ ...convertForm, deliveryDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Order Quantity (Boxes) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={convertForm.quantity}
                    onChange={e => setConvertForm({ ...convertForm, quantity: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Unit Price (₹/Box) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={convertForm.unitPrice}
                    onChange={e => setConvertForm({ ...convertForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>Total Order Value:</span>
                <span className={`font-mono font-extrabold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  ₹{(convertForm.quantity * convertForm.unitPrice).toLocaleString('en-IN')} (+ 18% GST)
                </span>
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                  <span>Generate Confirmed Sales Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT / FORMAL PROPOSAL LETTER */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white text-slate-900 p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-extrabold text-slate-800">Formal Quotation Document Preview</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs hover:bg-teal-500 cursor-pointer"
                >
                  Print Document
                </button>
                <button onClick={() => setShowPrintModal(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Letterhead */}
            <div className="mt-6 space-y-6 text-xs text-slate-700">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">AMK CARTON MILLS LTD</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Corrugated Packaging & Industrial Paper Conversion</p>
                  <p className="text-[11px] text-slate-500">Plot 45-B, Peenya Industrial Area, Phase 2, Bengaluru - 560058</p>
                  <p className="text-[11px] text-slate-500 font-mono">GSTIN: 29AABCA1234F1Z8 | CIN: U21010KA2020PLC123456</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-teal-100 text-teal-800 font-mono font-bold text-xs">
                    {quote.quotationNumber}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Date: {quote.quotationDate}</p>
                  <p className="text-[11px] text-slate-500">Revision: Rev {quote.revision || 1}</p>
                  <p className="text-[11px] font-semibold text-rose-600">Valid Until: {quote.validUntil}</p>
                </div>
              </div>

              {/* To Customer Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Proposal Prepared For:</span>
                <p className="font-extrabold text-sm text-slate-900 mt-0.5">{quote.customerName}</p>
                <p className="text-[11px] text-slate-600">{quote.customer?.address || 'Industrial Area, Bengaluru'}</p>
                <p className="text-[11px] text-slate-600">Attn: {quote.customer?.contactPerson || quote.lead?.contactPerson || 'Procurement Incharge'}</p>
              </div>

              {/* Item Table */}
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700">
                    <th className="border border-slate-200 p-2 text-left">Item #</th>
                    <th className="border border-slate-200 p-2 text-left">Product Specification</th>
                    <th className="border border-slate-200 p-2 text-right">Quantity</th>
                    <th className="border border-slate-200 p-2 text-right">Unit Rate (₹)</th>
                    <th className="border border-slate-200 p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2">01</td>
                    <td className="border border-slate-200 p-2 font-semibold">
                      {quote.productName}
                      <div className="text-[10px] text-slate-500">{quote.costingSummary}</div>
                    </td>
                    <td className="border border-slate-200 p-2 text-right font-mono">{expectedQty.toLocaleString()} Pcs</td>
                    <td className="border border-slate-200 p-2 text-right font-mono">₹{unitPriceCalculated}</td>
                    <td className="border border-slate-200 p-2 text-right font-mono font-bold">₹{baseAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="border border-slate-200 p-2 text-right">Basic Taxable Value:</td>
                    <td className="border border-slate-200 p-2 text-right font-mono">₹{baseAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="border border-slate-200 p-2 text-right text-slate-600">GST @ 18%:</td>
                    <td className="border border-slate-200 p-2 text-right font-mono">₹{gstAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-teal-50 font-extrabold text-slate-900 text-sm">
                    <td colSpan={4} className="border border-slate-200 p-2 text-right">Net Grand Total:</td>
                    <td className="border border-slate-200 p-2 text-right font-mono text-teal-800">₹{grandTotal.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Prepared By:</p>
                  <p className="text-slate-600">{quote.salesExecutive || 'Rajesh Sharma'}</p>
                  <p className="text-[10px] text-slate-400">AMK Sales & Commercial Team</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">Authorized Signatory</p>
                  <p className="text-[10px] text-slate-400 mt-6">AMK Carton Mills Ltd</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BASIC DETAILS */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className="text-base font-extrabold">Edit Quotation Details</h3>
              <button onClick={() => setShowEditModal(false)} className={`p-1 cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuotation} className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.customerName}
                  onChange={e => setEditForm({ ...editForm, customerName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Product Name / Specification *</label>
                <input
                  type="text"
                  required
                  value={editForm.productName}
                  onChange={e => setEditForm({ ...editForm, productName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Quotation Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editForm.amount}
                    onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Valid Until Date</label>
                  <input
                    type="date"
                    value={editForm.validUntil}
                    onChange={e => setEditForm({ ...editForm, validUntil: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Costing Summary / Notes</label>
                <textarea
                  rows={2}
                  value={editForm.costingSummary}
                  onChange={e => setEditForm({ ...editForm, costingSummary: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
