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
  Trash2
} from 'lucide-react';

interface LeadWorkflowWorkspacePageProps {
  darkMode: boolean;
  leadId?: string;
  leadData?: any;
  onBack: () => void;
  onRefreshParent?: () => void;
  onSelectModule?: (module: string) => void;
  onNavigateToCostingBom?: (leadId: string, customerId?: string) => void;
  onNavigateToQuotation?: (quotationId: string) => void;
}

export const LeadWorkflowWorkspacePage: React.FC<LeadWorkflowWorkspacePageProps> = ({
  darkMode,
  leadId,
  leadData: initialLeadData,
  onBack,
  onRefreshParent,
  onSelectModule,
  onNavigateToCostingBom,
  onNavigateToQuotation
}) => {
  const [lead, setLead] = useState<any>(initialLeadData || null);
  const [loading, setLoading] = useState(!initialLeadData && !!leadId);
  const [activeTab, setActiveTab] = useState<'overview' | 'commercials' | 'timeline'>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // PO Capture Modal state
  const [showPoModal, setShowPoModal] = useState(false);
  const [poForm, setPoForm] = useState({
    customerPoNumber: '',
    customerPoDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Edit Lead Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
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
    followUpDate: '',
    remarks: ''
  });

  // Add Note Modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  const effectiveLeadId = lead?.id || leadId || initialLeadData?.id;

  const fetchLeadDetails = async (idToFetch?: string) => {
    const id = idToFetch || effectiveLeadId;
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLead(data.data);
        setEditForm({
          customerName: data.data.customerName || '',
          contactPerson: data.data.contactPerson || '',
          phone: data.data.phone || '',
          email: data.data.email || '',
          productRequirement: data.data.productRequirement || '',
          productDescription: data.data.productDescription || '',
          expectedQuantity: data.data.expectedQuantity || 1000,
          requiredDeliveryDate: data.data.requiredDeliveryDate || '',
          specifications: data.data.specifications || '',
          sampleRequired: data.data.sampleRequired || false,
          sampleDetails: data.data.sampleDetails || '',
          assignedSalesExecutive: data.data.assignedSalesExecutive || 'Rajesh Sharma',
          leadSource: data.data.leadSource || 'Direct Enquiry',
          followUpDate: data.data.followUpDate || '',
          remarks: data.data.remarks || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveLeadId) {
      fetchLeadDetails(effectiveLeadId);
    }
  }, [effectiveLeadId]);

  const handleCopyLeadNumber = () => {
    if (lead?.leadNumber) {
      navigator.clipboard.writeText(lead.leadNumber);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const notifySuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const notifyError = (msg: string) => {
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(''), 4000);
  };

  // Stage Advancement Handlers
  const handleAdvanceStage = async (nextStatus: string, remarks?: string) => {
    if (!lead?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, remarks })
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess(`Lead stage advanced to "${nextStatus}" successfully!`);
        await fetchLeadDetails();
        if (onRefreshParent) onRefreshParent();
      } else {
        notifyError(data.error || 'Failed to advance stage');
      }
    } catch (err: any) {
      notifyError(err.message || 'Server error while advancing stage');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToCosting = async () => {
    if (!lead?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}/send-to-costing`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess('Lead specifications successfully forwarded to Costing & Production Planning Module!');
        await fetchLeadDetails();
        if (onRefreshParent) onRefreshParent();
      } else {
        notifyError(data.error || 'Failed to forward to costing');
      }
    } catch (err: any) {
      notifyError(err.message || 'Error forwarding to costing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBom = async () => {
    if (!lead?.id) return;
    setActionLoading(true);
    try {
      if (lead.status === 'Lead' || lead.status === 'Details Taken / Sample Details') {
        await fetch(`/api/sales/leads/${lead.id}/stage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Costing', remarks: 'Initiated BOM creation in Costing Module' })
        });
      }

      if (onNavigateToCostingBom) {
        onNavigateToCostingBom(lead.id, lead.customerId || undefined);
      } else if (onSelectModule) {
        onSelectModule('costing_bom');
      }
    } catch (err: any) {
      notifyError(err.message || 'Error opening BOM creator');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCapturePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}/customer-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowPoModal(false);
        notifySuccess('Customer Purchase Order captured! Deal marked as Won.');
        await fetchLeadDetails();
        if (onRefreshParent) onRefreshParent();
      } else {
        notifyError(data.error || 'Failed to capture PO');
      }
    } catch (err: any) {
      notifyError(err.message || 'Error capturing customer PO');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSalesOrder = async () => {
    if (!lead?.id) return;
    if (!confirm('Are you sure you want to convert this won lead into an official Sales Order and forward it to Corrugation Production Planning?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}/convert`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess('Lead successfully converted to Sales Order!');
        await fetchLeadDetails();
        if (onRefreshParent) onRefreshParent();
      } else {
        notifyError(data.error || 'Failed to convert lead');
      }
    } catch (err: any) {
      notifyError(err.message || 'Error converting lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!lead?.id) return;
    if (!confirm(`Are you sure you want to delete lead "${lead.leadNumber}" for "${lead.customerName}"? It will be moved to the Recycle Bin.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('Lead moved to Recycle Bin successfully');
        if (onRefreshParent) onRefreshParent();
        onBack();
      } else {
        notifyError(data.error || 'Failed to delete lead');
      }
    } catch (err: any) {
      notifyError(err.message || 'Error deleting lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLeadInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        notifySuccess('Lead details updated successfully!');
        await fetchLeadDetails();
        if (onRefreshParent) onRefreshParent();
      } else {
        notifyError(data.error || 'Failed to update lead');
      }
    } catch (err: any) {
      notifyError(err.message || 'Error updating lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id || !noteText.trim()) return;
    setActionLoading(true);
    try {
      // Advance with same status to record audit note
      const res = await fetch(`/api/sales/leads/${lead.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: lead.status, remarks: noteText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNoteText('');
        setShowNoteModal(false);
        notifySuccess('Note added to timeline!');
        await fetchLeadDetails();
      } else {
        notifyError(data.error || 'Failed to add note');
      }
    } catch (err: any) {
      notifyError(err.message || 'Error adding note');
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow Stages List
  const workflowStages = [
    { key: 'Lead', label: 'Lead', subtext: 'Customer Enquiry' },
    { key: 'Details Taken / Sample Details', label: 'Details / Sample', subtext: 'Specs Captured' },
    { key: 'Costing', label: 'Costing', subtext: 'Cost Estimation' },
    { key: 'Proposal Sent', label: 'Proposal Sent', subtext: 'Quote Dispatched' },
    { key: 'Negotiation', label: 'Negotiation', subtext: 'Terms Review' },
    { key: 'Won', label: 'Deal Won', subtext: 'Customer PO Received' },
    { key: 'Converted', label: 'Converted', subtext: 'Active in Production' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Won':
        return darkMode
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold';
      case 'Converted':
        return darkMode
          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
          : 'bg-blue-100 text-blue-950 border-blue-400 font-bold';
      case 'Costing':
        return darkMode
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          : 'bg-amber-100 text-amber-950 border-amber-400 font-bold';
      case 'Proposal Sent':
      case 'Negotiation':
        return darkMode
          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
          : 'bg-purple-100 text-purple-950 border-purple-400 font-bold';
      case 'Details Taken / Sample Details':
        return darkMode
          ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
          : 'bg-teal-100 text-teal-950 border-teal-400 font-bold';
      default:
        return darkMode
          ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
          : 'bg-slate-200 text-slate-950 border-slate-400 font-bold';
    }
  };

  const currentStageIdx = workflowStages.findIndex(s => s.key === lead?.status);

  if (loading) {
    return (
      <div className={`min-h-[500px] flex flex-col items-center justify-center space-y-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading Lead Workflow Workspace...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className={`p-8 rounded-2xl border text-center my-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Sales Lead Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">The requested lead record could not be loaded or has been removed.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Leads Directory
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-20 max-w-7xl mx-auto ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Toast Alert Notifications */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg('')} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-semibold ${
              darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Leads</span>
          </button>

          <div className={`hidden sm:flex items-center space-x-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            <span className="cursor-pointer hover:underline" onClick={onBack}>Sales & Dispatch</span>
            <ChevronRight className={`w-3 h-3 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
            <span className="cursor-pointer hover:underline" onClick={onBack}>Leads & Pipeline</span>
            <ChevronRight className={`w-3 h-3 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
            <span className={`font-semibold ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>Lead Workspace</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchLeadDetails()}
            disabled={loading || actionLoading}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
            title="Refresh lead workspace data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Details</span>
          </button>

          <button
            onClick={() => window.print()}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Printer className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            onClick={handleDeleteLead}
            disabled={actionLoading}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer text-red-500 hover:bg-red-500/10 border-red-500/20`}
            title="Delete Lead (Move to Recycle Bin)"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Main Header Hero Card */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold flex items-center space-x-1.5 ${
                darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <span>{lead.leadNumber}</span>
                <button
                  onClick={handleCopyLeadNumber}
                  className="hover:text-slate-900 transition-colors"
                  title="Copy Lead Number"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className={`w-3 h-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />}
                </button>
              </span>

              <div className="relative flex items-center">
                <select
                  value={lead.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    if (newStatus !== lead.status) {
                      handleAdvanceStage(newStatus);
                    }
                  }}
                  disabled={actionLoading}
                  className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${getStatusBadge(lead.status)}`}
                  title="Click to manually change lead stage"
                >
                  <option value="Lead" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Lead Stage</option>
                  <option value="Details Taken / Sample Details" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Details / Sample Taken</option>
                  <option value="Costing" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Costing</option>
                  <option value="Proposal Sent" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Proposal Sent</option>
                  <option value="Negotiation" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Negotiation</option>
                  <option value="Won" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Won (PO Received)</option>
                  <option value="Converted" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Converted to Order</option>
                  <option value="Lost" className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Lost / Disqualified</option>
                </select>
              </div>

              {lead.customerPoNumber && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>PO #{lead.customerPoNumber}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center space-x-2 text-slate-900 dark:text-white">
              <span>{lead.customerName}</span>
            </h1>
            <p className={`text-xs sm:text-sm mt-1 font-medium flex items-center space-x-2 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
              <span>Requirement: <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>{lead.productRequirement}</strong></span>
              <span>•</span>
              <span>Qty: <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>{lead.expectedQuantity.toLocaleString()} Pcs</strong></span>
            </p>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Sales Executive</span>
              <p className="text-xs font-bold mt-0.5 truncate text-slate-900 dark:text-slate-100">{lead.assignedSalesExecutive || 'Rajesh Sharma'}</p>
            </div>
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Target Delivery</span>
              <p className="text-xs font-bold mt-0.5 truncate text-slate-900 dark:text-slate-100">{lead.requiredDeliveryDate || 'Immediate / Flexible'}</p>
            </div>
            <div className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Sample Status</span>
              <p className="text-xs font-bold mt-0.5 truncate">
                {lead.sampleRequired ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Sample Required</span>
                ) : (
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-700'}>Standard Spec</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Step Enterprise Workflow Stepper */}
      <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Enterprise Sales Workflow Progression</span>
            </h3>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Corrugated Packaging Order Execution Lifecycle</p>
          </div>
          <span className={`text-xs font-mono font-bold ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>
            Step {currentStageIdx >= 0 ? currentStageIdx + 1 : 1} of {workflowStages.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {workflowStages.map((stage, idx) => {
            const isDone = currentStageIdx >= idx;
            const isCurrent = lead.status === stage.key;

            return (
              <button
                key={stage.key}
                onClick={() => {
                  if (stage.key !== lead.status) {
                    handleAdvanceStage(stage.key);
                  }
                }}
                disabled={actionLoading}
                title={`Click to manually switch lead to "${stage.label}" stage`}
                className={`p-3 rounded-xl border relative transition-all text-left flex flex-col justify-between cursor-pointer hover:scale-[1.02] ${
                  isCurrent
                    ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                    : isDone
                    ? darkMode
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:border-emerald-400/60'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold hover:border-emerald-400'
                    : darkMode
                    ? 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-800 font-semibold hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-emerald-700'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-700 font-extrabold'
                  }`}>
                    {isDone && !isCurrent ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </span>
                  {isCurrent && (
                    <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping"></span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-extrabold leading-tight">{stage.label}</h4>
                  <p className={`text-[10px] mt-0.5 leading-snug truncate ${isCurrent ? 'text-emerald-100' : darkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                    {stage.subtext}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Action & Next Steps Progression Console */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        darkMode ? 'bg-gradient-to-r from-slate-900 to-slate-850 border-slate-850' : 'bg-gradient-to-r from-slate-50 to-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Next Workflow Action</span>
            </span>
            <h3 className="text-base font-bold mt-1 text-slate-900 dark:text-white">
              {lead.status === 'Lead' && 'Qualify Requirements & Capture Sample Parameters'}
              {lead.status === 'Details Taken / Sample Details' && 'Forward Corrugation Specs to Costing & Production Planning'}
              {lead.status === 'Costing' && 'Review Cost Calculations & Dispatch Formal Proposal / Quotation'}
              {lead.status === 'Proposal Sent' && 'Follow Up With Client / Capture Negotiation Notes or Customer PO'}
              {lead.status === 'Negotiation' && 'Finalize Terms & Capture Official Customer Purchase Order (Won)'}
              {lead.status === 'Won' && 'Convert Won Deal into Sales Order & Allocate to Corrugator Schedule'}
              {lead.status === 'Converted' && 'Lead Converted to Live Sales Order & In Production'}
              {lead.status === 'Lost' && 'Lead Marked as Lost / Disqualified'}
            </h3>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
              Current stage status: <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>{lead.status}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Direct Manual Stage Switcher Dropdown */}
            <div className="flex items-center space-x-2 border-r pr-3 border-slate-200 dark:border-slate-800">
              <span className={`text-[11px] font-bold hidden sm:inline ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Set Stage:</span>
              <select
                value={lead.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  if (newStatus !== lead.status) {
                    handleAdvanceStage(newStatus);
                  }
                }}
                disabled={actionLoading}
                className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                }`}
                title="Manually override and change stage"
              >
                <option value="Lead">1. Lead</option>
                <option value="Details Taken / Sample Details">2. Details / Sample Taken</option>
                <option value="Costing">3. Costing</option>
                <option value="Proposal Sent">4. Proposal Sent</option>
                <option value="Negotiation">5. Negotiation</option>
                <option value="Won">6. Won (PO Received)</option>
                <option value="Converted">7. Converted to Order</option>
                <option value="Lost">8. Lost / Disqualified</option>
              </select>
            </div>

            {lead.status === 'Lead' && (
              <button
                onClick={() => handleAdvanceStage('Details Taken / Sample Details')}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-2 cursor-pointer shadow-lg shadow-blue-500/25 transition-all"
              >
                <span>Advance: Mark Details & Sample Taken</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {lead.status === 'Details Taken / Sample Details' && (
              <>
                <button
                  onClick={handleCreateBom}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-2 cursor-pointer shadow-lg shadow-amber-600/25 transition-all"
                >
                  <Layers className="w-4 h-4" />
                  <span>Create BOM in Costing</span>
                </button>
                <button
                  onClick={handleSendToCosting}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center space-x-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Forward to Costing</span>
                </button>
              </>
            )}

            {lead.status === 'Costing' && (
              <>
                <button
                  onClick={handleCreateBom}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-2 cursor-pointer shadow-lg shadow-amber-600/25 transition-all"
                >
                  <Layers className="w-4 h-4" />
                  <span>Open BOM in Costing</span>
                </button>
                <button
                  onClick={() => handleAdvanceStage('Proposal Sent')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center space-x-2 cursor-pointer shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Mark Formal Proposal Sent</span>
                </button>
              </>
            )}

            {(lead.status === 'Proposal Sent' || lead.status === 'Negotiation') && (
              <>
                {lead.status === 'Proposal Sent' && (
                  <button
                    onClick={() => handleAdvanceStage('Negotiation')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 flex items-center space-x-1.5 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Enter Negotiation</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setPoForm({
                      customerPoNumber: lead.customerPoNumber || '',
                      customerPoDate: lead.customerPoDate || new Date().toISOString().split('T')[0],
                      remarks: ''
                    });
                    setShowPoModal(true);
                  }}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Customer PO Received (Mark Won)</span>
                </button>
              </>
            )}

            {lead.status === 'Won' && (
              <button
                onClick={handleConvertToSalesOrder}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-2 shadow-xl shadow-emerald-600/30 cursor-pointer transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Convert to Sales Order & Forward to Planning</span>
              </button>
            )}

            {lead.status === 'Converted' && (
              <span className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Active in Corrugation Planning</span>
              </span>
            )}

            <button
              onClick={() => setShowNoteModal(true)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
              <span>Add Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-500'
              : darkMode
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-700 hover:text-slate-900 font-bold'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Carton Specifications & Details</span>
        </button>
        <button
          onClick={() => setActiveTab('commercials')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'commercials'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-500'
              : darkMode
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-700 hover:text-slate-900 font-bold'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Commercials & Customer PO</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-500'
              : darkMode
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-700 hover:text-slate-900 font-bold'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Workflow Timeline & Audit Log ({lead.timeline?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Overview & Specifications */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Customer Profile */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center space-x-2 pb-2 border-b ${darkMode ? 'text-emerald-500 border-slate-800' : 'text-emerald-700 border-slate-200'}`}>
              <Building2 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Customer & Contact Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Company / Client Name</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">{lead.customerName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Contact Person</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.contactPerson || 'N/A'}</span>
                </div>
                <div>
                  <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Phone</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.phone || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Email Address</span>
                <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{lead.email || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Lead Source</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.leadSource || 'Direct Enquiry'}</span>
                </div>
                <div>
                  <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Follow-Up Date</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.followUpDate || 'None Scheduled'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Packaging & Corrugation Box Specs */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 lg:col-span-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className={`flex items-center space-x-2 ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>
                <Package className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Corrugated Box Specs & Requirements</h3>
              </div>
              <span className={`text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                Order Target: <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-black'}>{lead.expectedQuantity.toLocaleString()} Pcs</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Product Requirement / Box Type</span>
                <p className="font-extrabold text-sm mt-0.5 text-slate-900 dark:text-white">{lead.productRequirement}</p>
              </div>

              <div>
                <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Required Delivery Date</span>
                <p className="font-semibold mt-0.5 text-slate-900 dark:text-slate-200">{lead.requiredDeliveryDate || 'As per production batch'}</p>
              </div>

              <div className="sm:col-span-2">
                <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Product Description</span>
                <p className={`mt-1 p-2.5 rounded-xl border font-medium ${
                  darkMode ? 'text-slate-300 bg-slate-800/30 border-slate-700/50' : 'text-slate-900 bg-slate-50 border-slate-200'
                }`}>
                  {lead.productDescription || 'Standard corrugated shipping carton container specifications.'}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Technical Specifications & Board Quality</span>
                <p className={`mt-1 p-2.5 rounded-xl border font-medium ${
                  darkMode ? 'text-slate-300 bg-slate-800/30 border-slate-700/50' : 'text-slate-900 bg-slate-50 border-slate-200'
                }`}>
                  {lead.specifications || 'Standard Kraft liner + semi-chemical fluting medium specifications.'}
                </p>
              </div>

              {/* Sample Box Information */}
              <div className={`sm:col-span-2 p-3.5 rounded-xl border flex items-start space-x-3 ${
                darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/80 border-amber-200'
              }`}>
                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-xs text-amber-800 dark:text-amber-400">Physical Sample Requirement</span>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
                    {lead.sampleRequired
                      ? `Sample requested: ${lead.sampleDetails || 'Physical carton sample with custom print proofing required before bulk run.'}`
                      : 'No custom sample required. Production approved directly against digital drawings & agreed specs.'}
                  </p>
                </div>
              </div>

              {lead.remarks && (
                <div className="sm:col-span-2">
                  <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Executive Remarks</span>
                  <p className={`mt-0.5 text-xs italic ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>"{lead.remarks}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Interconnected Corrugation ERP Pipeline & Linked Artifacts */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 lg:col-span-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Interconnected ERP Pipeline (BOM, Costing & Commercials)
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateBom}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-1.5 cursor-pointer shadow-md shadow-amber-600/20 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>+ Create / Open BOM</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Linked BOMs */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-850 border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center space-x-1.5 text-slate-900 dark:text-white">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bill of Materials (BOM)</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                    {lead.boms?.length || 0} Linked
                  </span>
                </div>
                {lead.boms && lead.boms.length > 0 ? (
                  <div className="space-y-2">
                    {lead.boms.map((b: any) => (
                      <div key={b.id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div>
                          <span className="font-mono font-bold block text-slate-900 dark:text-white">{b.bomNumber}</span>
                          <span className="text-[10px] text-slate-700 dark:text-slate-400">{b.ply || 5}-Ply • {b.fluteType || 'B/C'} Flute</span>
                        </div>
                        <button
                          onClick={() => {
                            if (onSelectModule) onSelectModule('costing_bom');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-all"
                        >
                          View BOM
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className={`text-[11px] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>No BOM generated yet for this lead</p>
                    <button
                      onClick={handleCreateBom}
                      className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                    >
                      + Generate BOM in Costing
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Cost Sheets */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-850 border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center space-x-1.5 text-slate-900 dark:text-white">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                    <span>Cost Sheets</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                    {lead.costSheets?.length || 0} Linked
                  </span>
                </div>
                {lead.costSheets && lead.costSheets.length > 0 ? (
                  <div className="space-y-2">
                    {lead.costSheets.map((cs: any) => (
                      <div key={cs.id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div>
                          <span className="font-mono font-bold block text-slate-900 dark:text-white">{cs.sheetNumber}</span>
                          <span className="text-[10px] text-slate-700 dark:text-slate-400">₹{cs.totalCostPerBox || cs.sellingPrice || 0}/box • {cs.status || 'Draft'}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (onSelectModule) onSelectModule('costing_sheets');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 transition-all"
                        >
                          View Sheet
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className={`text-[11px] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>No Cost Sheet prepared yet</p>
                    <button
                      onClick={() => {
                        if (onSelectModule) onSelectModule('costing_sheets');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Open Costing Module
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Quotations */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-850 border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center space-x-1.5 text-slate-900 dark:text-white">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>Sales Quotations</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                    {lead.quotations?.length || 0} Linked
                  </span>
                </div>
                {lead.quotations && lead.quotations.length > 0 ? (
                  <div className="space-y-2">
                    {lead.quotations.map((q: any) => (
                      <div key={q.id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div>
                          <span className="font-mono font-bold block text-slate-900 dark:text-white">{q.quoteNumber}</span>
                          <span className="text-[10px] text-slate-700 dark:text-slate-400">₹{(q.totalAmount || 0).toLocaleString()} • {q.status || 'Draft'}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (onNavigateToQuotation) onNavigateToQuotation(q.id);
                            else if (onSelectModule) onSelectModule('sales_quotations');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 transition-all"
                        >
                          View Quote
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className={`text-[11px] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>No formal quotation generated</p>
                    <button
                      onClick={() => {
                        if (onSelectModule) onSelectModule('sales_quotations');
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                      Open Quotations
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Commercials & PO */}
      {activeTab === 'commercials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 lg:col-span-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center space-x-2 pb-2 border-b ${darkMode ? 'text-emerald-500 border-slate-800' : 'text-emerald-700 border-slate-200'}`}>
              <FileSpreadsheet className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Official Customer Purchase Order (PO) Details</h3>
            </div>

            {lead.customerPoNumber ? (
              <div className={`p-4 rounded-xl border space-y-3 text-xs ${
                darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Captured Customer PO #</span>
                    <span className={`font-mono font-black text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{lead.customerPoNumber}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    Deal Won Confirmed
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-3 pt-2 border-t ${darkMode ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                  <div>
                    <span className={`text-[10px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>PO Date</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{lead.customerPoDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Expected Qty</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{lead.expectedQuantity.toLocaleString()} Pcs</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-xl border border-dashed text-center space-y-3 ${
                darkMode ? 'border-slate-700 bg-slate-800/20 text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
              }`}>
                <FileText className={`w-8 h-8 mx-auto ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">No Customer PO Captured Yet</h4>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>When the client approves quotation and issues an official PO, capture it here to advance to Won stage.</p>
                </div>
                <button
                  onClick={() => setShowPoModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Capture Customer PO Now
                </button>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center space-x-2 pb-2 border-b ${darkMode ? 'text-emerald-500 border-slate-800' : 'text-emerald-700 border-slate-200'}`}>
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Quick Actions & Shortcuts</h3>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  if (onSelectModule) onSelectModule('sales_quotations');
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                  darkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'
                }`}
              >
                <div>
                  <span className="font-bold block">Sales Quotations Registry</span>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>View and issue formal quotations</span>
                </div>
                <ArrowRight className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>

              <button
                onClick={() => {
                  if (onSelectModule) onSelectModule('sales_orders');
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                  darkMode ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'
                }`}
              >
                <div>
                  <span className="font-bold block">Sales Orders Registry</span>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>View corrugation production orders</span>
                </div>
                <ArrowRight className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Timeline & Audit Trail */}
      {activeTab === 'timeline' && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${darkMode ? 'text-emerald-500' : 'text-emerald-700'}`}>
                <Clock className="w-4 h-4" />
                <span>Chronological Workflow Audit Trail</span>
              </h3>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>Automated timestamped logging for sales governance</p>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Note</span>
            </button>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {(!lead.timeline || lead.timeline.length === 0) ? (
              <p className={`text-xs py-4 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>No audit events recorded yet.</p>
            ) : (
              lead.timeline.map((evt: any, idx: number) => (
                <div key={evt.id || idx} className="relative">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>

                  <div className={`p-4 rounded-xl border text-xs ${
                    darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{evt.action}</span>
                      <span className={`text-[10px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    {evt.remarks && (
                      <p className={`mt-1 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{evt.remarks}</p>
                    )}
                    {evt.user && (
                      <span className={`text-[10px] block mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>Logged by: {evt.user}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER PO CAPTURE */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="text-base font-bold">Capture Official Customer PO</h3>
              <button 
                onClick={() => setShowPoModal(false)} 
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Enter official customer purchase order reference to mark this deal as Won.</p>
            <form onSubmit={handleCapturePo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Customer PO Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO/2026/8942"
                  value={poForm.customerPoNumber}
                  onChange={e => setPoForm({ ...poForm, customerPoNumber: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">PO Date</label>
                <input
                  type="date"
                  value={poForm.customerPoDate}
                  onChange={e => setPoForm({ ...poForm, customerPoDate: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Remarks / Payment Terms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 30 days credit approved"
                  value={poForm.remarks}
                  onChange={e => setPoForm({ ...poForm, remarks: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Confirm Deal Won
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT LEAD DETAILS */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl my-8 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700">
              <h3 className="text-base font-bold">Edit Lead & Box Specifications</h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateLeadInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.customerName}
                    onChange={e => setEditForm({ ...editForm, customerName: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editForm.contactPerson}
                    onChange={e => setEditForm({ ...editForm, contactPerson: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Product Requirement / Carton Type *</label>
                  <input
                    type="text"
                    required
                    value={editForm.productRequirement}
                    onChange={e => setEditForm({ ...editForm, productRequirement: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Expected Quantity</label>
                  <input
                    type="number"
                    value={editForm.expectedQuantity}
                    onChange={e => setEditForm({ ...editForm, expectedQuantity: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Target Delivery Date</label>
                  <input
                    type="date"
                    value={editForm.requiredDeliveryDate}
                    onChange={e => setEditForm({ ...editForm, requiredDeliveryDate: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Technical Specifications & Board Parameters</label>
                  <textarea
                    rows={3}
                    value={editForm.specifications}
                    onChange={e => setEditForm({ ...editForm, specifications: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TIMELINE NOTE */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="text-base font-bold">Add Note to Workflow Timeline</h3>
              <button 
                onClick={() => setShowNoteModal(false)} 
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddTimelineNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Note Content *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Spoke with client. Revised GSM specs sent for review."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !noteText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Post Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
