import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, FileText, Building2, Package, Tag, 
  Info, AlertTriangle, Loader2, Edit3, Award, CheckCircle2, Clock, 
  DollarSign, ShieldCheck, History, ExternalLink, RefreshCw, Trash2, Sparkles
} from 'lucide-react';
import { Supplier } from '../../types';
import { procurementService } from './procurementService';

interface SupplierQuoteDetailViewProps {
  darkMode: boolean;
  quoteId: string;
  quoteData?: any;
  loading?: boolean;
  onClose?: () => void;
  getSupplierDisplayName?: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
}

export const SupplierQuoteDetailView: React.FC<SupplierQuoteDetailViewProps> = ({
  darkMode,
  quoteId,
  quoteData: initialQuoteData,
  loading: initialLoading = false,
  onClose,
  getSupplierDisplayName
}) => {
  const router = useRouter();
  const [quote, setQuote] = useState<any>(initialQuoteData || null);
  const [loading, setLoading] = useState<boolean>(initialLoading || (!initialQuoteData && !!quoteId));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(initialQuoteData?.status || 'Submitted');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);

  // Fetch Supplier Quote details if not provided
  const fetchQuoteDetails = async () => {
    if (!quoteId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier-quotes?id=${quoteId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setQuote(json.data);
        setStatus(json.data.status || 'Submitted');
      } else {
        setError(json.message || 'Failed to load supplier quotation details');
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching supplier quotation details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch status history / audit logs
  const fetchAuditLogs = async () => {
    if (!quoteId) return;
    setLoadingAuditLogs(true);
    try {
      const res = await fetch(`/api/audit-logs?entity=SupplierQuotation&entityId=${quoteId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAuditLogs(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    if (!initialQuoteData && quoteId) {
      fetchQuoteDetails();
    } else if (initialQuoteData) {
      setQuote(initialQuoteData);
      setStatus(initialQuoteData.status || 'Submitted');
    }
  }, [quoteId, initialQuoteData]);

  useEffect(() => {
    if (quoteId) {
      fetchAuditLogs();
    }
  }, [quoteId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!quote || newStatus === status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/supplier-quotes?id=${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quote,
          status: newStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatus(newStatus);
        setQuote((prev: any) => ({ ...prev, status: newStatus }));
        fetchAuditLogs();
      } else {
        alert(json.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [deleting, setDeleting] = useState<boolean>(false);

  const handleDeleteQuote = async () => {
    if (!quote) return;
    const quoteNum = quote.quoteNumber || quote.quotationNumber || `Quote #${quote.id}`;
    if (!window.confirm(`Are you sure you want to delete Supplier Quotation ${quoteNum}? It will be moved to the Recycle Bin and can be restored anytime.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/supplier-quotes?id=${quote.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert(`Supplier Quotation ${quoteNum} has been moved to the Recycle Bin.`);
        router.push('/procurement/supplier-quotations');
      } else {
        alert(data.error || data.message || 'Failed to delete Supplier Quotation');
      }
    } catch (err: any) {
      alert(err?.message || 'Error deleting Supplier Quotation');
    } finally {
      setDeleting(false);
    }
  };

  const [convertingPo, setConvertingPo] = useState<boolean>(false);

  // Convert Quote to Purchase Order directly
  const handleConvertToPo = async () => {
    if (!quote) return;
    setConvertingPo(true);
    try {
      const itemsList = (quote.items && quote.items.length > 0)
        ? quote.items.map((it: any) => ({
            materialCode: it.materialCode || 'RM-KRAFT-180',
            materialName: it.materialName || it.name || 'Kraft Paper Roll',
            quantityOrdered: Number(it.quantity || 1),
            quantityReceived: 0,
            unitPrice: Number(it.unitPrice || 0),
            total: Number(it.totalAmount || (it.quantity * it.unitPrice))
          }))
        : [{
            materialCode: 'RM-KRAFT-180',
            materialName: 'Kraft Paper Roll',
            quantityOrdered: Number(quote.quantity || 1000),
            quantityReceived: 0,
            unitPrice: Number(quote.unitPrice || 50),
            total: Number(quote.totalPrice || quote.totalAmount || 50000)
          }];

      const totalAmt = itemsList.reduce((acc: number, it: any) => acc + (Number(it.total) || 0), 0);
      const delDays = Number(quote.deliveryDays) || 7;
      let delDate = quote.deliveryDate || quote.validUntil;
      if (!delDate || isNaN(new Date(delDate).getTime())) {
        delDate = new Date(Date.now() + delDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      }

      const payload = {
        rfqNumber: quote.rfqNumber || undefined,
        rfqId: quote.rfqId || undefined,
        quoteId: quote.id,
        supplierId: quote.supplierId || quote.supplier?.id,
        date: new Date().toISOString().slice(0, 10),
        deliveryDate: delDate,
        status: 'Approved' as const,
        remarks: `Generated from Supplier Quotation: ${quote.quotationNumber || quote.quoteNumber || quote.id}.`,
        totalAmount: totalAmt,
        items: itemsList
      };

      const res = await procurementService.createPurchaseOrder(payload);
      if (res.success) {
        // Also update quote status to Awarded
        try {
          await fetch(`/api/supplier-quotes?id=${quote.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...quote, status: 'Awarded' })
          });
        } catch (e) {
          console.warn('Could not update quote status:', e);
        }
        alert('Purchase Order successfully generated!');
        router.push('/procurement/po');
      } else {
        alert(res.error || 'Failed to generate Purchase Order.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error converting quote to PO.');
    } finally {
      setConvertingPo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-slate-500">Fetching supplier quotation details...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-sm font-medium text-slate-500">{error || 'Supplier quotation not found.'}</p>
        <button
          onClick={() => router.push('/procurement/supplier-quotations')}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Supplier Quotations</span>
        </button>
      </div>
    );
  }

  const items = quote.items || [];
  const supplierName = quote.supplier?.supplierName || quote.supplierName || 'Supplier';
  const millName = quote.supplier?.millName || quote.millName;
  const supplierDisplay = getSupplierDisplayName 
    ? getSupplierDisplayName(quote.supplierId, supplierName, millName, quote.supplier)
    : `${supplierName}${millName ? ` (${millName})` : ''}`;

  const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unitPrice) - (Number(item.discount) || 0)), 0);
  const taxTotal = items.reduce((acc: number, item: any) => {
    const base = Number(item.quantity) * Number(item.unitPrice) - (Number(item.discount) || 0);
    const taxPct = Number(item.tax) || Number(item.taxPercent) || 0;
    return acc + (base * taxPct / 100);
  }, 0);
  const grandTotal = quote.totalAmount || (subtotal + taxTotal);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Navigation & Action Header */}
      <div className={`p-5 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/procurement/supplier-quotations')}
              className="p-2.5 rounded-2xl border text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Back to Supplier Quotations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  Supplier Quotation View
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-mono text-slate-400">{quote.id}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-0.5 flex items-center space-x-3">
                <span>{quote.quoteNumber || quote.quotationNumber || 'SQ-UNKNOWN'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDeleteQuote}
              disabled={deleting}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Move to Recycle Bin"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete</span>
            </button>
            <button
              onClick={() => router.push(`/procurement/supplier-quotations/${quote.id}/edit`)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleConvertToPo}
              disabled={convertingPo}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {convertingPo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{convertingPo ? 'Generating PO...' : 'Generate Purchase Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 columns: Quotation Info & Line Items */}
        <div className="md:col-span-2 space-y-6">
          {/* Header Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier Details */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center space-x-2 text-cyan-500 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Supplier Information</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{supplierDisplay}</h3>
              <p className="text-xs text-slate-500 mt-1">Supplier Code: <span className="font-mono text-slate-400">{quote.supplier?.supplierCode || 'N/A'}</span></p>
              {quote.supplier?.category && (
                <div className="mt-2 text-[11px] text-slate-500">
                  Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{quote.supplier.category}</span>
                </div>
              )}
            </div>

            {/* Linked RFQ & Dates */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center space-x-2 text-emerald-500 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Reference & Dates</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {quote.rfq || quote.rfqId ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Linked RFQ:</span>
                    <button
                      onClick={() => router.push(`/procurement/rfq/${quote.rfqId || quote.rfq?.id}`)}
                      className="text-emerald-500 hover:text-emerald-400 font-bold font-mono flex items-center space-x-1 underline decoration-dotted"
                    >
                      <span>{quote.rfq?.rfqNumber || quote.rfqNumber || 'View RFQ'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Linked RFQ:</span>
                    <span className="text-slate-400 italic">Direct Quotation (No RFQ)</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Quotation Date:</span>
                  <span className="font-bold">{quote.quoteDate || quote.quotationDate || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-bold text-amber-500">{quote.validityDate || quote.validUntil || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center space-x-2 text-slate-400">
              <Package className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Quoted Line Items</h3>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Material</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">Tax (GST)</th>
                    <th className="p-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 italic">No line items specified.</td>
                    </tr>
                  ) : (
                    items.map((item: any, idx: number) => {
                      const qty = Number(item.quantity) || 0;
                      const price = Number(item.unitPrice) || 0;
                      const disc = Number(item.discount) || 0;
                      const taxPct = Number(item.tax) || Number(item.taxPercent) || 0;
                      const itemBase = qty * price - disc;
                      const itemTax = itemBase * (taxPct / 100);
                      const itemTotal = item.totalPrice || item.totalAmount || (itemBase + itemTax);

                      return (
                        <tr key={idx} className={darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-white'}>
                          <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.materialName || 'Material'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.materialCode || ''}</div>
                          </td>
                          <td className="p-3 text-right font-semibold">{qty.toLocaleString()} {item.unit || 'Kg'}</td>
                          <td className="p-3 text-right font-mono">₹{price.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-rose-500">₹{disc.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-indigo-400">{taxPct}% (₹{itemTax.toLocaleString()})</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-500">₹{itemTotal.toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className={`w-full max-w-xs p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>GST / Taxes:</span>
                  <span className="font-mono font-bold text-indigo-500">₹{taxTotal.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-700/50 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-500">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Remarks */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center space-x-2 text-slate-400">
              <Info className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Commercial Terms & Remarks</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Payment Terms</span>
                <p className="font-medium">{quote.paymentTerms || 'As per standard agreement'}</p>
              </div>
              <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Delivery Terms</span>
                <p className="font-medium">{quote.deliveryTerms || quote.deliveryDays ? `Delivery within ${quote.deliveryDays} days` : 'Ex-Factory'}</p>
              </div>
            </div>

            {quote.remarks && (
              <div className={`p-3.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Remarks / Special Notes</span>
                <p>{quote.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 column: Status Management & Audit History */}
        <div className="space-y-6">
          {/* Status Management Box */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center space-x-2 text-indigo-500">
              <Tag className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Quotation Status</h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-slate-500 font-medium block">Current Status</label>
              <select
                value={status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`w-full p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  status === 'Accepted'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : status === 'Under Review'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                }`}
              >
                <option value="Submitted">Submitted (Received from Supplier)</option>
                <option value="Under Review">Under Review (Evaluating Terms & Price)</option>
                <option value="Accepted">Accepted (Approved for PO)</option>
              </select>

              {updatingStatus && (
                <div className="flex items-center space-x-2 text-xs text-emerald-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating status in database...</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/40 text-[11px] text-slate-500 space-y-1">
              <div>Created Date: <span className="font-medium text-slate-700 dark:text-slate-300">{quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}</span></div>
              <div>Last Updated: <span className="font-medium text-slate-700 dark:text-slate-300">{quote.updatedAt ? new Date(quote.updatedAt).toLocaleDateString() : 'N/A'}</span></div>
            </div>
          </div>

          {/* Activity / Status History Timeline */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-500">
                <History className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Status History & Audit Trail</h3>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingAuditLogs ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading audit history...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">No history records found yet.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {auditLogs.map((log: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-2xl border text-xs space-y-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-500">{log.action || 'Activity'}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp || log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.oldValue && log.newValue ? (
                      <p className="text-slate-400">
                        Changed status from <span className="font-bold text-slate-300">{log.oldValue}</span> to <span className="font-bold text-emerald-400">{log.newValue}</span>
                      </p>
                    ) : (
                      <p className="text-slate-400">{log.details || 'Record modified'}</p>
                    )}
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>By: {log.user || 'Administrator'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
