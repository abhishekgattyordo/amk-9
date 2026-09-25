import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Clock, 
  Send, 
  FileText, 
  Layers, 
  Award, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Building2, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Download, 
  ChevronRight, 
  AlertCircle,
  Check,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { RFQItem, RawMaterial, Supplier, ProcurementPO } from '../../types';
import { procurementService } from './procurementService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ProcurementEditViewProps {
  rfqId: string;
  rfqs: RFQItem[];
  onUpdateRfqs: (rfqs: RFQItem[] | ((prev: RFQItem[]) => RFQItem[])) => void;
  quotes: any[];
  setQuotes: (quotes: any[] | ((prev: any[]) => any[])) => void;
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
  purchaseOrders: ProcurementPO[];
  setPurchaseOrders: (pos: ProcurementPO[] | ((prev: ProcurementPO[]) => ProcurementPO[])) => void;
  darkMode: boolean;
  currentUser?: any;
  onBack: () => void;
  onNavigateToPo?: (poNumber?: string) => void;
  onAddNotification?: (notif: any) => void;
  triggerNotification?: (eventKey: any, data: any) => void;
  getSupplierDisplayName?: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
}

const WORKFLOW_STAGES = [
  { id: 'Draft', label: 'Draft', step: 1, desc: 'Initial specification & requirements', icon: FileText, color: 'slate' },
  { id: 'Sent to Supplier', label: 'Sent to Supplier', step: 2, desc: 'Bid invitations dispatched to mills', icon: Send, color: 'blue' },
  { id: 'Response Received', label: 'Response Received', step: 3, desc: 'Supplier quotation proposals collected', icon: Layers, color: 'amber' },
  { id: 'Evaluated', label: 'Evaluated', step: 4, desc: 'Pricing comparison & L1 analysis', icon: CheckCircle2, color: 'purple' },
  { id: 'Awarded', label: 'Awarded', step: 5, desc: 'Final contract awarded - Ready for PO', icon: Award, color: 'emerald' },
];

