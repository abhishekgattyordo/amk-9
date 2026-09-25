import React from 'react';
import { Plus, Award, Sparkles, Download, Eye, Trash2 } from 'lucide-react';
import { RFQItem } from '../../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SupplierQuotesViewProps {
  darkMode: boolean;
  rfqs: RFQItem[];
  quotes: any[];
  selectedRfqForQuotes: RFQItem | null;
  setSelectedRfqForQuotes: (rfq: RFQItem | null) => void;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  handleOpenNewQuoteModal: () => void;
  handleOpenEditQuoteModal: (q: any) => void;
  onViewQuote?: (q: any) => void;
  onDeleteQuote: (quoteId: string) => void;
  handleAwardQuote: (q: any) => void;
  handleConvertQuoteToPo: (q: any) => void;
  handleDownloadPdf?: (q: any) => void;
}

export const SupplierQuotesView: React.FC<SupplierQuotesViewProps> = ({
  darkMode,
  rfqs,
  quotes,
  getSupplierDisplayName,
  handleOpenNewQuoteModal,
  handleOpenEditQuoteModal,
  onViewQuote,
  onDeleteQuote,
  handleAwardQuote,
  handleConvertQuoteToPo,
  handleDownloadPdf,
}) => {
  const downloadPdf = (q: any) => {
    // ... (rest of downloadPdf function is unchanged)
    if (handleDownloadPdf) {
      handleDownloadPdf(q);
      return;
    }

    const doc = new jsPDF() as any;
    const supplierName = getSupplierDisplayName(q.supplierId, q.supplierName);
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('SUPPLIER QUOTATION', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('AMK ERP SYSTEM', 105, 27, { align: 'center' });
    
    // Company & Supplier Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Information:', 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('AMK Industries Pvt Ltd', 14, 52);
    doc.text('Plot No. 45, Industrial Area, Sector 5', 14, 57);
    doc.text('Mumbai, Maharashtra - 400001', 14, 62);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier Information:', 120, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(supplierName, 120, 52);
    doc.text(`Quote #: ${q.quotationNumber || q.id}`, 120, 57);
    doc.text(`Date: ${q.quotationDate || 'N/A'}`, 120, 62);
    doc.text(`Valid Until: ${q.validUntil || 'N/A'}`, 120, 67);
    
    // Table
    const tableData = (q.items || []).map((item: any) => [
      item.materialName || item.materialCode,
      item.quantity,
      item.unit || 'Kg',
      `INR ${item.unitPrice}`,
      `INR ${item.discount || 0}`,
      `${item.taxPercent || 18}%`,
      `INR ${item.taxAmount?.toLocaleString() || '0'}`,
      `INR ${item.totalAmount?.toLocaleString() || '0'}`
    ]);
    
    doc.autoTable({
      startY: 80,
      head: [['Material', 'Qty', 'Unit', 'Price', 'Disc', 'GST', 'Tax Amt', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // Emerald-500
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Totals
    doc.setFont('helvetica', 'bold');
    const totalTax = (q.items || []).reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
    const subtotal = q.totalPrice - totalTax;
    
    doc.text(`Subtotal: INR ${subtotal.toLocaleString()}`, 140, finalY + 15);
    doc.text(`Total Tax (GST): INR ${totalTax.toLocaleString()}`, 140, finalY + 22);
    doc.setFontSize(14);
    doc.text(`Grand Total: INR ${q.totalPrice.toLocaleString()}`, 140, finalY + 32);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms & Conditions:', 14, finalY + 15);
    doc.text(q.paymentTerms || 'Standard Terms Apply', 14, finalY + 22);
    if (q.remarks) {
        doc.text('Remarks:', 14, finalY + 32);
        doc.text(q.remarks, 14, finalY + 39);
    }
    
    doc.save(`Quotation_${q.quotationNumber || q.id}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800 dark:text-slate-500'}`}>All Supplier Quotations</h3>
          <p className="text-[11px] text-slate-700 dark:text-slate-400">Manage and view all incoming supplier quotations.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenNewQuoteModal}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center space-x-1 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Supplier Quotation</span>
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'} overflow-hidden`}>
        <table className="w-full text-left text-xs">
          <thead className={darkMode ? 'bg-slate-900' : 'bg-slate-50'}>
            <tr>
              <th className="p-3">Quotation No.</th>
              <th className="p-3">Supplier</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Avg Rate</th>
              <th className="p-3 text-right">Total Proposal</th>
              <th className="p-3 text-right">Lead Time</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/20">
            {quotes.map(q => (
              <tr key={q.id} className={darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}>
                <td className="p-3 font-mono">{q.quotationNumber || `QTN-${q.id}`}</td>
                <td className="p-3 font-bold">{getSupplierDisplayName(q.supplierId, q.supplierName)}</td>
                <td className="p-3">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                        (q.status || '').toLowerCase() === 'awarded' ? 'bg-emerald-600 text-white' : 
                        (q.status || '').toLowerCase() === 'submitted' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                    }`}>
                        {q.status}
                    </span>
                </td>
                <td className="p-3 text-right font-mono">₹{(q.unitPrice || 0).toLocaleString()}</td>
                <td className="p-3 text-right font-mono font-bold">₹{(q.totalPrice || 0).toLocaleString()}</td>
                <td className="p-3 text-right">{q.deliveryDays || 0} Days</td>
                <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                        {onViewQuote && (
                            <button onClick={() => onViewQuote(q)} className="p-1.5 hover:bg-slate-800 rounded-lg text-cyan-400" title="View"><Eye className="w-3.5 h-3.5"/></button>
                        )}
                        <button onClick={() => downloadPdf(q)} className="p-1.5 hover:bg-slate-800 rounded-lg text-emerald-400" title="PDF"><Download className="w-3.5 h-3.5"/></button>
                        <button onClick={() => handleOpenEditQuoteModal(q)} className="p-1.5 hover:bg-slate-800 rounded-lg" title="Edit">Edit</button>
                        <button onClick={() => onDeleteQuote(q)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer" title="Move to Recycle Bin"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
