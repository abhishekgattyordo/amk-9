import { jsPDF } from 'jspdf';
import { CostSheetItem } from '@/types';

// Exact RGB Colors matching the reference image
const COLORS = {
  black: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  headerDark: [30, 41, 59] as [number, number, number], // #1e293b dark slate
  logoBlue: [41, 128, 185] as [number, number, number], // #2980b9
  logoBlueDark: [24, 88, 140] as [number, number, number],
  graySectionHeader: [231, 230, 230] as [number, number, number], // #e7e6e6 light gray
  paperSpecHeader: [91, 155, 213] as [number, number, number], // #5b9bd5 medium blue
  paperCombCell: [189, 215, 238] as [number, number, number], // #bdd7ee soft blue
  orangeCell: [252, 215, 182] as [number, number, number], // #fcd7b6 light orange / peach
  greenCell: [217, 235, 211] as [number, number, number], // #d9ebd3 light green
  greenText: [22, 128, 61] as [number, number, number], // #16803d dark green
  outputBanner: [252, 215, 182] as [number, number, number], // #fcd7b6 peach
  outputYellow: [255, 242, 204] as [number, number, number], // #fff2cc soft yellow / cream
  blueLabelText: [31, 78, 121] as [number, number, number], // #1f4e79 dark blue label
  borderBlack: [0, 0, 0] as [number, number, number],
};