export const ProcurementEditView: React.FC<ProcurementEditViewProps> = ({
  rfqId,
  rfqs,
  onUpdateRfqs,
  quotes,
  setQuotes,
  suppliers,
  rawMaterials,
  purchaseOrders,
  setPurchaseOrders,
  darkMode,
  currentUser,
  onBack,
  onNavigateToPo,
  onAddNotification,
  triggerNotification,
  getSupplierDisplayName = (id, name, mill) => name || mill || 'Unknown Supplier'
}) => {
  // Find current RFQ
  const currentRfq = rfqs.find(r => r.id === rfqId);

  // Form State
  const [rfqNumber, setRfqNumber] = useState('');
  const [rfqDate, setRfqDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [department, setDepartment] = useState('Procurement');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<string>('Draft');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [responseDeadline, setResponseDeadline] = useState('');
  
  // Materials List State
  const [materials, setMaterials] = useState<Array<{
    materialCode: string;
    materialId?: string;
    name: string;
    description?: string;
    unit: string;
    quantity: number;
    expectedPrice?: number;
    requiredDate: string;
    remarks?: string;
  }>>([]);

  // Selected Invited Suppliers
  const [selectedSuppliers, setSelectedSuppliers] = useState<Array<{
    supplierId: string;
    supplierName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  }>>([]);

  // Quote editing inline state
  const [selectedAwardedQuoteId, setSelectedAwardedQuoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'materials' | 'suppliers' | 'quotes' | 'conversion'>('details');
  const [createdPoDetails, setCreatedPoDetails] = useState<ProcurementPO | null>(null);
  const [showPoModal, setShowPoModal] = useState(false);

  // Add new quote quick form state
  const [showAddQuoteInline, setShowAddQuoteInline] = useState(false);
  const [inlineQuoteSupplierId, setInlineQuoteSupplierId] = useState('');
  const [inlineQuoteNumber, setInlineQuoteNumber] = useState('');
  const [inlineQuoteDate, setInlineQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [inlineQuoteValidUntil, setInlineQuoteValidUntil] = useState(new Date(Date.now() + 20*24*60*60*1000).toISOString().slice(0, 10));
  const [inlineQuoteDeliveryDays, setInlineQuoteDeliveryDays] = useState(7);
  const [inlineQuotePaymentTerms, setInlineQuotePaymentTerms] = useState('Net 30 Days');
  const [inlineQuoteRemarks, setInlineQuoteRemarks] = useState('');
  const [inlineQuoteItems, setInlineQuoteItems] = useState<Array<{
    materialCode: string;
    materialName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    taxPercent: number;
    taxAmount: number;
    totalAmount: number;
  }>>([]);

  // Load RFQ Data into state
  useEffect(() => {
    if (currentRfq) {
      setRfqNumber(currentRfq.rfqNumber || '');
      setRfqDate(currentRfq.rfqDate || new Date().toISOString().slice(0, 10));
      setDeliveryDate(currentRfq.deliveryDate || new Date(Date.now() + 10*24*60*60*1000).toISOString().slice(0, 10));
      setDepartment(currentRfq.department || 'Procurement');
      setPriority(currentRfq.priority || 'Medium');
      
      // Normalize status to workflow stages if equivalent
      const currentStat = currentRfq.status || 'Draft';
      if (currentStat === 'Sent') {
        setStatus('Sent to Supplier');
      } else if (currentStat === 'Submitted') {
        setStatus('Response Received');
      } else {
        setStatus(currentStat);
      }

      setDescription(currentRfq.description || '');
      setRemarks(currentRfq.remarks || '');
      setResponseDeadline(currentRfq.responseDeadline || '');
      
      // Load materials
      if (currentRfq.materials && currentRfq.materials.length > 0) {
        setMaterials(currentRfq.materials.map(m => ({
          materialCode: m.materialCode,
          name: m.name,
          description: m.description || '',
          unit: m.unit || 'Kg',
          quantity: m.quantity || 1000,
          expectedPrice: m.expectedPrice,
          requiredDate: m.requiredDate || currentRfq.deliveryDate || new Date().toISOString().slice(0, 10),
          remarks: m.remarks || ''
        })));
      } else {
        setMaterials([{
          materialCode: 'RM-KRAFT-180',
          name: 'Kraft Liner Paper 180 GSM',
          description: 'Virgin Kraft Paper Roll',
          unit: 'Kg',
          quantity: 2000,
          expectedPrice: 48,
          requiredDate: new Date().toISOString().slice(0, 10),
          remarks: 'High Bursting Factor'
        }]);
      }

      // Load invited suppliers
      if (currentRfq.suppliers && currentRfq.suppliers.length > 0) {
        setSelectedSuppliers(currentRfq.suppliers);
      } else if (suppliers && suppliers.length > 0) {
        setSelectedSuppliers([
          {
            supplierId: suppliers[0].id,
            supplierName: suppliers[0].supplierName,
            contactPerson: suppliers[0].contactPerson || 'Contact Person',
            email: suppliers[0].email || 'sales@supplier.com',
            phone: suppliers[0].phone || '+91 9876543210'
          }
        ]);
      }
    }
  }, [rfqId, currentRfq, suppliers]);

  // Quotes related to this RFQ
  const rfqQuotes = quotes.filter(q => q.rfqId === rfqId || (currentRfq && q.rfqNumber === currentRfq.rfqNumber));

  // Determine currently awarded quote
  const awardedQuote = rfqQuotes.find(q => q.status === 'Awarded') || 
                       (selectedAwardedQuoteId ? rfqQuotes.find(q => q.id === selectedAwardedQuoteId) : null) || 
                       (rfqQuotes.length > 0 ? rfqQuotes[0] : null);

  // Material manipulation functions
  const handleAddMaterial = () => {
    setMaterials(prev => [
      ...prev,
      {
        materialCode: rawMaterials[0]?.code || 'RM-NEW',
        name: rawMaterials[0]?.name || 'New Material Item',
        description: '',
        unit: rawMaterials[0]?.uom || 'Kg',
        quantity: 1000,
        expectedPrice: rawMaterials[0]?.purchasePrice || 50,
        requiredDate: deliveryDate || new Date().toISOString().slice(0, 10),
        remarks: ''
      }
    ]);
  };

  const handleUpdateMaterial = (index: number, field: string, val: any) => {
    setMaterials(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };

      if (field === 'materialCode') {
        const found = rawMaterials.find(rm => rm.code === val || rm.id === val);
        if (found) {
          item.materialCode = found.code || val;
          item.materialId = found.id;
          item.name = found.name;
          item.unit = found.uom || 'Kg';
          item.expectedPrice = found.purchasePrice || item.expectedPrice;
          item.description = found.description || item.description;
        } else {
          item.materialCode = val;
        }
      } else {
        (item as any)[field] = val;
      }

      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateMaterial = (index: number) => {
    const item = materials[index];
    if (!item) return;
    setMaterials(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...item });
      return copy;
    });
  };

  const handleMoveMaterial = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === materials.length - 1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    setMaterials(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // Supplier management
  const handleToggleSupplier = (sup: Supplier) => {
    const exists = selectedSuppliers.some(s => s.supplierId === sup.id);
    if (exists) {
      setSelectedSuppliers(prev => prev.filter(s => s.supplierId !== sup.id));
    } else {
      setSelectedSuppliers(prev => [
        ...prev,
        {
          supplierId: sup.id,
          supplierName: getSupplierDisplayName(sup.id, sup.supplierName, sup.millName),
          contactPerson: sup.contactPerson || '',
          email: sup.email || '',
          phone: sup.phone || ''
        }
      ]);
    }
  };

  // Status Change Handler
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setSaveSuccessMsg(`Status updated to "${newStatus}". Click Save to persist changes.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Quote Awarding Handler
  const handleAwardSpecificQuote = (quoteToAward: any) => {
    setSelectedAwardedQuoteId(quoteToAward.id);
    // Update quote statuses
    setQuotes(prev => prev.map(q => {
      if (q.rfqId === rfqId || (currentRfq && q.rfqNumber === currentRfq.rfqNumber)) {
        return q.id === quoteToAward.id ? { ...q, status: 'Awarded' } : { ...q, status: 'Rejected' };
      }
      return q;
    }));

    // Move RFQ status to Awarded
    setStatus('Awarded');

    if (onAddNotification) {
      onAddNotification({
        title: 'Supplier Quotation Awarded',
        message: `Awarded bid ${quoteToAward.quotationNumber || quoteToAward.id} from ${quoteToAward.supplierName}. Status set to Awarded.`,
        type: 'success',
        time: 'Just Now'
      });
    }

    // Automatically convert to PO
    handleConvertSupplierQuoteToPO(quoteToAward);
  };

  // Save RFQ to Database & State
  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      if (materials.length === 0) {
        throw new Error('Please include at least one raw material in the RFQ.');
      }

      const payload = {
        rfqNumber,
        rfqDate,
        deliveryDate,
        department,
        priority,
        status,
        description,
        remarks,
        responseDeadline,
        materials: materials.map(m => ({
          materialCode: m.materialCode,
          name: m.name,
          unit: m.unit,
          quantity: Number(m.quantity) || 1,
          expectedPrice: m.expectedPrice ? Number(m.expectedPrice) : undefined,
          requiredDate: m.requiredDate || deliveryDate,
          description: m.description,
          remarks: m.remarks
        })),
        suppliers: selectedSuppliers.map(s => ({
          supplierId: s.supplierId,
          supplierName: s.supplierName,
          contactPerson: s.contactPerson || '',
          email: s.email || '',
          phone: s.phone || ''
        }))
      };

      // Call API PUT /api/rfqs?id=...
      const res = await fetch(`/api/rfqs?id=${rfqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        console.warn('Backend API update notice:', resData.message);
      }

      // Update in-memory state
      const updatedRfqItem: RFQItem = {
        id: rfqId,
        rfqNumber,
        rfqDate,
        deliveryDate,
        department,
        priority,
        status,
        description,
        remarks,
        responseDeadline,
        materials: payload.materials,
        suppliers: payload.suppliers,
        createdAt: currentRfq?.createdAt || new Date().toISOString()
      };

      onUpdateRfqs(prev => prev.map(r => r.id === rfqId ? updatedRfqItem : r));

      setSaveSuccessMsg(`All changes and status "${status}" saved successfully!`);
      
      if (onAddNotification) {
        onAddNotification({
          title: 'RFQ Updated',
          message: `RFQ ${rfqNumber} updated. Status: ${status}`,
          type: 'success',
          time: 'Just Now'
        });
      }

      // Go back to the RFQ detail page
      onBack();
    } catch (err: any) {
      console.error('Error saving RFQ:', err);
      setErrorMsg(err.message || 'Failed to save RFQ updates.');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert Supplier Quotation to PO (Final Stage Action)
  const handleConvertSupplierQuoteToPO = async (explicitQuote?: any) => {
    if (!explicitQuote && !awardedQuote && rfqQuotes.length === 0 && materials.length === 0) {
      setErrorMsg('No quote or materials available to convert to Purchase Order.');
      return;
    }

    const targetQuote = explicitQuote || awardedQuote || rfqQuotes[0];
    const supId = targetQuote ? targetQuote.supplierId : (selectedSuppliers[0]?.supplierId || suppliers[0]?.id || '');
    const supName = targetQuote ? targetQuote.supplierName : (selectedSuppliers[0]?.supplierName || suppliers[0]?.supplierName || 'Primary Supplier');

    // Build PO line items
    let poItems: any[] = [];
    if (targetQuote && targetQuote.items && targetQuote.items.length > 0) {
      poItems = targetQuote.items.map((it: any) => ({
        materialCode: it.materialCode,
        materialName: it.materialName || it.name,
        quantityOrdered: Number(it.quantity || 1),
        quantityReceived: 0,
        unitPrice: Number(it.unitPrice || 0),
        total: Number(it.totalAmount || (it.quantity * it.unitPrice))
      }));
    } else if (materials.length > 0) {
      const avgUnitPrice = targetQuote?.unitPrice || 50;
      poItems = materials.map(mat => {
        const unitP = mat.expectedPrice || avgUnitPrice;
        return {
          materialCode: mat.materialCode,
          materialName: mat.name,
          quantityOrdered: Number(mat.quantity || 1),
          quantityReceived: 0,
          unitPrice: Number(unitP),
          total: Number((mat.quantity * unitP).toFixed(2))
        };
      });
    } else {
      poItems = [{
        materialCode: rawMaterials[0]?.code || 'RM-KRAFT-180',
        materialName: rawMaterials[0]?.name || 'Kraft Paper Roll',
        quantityOrdered: 1000,
        quantityReceived: 0,
        unitPrice: 50,
        total: 50000
      }];
    }

    const totalAmt = poItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
    const validDeliveryDays = 7;
    let delDate = targetQuote?.validUntil || deliveryDate;
    if (!delDate || isNaN(new Date(delDate).getTime())) {
      delDate = new Date(Date.now() + validDeliveryDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

    const poPayload = {
      rfqNumber: rfqNumber || undefined,
      rfqId: rfqId || undefined,
      quoteId: targetQuote?.id && targetQuote.id !== 'new' ? targetQuote.id : undefined,
      supplierId: supId || suppliers[0]?.id,
      date: new Date().toISOString().slice(0, 10),
      deliveryDate: delDate,
      status: 'Approved' as const,
      remarks: `Converted from RFQ ${rfqNumber} (Awarded Supplier Quotation: ${targetQuote?.quotationNumber || 'Direct Award'}). Terms: ${targetQuote?.paymentTerms || 'Standard 30 Days'}.`,
      totalAmount: totalAmt,
      items: poItems
    };

    try {
      const result = await procurementService.createPurchaseOrder(poPayload);
      let newPO: ProcurementPO;
      if (result && result.success && result.data) {
        newPO = {
          ...result.data,
          supplierName: supName
        };
      } else {
        const nextPoNum = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, '0')}`;
        newPO = {
          id: `PO-${Date.now()}`,
          poNumber: nextPoNum,
          ...poPayload,
          supplierName: supName,
          status: 'Approved'
        } as any;
      }

      // Save PO in state
      setPurchaseOrders(prev => [newPO, ...prev.filter(p => p.id !== newPO.id)]);
      setCreatedPoDetails(newPO);
      setShowPoModal(true);

      // Update quote status if exists
      if (targetQuote && targetQuote.id) {
        try {
          await fetch(`/api/supplier-quotes?id=${targetQuote.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...targetQuote, status: 'Awarded' })
          });
        } catch (e) {
          console.warn('Could not update quote status in DB:', e);
        }
        setQuotes(prev => prev.map(q => q.id === targetQuote.id ? { ...q, status: 'Awarded' } : q));
      }

      // Update RFQ status to Awarded if not already
      if (status !== 'Awarded') {
        setStatus('Awarded');
        onUpdateRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: 'Awarded' } : r));
      }

      // Trigger system notifications
      if (onAddNotification) {
        onAddNotification({
          title: 'Purchase Order Created from Quotation',
          message: `Successfully converted Quotation to Purchase Order ${newPO.poNumber} for ${supName}.`,
          type: 'success',
          time: 'Just Now'
        });
      }

      if (triggerNotification) {
        triggerNotification('po_created', {
          title: 'Purchase Order Created',
          message: `PO ${newPO.poNumber} generated for ${supName} against RFQ ${rfqNumber}.`,
          poNumber: newPO.poNumber,
          supplierName: supName,
          recipientEmail: currentUser?.email || 'sunita.menon@amkerp.com'
        });
      }
    } catch (err: any) {
      console.error('Failed to create PO from RFQ:', err);
      alert('Error creating Purchase Order');
    }
  };

  // Quick Inline Add Quotation Submission
  const handleSaveInlineQuote = () => {
    if (!inlineQuoteSupplierId) {
      alert('Please select a supplier for the quotation.');
      return;
    }

    const sup = suppliers.find(s => s.id === inlineQuoteSupplierId);
    const supName = sup ? getSupplierDisplayName(sup.id, sup.supplierName, sup.millName) : 'Selected Supplier';
    const qtnNum = inlineQuoteNumber || `QTN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random()*9000)}`;

    const itemsToSave = inlineQuoteItems.length > 0 ? inlineQuoteItems : materials.map(m => {
      const unitP = m.expectedPrice || 50;
      const taxA = (m.quantity * unitP) * 0.18;
      return {
        materialCode: m.materialCode,
        materialName: m.name,
        quantity: m.quantity,
        unit: m.unit,
        unitPrice: unitP,
        discount: 0,
        taxPercent: 18,
        taxAmount: Number(taxA.toFixed(2)),
        totalAmount: Number(((m.quantity * unitP) + taxA).toFixed(2))
      };
    });

    const totalAmt = itemsToSave.reduce((s, it) => s + (it.totalAmount || 0), 0);
    const totalQty = itemsToSave.reduce((s, it) => s + (it.quantity || 0), 0);
    const avgPrice = totalQty > 0 ? totalAmt / totalQty : 50;

    const newQuoteObj = {
      id: `QUOTE-${Date.now()}`,
      quotationNumber: qtnNum,
      quotationDate: inlineQuoteDate,
      rfqId,
      rfqNumber,
      supplierId: inlineQuoteSupplierId,
      supplierName: supName,
      unitPrice: Number(avgPrice.toFixed(2)),
      quantity: totalQty,
      totalPrice: totalAmt,
      deliveryDays: inlineQuoteDeliveryDays,
      paymentTerms: inlineQuotePaymentTerms,
      validUntil: inlineQuoteValidUntil,
      currency: 'INR (₹)',
      remarks: inlineQuoteRemarks || 'Direct Supplier Quote response',
      status: 'Pending',
      items: itemsToSave
    };

    setQuotes(prev => [newQuoteObj, ...prev]);
    setShowAddQuoteInline(false);

    // Auto advance status to Response Received if it is in Draft or Sent
    if (status === 'Draft' || status === 'Sent to Supplier') {
      setStatus('Response Received');
    }

    if (onAddNotification) {
      onAddNotification({
        title: 'Supplier Quotation Added',
        message: `Quotation ${qtnNum} from ${supName} recorded for RFQ ${rfqNumber}.`,
        type: 'success',
        time: 'Just Now'
      });
    }
  };

  // PDF Generation for this RFQ
  const handleDownloadRfqPdf = () => {
    const doc = new jsPDF() as any;

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('REQUEST FOR QUOTATION (RFQ)', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('AMK INDUSTRIES PVT LTD - PROCUREMENT DIVISION', 105, 27, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Details Grid
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(`RFQ Number: ${rfqNumber}`, 14, 42);
    doc.text(`RFQ Date: ${rfqDate}`, 14, 48);
    doc.text(`Target Delivery: ${deliveryDate}`, 14, 54);
    doc.text(`Department: ${department}`, 14, 60);

    doc.text(`Status: ${status.toUpperCase()}`, 120, 42);
    doc.text(`Priority: ${priority}`, 120, 48);
    doc.text(`Response Deadline: ${responseDeadline || 'Within 7 Days'}`, 120, 54);
    doc.text(`Invited Suppliers: ${selectedSuppliers.length} Mills`, 120, 60);

    // Materials Table
    const tableData = materials.map((m, idx) => [
      idx + 1,
      m.materialCode,
      m.name,
      `${m.quantity.toLocaleString()} ${m.unit}`,
      m.expectedPrice ? `INR ${m.expectedPrice}` : 'Open Quote',
      m.requiredDate || deliveryDate,
      m.remarks || '-'
    ]);

    doc.autoTable({
      startY: 68,
      head: [['#', 'Code', 'Material Description', 'Quantity', 'Target Price', 'Required By', 'Remarks']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 140;

    // Invited Suppliers List
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Invited Suppliers:', 14, finalY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    selectedSuppliers.forEach((s, idx) => {
      doc.text(`${idx + 1}. ${s.supplierName} (${s.email || 'Email on file'}, Ph: ${s.phone || 'N/A'})`, 14, finalY + 18 + (idx * 6));
    });

    const notesY = finalY + 22 + (selectedSuppliers.length * 6);
    if (description || remarks) {
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Specifications:', 14, notesY);
      doc.setFont('helvetica', 'normal');
      doc.text(description || remarks, 14, notesY + 6, { maxWidth: 180 });
    }

    doc.save(`RFQ_${rfqNumber || 'Document'}.pdf`);
  };

  // Current stage index for stepper
  const currentStageIndex = WORKFLOW_STAGES.findIndex(s => s.id.toLowerCase() === status.toLowerCase());
  const effectiveStageIdx = currentStageIndex >= 0 ? currentStageIndex : 0;

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/60 text-slate-900'}`}>
      
      {/* Top Header / Navigation Bar */}
      <div className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-6 py-3.5 transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Breadcrumbs & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Back to RFQ List"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to RFQs</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${
                  darkMode ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {rfqNumber || 'RFQ-WORKSPACE'}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-400">/</span>
                <span className="text-xs text-slate-700 dark:text-slate-400 font-medium">Procurement Workspace & Data Editor</span>
              </div>
              <h1 className={`text-lg sm:text-xl font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                RFQ & Quotation Workflow Editor
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleDownloadRfqPdf}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Download RFQ as PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden md:inline">Download PDF</span>
            </button>

            {/* If Final Stage (Awarded), show direct Create Supplier Quotation button if needed */}
            {status === 'Awarded' && !awardedQuote && (
              <button
                onClick={() => setShowAddQuoteInline(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-blue-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Create Supplier Quotation for Awarded RFQ"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Supplier Quotation</span>
              </button>
            )}

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Feedback Alert Messages */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-slate-700 dark:text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-700 dark:text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* WORKFLOW STATUS STEPPER & LIFECYCLE BAR */}
        <div className={`p-5 rounded-2xl border ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-400 block">
                Procurement Lifecycle Pipeline
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <h3 className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Current Status: <span className="text-emerald-500 underline decoration-2 underline-offset-4">{status}</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  status === 'Awarded' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  status === 'Evaluated' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  status === 'Response Received' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  status === 'Sent to Supplier' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  Stage {effectiveStageIdx + 1} of 5
                </span>
              </div>
            </div>

            {/* Quick Status Dropdown & Advance Button */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-700 dark:text-slate-400 font-bold hidden sm:inline">Change Status:</span>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {WORKFLOW_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.step}. {stage.label}
                    </option>
                  ))}
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {effectiveStageIdx < WORKFLOW_STAGES.length - 1 && (
                <button
                  onClick={() => handleStatusChange(WORKFLOW_STAGES[effectiveStageIdx + 1].id)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <span>Advance to {WORKFLOW_STAGES[effectiveStageIdx + 1].label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Stepper Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isPast = idx < effectiveStageIdx;
              const isCurrent = idx === effectiveStageIdx;
              const isFuture = idx > effectiveStageIdx;
              const Icon = stage.icon;

              return (
                <button
                  key={stage.id}
                  onClick={() => handleStatusChange(stage.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isCurrent 
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/30' 
                      : isPast
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : darkMode 
                      ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40' 
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-mono ${
                      isCurrent 
                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/40' 
                        : isPast 
                        ? 'bg-emerald-600 text-white' 
                        : darkMode ? 'bg-slate-800 text-slate-700 dark:text-slate-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : stage.step}
                    </span>
                    <Icon className={`w-4 h-4 ${
                      isCurrent ? 'text-emerald-400' : isPast ? 'text-emerald-500/60' : 'text-slate-700 dark:text-slate-400'
                    }`} />
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-emerald-400' : darkMode ? 'text-slate-200' : 'text-slate-900'
                    }`}>
                      {stage.label}
                    </h4>
                    <p className="text-[10px] text-slate-700 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {stage.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* REMOVED: Final Stage Prominent Action: Convert to PO Banner */}

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b pb-2 border-slate-800">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'details'
                ? 'bg-emerald-600 text-white shadow'
                : darkMode ? 'bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. General Information</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-emerald-600 text-white shadow'
                : darkMode ? 'bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Requested Materials ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-emerald-600 text-white shadow'
                : darkMode ? 'bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3. Invited Suppliers ({selectedSuppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-emerald-600 text-white shadow'
                : darkMode ? 'bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. Supplier Quotations & Evaluation ({rfqQuotes.length})</span>
          </button>
        </div>

        {/* TAB 1: GENERAL INFORMATION */}
        {activeTab === 'details' && (
          <div className={`p-6 rounded-2xl border space-y-6 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                General RFQ Metadata & Scheduling
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
                Configure origin department, scheduling dates, priorities, and delivery expectations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  RFQ Reference Number
                </label>
                <input
                  type="text"
                  value={rfqNumber}
                  onChange={(e) => setRfqNumber(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  placeholder="e.g. RFQ-2026-0001"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  RFQ Issue Date
                </label>
                <input
                  type="date"
                  value={rfqDate}
                  onChange={(e) => setRfqDate(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  Originating Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Procurement">Procurement</option>
                  <option value="Production">Production (Corrugator)</option>
                  <option value="Adhesives">Adhesives & Chemicals</option>
                  <option value="Packaging">Packaging & Starch</option>
                  <option value="Maintenance">Maintenance & Spares</option>
                  <option value="Inventory">Inventory Warehouse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold ${
                    priority === 'High' ? 'text-rose-400' : priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                  } ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High (Urgent Requirement)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  Supplier Response Deadline
                </label>
                <input
                  type="date"
                  value={responseDeadline}
                  onChange={(e) => setResponseDeadline(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  Brief Purpose & Technical Specifications
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  placeholder="Specify quality parameters, reel width requirements, GSM tolerance, Cobb test limits..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-400 mb-1.5">
                  Internal Remarks / Delivery Instructions
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  placeholder="Internal procurement notes, transport instructions, mill payment conditions..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REQUESTED RAW MATERIALS */}
        {activeTab === 'materials' && (
          <div className={`p-6 rounded-2xl border space-y-5 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Requested Materials Line Items
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
                  Add, edit, reorder or duplicate raw materials requested for supplier quotations.
                </p>
              </div>

              <button
                onClick={handleAddMaterial}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material Row</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className={darkMode ? 'bg-slate-800/80 text-slate-300 font-bold' : 'bg-slate-100 text-slate-700 font-bold'}>
                  <tr>
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3">Material Selection</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 w-28">Quantity</th>
                    <th className="p-3 w-24">UOM</th>
                    <th className="p-3 w-32">Target Price (₹)</th>
                    <th className="p-3 w-36">Required By</th>
                    <th className="p-3 w-40">Remarks</th>
                    <th className="p-3 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  {materials.map((mat, idx) => (
                    <tr key={idx} className={darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="p-3 min-w-[200px]">
                        <select
                          value={mat.materialCode}
                          onChange={(e) => handleUpdateMaterial(idx, 'materialCode', e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold mb-1 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                          }`}
                        >
                          <option value="">-- Select Catalog Material --</option>
                          {rawMaterials.map(rm => (
                            <option key={rm.id} value={rm.code || rm.id}>
                              {rm.code} - {rm.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={mat.name}
                          onChange={(e) => handleUpdateMaterial(idx, 'name', e.target.value)}
                          placeholder="Material Display Name"
                          className={`w-full px-2 py-1 rounded-md border text-[11px] ${
                            darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        />
                      </td>

                      <td className="p-3 min-w-[140px]">
                        <input
                          type="text"
                          value={mat.description || ''}
                          onChange={(e) => handleUpdateMaterial(idx, 'description', e.target.value)}
                          placeholder="Specs / GSM / BF..."
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                          }`}
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          value={mat.quantity}
                          onChange={(e) => handleUpdateMaterial(idx, 'quantity', Number(e.target.value))}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold text-right font-mono ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                          }`}
                        />
                      </td>

                      <td className="p-3">
                        <select
                          value={mat.unit}
                          onChange={(e) => handleUpdateMaterial(idx, 'unit', e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                          }`}
                        >
                          <option value="Kg">Kg</option>
                          <option value="Nos">Nos</option>
                          <option value="Rolls">Rolls</option>
                          <option value="MT">MT (Tons)</option>
                          <option value="Ltr">Ltr</option>
                          <option value="Box">Box</option>
                        </select>
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          value={mat.expectedPrice !== undefined ? mat.expectedPrice : ''}
                          onChange={(e) => handleUpdateMaterial(idx, 'expectedPrice', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g. 48.5"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold text-right text-emerald-400 font-mono ${
                            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                          }`}
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="date"
                          value={mat.requiredDate || deliveryDate}
                          onChange={(e) => handleUpdateMaterial(idx, 'requiredDate', e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                          }`}
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={mat.remarks || ''}
                          onChange={(e) => handleUpdateMaterial(idx, 'remarks', e.target.value)}
                          placeholder="Line notes..."
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                          }`}
                        />
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleMoveMaterial(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-700 text-slate-700 dark:text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveMaterial(idx, 'down')}
                            disabled={idx === materials.length - 1}
                            className="p-1 rounded hover:bg-slate-700 text-slate-700 dark:text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateMaterial(idx)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-700 dark:text-slate-400 hover:text-white cursor-pointer"
                            title="Duplicate Row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveMaterial(idx)}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Materials Summary Footer */}
            <div className={`p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold ${
              darkMode ? 'bg-slate-800/60' : 'bg-slate-100'
            }`}>
              <div>
                <span>Total Items: </span>
                <span className="text-emerald-400">{materials.length} Raw Materials</span>
              </div>
              <div>
                <span>Total Quantity Required: </span>
                <span className="text-white font-mono">{materials.reduce((s, m) => s + (Number(m.quantity) || 0), 0).toLocaleString()} Units</span>
              </div>
              <div>
                <span>Estimated Target Budget: </span>
                <span className="text-emerald-400 font-mono">
                  ₹{materials.reduce((s, m) => s + ((Number(m.quantity) || 0) * (Number(m.expectedPrice) || 0)), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVITED SUPPLIERS */}
        {activeTab === 'suppliers' && (
          <div className={`p-6 rounded-2xl border space-y-5 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Invited Supplier Mills & Vendors
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
                Select which supplier paper mills to invite for bids. Dispatched quotes will be tracked per supplier.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {suppliers.map(sup => {
                const isSelected = selectedSuppliers.some(s => s.supplierId === sup.id);
                return (
                  <div
                    key={sup.id}
                    onClick={() => handleToggleSupplier(sup)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/40'
                        : darkMode ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {getSupplierDisplayName(sup.id, sup.supplierName, sup.millName)}
                        </h4>
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                          isSelected ? 'bg-emerald-500 text-white font-bold' : 'border border-slate-700 bg-slate-800'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-700 dark:text-slate-400 mt-1 font-mono">
                        {sup.email || 'sales@mill.com'}
                      </p>
                      <p className="text-[10px] text-slate-700 dark:text-slate-400">
                        {sup.contactPerson || 'Sales Desk'} • {sup.phone || '+91 9000000000'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px]">
                      <span className="text-slate-700 dark:text-slate-400">{sup.millName ? `Mill: ${sup.millName}` : 'Paper Vendor'}</span>
                      <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-400'}>
                        {isSelected ? '✓ Invited' : '+ Click to Invite'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SUPPLIER QUOTATIONS & EVALUATION */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Supplier Quotation Bids & L1 Evaluation
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
                    Compare supplier quotation proposals, evaluate rates, and award the contract to the winning vendor.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddQuoteInline(!showAddQuoteInline)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddQuoteInline ? 'Hide Quote Entry Form' : '+ Record Supplier Bid Response'}</span>
                </button>
              </div>

              {/* Quick Inline Quote Entry Form */}
              {showAddQuoteInline && (
                <div className={`p-5 rounded-2xl border ${
                  darkMode ? 'bg-slate-950 border-emerald-500/40' : 'bg-emerald-50/50 border-emerald-300'
                }`}>
                  <h4 className="text-xs font-extrabold uppercase text-emerald-400 mb-3 flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Record Supplier Quotation Proposal</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1">
                        Supplier Mill
                      </label>
                      <select
                        value={inlineQuoteSupplierId}
                        onChange={(e) => setInlineQuoteSupplierId(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      >
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>
                            {getSupplierDisplayName(s.id, s.supplierName, s.millName)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1">
                        Quotation Number
                      </label>
                      <input
                        type="text"
                        value={inlineQuoteNumber}
                        onChange={(e) => setInlineQuoteNumber(e.target.value)}
                        placeholder={`QTN-${new Date().getFullYear()}-001`}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1">
                        Delivery Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        value={inlineQuoteDeliveryDays}
                        onChange={(e) => setInlineQuoteDeliveryDays(Number(e.target.value))}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1">
                        Payment Terms
                      </label>
                      <select
                        value={inlineQuotePaymentTerms}
                        onChange={(e) => setInlineQuotePaymentTerms(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      >
                        <option value="Net 30 Days">Net 30 Days</option>
                        <option value="Net 15 Days">Net 15 Days</option>
                        <option value="Net 45 Days">Net 45 Days</option>
                        <option value="Advance Payment">Advance Payment</option>
                        <option value="Against Delivery">Against Delivery</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1">
                        Quote Validity Date
                      </label>
                      <input
                        type="date"
                        value={inlineQuoteValidUntil}
                        onChange={(e) => setInlineQuoteValidUntil(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-400 mb-1">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={inlineQuoteRemarks}
                        onChange={(e) => setInlineQuoteRemarks(e.target.value)}
                        placeholder="Freight terms, taxes included..."
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowAddQuoteInline(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveInlineQuote}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
                    >
                      Save Supplier Proposal
                    </button>
                  </div>
                </div>
              )}

              {/* Quotations List / Cards */}
              {rfqQuotes.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-700 dark:text-slate-400 space-y-2">
                  <Award className="w-8 h-8 mx-auto text-slate-600" />
                  <p>No supplier bids received yet for this RFQ.</p>
                  <p className="text-[11px]">Click "+ Record Supplier Bid Response" above to enter received quotation rates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rfqQuotes.map(q => {
                    const isLowest = q.totalPrice <= Math.min(...rfqQuotes.map(oq => oq.totalPrice));
                    const isAwarded = q.status === 'Awarded' || status === 'Awarded';

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isAwarded
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/30'
                            : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-300">
                                  {q.quotationNumber || `QTN-${q.id}`}
                                </span>
                                {isLowest && (
                                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold uppercase rounded-md shadow">
                                    L1 Lowest Rate
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-sm font-extrabold mt-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {q.supplierName}
                              </h4>
                            </div>

                            <div>
                              {isAwarded ? (
                                <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg shadow">
                                  🏆 Awarded Bid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded">
                                  {q.status || 'Pending'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                              <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold block">RATE PER UNIT</span>
                              <span className="text-sm font-black text-emerald-400 font-mono">₹{q.unitPrice}</span>
                            </div>

                            <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                              <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold block">TOTAL BID AMOUNT</span>
                              <span className="text-sm font-black text-slate-100 font-mono">₹{q.totalPrice?.toLocaleString()}</span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold block">LEAD TIME</span>
                              <strong>{q.deliveryDays || 7} Days Delivery</strong>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold block">PAYMENT TERMS</span>
                              <strong>{q.paymentTerms || 'Net 30 Days'}</strong>
                            </div>
                          </div>

                          {q.items && q.items.length > 0 && (
                            <div className="border-t border-slate-800/40 pt-2 mb-3">
                              <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-400 block mb-1">
                                Line Items ({q.items.length})
                              </span>
                              <div className="max-h-24 overflow-y-auto rounded border border-slate-800 text-[11px]">
                                <table className="w-full text-left">
                                  <tbody className="divide-y divide-slate-800">
                                    {q.items.map((it: any, i: number) => (
                                      <tr key={i} className="p-1">
                                        <td className="p-1 font-medium">{it.materialName || it.materialCode}</td>
                                        <td className="p-1 text-right font-mono">{it.quantity} {it.unit}</td>
                                        <td className="p-1 text-right font-mono text-emerald-400 font-bold">₹{it.unitPrice}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-800/40 pt-3 flex items-center justify-between">
                          <span className="text-[10px] text-slate-700 dark:text-slate-400">
                            Valid till: {q.validUntil || 'N/A'}
                          </span>

                          <div className="flex items-center space-x-2">
                            {q.status !== 'Awarded' && (
                              <button
                                onClick={() => handleAwardSpecificQuote(q)}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center space-x-1"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Award Quotation</span>
                              </button>
                            )}

                            {(isAwarded || status === 'Awarded') && (
                              <button
                                onClick={handleConvertSupplierQuoteToPO}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow flex items-center space-x-1 transition-all cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Convert to PO</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS MODAL AFTER CONVERTING TO PO */}
      {showPoModal && createdPoDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl animate-in zoom-in-95 ${
            darkMode ? 'bg-slate-900 border-emerald-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Purchase Order Created Successfully!</h3>
                <p className="text-xs text-slate-700 dark:text-slate-400">Converted from awarded supplier quotation for RFQ {rfqNumber}</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-400 font-bold">PO NUMBER:</span>
                <strong className="text-emerald-400 font-mono">{createdPoDetails.poNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-400 font-bold">SUPPLIER:</span>
                <strong>{createdPoDetails.supplierName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-400 font-bold">DELIVERY DATE:</span>
                <strong>{createdPoDetails.deliveryDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-400 font-bold">LINE ITEMS:</span>
                <strong>{createdPoDetails.items.length} Materials</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-400 font-bold">STATUS:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold uppercase text-[10px]">
                  {createdPoDetails.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowPoModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Close Window
              </button>
              {onNavigateToPo && (
                <button
                  onClick={() => {
                    setShowPoModal(false);
                    onNavigateToPo(createdPoDetails.poNumber);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <span>Open in Purchase Orders View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
