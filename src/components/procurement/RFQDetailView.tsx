import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, FileText, Building2, Package, Tag, 
  Info, AlertTriangle, Loader2, Edit3, Award, CheckCircle2, Clock, 
  DollarSign, ShieldCheck, History, ExternalLink, RefreshCw, PlusCircle
} from 'lucide-react';
import { RFQItem, Supplier } from '../../types';

interface RFQDetailViewProps {
  darkMode: boolean;
  rfq: RFQItem | null;
  loading?: boolean;
  onClose?: () => void;
  onEdit?: (rfq: RFQItem) => void;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  standalonePage?: boolean;
  rfqId?: string;
}

export const RFQDetailView: React.FC<RFQDetailViewProps> = ({
  darkMode,
  rfq: initialRfq,
  loading: initialLoading = false,
  onClose,
  onEdit,
  getSupplierDisplayName,
  standalonePage = false,
  rfqId: propRfqId
}) => {
  const router = useRouter();
  const effectiveId = propRfqId || initialRfq?.id;
  const [rfq, setRfq] = useState<RFQItem | null>(initialRfq || null);
  const [loading, setLoading] = useState<boolean>(initialLoading || (!initialRfq && !!effectiveId));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(initialRfq?.status || 'Draft');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [converting, setConverting] = useState<boolean>(false);
  const [conversionMessage, setConversionMessage] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);
  const [linkedQuote, setLinkedQuote] = useState<any | null>(null);

  // Fetch RFQ Details
  const fetchRfqDetails = async () => {
    if (!effectiveId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfqs?id=${effectiveId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRfq(json.data);
        setStatus(json.data.status || 'Draft');
      } else {
        setError(json.message || 'Failed to load RFQ details');
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching RFQ details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Linked Supplier Quotes to check if converted
  const fetchLinkedQuotes = async () => {
    if (!effectiveId) return;
    try {
      const res = await fetch(`/api/supplier-quotes?rfqId=${effectiveId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setLinkedQuote(json.data[0]);
      } else {
        setLinkedQuote(null);
      }
    } catch (err) {
      console.error('Failed to fetch linked supplier quotes:', err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    if (!effectiveId) return;
    setLoadingAuditLogs(true);
    try {
      const res = await fetch(`/api/audit-logs?entity=RFQ&entityId=${effectiveId}`);
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
    if (!initialRfq && effectiveId) {
      fetchRfqDetails();
    } else if (initialRfq) {
      setRfq(initialRfq);
      setStatus(initialRfq.status || 'Draft');
    }
  }, [effectiveId, initialRfq]);

  useEffect(() => {
    if (effectiveId) {
      fetchLinkedQuotes();
      fetchAuditLogs();
    }
  }, [effectiveId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!rfq || newStatus === status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/rfqs?id=${rfq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rfq,
          status: newStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatus(newStatus);
        setRfq((prev: any) => ({ ...prev, status: newStatus }));
        fetchAuditLogs();
      } else {
        alert(json.message || 'Failed to update RFQ status');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating RFQ status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertToSupplierQuote = async () => {
    if (!rfq) return;
    if (linkedQuote) {
      alert(`A Supplier Quotation (${linkedQuote.quoteNumber || linkedQuote.quotationNumber}) already exists for this RFQ.`);
      return;
    }

    setConverting(true);
    setConversionMessage(null);
    try {
      const supplierObj = rfq.suppliers?.[0];
      const supplierId = supplierObj?.supplierId || (supplierObj as any)?.id || 'NO_SUPPLIER_ID';
      const supplierName = supplierObj?.supplierName || (supplierObj as any)?.name || '';

      const items = (rfq.materials || []).map((mat: any) => {
        const qty = Number(mat.quantity) || 1;
        const price = Number(mat.expectedPrice) || 0;
        return {
          materialCode: mat.materialCode || 'RM-ITEM',
          materialName: mat.name || 'Material Item',
          quantity: qty,
          unitPrice: price,
          discount: 0,
          tax: 18,
          totalPrice: qty * price * 1.18
        };
      });

      const totalAmount = items.reduce((sum: number, it: any) => sum + it.totalPrice, 0);

      const payload = {
        rfqId: rfq.id,
        supplierId: supplierId,
        supplierName: supplierName,
        quoteDate: new Date().toISOString().slice(0, 10),
        validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Submitted',
        remarks: `Converted from RFQ ${rfq.rfqNumber}`,
        items: items,
        totalAmount: totalAmount
      };

      const res = await fetch('/api/supplier-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success && json.data) {
        setLinkedQuote(json.data);
        setConversionMessage(`Converted to Supplier Quotation ${json.data.quoteNumber || ''} successfully!`);
        fetchAuditLogs();
      } else {
        alert(json.error || json.message || 'Failed to convert RFQ to Supplier Quotation.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error converting RFQ to Supplier Quotation.');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm font-medium text-slate-500">Fetching RFQ details...</p>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-sm font-medium text-slate-500">{error || 'RFQ information not found.'}</p>
        <button
          onClick={() => {
            if (onClose) onClose();
            else router.push('/procurement/rfq');
          }}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to RFQs</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar for Standalone Page */}
      <div className={`p-5 rounded-3xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (onClose) onClose();
                else router.push('/procurement/rfq');
              }}
              className="p-2.5 rounded-2xl border text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Back to RFQs List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  RFQ View Page
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-mono text-slate-400">{rfq.id}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-0.5">
                {rfq.rfqNumber}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (onEdit) {
                  if (onClose) onClose();
                  onEdit(rfq);
                } else {
                  router.push(`/procurement/rfq/${rfq.id}/edit`);
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit RFQ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center space-x-2 text-emerald-500 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">RFQ Identification</span>
              </div>
              <h3 className="text-lg font-black">{rfq.rfqNumber}</h3>
              <div className="space-y-1 mt-2 text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created Date: <strong className="text-slate-700 dark:text-slate-300">{rfq.rfqDate}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target Delivery: <strong className="text-amber-500">{rfq.deliveryDate}</strong></span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center space-x-2 text-indigo-500 mb-2">
                <Tag className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Department & Priority</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  rfq.priority === 'High' 
                    ? 'bg-rose-500/15 text-rose-500 border-rose-500/20' 
                    : 'bg-blue-500/15 text-blue-500 border-blue-500/20'
                }`}>
                  {rfq.priority} Priority
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800/40 text-slate-300 border border-slate-700">
                  {rfq.department || 'Procurement'}
                </span>
              </div>
            </div>
          </div>

          {/* Awarded / Supplier Quotation Conversion Section */}
          {status === 'Awarded' && (
            <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/60 border-emerald-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-500">
                  <Award className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    RFQ Awarded - Supplier Quotation Status
                  </h3>
                </div>
              </div>

              {conversionMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                  {conversionMessage}
                </div>
              )}

              {linkedQuote ? (
                <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Converted Supplier Quotation</div>
                    <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {linkedQuote.quoteNumber || linkedQuote.quotationNumber || 'SQ-0001'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Status: <span className="font-bold text-emerald-500">{linkedQuote.status || 'Submitted'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/procurement/supplier-quotations/${linkedQuote.id}`)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <span>View Supplier Quotation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    This RFQ has been marked as <strong>Awarded</strong>. You can now convert it into an official Supplier Quotation record in the database.
                  </p>
                  <button
                    onClick={handleConvertToSupplierQuote}
                    disabled={converting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {converting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Converting to Supplier Quotation...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Convert to Supplier Quotation</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Invited Suppliers */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center space-x-2 text-slate-400">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Invited Suppliers</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(rfq.suppliers || []).map((s, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-2xl border flex items-center space-x-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                      {getSupplierDisplayName(s?.supplierId || (s as any)?.id, s?.supplierName, (s as any)?.millName, s)}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{s?.email || 'No email provided'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materials Table */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center space-x-2 text-slate-400">
              <Package className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Requested Materials</h3>
            </div>
            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Material Code / Name</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Required Date</th>
                    <th className="p-3 text-right">Expected Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {(rfq.materials || []).map((mat, idx) => (
                    <tr key={idx} className={darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-white'}>
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{mat?.name || 'Item'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{mat?.materialCode || ''}</div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-500">{(Number(mat?.quantity) || 0).toLocaleString()}</td>
                      <td className="p-3 font-medium text-slate-500">{mat?.unit || ''}</td>
                      <td className="p-3 font-medium text-amber-500">{mat?.requiredDate || ''}</td>
                      <td className="p-3 text-right font-mono font-bold">₹{mat?.expectedPrice ? Number(mat.expectedPrice).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {(rfq.description || rfq.remarks) && (
            <div className={`p-5 rounded-3xl border shadow-sm space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center space-x-2 text-slate-400">
                <Info className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Description & Remarks</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {rfq.description && (
                  <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">RFQ Description</span>
                    <p>{rfq.description}</p>
                  </div>
                )}
                {rfq.remarks && (
                  <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Internal Remarks</span>
                    <p>{rfq.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Status Management Box */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center space-x-2 text-indigo-500">
              <Tag className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">RFQ Status Control</h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-slate-500 font-medium block">Change Status</label>
              <select
                value={status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`w-full p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  status === 'Awarded'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : status === 'Evaluated'
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                    : status === 'Response Received'
                    ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30'
                    : status === 'Sent to Supplier'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                }`}
              >
                <option value="Draft">Draft</option>
                <option value="Sent to Supplier">Sent to Supplier</option>
                <option value="Response Received">Response Received</option>
                <option value="Evaluated">Evaluated</option>
                <option value="Awarded">Awarded</option>
              </select>

              {updatingStatus && (
                <div className="flex items-center space-x-2 text-xs text-emerald-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating status in database...</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/40 text-[11px] text-slate-500 space-y-1">
              <div>Created By: <span className="font-medium text-slate-700 dark:text-slate-300">Administrator</span></div>
              <div>Created Date: <span className="font-medium text-slate-700 dark:text-slate-300">{rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : rfq.rfqDate}</span></div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className={`p-5 rounded-3xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-500">
                <History className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Status & Audit History</h3>
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
                      <p className="text-slate-400">{log.details || 'RFQ modified'}</p>
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