export function generatePlanningCostSheetPdf(costSheet: CostSheetItem): jsPDF {
  // A4 portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const isInch = costSheet.dimensionUnit === 'inch';
  const lMm = isInch ? (costSheet.length || 0) * 25.4 : (costSheet.length || 0);
  const wMm = isInch ? (costSheet.width || 0) * 25.4 : (costSheet.width || 0);
  const hMm = isInch ? (costSheet.height || 0) * 25.4 : (costSheet.height || 0);

  const jointFlap = costSheet.jointFlapMm !== undefined ? costSheet.jointFlapMm : 35;
  const crease = costSheet.creaseAllowanceMm !== undefined ? costSheet.creaseAllowanceMm : 0;

  const deckleMm =
    costSheet.deckleSizeMm && costSheet.deckleSizeMm > 50
      ? costSheet.deckleSizeMm
      : Math.round((wMm + hMm) * 2 + jointFlap);

  const cutLengthMm =
    costSheet.cuttingLengthMm && costSheet.cuttingLengthMm > 50
      ? costSheet.cuttingLengthMm
      : Math.round(lMm + wMm + crease);

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

  // 7 standard slots (TOP, FLUTE 1, LINER 1, FLUTE 2, LINER 2, FLUTE 3, LINER 3)
  const slotRows: {
    label: string;
    flute: string;
    flutePercent: string;
    gsm: string | number;
    bf: string | number;
    shade: string;
    rate: string | number;
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
      const isFlute =
        l.layerType === 'Fluting' ||
        (l.layerName && l.layerName.toLowerCase().includes('flut')) ||
        idx % 2 === 1;
      if (idx === 0) {
        slotRows[0].gsm = l.gsm ?? '';
        slotRows[0].bf = l.bf ?? '';
        slotRows[0].rate = l.ratePerKg ?? '';
        slotRows[0].shade = l.paperGrade || '';
      } else if (isFlute) {
        const slot = slotRows.find((s) => s.label === `FLUTE ${fluteIdx}`);
        if (slot) {
          slot.flute = l.fluteType || (fluteIdx === 1 ? 'C' : 'B');
          const takeUp = Number(l.fluteFactor) || (slot.flute === 'C' ? 1.43 : 1.35);
          slot.flutePercent = `${Math.round((takeUp - 1) * 100)}`;
          slot.gsm = l.gsm ?? '';
          slot.bf = l.bf ?? '';
          slot.rate = l.ratePerKg ?? '';
          slot.shade = l.paperGrade || '';
        }
        fluteIdx++;
      } else {
        const slot = slotRows.find((s) => s.label === `LINER ${linerIdx}`);
        if (slot) {
          slot.gsm = l.gsm ?? '';
          slot.bf = l.bf ?? '';
          slot.rate = l.ratePerKg ?? '';
          slot.shade = l.paperGrade || '';
        }
        linerIdx++;
      }
    });
  } else {
    // Default fallback from cost sheet ply
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
    ? new Date(costSheet.createdAt)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-')
    : '01-08-2026';

  const serialNo = costSheet.costSheetNumber
    ? costSheet.costSheetNumber.startsWith('AKPL-')
      ? costSheet.costSheetNumber
      : `AKPL-${costSheet.costSheetNumber.replace(/[^0-9]/g, '') || '2026-0804'}`
    : 'AKPL-2026-0804';

  // Helper function to draw filled & bordered cell
  const drawCell = (
    x: number,
    y: number,
    w: number,
    h: number,
    text: string | number,
    options: {
      fill?: [number, number, number];
      textColor?: [number, number, number];
      fontStyle?: 'normal' | 'bold' | 'italic';
      fontSize?: number;
      align?: 'left' | 'center' | 'right';
      borderWidth?: number;
      paddingX?: number;
    } = {}
  ) => {
    const {
      fill,
      textColor = COLORS.black,
      fontStyle = 'normal',
      fontSize = 8,
      align = 'center',
      borderWidth = 0.3,
      paddingX = 2,
    } = options;

    doc.setLineWidth(borderWidth);
    doc.setDrawColor(COLORS.borderBlack[0], COLORS.borderBlack[1], COLORS.borderBlack[2]);

    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(x, y, w, h, 'FD');
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, w, h, 'FD');
    }

    if (text !== undefined && text !== null && text !== '') {
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      let textX = x + w / 2;
      if (align === 'left') {
        textX = x + paddingX;
      } else if (align === 'right') {
        textX = x + w - paddingX;
      }

      // Vertical center alignment approx
      const textY = y + h / 2 + fontSize * 0.12;
      doc.text(String(text), textX, textY, { align });
    }
  };

  // ==========================================
  // 1. PAGE BORDER
  // ==========================================
  const pageX = 10;
  const pageY = 10;
  const pageW = 190;
  const pageH = 277;

  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.rect(pageX, pageY, pageW, pageH);

  // ==========================================
  // 2. HEADER
  // ==========================================
  // Logo Box (Left)
  const logoX = 14;
  const logoY = 13;
  const logoW = 38;
  const logoH = 10;

  doc.setLineWidth(0.5);
  doc.setDrawColor(91, 155, 213);
  doc.setFillColor(235, 245, 255);
  doc.roundedRect(logoX, logoY, logoW, logoH, 1, 1, 'FD');

  // Inner gradient effect lines for logo
  doc.setFillColor(41, 128, 185);
  doc.roundedRect(logoX + 2, logoY + 1.5, logoW - 4, logoH - 3, 0.5, 0.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('AMK PACK', logoX + logoW / 2, logoY + logoH / 2 + 1.2, { align: 'center' });

  // Main Header Title (Center)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLORS.headerDark[0], COLORS.headerDark[1], COLORS.headerDark[2]);
  doc.text('PLANNING AND COST SHEET', 105, 19.5, { align: 'center' });

  // Date & Sl.No (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.headerDark[0], COLORS.headerDark[1], COLORS.headerDark[2]);
  doc.text(`Date:${createdDate}`, 196, 16, { align: 'right' });
  doc.text(`Sl.no:${serialNo}`, 196, 21.5, { align: 'right' });

  // Header Divider Line
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(pageX, 26, pageX + pageW, 26);

  // ==========================================
  // 3. LAYOUT COORDINATES
  // ==========================================
  const leftX = 14;
  const leftW = 115;
  const rightX = 136;
  const rightW = 60;

  // ==========================================
  // 4. LEFT COLUMN TABLES
  // ==========================================

  // --- Table 1: Customer details ---
  let curY = 32;
  const rowH1 = 5.2;

  // Section Header
  drawCell(leftX, curY, leftW, 5.8, 'Customer details', {
    fill: COLORS.graySectionHeader,
    fontStyle: 'bold',
    fontSize: 9,
    align: 'center',
    borderWidth: 0.4,
  });
  curY += 5.8;

  // Row 1: Company Name
  const col1W = 34;
  const colRestW = leftW - col1W;
  drawCell(leftX, curY, col1W, rowH1, 'Company Name', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, colRestW, rowH1, costSheet.customerName || costSheet.customer?.name || 'Shyamprabha Smartpack Pvt Ltd', {
    fontStyle: 'normal',
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH1;

  // Row 2: Type of Box
  drawCell(leftX, curY, col1W, rowH1, 'Type of Box', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, colRestW, rowH1, costSheet.boxType || 'Universal', {
    fill: COLORS.orangeCell,
    fontStyle: 'normal',
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH1;

  // Row 3: Description
  drawCell(leftX, curY, col1W, rowH1, 'Description', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, colRestW, rowH1, `${costSheet.ply || 5} Ply Plain Box`, {
    fontStyle: 'normal',
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH1;

  // Row 4: Ply
  drawCell(leftX, curY, col1W, rowH1, 'Ply', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, colRestW, rowH1, costSheet.ply || 5, {
    fill: COLORS.greenCell,
    fontStyle: 'bold',
    fontSize: 8,
    align: 'center',
  });
  curY += rowH1;

  // Row 5: Print
  const printMidW = 42;
  const printValW = colRestW - printMidW;
  drawCell(leftX, curY, col1W, rowH1, 'Print', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, printMidW, rowH1, 'OFFSET Printing Cost', {
    fill: COLORS.greenCell,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'center',
  });
  drawCell(leftX + col1W + printMidW, curY, printValW, rowH1, Number(costSheet.printingCostPerBox || 0), {
    fill: COLORS.orangeCell,
    fontStyle: 'normal',
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH1;

  // Row 6: Labour Cost
  drawCell(leftX, curY, col1W, rowH1, 'Labour Cost', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, colRestW, rowH1, Number(costSheet.conversionLaborCostPerBox || 0), {
    fill: COLORS.greenCell,
    fontStyle: 'bold',
    fontSize: 8,
    align: 'center',
  });
  curY += rowH1;

  // Row 7: Dimension(MM)
  const dimColW = colRestW / 3;
  drawCell(leftX, curY, col1W, rowH1, 'Dimension(MM)', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, dimColW, rowH1, Math.round(lMm), { fontStyle: 'normal', fontSize: 7.5, align: 'center' });
  drawCell(leftX + col1W + dimColW, curY, dimColW, rowH1, Math.round(wMm), { fontStyle: 'normal', fontSize: 7.5, align: 'center' });
  drawCell(leftX + col1W + dimColW * 2, curY, dimColW, rowH1, Math.round(hMm), { fontStyle: 'normal', fontSize: 7.5, align: 'center' });
  curY += rowH1;

  // Row 8: Order Quantity
  drawCell(leftX, curY, col1W, rowH1, 'Order Quantity', { fontStyle: 'bold', fontSize: 7.5, align: 'left', paddingX: 1.5 });
  drawCell(leftX + col1W, curY, colRestW, rowH1, qty, { fontStyle: 'bold', fontSize: 8, align: 'center' });
  curY += rowH1 + 4; // Spacing before next table

  // --- Table 2: Paper Specification ---
  const rowH2 = 4.8;
  const pCol1 = 30; // Paper Combination
  const pCol2 = 14; // Flute
  const pCol3 = 14; // Flute %
  const pCol4 = 14; // GSM
  const pCol5 = 13; // BF
  const pCol6 = 15; // Shade
  const pCol7 = 15; // Rate

  // Section Header
  drawCell(leftX, curY, leftW, 5.8, 'Paper Specification', {
    fill: COLORS.graySectionHeader,
    fontStyle: 'bold',
    fontSize: 9,
    align: 'center',
    borderWidth: 0.4,
  });
  curY += 5.8;

  // Columns Header Row
  drawCell(leftX, curY, pCol1, rowH2, 'Paper Combination', {
    fill: COLORS.paperSpecHeader,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 7,
  });
  drawCell(leftX + pCol1, curY, pCol2, rowH2, 'Flute', {
    fill: COLORS.paperSpecHeader,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 7,
  });
  drawCell(leftX + pCol1 + pCol2, curY, pCol3, rowH2, 'Flute %', {
    fill: COLORS.paperSpecHeader,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 7,
  });
  drawCell(leftX + pCol1 + pCol2 + pCol3, curY, pCol4, rowH2, 'GSM', {
    fill: COLORS.paperSpecHeader,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 7,
  });
  drawCell(leftX + pCol1 + pCol2 + pCol3 + pCol4, curY, pCol5, rowH2, 'BF', {
    fill: COLORS.paperSpecHeader,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 7,
  });
  drawCell(leftX + pCol1 + pCol2 + pCol3 + pCol4 + pCol5, curY, pCol6, rowH2, 'Shade', {
    fill: COLORS.paperSpecHeader,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 7,
  });
  drawCell(leftX + pCol1 + pCol2 + pCol3 + pCol4 + pCol5 + pCol6, curY, pCol7, rowH2, 'Rate', {
    fill: COLORS.paperSpecHeader,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 7,
  });
  curY += rowH2;

  // 7 Standard Layer Rows
  slotRows.forEach((row) => {
    // Col 1: Paper Combination Label
    drawCell(leftX, curY, pCol1, rowH2, row.label, {
      fill: row.isFlute || row.label === 'TOP' ? COLORS.paperCombCell : undefined,
      fontStyle: 'bold',
      fontSize: 7,
      align: 'left',
      paddingX: 1.5,
    });

    // Col 2: Flute
    drawCell(leftX + pCol1, curY, pCol2, rowH2, row.flute, {
      fill: row.flute ? COLORS.greenCell : undefined,
      textColor: row.flute ? COLORS.greenText : COLORS.black,
      fontStyle: 'bold',
      fontSize: 7.5,
    });

    // Col 3: Flute %
    drawCell(leftX + pCol1 + pCol2, curY, pCol3, rowH2, row.flutePercent, {
      fill: row.flutePercent ? COLORS.orangeCell : undefined,
      fontStyle: 'bold',
      fontSize: 7,
    });

    // Col 4: GSM
    drawCell(leftX + pCol1 + pCol2 + pCol3, curY, pCol4, rowH2, row.gsm, {
      fontSize: 7.5,
    });

    // Col 5: BF
    drawCell(leftX + pCol1 + pCol2 + pCol3 + pCol4, curY, pCol5, rowH2, row.bf, {
      fontSize: 7.5,
    });

    // Col 6: Shade
    drawCell(leftX + pCol1 + pCol2 + pCol3 + pCol4 + pCol5, curY, pCol6, rowH2, row.shade ? row.shade.slice(0, 8) : '', {
      fill: row.gsm || row.shade ? COLORS.greenCell : undefined,
      fontSize: 6.5,
    });

    // Col 7: Rate
    drawCell(leftX + pCol1 + pCol2 + pCol3 + pCol4 + pCol5 + pCol6, curY, pCol7, rowH2, row.rate, {
      fontSize: 7.5,
    });

    curY += rowH2;
  });
  curY += 4; // Spacing before Box Specification

  // --- Table 3: Box Specification ---
  const rowH3 = 5.2;

  // Section Header
  drawCell(leftX, curY, leftW, 5.8, 'Box Specification', {
    fill: COLORS.graySectionHeader,
    fontStyle: 'bold',
    fontSize: 9,
    align: 'center',
    borderWidth: 0.4,
  });
  curY += 5.8;

  // Row 1: Deckle/ Adjusted Deckle
  const deckLabelW = 42;
  const deckVal1W = (leftW - deckLabelW) / 2;
  const deckVal2W = (leftW - deckLabelW) / 2;
  drawCell(leftX, curY, deckLabelW, rowH3, 'Deckle/ Adjusted Deckle', {
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + deckLabelW, curY, deckVal1W, rowH3, deckleDisplay, {
    fill: COLORS.orangeCell,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'center',
  });
  drawCell(leftX + deckLabelW + deckVal1W, curY, deckVal2W, rowH3, adjustedDeckleDisplay, {
    fontStyle: 'normal',
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH3;

  // Row 2: ups
  drawCell(leftX, curY, deckLabelW, rowH3, 'ups', {
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + deckLabelW, curY, leftW - deckLabelW, rowH3, 2, {
    fontStyle: 'normal',
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH3;

  // Row 3: Cutting length
  drawCell(leftX, curY, deckLabelW, rowH3, 'Cutting length', {
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + deckLabelW, curY, leftW - deckLabelW, rowH3, cutLengthDisplay, {
    fill: COLORS.orangeCell,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH3 + 4; // Spacing before Other Charges

  // --- Table 4: Other Charges ---
  const rowH4 = 5.2;
  const chargeLabelW = 42;
  const chargeValW = leftW - chargeLabelW;

  // Section Header
  drawCell(leftX, curY, leftW, 5.8, 'Other Charges', {
    fill: COLORS.graySectionHeader,
    fontStyle: 'bold',
    fontSize: 9,
    align: 'center',
    borderWidth: 0.4,
  });
  curY += 5.8;

  // Freight
  drawCell(leftX, curY, chargeLabelW, rowH4, 'Freight', {
    textColor: COLORS.blueLabelText,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + chargeLabelW, curY, chargeValW, rowH4, Number(costSheet.freightCostPerBox || 0), {
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH4;

  // Die
  drawCell(leftX, curY, chargeLabelW, rowH4, 'Die', {
    textColor: COLORS.blueLabelText,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + chargeLabelW, curY, chargeValW, rowH4, Number(costSheet.dieCostTotal || 0), {
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH4;

  // Stereo
  drawCell(leftX, curY, chargeLabelW, rowH4, 'Stereo', {
    textColor: COLORS.blueLabelText,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + chargeLabelW, curY, chargeValW, rowH4, Number(costSheet.plateStereoCostTotal || 0), {
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH4;

  // Offset printing rate
  drawCell(leftX, curY, chargeLabelW, rowH4, 'Offset printing rate', {
    textColor: COLORS.blueLabelText,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + chargeLabelW, curY, chargeValW, rowH4, Number(costSheet.printingCostPerBox || 0), {
    fill: COLORS.orangeCell,
    fontSize: 7.5,
    align: 'center',
  });
  curY += rowH4;

  // Conversion
  drawCell(leftX, curY, chargeLabelW, rowH4, 'Conversion', {
    textColor: COLORS.blueLabelText,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + chargeLabelW, curY, chargeValW, rowH4, Number(costSheet.conversionLaborCostPerBox || 10), {
    fill: COLORS.greenCell,
    textColor: COLORS.greenText,
    fontStyle: 'bold',
    fontSize: 8,
    align: 'center',
  });
  curY += rowH4;

  // Margin
  drawCell(leftX, curY, chargeLabelW, rowH4, 'Margin', {
    textColor: COLORS.blueLabelText,
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
  });
  drawCell(leftX + chargeLabelW, curY, chargeValW, rowH4, `${costSheet.profitMarginPercent || 15}%`, {
    fill: COLORS.greenCell,
    textColor: COLORS.greenText,
    fontStyle: 'bold',
    fontSize: 8,
    align: 'center',
  });

  // ==========================================
  // 5. RIGHT COLUMN: OUTPUT CARD
  // ==========================================
  const outY = 38;
  const outH_Header = 18;
  const outRowH = 11.5;
  const outCol1W = 28;
  const outCol2W = rightW - outCol1W;

  // Outer bold border
  doc.setLineWidth(0.7);
  doc.setDrawColor(0, 0, 0);

  // 1. OUTPUT Title Banner
  drawCell(rightX, outY, rightW, outH_Header, 'OUTPUT', {
    fill: COLORS.outputBanner,
    fontStyle: 'bold',
    fontSize: 14,
    align: 'center',
    borderWidth: 0.7,
  });

  // 2. Box weight (Kg)
  drawCell(rightX, outY + outH_Header, outCol1W, outRowH, 'Box weight (Kg)', {
    fontStyle: 'bold',
    fontSize: 8,
    align: 'left',
    paddingX: 1.5,
    borderWidth: 0.5,
  });
  drawCell(rightX + outCol1W, outY + outH_Header, outCol2W, outRowH, boxWeightKg.toFixed(2), {
    fill: COLORS.outputYellow,
    fontStyle: 'bold',
    fontSize: 10,
    align: 'right',
    paddingX: 2.5,
    borderWidth: 0.5,
  });

  // 3. Required paper per Order (kg)
  drawCell(rightX, outY + outH_Header + outRowH, outCol1W, outRowH, 'Required paper\nper Order (kg)', {
    fontStyle: 'bold',
    fontSize: 7.5,
    align: 'left',
    paddingX: 1.5,
    borderWidth: 0.5,
  });
  drawCell(rightX + outCol1W, outY + outH_Header + outRowH, outCol2W, outRowH, requiredPaperKg.toLocaleString(), {
    fill: COLORS.outputYellow,
    fontStyle: 'bold',
    fontSize: 10,
    align: 'right',
    paddingX: 2.5,
    borderWidth: 0.5,
  });

  // 4. Rate per Box(Rs)
  drawCell(rightX, outY + outH_Header + outRowH * 2, outCol1W, outRowH, 'Rate per Box(Rs)', {
    fontStyle: 'bold',
    fontSize: 8,
    align: 'left',
    paddingX: 1.5,
    borderWidth: 0.5,
  });
  drawCell(rightX + outCol1W, outY + outH_Header + outRowH * 2, outCol2W, outRowH, ratePerBox.toFixed(2), {
    fill: COLORS.outputYellow,
    fontStyle: 'bold',
    fontSize: 10,
    align: 'right',
    paddingX: 2.5,
    borderWidth: 0.5,
  });

  // 5. PO Value(Rs)
  drawCell(rightX, outY + outH_Header + outRowH * 3, outCol1W, outRowH, 'PO Value(Rs)', {
    fontStyle: 'bold',
    fontSize: 8,
    align: 'left',
    paddingX: 1.5,
    borderWidth: 0.5,
  });
  drawCell(
    rightX + outCol1W,
    outY + outH_Header + outRowH * 3,
    outCol2W,
    outRowH,
    poValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    {
      fill: COLORS.outputYellow,
      fontStyle: 'bold',
      fontSize: 10,
      align: 'right',
      paddingX: 2.5,
      borderWidth: 0.5,
    }
  );

  return doc;
}

export function downloadPlanningCostSheetPdf(costSheet: CostSheetItem) {
  const doc = generatePlanningCostSheetPdf(costSheet);
  const serialNo = costSheet.costSheetNumber
    ? costSheet.costSheetNumber.startsWith('AKPL-')
      ? costSheet.costSheetNumber
      : `AKPL-${costSheet.costSheetNumber.replace(/[^0-9]/g, '') || '2026-0804'}`
    : 'AKPL-2026-0804';
  const fileName = `Planning_Cost_Sheet_${serialNo}.pdf`;
  doc.save(fileName);
}
