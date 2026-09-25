'use client';

import React, { useRef } from 'react';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { CostSheetItem } from '@/types';
import { downloadPlanningCostSheetExcel } from '@/lib/planning-sheet-excel';
import { downloadPlanningCostSheetPdf } from '@/lib/planning-sheet-pdf';

interface PlanningCostSheetModalProps {
  costSheet: CostSheetItem;
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export function PlanningCostSheetModal({
  costSheet,
  isOpen,
  onClose,
  darkMode,
}: PlanningCostSheetModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isInch = costSheet.dimensionUnit === 'inch';
  const lMm = isInch ? (costSheet.length || 0) * 25.4 : (costSheet.length || 0);
  const wMm = isInch ? (costSheet.width || 0) * 25.4 : (costSheet.width || 0);
  const hMm = isInch ? (costSheet.height || 0) * 25.4 : (costSheet.height || 0);

  const jointFlap = costSheet.jointFlapMm !== undefined ? costSheet.jointFlapMm : 35;
  const crease = costSheet.creaseAllowanceMm !== undefined ? costSheet.creaseAllowanceMm : 0;

  const deckleMm =
    costSheet.deckleSizeMm && costSheet.deckleSizeMm > 50
      ? costSheet.deckleSizeMm
      : Math.round(((wMm + hMm) * 2) + jointFlap);

  const cutLengthMm =
    costSheet.cuttingLengthMm && costSheet.cuttingLengthMm > 50
      ? costSheet.cuttingLengthMm
      : Math.round(lMm + wMm + crease);

  // Deckle in cm (standard corrugator notation)
  const deckleDisplay = Math.round(deckleMm / 10);
  const adjustedDeckleDisplay = Math.round(deckleMm / 10) + 3;
  const cutLengthDisplay = Math.round(cutLengthMm / 10);

  const qty = Number(costSheet.targetQuantity) || 1;
  const boxWeightKg =
    Number(costSheet.singleBoxWeightKg) ||
    (Number(costSheet.singleBoxWeightGrams) ? Number(costSheet.singleBoxWeightGrams) / 1000 : 0) ||
    (Number(costSheet.totalBoardGsm || 0) > 0
      ? (costSheet.totalBoardGsm * ((deckleMm * cutLengthMm) / 1000000)) / 1000
      : 1.22);
  const requiredPaperKg = Math.round(boxWeightKg * qty);
  const ratePerBox = Number(costSheet.sellingPricePerBox) || 0;
  const poValue = Number(costSheet.totalOrderValue) || ratePerBox * qty;

  const layers = (costSheet.layers as any[]) || [];

  // Map into the standard 7 row slots: TOP, FLUTE 1, LINER 1, FLUTE 2, LINER 2, FLUTE 3, LINER 3
  const slotRows: {
    label: string;
    flute: string;
    flutePercent: string;
    gsm: number | string;
    bf: number | string;
    shade: string;
    rate: number | string;
    isFlute: boolean;
  }[] = [
    { label: 'TOP', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '', isFlute: false },
    { label: 'FLUTE 1', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '', isFlute: true },
    { label: 'LINER 1', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '', isFlute: false },
    { label: 'FLUTE 2', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '', isFlute: true },
    { label: 'LINER 2', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '', isFlute: false },
    { label: 'FLUTE 3', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '', isFlute: true },
    { label: 'LINER 3', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '', isFlute: false },
  ];

  if (layers.length > 0) {
    let fluteIdx = 1;
    let linerIdx = 1;
    layers.forEach((l, idx) => {
      const isFlute = l.layerType === 'Fluting' || (l.layerName && l.layerName.toLowerCase().includes('flut')) || (idx % 2 === 1);
      if (idx === 0) {
        slotRows[0].gsm = l.gsm || 150;
        slotRows[0].bf = l.bf || 22;
        slotRows[0].rate = l.ratePerKg || 39;
        slotRows[0].shade = l.paperGrade || '';
      } else if (isFlute) {
        const slot = slotRows.find((s) => s.label === `FLUTE ${fluteIdx}`);
        if (slot) {
          slot.flute = l.fluteType || (fluteIdx === 1 ? 'C' : 'B');
          const takeUp = Number(l.fluteFactor) || (slot.flute === 'C' ? 1.43 : 1.35);
          slot.flutePercent = `${Math.round((takeUp - 1) * 100)}`;
          slot.gsm = l.gsm || 150;
          slot.bf = l.bf || 22;
          slot.rate = l.ratePerKg || 39;
          slot.shade = l.paperGrade || '';
        }
        fluteIdx++;
      } else {
        const slot = slotRows.find((s) => s.label === `LINER ${linerIdx}`);
        if (slot) {
          slot.gsm = l.gsm || 150;
          slot.bf = l.bf || 22;
          slot.rate = l.ratePerKg || 39;
          slot.shade = l.paperGrade || '';
        }
        linerIdx++;
      }
    });
  } else {
    // Default fallback for 5-ply / 3-ply
    const ply = costSheet.ply || 5;
    slotRows[0] = { label: 'TOP', flute: '', flutePercent: '', gsm: 150, bf: 22, shade: '', rate: 39, isFlute: false };
    slotRows[1] = { label: 'FLUTE 1', flute: 'C', flutePercent: '50', gsm: 150, bf: 22, shade: '', rate: 39, isFlute: true };
    slotRows[2] = { label: 'LINER 1', flute: '', flutePercent: '', gsm: 150, bf: 22, shade: '', rate: 39, isFlute: false };
    if (ply >= 5) {
      slotRows[3] = { label: 'FLUTE 2', flute: 'B', flutePercent: '40', gsm: 150, bf: 22, shade: '', rate: 39, isFlute: true };
      slotRows[4] = { label: 'LINER 2', flute: '', flutePercent: '', gsm: 150, bf: 22, shade: '', rate: 39, isFlute: false };
    }
  }

  const createdDate = costSheet.createdAt
    ? new Date(costSheet.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-')
    : '01-08-2026';

  const serialNo = costSheet.costSheetNumber
    ? `AKPL-${costSheet.costSheetNumber.replace(/[^0-9]/g, '') || '2026-0804'}`
    : 'AKPL-2026-0804';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadPlanningCostSheetPdf(costSheet);
  };

  const handleDownloadExcel = () => {
    downloadPlanningCostSheetExcel(costSheet);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      <div
        className={`relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
        } print:border-none print:shadow-none print:max-w-none print:rounded-none`}
      >
        {/* Action Header Bar (Hidden in Print) */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b print:hidden ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Planning & Cost Sheet Format
              </h3>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Download dynamically generated PDF & Excel matching the factory specification
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                darkMode
                  ? 'border-slate-700 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 hover:bg-slate-200 text-slate-800 bg-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                darkMode
                  ? 'border-slate-700 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 hover:bg-slate-200 text-slate-800 bg-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Planning Sheet Area */}
        <div className="p-6 sm:p-10 overflow-x-auto bg-white text-black font-sans print:p-0">
          <div
            ref={printRef}
            className="w-[820px] mx-auto bg-white border border-black p-6 space-y-4 print:border-none print:w-full print:p-0"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* Header: Logo, Title, Date & Sl.No */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              {/* Logo / Company Mark */}
              <div className="w-36 h-10 border-2 border-blue-400 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center rounded shadow-inner text-white font-black text-xl tracking-wider">
                <span className="text-white text-shadow">AMK</span>
              </div>

              {/* Title */}
              <div className="text-center font-bold text-base tracking-wider text-slate-800 uppercase">
                PLANNING AND COST SHEET
              </div>

              {/* Date & Serial */}
              <div className="text-right text-xs font-bold text-slate-800 space-y-1">
                <div>Date:{createdDate}</div>
                <div>Sl.no:{serialNo}</div>
              </div>
            </div>

            {/* Main Body Grid: Left (4 Tables) + Right (OUTPUT Box) */}
            <div className="grid grid-cols-12 gap-5 pt-2">
              {/* Left Side (8 Cols): Tables */}
              <div className="col-span-8 space-y-4">
                {/* 1. Customer details Table */}
                <table className="w-full text-xs border-collapse border border-black text-center">
                  <thead>
                    <tr className="bg-[#e7e6e6] border-b border-black font-bold">
                      <th colSpan={4} className="py-1 px-2 border-r border-black uppercase text-center">
                        Customer details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-36 py-1 px-2 text-left font-semibold border-r border-black">
                        Company Name
                      </td>
                      <td colSpan={3} className="py-1 px-2 text-center font-medium">
                        {costSheet.customerName || costSheet.customer?.name || 'Shyamprabha Smartpack Pvt Ltd'}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Type of Box
                      </td>
                      <td colSpan={3} className="py-1 px-2 bg-[#fcd7b6] text-center font-medium">
                        {costSheet.boxType || 'Universal'}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Description
                      </td>
                      <td colSpan={3} className="py-1 px-2 text-center font-medium">
                        {costSheet.ply || 5} Ply Plain Box
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Ply
                      </td>
                      <td colSpan={3} className="py-1 px-2 bg-[#d9ebd3] font-bold text-center">
                        {costSheet.ply || 5}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Print
                      </td>
                      <td className="w-36 py-1 px-2 bg-[#d9ebd3] font-bold text-center border-r border-black">
                        OFFSET Printing Cost
                      </td>
                      <td colSpan={2} className="py-1 px-2 bg-[#fcd7b6] font-medium text-center">
                        {Number(costSheet.printingCostPerBox || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Labour Cost
                      </td>
                      <td colSpan={3} className="py-1 px-2 bg-[#d9ebd3] font-bold text-center">
                        {Number(costSheet.conversionLaborCostPerBox || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Dimension(MM)
                      </td>
                      <td className="py-1 px-2 border-r border-black font-medium">{Math.round(lMm)}</td>
                      <td className="py-1 px-2 border-r border-black font-medium">{Math.round(wMm)}</td>
                      <td className="py-1 px-2 font-medium">{Math.round(hMm)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Order Quantity
                      </td>
                      <td colSpan={3} className="py-1 px-2 font-bold text-center">
                        {qty}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. Paper Specification Table */}
                <table className="w-full text-xs border-collapse border border-black text-center">
                  <thead>
                    <tr className="bg-[#e7e6e6] border-b border-black font-bold">
                      <th colSpan={7} className="py-1 px-2 border-r border-black uppercase text-center">
                        Paper Specification
                      </th>
                    </tr>
                    <tr className="bg-[#8ea9db] text-white border-b border-black font-bold text-[11px]">
                      <th className="py-1 px-1 border-r border-black w-28">Paper Combination</th>
                      <th className="py-1 px-1 border-r border-black w-14">Flute</th>
                      <th className="py-1 px-1 border-r border-black w-16">Flute %</th>
                      <th className="py-1 px-1 border-r border-black w-14">GSM</th>
                      <th className="py-1 px-1 border-r border-black w-12">BF</th>
                      <th className="py-1 px-1 border-r border-black w-14">Shade</th>
                      <th className="py-1 px-1 w-14">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-black font-medium text-[11px]">
                        <td
                          className={`py-1 px-1.5 text-left font-bold border-r border-black ${
                            row.isFlute ? 'bg-[#bdd7ee]' : 'bg-white'
                          }`}
                        >
                          {row.label}
                        </td>
                        <td className={`py-1 px-1 border-r border-black ${row.flute ? 'bg-[#d9ebd3] font-bold italic' : ''}`}>
                          {row.flute}
                        </td>
                        <td className={`py-1 px-1 border-r border-black ${row.flutePercent ? 'bg-[#fcd7b6] font-semibold' : ''}`}>
                          {row.flutePercent}
                        </td>
                        <td className="py-1 px-1 border-r border-black">{row.gsm}</td>
                        <td className="py-1 px-1 border-r border-black">{row.bf}</td>
                        <td className={`py-1 px-1 border-r border-black ${row.gsm ? 'bg-[#d9ebd3]' : ''}`}>
                          {row.shade ? row.shade.slice(0, 6) : ''}
                        </td>
                        <td className="py-1 px-1">{row.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 3. Box Specification Table */}
                <table className="w-full text-xs border-collapse border border-black text-center">
                  <thead>
                    <tr className="bg-[#e7e6e6] border-b border-black font-bold">
                      <th colSpan={3} className="py-1 px-2 border-r border-black uppercase text-center">
                        Box Specification
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-40 py-1 px-2 text-left font-semibold border-r border-black">
                        Deckle/ Adjusted Deckle
                      </td>
                      <td className="w-24 py-1 px-2 bg-[#fcd7b6] font-medium border-r border-black text-center">
                        {deckleDisplay}
                      </td>
                      <td className="py-1 px-2 font-medium text-center">{adjustedDeckleDisplay}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">ups</td>
                      <td colSpan={2} className="py-1 px-2 font-medium text-center">
                        2
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left font-semibold border-r border-black">
                        Cutting length
                      </td>
                      <td colSpan={2} className="py-1 px-2 bg-[#fcd7b6] font-medium text-center">
                        {cutLengthDisplay}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. Other Charges Table */}
                <table className="w-full text-xs border-collapse border border-black text-center">
                  <thead>
                    <tr className="bg-[#e7e6e6] border-b border-black font-bold">
                      <th colSpan={2} className="py-1 px-2 border-r border-black uppercase text-center">
                        Other Charges
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-40 py-1 px-2 text-left font-bold text-blue-900 border-r border-black">
                        Freight
                      </td>
                      <td className="py-1 px-2 font-medium text-center">
                        {Number(costSheet.freightCostPerBox || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-bold text-blue-900 border-r border-black">
                        Die
                      </td>
                      <td className="py-1 px-2 font-medium text-center">
                        {Number(costSheet.dieCostTotal || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-bold text-blue-900 border-r border-black">
                        Stereo
                      </td>
                      <td className="py-1 px-2 font-medium text-center">
                        {Number(costSheet.plateStereoCostTotal || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-bold text-blue-900 border-r border-black">
                        Offset printing rate
                      </td>
                      <td className="py-1 px-2 bg-[#fcd7b6] font-medium text-center">
                        {Number(costSheet.printingCostPerBox || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="py-1 px-2 text-left font-bold text-blue-900 border-r border-black">
                        Conversion
                      </td>
                      <td className="py-1 px-2 bg-[#d9ebd3] font-bold text-emerald-700 italic text-center">
                        {Number(costSheet.conversionLaborCostPerBox || 10)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-left font-bold text-blue-900 border-r border-black">
                        Margin
                      </td>
                      <td className="py-1 px-2 bg-[#d9ebd3] font-bold text-emerald-700 italic text-center">
                        {costSheet.profitMarginPercent || 15}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Side (4 Cols): OUTPUT Card */}
              <div className="col-span-4">
                <div className="border-2 border-black rounded-sm overflow-hidden shadow-sm">
                  {/* Output Header */}
                  <div className="bg-[#fcd7b6] py-3 text-center border-b-2 border-black">
                    <h3 className="text-base font-black tracking-wider text-black uppercase">
                      OUTPUT
                    </h3>
                  </div>

                  {/* Output Data Rows */}
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="w-1/2 py-3 px-2 font-semibold border-r border-black leading-tight">
                          Box weight (Kg)
                        </td>
                        <td className="py-3 px-2 bg-[#fff2cc] font-bold text-right text-sm">
                          {boxWeightKg.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="py-3 px-2 font-semibold border-r border-black leading-tight">
                          Required paper per Order (kg)
                        </td>
                        <td className="py-3 px-2 bg-[#fff2cc] font-bold text-right text-sm">
                          {requiredPaperKg.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="py-3 px-2 font-semibold border-r border-black leading-tight">
                          Rate per Box(Rs)
                        </td>
                        <td className="py-3 px-2 bg-[#fff2cc] font-bold text-right text-sm">
                          {ratePerBox.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-semibold border-r border-black leading-tight">
                          PO Value(Rs)
                        </td>
                        <td className="py-3 px-2 bg-[#fff2cc] font-black text-right text-sm text-slate-900">
                          {poValue.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
