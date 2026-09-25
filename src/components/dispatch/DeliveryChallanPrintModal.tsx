'use client';

import React, { useRef } from 'react';
import { Printer, X, Download, ShieldCheck, Truck, Package, Building, FileText } from 'lucide-react';

interface DeliveryChallanPrintModalProps {
  dispatch: any;
  onClose: () => void;
  darkMode?: boolean;
}

export const DeliveryChallanPrintModal: React.FC<DeliveryChallanPrintModalProps> = ({
  dispatch,
  onClose,
  darkMode = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Delivery Challan - ' + (dispatch.challanNumber || 'Print') + '</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #1e293b; margin: 0; padding: 10px; }
        .border-box { border: 1.5px solid #0f172a; }
        .table-border { border-collapse: collapse; width: 100%; }
        .table-border th, .table-border td { border: 1px solid #334155; padding: 6px 8px; font-size: 11px; }
        .table-border th { background-color: #f1f5f9; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .bg-gray { background-color: #f8fafc; }
        .grid-2 { display: flex; width: 100%; border-bottom: 1px solid #334155; }
        .grid-col { flex: 1; padding: 8px; }
        .grid-col:first-child { border-right: 1px solid #334155; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `);
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 350);
    } else {
      window.print();
    }
  };

  const items = dispatch.items || [];
  const totalAmount = items.reduce((sum: number, it: any) => sum + (Number(it.amount) || (Number(it.dispatchedQuantity) * Number(it.rate || 0))), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Delivery Challan & Gate Pass Preview</h3>
              <p className="text-xs text-slate-500">Challan #{dispatch.challanNumber} • Tax & Transport Compliant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)] bg-slate-100 dark:bg-slate-950/50 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[800px] bg-white text-slate-900 p-8 shadow-sm border border-slate-300 font-sans text-xs"
          >
            {/* Top Regulatory Label */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 border-b pb-1 border-slate-200">
              <span>GST RULE 55 COMPLIANT • DELIVERY CHALLAN FOR REMOVAL OF GOODS</span>
              <span className="font-semibold text-slate-700 uppercase">Original for Consignee</span>
            </div>

            {/* Company Header */}
            <div className="text-center pb-4 mb-3 border-b-2 border-slate-900">
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                AMK Corrugation & Packaging Pvt. Ltd.
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Plot No. 42-45, Industrial Area Phase II, Packaging Zone, Mumbai, Maharashtra - 400093
              </p>
              <div className="flex justify-center flex-wrap gap-x-4 text-[10px] text-slate-700 font-medium mt-1">
                <span><strong>GSTIN:</strong> 27AABCA1234F1Z5</span>
                <span><strong>CIN:</strong> U21022MH2018PTC304891</span>
                <span><strong>Email:</strong> dispatch@amkpackaging.com</span>
                <span><strong>Phone:</strong> +91 22 2847 9000</span>
              </div>
              <div className="mt-2 inline-block bg-slate-900 text-white font-bold px-4 py-0.5 tracking-wider text-xs uppercase rounded-xs">
                DELIVERY CHALLAN & GATE PASS
              </div>
            </div>

            {/* Document Info Grid */}
            <div className="grid grid-cols-2 border border-slate-900 mb-3">
              {/* Left Column: Challan & Order Info */}
              <div className="p-3 border-r border-slate-900 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Challan No:</span>
                  <span className="font-bold text-slate-900">{dispatch.challanNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Dispatch Date:</span>
                  <span className="font-semibold">{dispatch.dispatchDate} {dispatch.dispatchTime && `• ${dispatch.dispatchTime}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sales Order No:</span>
                  <span className="font-semibold text-blue-800">{dispatch.soNumber || dispatch.salesOrder?.soNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer PO No:</span>
                  <span className="font-medium">{dispatch.customerPoNumber || dispatch.salesOrder?.customerPoNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Type:</span>
                  <span className="font-semibold text-emerald-800">{dispatch.deliveryType || 'Full Delivery'}</span>
                </div>
                {dispatch.partialAction && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Partial Action:</span>
                    <span className="font-medium">{dispatch.partialAction}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Transport & Gate Info */}
              <div className="p-3 space-y-1.5 bg-slate-50/50">
                <div className="flex justify-between">
                  <span className="text-slate-600">Vehicle No:</span>
                  <span className="font-bold text-slate-900 uppercase tracking-wide">{dispatch.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Transporter:</span>
                  <span className="font-semibold">{dispatch.transporterName || 'Direct / Customer Fleet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Driver Name / Mobile:</span>
                  <span>{dispatch.driverName || 'N/A'} {dispatch.driverPhone && `(${dispatch.driverPhone})`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">E-Way Bill No:</span>
                  <span className="font-semibold">{dispatch.ewayBillNumber || 'N/A (Below Threshold / Local)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gate Pass No:</span>
                  <span className="font-bold text-slate-900">{dispatch.gatePassNumber || `GP-${dispatch.challanNumber}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">L.R. No. & Date:</span>
                  <span>{dispatch.lrNumber ? `${dispatch.lrNumber} (${dispatch.lrDate || dispatch.dispatchDate})` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Consignee & Shipping Details */}
            <div className="border border-slate-900 mb-3 grid grid-cols-2">
              <div className="p-3 border-r border-slate-900">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Details of Consignee (Billed To):</div>
                <div className="font-bold text-slate-900 text-sm">{dispatch.customerName || dispatch.customer?.name}</div>
                <div className="text-slate-600 mt-1 leading-snug">
                  {dispatch.customer?.address || 'Mumbai Industrial Zone'}
                </div>
                {dispatch.customer?.gstin && (
                  <div className="mt-1.5 text-[11px] font-semibold text-slate-800">
                    GSTIN: {dispatch.customer.gstin}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Dispatch Destination (Shipped To):</div>
                <div className="font-bold text-slate-900">{dispatch.customerName || dispatch.customer?.name}</div>
                <div className="text-slate-600 mt-1 leading-snug">
                  {dispatch.shippingAddress || dispatch.customer?.shippingAddress || dispatch.customer?.address || 'Ex-Factory Delivery'}
                </div>
                <div className="mt-1.5 text-[11px] text-slate-700">
                  <span><strong>Delivery Terms:</strong> {dispatch.deliveryTerm || 'Ex-Factory'}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-slate-900 mb-3 text-left">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-800 border-b border-slate-900">
                  <th className="border-r border-slate-900 p-2 text-center w-10">Sr.</th>
                  <th className="border-r border-slate-900 p-2">Item Description & Specification</th>
                  <th className="border-r border-slate-900 p-2 text-center w-16">HSN</th>
                  <th className="border-r border-slate-900 p-2 text-right w-16">Ordered</th>
                  <th className="border-r border-slate-900 p-2 text-right w-20">Dispatched</th>
                  <th className="border-r border-slate-900 p-2 text-center w-16">Bundles</th>
                  <th className="border-r border-slate-900 p-2 text-right w-20">Net Wt(Kg)</th>
                  <th className="border-r border-slate-900 p-2 text-right w-16">Rate(₹)</th>
                  <th className="p-2 text-right w-20">Amount(₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any, idx: number) => {
                  const qty = Number(it.dispatchedQuantity || it.quantity || 0);
                  const rate = Number(it.rate || it.unitPrice || 0);
                  const amt = Number(it.amount) || (qty * rate);
                  return (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="border-r border-slate-900 p-2 text-center font-medium">{idx + 1}</td>
                      <td className="border-r border-slate-900 p-2">
                        <div className="font-semibold text-slate-900">{it.productName || 'Corrugated Box'}</div>
                        <div className="text-[10px] text-slate-500 flex gap-2">
                          <span>Code: {it.productCode || it.product?.code || 'FG-PKG'}</span>
                          {it.binId && <span>• Bin: {it.binId}</span>}
                          {it.batchNumber && <span>• Batch: {it.batchNumber}</span>}
                        </div>
                      </td>
                      <td className="border-r border-slate-900 p-2 text-center font-mono text-[11px]">481910</td>
                      <td className="border-r border-slate-900 p-2 text-right text-slate-600">{it.orderedQuantity || it.quantity}</td>
                      <td className="border-r border-slate-900 p-2 text-right font-bold text-slate-900">
                        {qty.toLocaleString()} {it.unit || 'Pcs'}
                      </td>
                      <td className="border-r border-slate-900 p-2 text-center font-medium">
                        {it.bundlesCount || it.bundleCount || '-'}
                      </td>
                      <td className="border-r border-slate-900 p-2 text-right font-medium">
                        {Number(it.totalWeightKg || it.weightKg || 0).toFixed(1)}
                      </td>
                      <td className="border-r border-slate-900 p-2 text-right font-mono">
                        {rate > 0 ? rate.toFixed(2) : '-'}
                      </td>
                      <td className="p-2 text-right font-bold font-mono">
                        {amt > 0 ? amt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td colSpan={4} className="border-r border-slate-900 p-2 text-right uppercase">
                    Total Dispatched:
                  </td>
                  <td className="border-r border-slate-900 p-2 text-right text-slate-900">
                    {dispatch.totalQuantity?.toLocaleString()} Pcs
                  </td>
                  <td className="border-r border-slate-900 p-2 text-center">
                    {dispatch.totalBundles || '-'}
                  </td>
                  <td className="border-r border-slate-900 p-2 text-right">
                    {Number(dispatch.totalWeightKg || 0).toFixed(1)} Kg
                  </td>
                  <td className="border-r border-slate-900 p-2 text-right">-</td>
                  <td className="p-2 text-right font-mono">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Regulatory Remarks & QC Certification */}
            <div className="border border-slate-900 p-2.5 mb-4 text-[11px] bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Quality Assurance Status: <span className="text-emerald-700 font-bold">✓ FINAL QC APPROVED</span>
                </span>
                <span className="text-slate-500">Warehouse: {dispatch.warehouseName || dispatch.warehouse?.name || 'Main FG Warehouse'}</span>
              </div>
              {dispatch.remarks && (
                <div className="text-slate-600">
                  <strong>Special Instructions / Remarks:</strong> {dispatch.remarks}
                </div>
              )}
              <div className="text-[10px] text-slate-500 italic">
                Declaration: We certify that the goods described above are in good order and condition, fully inspected and packed per AMK QA protocols.
              </div>
            </div>

            {/* Signatures Block */}
            <div className="grid grid-cols-3 border border-slate-900 text-center text-[10px]">
              <div className="p-3 border-r border-slate-900 flex flex-col justify-between h-24">
                <span className="font-bold text-slate-700">Prepared & Dispatched By:</span>
                <div>
                  <div className="font-semibold text-slate-900">{dispatch.dispatchedBy || 'Dispatch Supervisor'}</div>
                  <div className="text-slate-400">AMK Packaging Dept.</div>
                </div>
              </div>
              <div className="p-3 border-r border-slate-900 flex flex-col justify-between h-24">
                <span className="font-bold text-slate-700">Security / Gate Verified By:</span>
                <div>
                  <div className="font-semibold text-slate-900">{dispatch.verifiedBy || 'Gate Incharge'}</div>
                  <div className="text-slate-400">Main Gate Pass Authority</div>
                </div>
              </div>
              <div className="p-3 flex flex-col justify-between h-24">
                <span className="font-bold text-slate-700">Customer Receipt & Seal:</span>
                <div className="border-t border-dashed border-slate-400 pt-1 text-slate-400">
                  Received Goods In Good Condition
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
