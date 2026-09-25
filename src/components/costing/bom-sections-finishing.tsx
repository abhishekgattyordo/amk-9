'use client';

import React from 'react';
import {
  Scissors,
  Link,
  PackageCheck,
  Grid,
  Settings2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { BomSectionsData } from './bom-types';

interface BomSectionsFinishingProps {
  darkMode?: boolean;
  data: BomSectionsData;
  onChange: (updater: (prev: BomSectionsData) => BomSectionsData) => void;
}

export function BomSectionsFinishing({
  darkMode,
  data,
  onChange,
}: BomSectionsFinishingProps) {
  const cardClass = `p-5 rounded-xl border transition-all ${
    darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 uppercase tracking-wider ${
    darkMode ? 'text-slate-300' : 'text-slate-600'
  }`;

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all ${
    darkMode
      ? 'bg-slate-900/80 border-slate-700 text-slate-100 focus:border-blue-500'
      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600'
  }`;

  const selectClass = `w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all ${
    darkMode
      ? 'bg-slate-900/80 border-slate-700 text-slate-100 focus:border-blue-500'
      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600'
  }`;

  const recalculateCosts = () => {
    const paper = Number(data.bomCostCalculations.paperCostPerBox) || 0;
    const process = Number(data.bomCostCalculations.processCostPerBox) || 0;
    const consumables = Number(data.bomCostCalculations.consumablesCostPerBox) || 0;
    const tooling = Number(data.bomCostCalculations.toolingAmortizationPerBox) || 0;
    const lamination = Number(data.bomCostCalculations.laminationCostPerBox) || 0;
    const packing = Number(data.bomCostCalculations.packingCostPerBox) || 0;
    const partition = data.partitionDetails.hasPartition
      ? Number(data.partitionDetails.partitionCostPerBox) || 0
      : 0;

    const totalMfg = paper + process + consumables + tooling + lamination + packing + partition;
    const margin = Number(data.bomCostCalculations.marginPercent) || 0;
    const sellingPrice = Number((totalMfg * (1 + margin / 100)).toFixed(2));

    onChange((prev) => ({
      ...prev,
      bomCostCalculations: {
        ...prev.bomCostCalculations,
        totalMfgCostPerBox: Number(totalMfg.toFixed(2)),
        quotedPricePerBox: sellingPrice,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* 17. Punching Details */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            17
          </span>
          <Scissors className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Punching Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Punching / Die Type</label>
            <select
              className={selectClass}
              value={data.punchingDetails.punchingType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  punchingDetails: {
                    ...prev.punchingDetails,
                    punchingType: e.target.value,
                  },
                }))
              }
            >
              <option value="Platen Die Cutting">Platen Die Cutting</option>
              <option value="Rotary Die Cutting">Rotary Die Cutting</option>
              <option value="Flatbed Auto Die Cutter">Flatbed Auto Die Cutter</option>
              <option value="Manual Hand Punching">Manual Hand Punching</option>
              <option value="None / Rotary Slotter Only">None / Rotary Slotter Only</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Die Code</label>
            <input
              type="text"
              className={inputClass}
              value={data.punchingDetails.dieCode}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  punchingDetails: {
                    ...prev.punchingDetails,
                    dieCode: e.target.value,
                  },
                }))
              }
              placeholder="e.g. DIE-PUNCH-009"
            />
          </div>

          <div>
            <label className={labelClass}>Stripping Method</label>
            <select
              className={selectClass}
              value={data.punchingDetails.strippingMethod}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  punchingDetails: {
                    ...prev.punchingDetails,
                    strippingMethod: e.target.value,
                  },
                }))
              }
            >
              <option value="Manual Stripping">Manual Stripping</option>
              <option value="Auto In-line Stripping">Auto In-line Stripping</option>
              <option value="Pneumatic Waste Stripper">Pneumatic Waste Stripper</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Embossing / Debossing</label>
            <input
              type="text"
              className={inputClass}
              value={data.punchingDetails.embossingType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  punchingDetails: {
                    ...prev.punchingDetails,
                    embossingType: e.target.value,
                  },
                }))
              }
              placeholder="e.g. Blind Emboss Logo"
            />
          </div>

          <div>
            <label className={labelClass}>Creasing Matrix</label>
            <input
              type="text"
              className={inputClass}
              value={data.punchingDetails.creasingMatrix}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  punchingDetails: {
                    ...prev.punchingDetails,
                    creasingMatrix: e.target.value,
                  },
                }))
              }
              placeholder="e.g. 0.8 x 2.7 mm"
            />
          </div>
        </div>
      </div>

      {/* 18. Joint Details */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            18
          </span>
          <Link className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Joint Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className={labelClass}>Joint Method</label>
            <select
              className={selectClass}
              value={data.jointDetails.jointType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  jointDetails: {
                    ...prev.jointDetails,
                    jointType: e.target.value,
                  },
                }))
              }
            >
              <option value="Wire Stitched">Wire Stitched</option>
              <option value="Cold PVA Glue">Cold PVA Glue</option>
              <option value="Hot Melt Glue">Hot Melt Glue</option>
              <option value="Glued & Stitched">Glued & Stitched</option>
              <option value="Self-Locking Tongue">Self-Locking Tongue</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Wire Gauge</label>
            <input
              type="text"
              className={inputClass}
              value={data.jointDetails.wireGauge}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  jointDetails: {
                    ...prev.jointDetails,
                    wireGauge: e.target.value,
                  },
                }))
              }
              placeholder="e.g. 12x25 Flat Wire"
            />
          </div>

          <div>
            <label className={labelClass}>Stitch Count</label>
            <input
              type="number"
              className={inputClass}
              value={data.jointDetails.stitchCount}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  jointDetails: {
                    ...prev.jointDetails,
                    stitchCount: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Stitch Pitch (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.jointDetails.stitchPitchMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  jointDetails: {
                    ...prev.jointDetails,
                    stitchPitchMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Glue Grade</label>
            <input
              type="text"
              className={inputClass}
              value={data.jointDetails.glueGrade}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  jointDetails: {
                    ...prev.jointDetails,
                    glueGrade: e.target.value,
                  },
                }))
              }
              placeholder="e.g. High-Tack Adhesive"
            />
          </div>

          <div>
            <label className={labelClass}>Glue Qty (g/box)</label>
            <input
              type="number"
              step="0.5"
              className={inputClass}
              value={data.jointDetails.glueConsumptionGrams}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  jointDetails: {
                    ...prev.jointDetails,
                    glueConsumptionGrams: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 19. Bundling Details */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            19
          </span>
          <PackageCheck className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Bundling Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Packing Mode</label>
            <select
              className={selectClass}
              value={data.bundlingDetails.packingMode}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bundlingDetails: {
                    ...prev.bundlingDetails,
                    packingMode: e.target.value,
                  },
                }))
              }
            >
              <option value="PP Strapped Bundles">PP Strapped Bundles</option>
              <option value="Stretch Wrapped Pallets">Stretch Wrapped Pallets</option>
              <option value="Shrink Film Packaged">Shrink Film Packaged</option>
              <option value="Packed in Master Carton">Packed in Master Carton</option>
              <option value="Loose in Corrugated Bin">Loose in Corrugated Bin</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Boxes Per Bundle</label>
            <input
              type="number"
              className={inputClass}
              value={data.bundlingDetails.boxesPerBundle}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bundlingDetails: {
                    ...prev.bundlingDetails,
                    boxesPerBundle: Number(e.target.value) || 0,
                  },
                }))
              }
              min={0}
            />
          </div>

          <div>
            <label className={labelClass}>Bundles Per Pallet</label>
            <input
              type="number"
              className={inputClass}
              value={data.bundlingDetails.bundlesPerPallet}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bundlingDetails: {
                    ...prev.bundlingDetails,
                    bundlesPerPallet: Number(e.target.value) || 0,
                  },
                }))
              }
              min={0}
            />
          </div>

          <div>
            <label className={labelClass}>Strap Material</label>
            <input
              type="text"
              className={inputClass}
              value={data.bundlingDetails.strapMaterial}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bundlingDetails: {
                    ...prev.bundlingDetails,
                    strapMaterial: e.target.value,
                  },
                }))
              }
              placeholder="e.g. PP 12mm White"
            />
          </div>

          <div>
            <label className={labelClass}>Corner Protectors</label>
            <select
              className={selectClass}
              value={data.bundlingDetails.cornerProtectors ? 'Yes' : 'No'}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bundlingDetails: {
                    ...prev.bundlingDetails,
                    cornerProtectors: e.target.value === 'Yes',
                  },
                }))
              }
            >
              <option value="Yes">Yes (Angle Boards Included)</option>
              <option value="No">No (Standard Strapping)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 20. Partition Details */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            20
          </span>
          <Grid className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Partition Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className={labelClass}>Include Partition</label>
            <select
              className={selectClass}
              value={data.partitionDetails.hasPartition ? 'Yes' : 'No'}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  partitionDetails: {
                    ...prev.partitionDetails,
                    hasPartition: e.target.value === 'Yes',
                  },
                }))
              }
            >
              <option value="No">No Partition</option>
              <option value="Yes">Yes (Grid / Interlocking)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Partition Material</label>
            <input
              type="text"
              className={inputClass}
              disabled={!data.partitionDetails.hasPartition}
              value={data.partitionDetails.partitionMaterial}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  partitionDetails: {
                    ...prev.partitionDetails,
                    partitionMaterial: e.target.value,
                  },
                }))
              }
              placeholder="e.g. 3-Ply B Flute"
            />
          </div>

          <div>
            <label className={labelClass}>Horizontal Cells</label>
            <input
              type="number"
              className={inputClass}
              disabled={!data.partitionDetails.hasPartition}
              value={data.partitionDetails.horizontalCells}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  partitionDetails: {
                    ...prev.partitionDetails,
                    horizontalCells: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Vertical Cells</label>
            <input
              type="number"
              className={inputClass}
              disabled={!data.partitionDetails.hasPartition}
              value={data.partitionDetails.verticalCells}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  partitionDetails: {
                    ...prev.partitionDetails,
                    verticalCells: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Partition Wt (g)</label>
            <input
              type="number"
              className={inputClass}
              disabled={!data.partitionDetails.hasPartition}
              value={data.partitionDetails.partitionWeightGrams}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  partitionDetails: {
                    ...prev.partitionDetails,
                    partitionWeightGrams: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Cost / Box (₹)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              disabled={!data.partitionDetails.hasPartition}
              value={data.partitionDetails.partitionCostPerBox}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  partitionDetails: {
                    ...prev.partitionDetails,
                    partitionCostPerBox: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 21. BOM Parameters */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            21
          </span>
          <Settings2 className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">BOM Parameters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Standard Batch Size</label>
            <input
              type="number"
              className={inputClass}
              value={data.bomParameters.batchSize}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bomParameters: {
                    ...prev.bomParameters,
                    batchSize: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Minimum Order Qty (MOQ)</label>
            <input
              type="number"
              className={inputClass}
              value={data.bomParameters.moq}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bomParameters: {
                    ...prev.bomParameters,
                    moq: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Production Lead Time (Days)</label>
            <input
              type="number"
              className={inputClass}
              value={data.bomParameters.leadTimeDays}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bomParameters: {
                    ...prev.bomParameters,
                    leadTimeDays: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>QA Inspection Level</label>
            <select
              className={selectClass}
              value={data.bomParameters.inspectionLevel}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bomParameters: {
                    ...prev.bomParameters,
                    inspectionLevel: e.target.value,
                  },
                }))
              }
            >
              <option value="Normal Level II (AQL 1.5)">Normal Level II (AQL 1.5)</option>
              <option value="Strict Level III (AQL 0.65)">Strict Level III (AQL 0.65)</option>
              <option value="Reduced Level I (AQL 4.0)">Reduced Level I (AQL 4.0)</option>
              <option value="100% Visual Inspection">100% Visual Inspection</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Safety Stock (Boxes)</label>
            <input
              type="number"
              className={inputClass}
              value={data.bomParameters.safetyStock}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  bomParameters: {
                    ...prev.bomParameters,
                    safetyStock: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 22. BOM Cost Calculations */}
      <div className={`p-5 rounded-xl border transition-all ${
        darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-emerald-50/40 border-emerald-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-emerald-600 rounded-full">
              22
            </span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                BOM Cost Calculations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consolidated unit economics and margin estimation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={recalculateCosts}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 rounded-lg transition-all"
          >
            <TrendingUp className="w-4 h-4" /> Recalculate
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Paper Cost / Box</label>
            <input
              type="number"
              step="0.01"
              className={`${inputClass} font-semibold`}
              value={data.bomCostCalculations.paperCostPerBox}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    paperCostPerBox: val,
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Process Cost / Box</label>
            <input
              type="number"
              step="0.01"
              className={`${inputClass} font-semibold`}
              value={data.bomCostCalculations.processCostPerBox}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    processCostPerBox: val,
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Consumables & Inks</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.bomCostCalculations.consumablesCostPerBox}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    consumablesCostPerBox: val,
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Tooling Amortization</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.bomCostCalculations.toolingAmortizationPerBox}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    toolingAmortizationPerBox: val,
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Lamination Cost</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.bomCostCalculations.laminationCostPerBox}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    laminationCostPerBox: val,
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Packing & Bundling</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.bomCostCalculations.packingCostPerBox}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    packingCostPerBox: val,
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Total Mfg Cost / Box</label>
            <input
              type="number"
              step="0.01"
              className={`${inputClass} font-bold text-base text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40`}
              value={data.bomCostCalculations.totalMfgCostPerBox}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    totalMfgCostPerBox: val,
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Profit Margin (%)</label>
            <input
              type="number"
              step="0.5"
              className={`${inputClass} font-semibold text-emerald-700 dark:text-emerald-400`}
              value={data.bomCostCalculations.marginPercent}
              onChange={(e) => {
                const m = Number(e.target.value) || 0;
                const mfg = data.bomCostCalculations.totalMfgCostPerBox || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    marginPercent: m,
                    quotedPricePerBox: Number((mfg * (1 + m / 100)).toFixed(2)),
                  },
                }));
              }}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Final Quoted Price / Box (₹)</label>
            <input
              type="number"
              step="0.01"
              className={`${inputClass} font-black text-lg text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50`}
              value={data.bomCostCalculations.quotedPricePerBox}
              onChange={(e) => {
                const qp = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  bomCostCalculations: {
                    ...prev.bomCostCalculations,
                    quotedPricePerBox: qp,
                  },
                }));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
