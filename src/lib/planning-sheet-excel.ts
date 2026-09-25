import * as XLSX from 'xlsx';
import { CostSheetItem } from '@/types';

export function generatePlanningCostSheetWorkbook(costSheet: CostSheetItem): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

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

  // Deckle in cm / inches if needed, or mm
  const deckleDisplay = Math.round(deckleMm / 10);
  const adjustedDeckleDisplay = Math.round(deckleMm / 10) + 3; // Standard adjusted deckle
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

  // Map layers into 7 standard slots (TOP, FLUTE 1, LINER 1, FLUTE 2, LINER 2, FLUTE 3, LINER 3)
  const slotRows: {
    label: string;
    flute: string;
    flutePercent: string;
    gsm: number | string;
    bf: number | string;
    shade: string;
    rate: number | string;
  }[] = [
    { label: 'TOP', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '' },
    { label: 'FLUTE 1', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '' },
    { label: 'LINER 1', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '' },
    { label: 'FLUTE 2', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '' },
    { label: 'LINER 2', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '' },
    { label: 'FLUTE 3', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '' },
    { label: 'LINER 3', flute: '', flutePercent: '', gsm: '', bf: '', shade: '', rate: '' },
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
        slotRows[0].shade = l.paperGrade || 'Natural Kraft';
      } else if (isFlute) {
        const slot = slotRows.find((s) => s.label === `FLUTE ${fluteIdx}`);
        if (slot) {
          slot.flute = l.fluteType || (fluteIdx === 1 ? 'C' : 'B');
          const takeUp = Number(l.fluteFactor) || (slot.flute === 'C' ? 1.43 : 1.35);
          slot.flutePercent = `${Math.round((takeUp - 1) * 100)}%`;
          slot.gsm = l.gsm || 150;
          slot.bf = l.bf || 22;
          slot.rate = l.ratePerKg || 39;
          slot.shade = l.paperGrade || 'Fluting Medium';
        }
        fluteIdx++;
      } else {
        const slot = slotRows.find((s) => s.label === `LINER ${linerIdx}`);
        if (slot) {
          slot.gsm = l.gsm || 150;
          slot.bf = l.bf || 22;
          slot.rate = l.ratePerKg || 39;
          slot.shade = l.paperGrade || 'Semi Kraft';
        }
        linerIdx++;
      }
    });
  } else {
    // Default fallback for 3-ply / 5-ply
    const ply = costSheet.ply || 5;
    slotRows[0] = { label: 'TOP', flute: '', flutePercent: '', gsm: 150, bf: 22, shade: 'Virgin Kraft', rate: 39 };
    slotRows[1] = { label: 'FLUTE 1', flute: 'C', flutePercent: '50%', gsm: 150, bf: 22, shade: 'Fluting', rate: 39 };
    slotRows[2] = { label: 'LINER 1', flute: '', flutePercent: '', gsm: 150, bf: 22, shade: 'Kraft', rate: 39 };
    if (ply >= 5) {
      slotRows[3] = { label: 'FLUTE 2', flute: 'B', flutePercent: '40%', gsm: 150, bf: 22, shade: 'Fluting', rate: 39 };
      slotRows[4] = { label: 'LINER 2', flute: '', flutePercent: '', gsm: 150, bf: 22, shade: 'Testliner', rate: 39 };
    }
  }

  const createdDate = costSheet.createdAt
    ? new Date(costSheet.createdAt).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  const serialNo = costSheet.costSheetNumber ? `AKPL-${costSheet.costSheetNumber.replace(/[^0-9]/g, '') || '2026-0804'}` : 'AKPL-2026-0804';

  // Build rows matching the layout
  const rows: (string | number)[][] = [
    ['', 'PLANNING AND COST SHEET', '', '', '', `Date:${createdDate}`],
    ['', '', '', '', '', `Sl.no:${serialNo}`],
    [],
    // Customer details Table
    ['Customer details', '', '', '', '', 'OUTPUT', ''],
    ['Company Name', costSheet.customerName || costSheet.customer?.name || 'Smartpack Pvt Ltd', '', '', '', 'Box weight (Kg)', Number(boxWeightKg.toFixed(2))],
    ['Type of Box', costSheet.boxType || 'Universal', '', '', '', '', ''],
    ['Description', `${costSheet.ply || 5} Ply Plain Box`, '', '', '', 'Required paper per Order (kg)', requiredPaperKg],
    ['Ply', costSheet.ply || 5, '', '', '', '', ''],
    ['Print', 'OFFSET Printing Cost', Number(costSheet.printingCostPerBox || 0), '', '', 'Rate per Box(Rs)', Number(ratePerBox.toFixed(2))],
    ['Labour Cost', Number(costSheet.conversionLaborCostPerBox || 0), '', '', '', '', ''],
    ['Dimension(MM)', Math.round(lMm), Math.round(wMm), Math.round(hMm), '', 'PO Value(Rs)', Number(poValue.toFixed(2))],
    ['Order Quantity', qty, '', '', '', '', ''],
    [],
    // Paper Specification Table
    ['Paper Specification', '', '', '', '', '', ''],
    ['Paper Combination', 'Flute', 'Flute %', 'GSM', 'BF', 'Shade', 'Rate'],
    ...slotRows.map((r) => [r.label, r.flute, r.flutePercent, r.gsm, r.bf, r.shade, r.rate]),
    [],
    // Box Specification Table
    ['Box Specification', '', '', '', '', '', ''],
    ['Deckle/ Adjusted Deckle', deckleDisplay, adjustedDeckleDisplay, '', '', '', ''],
    ['ups', 2, '', '', '', '', ''],
    ['Cutting length', cutLengthDisplay, '', '', '', '', ''],
    [],
    // Other Charges Table
    ['Other Charges', '', '', '', '', '', ''],
    ['Freight', Number(costSheet.freightCostPerBox || 0)],
    ['Die', Number(costSheet.dieCostTotal || 0)],
    ['Stereo', Number(costSheet.plateStereoCostTotal || 0)],
    ['Offset printing rate', Number(costSheet.printingCostPerBox || 0)],
    ['Conversion', Number(costSheet.conversionLaborCostPerBox || 10)],
    ['Margin', `${costSheet.profitMarginPercent || 15}%`],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 24 }, // A
    { wch: 20 }, // B
    { wch: 14 }, // C
    { wch: 12 }, // D
    { wch: 12 }, // E
    { wch: 28 }, // F
    { wch: 18 }, // G
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Planning & Cost Sheet');
  return wb;
}

export function downloadPlanningCostSheetExcel(costSheet: CostSheetItem) {
  const wb = generatePlanningCostSheetWorkbook(costSheet);
  const fileName = `Planning_Cost_Sheet_${costSheet.costSheetNumber || 'CS-2026'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
