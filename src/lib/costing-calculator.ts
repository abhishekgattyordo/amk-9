/**
 * AMK Corrugation ERP - Costing Calculation Engine
 * Accurate engineering and commercial computations for Universal & Customized Corrugated Boxes.
 */

export interface CalculationInput {
  boxType: 'Universal Box' | 'Customized Box' | 'Sheet Board' | 'Die-Cut' | 'Partition';
  dimensionUnit: 'mm' | 'inch';
  length: number;
  width: number;
  height: number;
  targetQuantity: number;
  jointFlapMm?: number;
  creaseAllowanceMm?: number;
  deckleSizeMm?: number;
  cuttingLengthMm?: number;
  ply: 3 | 5 | 7 | number;
  fluteType?: string;
  fluteTakeUp?: number;
  layers: {
    layerIndex: number;
    layerName: string;
    layerType: 'Liner' | 'Fluting';
    materialId?: string;
    paperGrade: string;
    gsm: number;
    bf: number;
    fluteType?: string;
    fluteFactor: number;
    ratePerKg: number;
    remarks?: string;
  }[];
  starchCostPerBox?: number;
  printingCostPerBox?: number;
  stitchingGlueCostPerBox?: number;
  dieCostTotal?: number;
  plateStereoCostTotal?: number;
  wastagePercent?: number;
  conversionLaborCostPerBox?: number;
  overheadCostPerBox?: number;
  freightCostPerBox?: number;
  otherCostPerBox?: number;
  profitMarginPercent?: number;
  taxRate?: number;
}

export interface CalculatedLayer {
  layerIndex: number;
  layerName: string;
  layerType: 'Liner' | 'Fluting';
  materialId?: string;
  paperGrade: string;
  gsm: number;
  bf: number;
  fluteType?: string;
  fluteFactor: number;
  weightGrams: number;
  ratePerKg: number;
  costPerBox: number;
  burstingStrengthPerLayer: number;
  remarks?: string;
}

export interface CalculationResult {
  dimensionUnit: 'mm' | 'inch';
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  deckleSizeMm: number;
  cuttingLengthMm: number;
  sheetAreaSqM: number;
  totalBoardGsm: number;
  burstingFactor: number;
  burstingStrength: number;
  boxCompressionTest: number;
  singleBoxWeightGrams: number;
  singleBoxWeightKg: number;
  paperCostPerBox: number;
  starchCostPerBox: number;
  printingCostPerBox: number;
  stitchingGlueCostPerBox: number;
  dieCostTotal: number;
  dieCostPerBox: number;
  plateStereoCostTotal: number;
  plateStereoCostPerBox: number;
  wastagePercent: number;
  wastageCostPerBox: number;
  conversionLaborCostPerBox: number;
  overheadCostPerBox: number;
  freightCostPerBox: number;
  otherCostPerBox: number;
  totalManufacturingCostPerBox: number;
  profitMarginPercent: number;
  profitAmountPerBox: number;
  sellingPricePerBox: number;
  totalOrderValue: number;
  taxRate: number;
  taxAmount: number;
  grandTotalValue: number;
  calculatedLayers: CalculatedLayer[];
}

export const STANDARD_FLUTE_FACTORS: Record<string, number> = {
  'A': 1.54,
  'B': 1.35,
  'C': 1.43,
  'E': 1.25,
  'F': 1.15,
  'BC': 1.39, // Average for multi-wall
};

export function getFluteFactor(fluteType?: string): number {
  if (!fluteType) return 1.35;
  const upper = fluteType.toUpperCase().trim();
  return STANDARD_FLUTE_FACTORS[upper] || 1.35;
}

