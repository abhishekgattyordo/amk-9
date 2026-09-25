export interface PaperLayerItem {
  id: string;
  layer: string;
  materialId?: string;
  materialCode?: string;
  materialName: string;
  mill?: string;
  shade?: string;
  paperType?: string;
  gsm: number;
  bf?: number;
  ratePerKg: number;
  fluteRatio?: number;
  weightGrams: number;
  costPerBox: number;
}

export interface ProductionProcessItem {
  id: string;
  sequence: number;
  processName: string;
  machineId?: string;
  machineName?: string;
  speedPerHour?: number;
  setupTimeMin?: number;
  costPerHour?: number;
  costPerBox: number;
  notes?: string;
}

export interface BomSectionsData {
  // 1. Basic Information
  basicInfo: {
    bomNumber: string;
    bomName: string;
    customerId: string;
    customerName: string;
    productId: string;
    productName: string;
    plantUnit: string;
    orderDate: string;
    requiredQuantity: number;
    version: number;
    status: 'Active' | 'Draft' | 'Inactive' | 'Archived';
    npdRef?: string;
    salesLeadId?: string;
    quotationId?: string;
    notes?: string;
  };

  // 2. Box Specification
  boxSpec: {
    boxType: string; // RSC, Universal, Die Cut, Telescopic, Wrap Around, etc.
    categoryId?: string;
    categoryName?: string;
    subCategoryId?: string;
    subCategoryName?: string;
    ply: number; // 3, 5, 7, 9
    fluteType: string; // B, C, E, BC, AB, etc.
    fluteHeightMm: number;
    burstingFactorBF: number;
    targetBCTKgf: number;
  };

  // 3. Dimensions
  dimensions: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    dimensionUnit: 'mm' | 'inch' | 'cm';
    dimensionType: 'Inner' | 'Outer';
    toleranceMm: number;
  };

  // 4. Additional Details
  additionalDetails: {
    jointType: string;
    flapSizeMm: number;
    slotDepthMm: number;
    dieNumber: string;
    artworkRef: string;
    colorCount: number;
    printingType: string;
  };

  // 5. Client Requirements
  clientRequirements: {
    targetGsm: number;
    burstingStrengthBS: number;
    ectKnm: number;
    cobbValueGsm: number;
    moisturePercent: number;
    coatingType: string; // Standard, Water-Resistant, Oil-Resistant, Anti-Static, etc.
  };

  // 6. Sheet Parameters
  sheetParameters: {
    deckleSizeMm: number;
    cuttingSizeMm: number;
    upsAcross: number;
    upsAround: number;
    totalUps: number;
    sheetAreaSqm: number;
    grainDirection: 'Parallel to Length' | 'Parallel to Width';
  };

  // 7. Sheet Size
  sheetSize: {
    grossDeckleMm: number;
    netDeckleMm: number;
    grossCutLengthMm: number;
    netCutLengthMm: number;
    runningMetersPer1000: number;
  };

  // 8. Wastage Calculations
  wastageCalculations: {
    trimWastagePercent: number;
    flutingFactor: number;
    slotterWastagePercent: number;
    printingWastagePercent: number;
    totalWastagePercent: number;
  };

  // 9. Paper Combination
  paperCombination: PaperLayerItem[];

  // 10. Box Calculations
  boxCalculations: {
    totalBoardGsm: number;
    netBoxWeightGrams: number;
    grossBoxWeightGrams: number;
    boardCaliperMm: number;
    calculatedBF: number;
  };

  // 11. Production Process
  productionProcesses: ProductionProcessItem[];

  // 12. Flute Directions
  fluteDirections: {
    fluteProfile: string;
    corrugationDirection: string;
    takeUpRatio: number;
  };

  // 13. Rotary Size
  rotarySize: {
    cylinderCircumferenceMm: number;
    dieDiameterMm: number;
    repeatLengthMm: number;
    impressionsPerRev: number;
  };

  // 14. RS4 Slotter Size
  rs4Slotter: {
    slotKnifeWidthMm: number;
    creasingRuleMm: number;
    bladeGapMm: number;
    slottingDepthMm: number;
  };

  // 15. Printing Details
  printingDetails: {
    machineName: string;
    inkShades: string[];
    inkConsumptionGsm: number;
    stereoThicknessMm: number;
    aniloxLpi: number;
  };

  // 16. Lamination
  lamination: {
    laminationType: string;
    filmMicron: number;
    adhesiveType: string;
    adhesiveGsm: number;
  };

  // 17. Punching Details
  punchingDetails: {
    punchingType: string;
    dieCode: string;
    strippingMethod: string;
    embossingType: string;
    creasingMatrix: string;
  };

  // 18. Joint Details
  jointDetails: {
    jointType: string;
    wireGauge: string;
    stitchCount: number;
    stitchPitchMm: number;
    glueGrade: string;
    glueConsumptionGrams: number;
  };

  // 19. Bundling Details
  bundlingDetails: {
    packingMode: string;
    boxesPerBundle: number;
    bundlesPerPallet: number;
    strapMaterial: string;
    cornerProtectors: boolean;
  };

  // 20. Partition Details
  partitionDetails: {
    hasPartition: boolean;
    partitionMaterial: string;
    horizontalCells: number;
    verticalCells: number;
    partitionWeightGrams: number;
    partitionCostPerBox: number;
  };

  // 21. BOM Parameters
  bomParameters: {
    batchSize: number;
    moq: number;
    leadTimeDays: number;
    inspectionLevel: string;
    safetyStock: number;
  };

  // 22. BOM Cost Calculations
  bomCostCalculations: {
    paperCostPerBox: number;
    processCostPerBox: number;
    consumablesCostPerBox: number;
    toolingAmortizationPerBox: number;
    laminationCostPerBox: number;
    packingCostPerBox: number;
    totalMfgCostPerBox: number;
    marginPercent: number;
    quotedPricePerBox: number;
  };
}