export function calculateCostSheet(input: CalculationInput): CalculationResult {
  const isInch = input.dimensionUnit === 'inch';
  const lMm = isInch ? input.length * 25.4 : input.length;
  const wMm = isInch ? input.width * 25.4 : input.width;
  const hMm = isInch ? input.height * 25.4 : input.height;

  const jointFlap = input.jointFlapMm !== undefined ? input.jointFlapMm : 35;
  const creaseAllowance = input.creaseAllowanceMm !== undefined ? input.creaseAllowanceMm : 0;
  const qty = Math.max(1, input.targetQuantity || 1);

  const defaultDeckle = Math.max(100, ((wMm + hMm) * 2) + jointFlap);
  const defaultCutLength = Math.max(100, lMm + wMm + creaseAllowance);

  let deckle = defaultDeckle;
  let cuttingLength = defaultCutLength;

  if (input.boxType !== 'Universal Box' && input.deckleSizeMm && input.deckleSizeMm >= 50 && input.cuttingLengthMm && input.cuttingLengthMm >= 50) {
    deckle = input.deckleSizeMm;
    cuttingLength = input.cuttingLengthMm;
  } else {
    deckle = defaultDeckle;
    cuttingLength = defaultCutLength;
  }

  // Calculate Sheet Area in square meters (Deckle mm * Cutting Length mm / 1,000,000)
  const sheetAreaSqM = Math.max(0.0001, (deckle * cuttingLength) / 1000000);

  // Process and compute layers
  let singleBoxWeightGrams = 0;
  let totalBoardGsm = 0;
  let paperCostPerBox = 0;
  let totalLayerBS = 0;

  const calculatedLayers: CalculatedLayer[] = (input.layers || []).map((layer, idx) => {
    const isFluting = layer.layerType === 'Fluting';
    const factor = isFluting ? (layer.fluteFactor || getFluteFactor(layer.fluteType)) : 1.0;
    
    // Grams = Area (sq.m) * GSM * factor
    const weightGrams = Math.max(0, sheetAreaSqM * (layer.gsm || 0) * factor);
    const weightKg = weightGrams / 1000;
    const layerCost = weightKg * (layer.ratePerKg || 0);

    // Bursting Strength per layer = (GSM * BF) / 1000 in kg/cm²
    const layerBS = ((layer.gsm || 0) * (layer.bf || 0)) / 1000;

    singleBoxWeightGrams += weightGrams;
    totalBoardGsm += (layer.gsm || 0) * factor;
    paperCostPerBox += layerCost;
    totalLayerBS += layerBS;

    return {
      layerIndex: layer.layerIndex ?? idx,
      layerName: layer.layerName || `Layer ${idx + 1}`,
      layerType: layer.layerType || (idx % 2 === 1 ? 'Fluting' : 'Liner'),
      materialId: layer.materialId,
      paperGrade: layer.paperGrade || '',
      gsm: layer.gsm || 0,
      bf: layer.bf || 0,
      fluteType: layer.fluteType,
      fluteFactor: factor,
      weightGrams: Number(weightGrams.toFixed(2)),
      ratePerKg: layer.ratePerKg || 0,
      costPerBox: Number(layerCost.toFixed(2)),
      burstingStrengthPerLayer: Number(layerBS.toFixed(2)),
      remarks: layer.remarks,
    };
  });

  const singleBoxWeightKg = singleBoxWeightGrams / 1000;

  // Board Bursting Strength and Bursting Factor
  const burstingStrength = Number(totalLayerBS.toFixed(2));
  const burstingFactor = totalBoardGsm > 0 ? Number(((burstingStrength * 1000) / totalBoardGsm).toFixed(2)) : 0;

  // Box Compression Test (BCT) approximation in kgf
  // McKee formula: BCT = 5.87 * ECT * sqrt(Caliper * Perimeter)
  // Approximate Caliper based on ply:
  const caliperMm = input.ply >= 7 ? 10.0 : input.ply >= 5 ? 6.5 : 3.5;
  const perimeterMm = 2 * (lMm + wMm);
  const ectEstimate = Math.max(1, burstingStrength * 0.28);
  const bctKgf = Math.round(5.87 * ectEstimate * Math.sqrt((caliperMm * perimeterMm) / 10) / 9.81);

  // Additional component costs
  const wastagePercent = input.wastagePercent !== undefined ? input.wastagePercent : 3;
  const wastageCostPerBox = paperCostPerBox * (wastagePercent / 100);

  const starchCost = input.starchCostPerBox || 0;
  const printingCost = input.printingCostPerBox || 0;
  const stitchingGlueCost = input.stitchingGlueCostPerBox || 0;
  
  const dieCostTotal = input.dieCostTotal || 0;
  const dieCostPerBox = dieCostTotal / qty;

  const plateStereoCostTotal = input.plateStereoCostTotal || 0;
  const plateStereoCostPerBox = plateStereoCostTotal / qty;

  const conversionLaborCost = input.conversionLaborCostPerBox || 0;
  const overheadCost = input.overheadCostPerBox || 0;
  const freightCost = input.freightCostPerBox || 0;
  const otherCost = input.otherCostPerBox || 0;

  const totalManufacturingCostPerBox = 
    paperCostPerBox +
    wastageCostPerBox +
    starchCost +
    printingCost +
    stitchingGlueCost +
    dieCostPerBox +
    plateStereoCostPerBox +
    conversionLaborCost +
    overheadCost +
    freightCost +
    otherCost;

  const profitMarginPercent = input.profitMarginPercent !== undefined ? input.profitMarginPercent : 15;
  const profitAmountPerBox = totalManufacturingCostPerBox * (profitMarginPercent / 100);
  const sellingPricePerBox = totalManufacturingCostPerBox + profitAmountPerBox;

  const totalOrderValue = sellingPricePerBox * qty;
  const taxRate = input.taxRate !== undefined ? input.taxRate : 18;
  const taxAmount = totalOrderValue * (taxRate / 100);
  const grandTotalValue = totalOrderValue + taxAmount;

  return {
    dimensionUnit: input.dimensionUnit,
    lengthMm: Number(lMm.toFixed(1)),
    widthMm: Number(wMm.toFixed(1)),
    heightMm: Number(hMm.toFixed(1)),
    deckleSizeMm: Number(deckle.toFixed(1)),
    cuttingLengthMm: Number(cuttingLength.toFixed(1)),
    sheetAreaSqM: Number(sheetAreaSqM.toFixed(4)),
    totalBoardGsm: Number(totalBoardGsm.toFixed(1)),
    burstingFactor,
    burstingStrength,
    boxCompressionTest: Math.max(50, bctKgf),
    singleBoxWeightGrams: Number(singleBoxWeightGrams.toFixed(2)),
    singleBoxWeightKg: Number(singleBoxWeightKg.toFixed(4)),
    paperCostPerBox: Number(paperCostPerBox.toFixed(2)),
    starchCostPerBox: Number(starchCost.toFixed(2)),
    printingCostPerBox: Number(printingCost.toFixed(2)),
    stitchingGlueCostPerBox: Number(stitchingGlueCost.toFixed(2)),
    dieCostTotal: Number(dieCostTotal.toFixed(2)),
    dieCostPerBox: Number(dieCostPerBox.toFixed(2)),
    plateStereoCostTotal: Number(plateStereoCostTotal.toFixed(2)),
    plateStereoCostPerBox: Number(plateStereoCostPerBox.toFixed(2)),
    wastagePercent: Number(wastagePercent.toFixed(2)),
    wastageCostPerBox: Number(wastageCostPerBox.toFixed(2)),
    conversionLaborCostPerBox: Number(conversionLaborCost.toFixed(2)),
    overheadCostPerBox: Number(overheadCost.toFixed(2)),
    freightCostPerBox: Number(freightCost.toFixed(2)),
    otherCostPerBox: Number(otherCost.toFixed(2)),
    totalManufacturingCostPerBox: Number(totalManufacturingCostPerBox.toFixed(2)),
    profitMarginPercent: Number(profitMarginPercent.toFixed(2)),
    profitAmountPerBox: Number(profitAmountPerBox.toFixed(2)),
    sellingPricePerBox: Number(sellingPricePerBox.toFixed(2)),
    totalOrderValue: Number(totalOrderValue.toFixed(2)),
    taxRate: Number(taxRate.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    grandTotalValue: Number(grandTotalValue.toFixed(2)),
    calculatedLayers,
  };
}

export function getDefaultLayersForPly(ply: number, fluteType: string = 'B'): CalculationInput['layers'] {
  const fluteFactor = getFluteFactor(fluteType);

  if (ply === 3) {
    return [
      { layerIndex: 0, layerName: 'Top Liner', layerType: 'Liner', paperGrade: 'Craft Paper (Virgin)', gsm: 180, bf: 20, fluteFactor: 1.0, ratePerKg: 38 },
      { layerIndex: 1, layerName: 'Fluting Medium', layerType: 'Fluting', paperGrade: 'Fluting Medium (Recycled)', gsm: 120, bf: 16, fluteType, fluteFactor, ratePerKg: 32 },
      { layerIndex: 2, layerName: 'Bottom Liner', layerType: 'Liner', paperGrade: 'Testliner Paper', gsm: 140, bf: 18, fluteFactor: 1.0, ratePerKg: 35 },
    ];
  }

  if (ply === 5) {
    return [
      { layerIndex: 0, layerName: 'Top Liner (Outer)', layerType: 'Liner', paperGrade: 'Craft Paper (Virgin)', gsm: 200, bf: 22, fluteFactor: 1.0, ratePerKg: 40 },
      { layerIndex: 1, layerName: 'Fluting 1 (Outer)', layerType: 'Fluting', paperGrade: 'Fluting Medium (Semi-Chemical)', gsm: 140, bf: 18, fluteType: 'B', fluteFactor: 1.35, ratePerKg: 34 },
      { layerIndex: 2, layerName: 'Middle Liner', layerType: 'Liner', paperGrade: 'Testliner Paper', gsm: 140, bf: 18, fluteFactor: 1.0, ratePerKg: 35 },
      { layerIndex: 3, layerName: 'Fluting 2 (Inner)', layerType: 'Fluting', paperGrade: 'Fluting Medium (Recycled)', gsm: 120, bf: 16, fluteType: 'C', fluteFactor: 1.43, ratePerKg: 32 },
      { layerIndex: 4, layerName: 'Bottom Liner (Inner)', layerType: 'Liner', paperGrade: 'Kraft Paper', gsm: 150, bf: 18, fluteFactor: 1.0, ratePerKg: 36 },
    ];
  }

  if (ply === 7) {
    return [
      { layerIndex: 0, layerName: 'Top Liner', layerType: 'Liner', paperGrade: 'Heavy Kraft Virgin', gsm: 230, bf: 24, fluteFactor: 1.0, ratePerKg: 42 },
      { layerIndex: 1, layerName: 'Fluting 1', layerType: 'Fluting', paperGrade: 'Semi-Chemical Flute', gsm: 150, bf: 18, fluteType: 'A', fluteFactor: 1.54, ratePerKg: 35 },
      { layerIndex: 2, layerName: 'Middle Liner 1', layerType: 'Liner', paperGrade: 'Testliner Paper', gsm: 150, bf: 18, fluteFactor: 1.0, ratePerKg: 35 },
      { layerIndex: 3, layerName: 'Fluting 2', layerType: 'Fluting', paperGrade: 'Semi-Chemical Flute', gsm: 140, bf: 18, fluteType: 'B', fluteFactor: 1.35, ratePerKg: 34 },
      { layerIndex: 4, layerName: 'Middle Liner 2', layerType: 'Liner', paperGrade: 'Testliner Paper', gsm: 150, bf: 18, fluteFactor: 1.0, ratePerKg: 35 },
      { layerIndex: 5, layerName: 'Fluting 3', layerType: 'Fluting', paperGrade: 'Fluting Medium', gsm: 130, bf: 16, fluteType: 'C', fluteFactor: 1.43, ratePerKg: 33 },
      { layerIndex: 6, layerName: 'Bottom Liner', layerType: 'Liner', paperGrade: 'Kraft Paper', gsm: 180, bf: 20, fluteFactor: 1.0, ratePerKg: 38 },
    ];
  }

  return [
    { layerIndex: 0, layerName: 'Top Liner', layerType: 'Liner', paperGrade: 'Craft Paper', gsm: 180, bf: 20, fluteFactor: 1.0, ratePerKg: 38 },
    { layerIndex: 1, layerName: 'Fluting Medium', layerType: 'Fluting', paperGrade: 'Fluting Medium', gsm: 120, bf: 16, fluteType, fluteFactor, ratePerKg: 32 },
    { layerIndex: 2, layerName: 'Bottom Liner', layerType: 'Liner', paperGrade: 'Testliner', gsm: 140, bf: 18, fluteFactor: 1.0, ratePerKg: 35 },
  ];
}
