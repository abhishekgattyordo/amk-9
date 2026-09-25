'use client';

import React from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Calculator,
  Scale,
  Percent,
  Maximize2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { BomSectionsData, PaperLayerItem } from './bom-types';

interface BomSectionsSheetProps {
  darkMode?: boolean;
  data: BomSectionsData;
  onChange: (updater: (prev: BomSectionsData) => BomSectionsData) => void;
  rawMaterials: any[];
  suppliers: any[];
}

export function BomSectionsSheet({
  darkMode,
  data,
  onChange,
  rawMaterials,
  suppliers,
}: BomSectionsSheetProps) {
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

  const handleAddPaperLayer = () => {
    const newLayer: PaperLayerItem = {
      id: `layer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      layer: `Layer ${data.paperCombination.length + 1}`,
      materialName: '',
      gsm: 0,
      bf: 0,
      ratePerKg: 0,
      fluteRatio: 1.0,
      weightGrams: 0,
      costPerBox: 0,
      paperType: '',
      mill: '',
      shade: '',
    };

    onChange((prev) => {
      const updated = [...prev.paperCombination, newLayer];
      // Recalculate totals
      const totalGsm = updated.reduce((acc, curr) => acc + (Number(curr.gsm) || 0), 0);
      const totalPaperCost = updated.reduce((acc, curr) => acc + (Number(curr.costPerBox) || 0), 0);
      return {
        ...prev,
        paperCombination: updated,
        boxCalculations: {
          ...prev.boxCalculations,
          totalBoardGsm: totalGsm,
        },
        bomCostCalculations: {
          ...prev.bomCostCalculations,
          paperCostPerBox: Number(totalPaperCost.toFixed(2)),
        },
      };
    });
  };

  const handleRemovePaperLayer = (index: number) => {
    onChange((prev) => {
      const updated = prev.paperCombination.filter((_, i) => i !== index);
      const totalGsm = updated.reduce((acc, curr) => acc + (Number(curr.gsm) || 0), 0);
      const totalPaperCost = updated.reduce((acc, curr) => acc + (Number(curr.costPerBox) || 0), 0);
      return {
        ...prev,
        paperCombination: updated,
        boxCalculations: {
          ...prev.boxCalculations,
          totalBoardGsm: totalGsm,
        },
        bomCostCalculations: {
          ...prev.bomCostCalculations,
          paperCostPerBox: Number(totalPaperCost.toFixed(2)),
        },
      };
    });
  };

  const handleLayerChange = (index: number, field: keyof PaperLayerItem, value: any) => {
    onChange((prev) => {
      const updated = [...prev.paperCombination];
      const item = { ...updated[index], [field]: value };

      // If material selected, pull details
      if (field === 'materialId') {
        const mat = rawMaterials.find((m) => m.id === value);
        if (mat) {
          item.materialCode = mat.code;
          item.materialName = mat.name;
          if (mat.gsm) item.gsm = Number(mat.gsm);
          if (mat.purchasePrice) item.ratePerKg = Number(mat.purchasePrice);
          if (mat.grade) item.paperType = mat.grade;
        }
      }

      // Compute item cost
      const gsm = Number(item.gsm) || 0;
      const rate = Number(item.ratePerKg) || 0;
      const weight = Number(item.weightGrams) || 0;
      item.costPerBox = Number(((weight / 1000) * rate).toFixed(2));

      updated[index] = item;

      const totalGsm = updated.reduce((acc, curr) => acc + (Number(curr.gsm) || 0), 0);
      const totalWeight = updated.reduce((acc, curr) => acc + (Number(curr.weightGrams) || 0), 0);
      const totalPaperCost = updated.reduce((acc, curr) => acc + (Number(curr.costPerBox) || 0), 0);

      return {
        ...prev,
        paperCombination: updated,
        boxCalculations: {
          ...prev.boxCalculations,
          totalBoardGsm: totalGsm,
          netBoxWeightGrams: totalWeight,
          grossBoxWeightGrams: Number((totalWeight * 1.05).toFixed(1)),
        },
        bomCostCalculations: {
          ...prev.bomCostCalculations,
          paperCostPerBox: Number(totalPaperCost.toFixed(2)),
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* 6. Sheet Parameters */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            6
          </span>
          <Maximize2 className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Sheet Parameters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className={labelClass}>Deckle Size (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetParameters.deckleSizeMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  sheetParameters: {
                    ...prev.sheetParameters,
                    deckleSizeMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Cutting Size (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetParameters.cuttingSizeMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  sheetParameters: {
                    ...prev.sheetParameters,
                    cuttingSizeMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Ups Across</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetParameters.upsAcross}
              onChange={(e) => {
                const across = Math.max(1, Number(e.target.value) || 1);
                onChange((prev) => ({
                  ...prev,
                  sheetParameters: {
                    ...prev.sheetParameters,
                    upsAcross: across,
                    totalUps: across * prev.sheetParameters.upsAround,
                  },
                }));
              }}
              min={1}
            />
          </div>

          <div>
            <label className={labelClass}>Ups Around</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetParameters.upsAround}
              onChange={(e) => {
                const around = Math.max(1, Number(e.target.value) || 1);
                onChange((prev) => ({
                  ...prev,
                  sheetParameters: {
                    ...prev.sheetParameters,
                    upsAround: around,
                    totalUps: prev.sheetParameters.upsAcross * around,
                  },
                }));
              }}
              min={1}
            />
          </div>

          <div>
            <label className={labelClass}>Total Ups</label>
            <input
              type="number"
              className={`${inputClass} font-semibold bg-slate-50 dark:bg-slate-800`}
              value={data.sheetParameters.totalUps}
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Grain Direction</label>
            <select
              className={selectClass}
              value={data.sheetParameters.grainDirection}
              onChange={(e: any) =>
                onChange((prev) => ({
                  ...prev,
                  sheetParameters: {
                    ...prev.sheetParameters,
                    grainDirection: e.target.value,
                  },
                }))
              }
            >
              <option value="Parallel to Length">Parallel to Length</option>
              <option value="Parallel to Width">Parallel to Width</option>
            </select>
          </div>
        </div>
      </div>

      {/* 7. Sheet Size */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            7
          </span>
          <Scale className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Sheet Size</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Gross Deckle (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetSize.grossDeckleMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  sheetSize: {
                    ...prev.sheetSize,
                    grossDeckleMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Net Deckle (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetSize.netDeckleMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  sheetSize: {
                    ...prev.sheetSize,
                    netDeckleMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Gross Cut Length (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetSize.grossCutLengthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  sheetSize: {
                    ...prev.sheetSize,
                    grossCutLengthMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Net Cut Length (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.sheetSize.netCutLengthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  sheetSize: {
                    ...prev.sheetSize,
                    netCutLengthMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Running Mtr / 1000 Boxes</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.sheetSize.runningMetersPer1000}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  sheetSize: {
                    ...prev.sheetSize,
                    runningMetersPer1000: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 8. Wastage Calculations */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            8
          </span>
          <Percent className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Wastage Calculations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Trim Wastage (%)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.wastageCalculations.trimWastagePercent}
              onChange={(e) => {
                const trim = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  wastageCalculations: {
                    ...prev.wastageCalculations,
                    trimWastagePercent: trim,
                    totalWastagePercent: Number(
                      (
                        trim +
                        prev.wastageCalculations.slotterWastagePercent +
                        prev.wastageCalculations.printingWastagePercent
                      ).toFixed(1)
                    ),
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Fluting Factor</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.wastageCalculations.flutingFactor}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  wastageCalculations: {
                    ...prev.wastageCalculations,
                    flutingFactor: Number(e.target.value) || 1.4,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Slotter Wastage (%)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.wastageCalculations.slotterWastagePercent}
              onChange={(e) => {
                const slot = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  wastageCalculations: {
                    ...prev.wastageCalculations,
                    slotterWastagePercent: slot,
                    totalWastagePercent: Number(
                      (
                        prev.wastageCalculations.trimWastagePercent +
                        slot +
                        prev.wastageCalculations.printingWastagePercent
                      ).toFixed(1)
                    ),
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Printing / Setup Wastage (%)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.wastageCalculations.printingWastagePercent}
              onChange={(e) => {
                const prn = Number(e.target.value) || 0;
                onChange((prev) => ({
                  ...prev,
                  wastageCalculations: {
                    ...prev.wastageCalculations,
                    printingWastagePercent: prn,
                    totalWastagePercent: Number(
                      (
                        prev.wastageCalculations.trimWastagePercent +
                        prev.wastageCalculations.slotterWastagePercent +
                        prn
                      ).toFixed(1)
                    ),
                  },
                }));
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Total Wastage (%)</label>
            <input
              type="number"
              className={`${inputClass} font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30`}
              value={data.wastageCalculations.totalWastagePercent}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* 9. Paper Combination */}
      <div className={cardClass}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
              9
            </span>
            <Layers className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Paper Combination
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define all board layers with live raw material master selection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddPaperLayer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" /> + Add Paper Item
          </button>
        </div>

        {data.paperCombination.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Layers className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No paper items added yet
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Click &ldquo;+ Add Paper Item&rdquo; to build your board structure
            </p>
            <button
              type="button"
              onClick={handleAddPaperLayer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Layer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Layer Name</th>
                  <th className="p-2.5">Raw Material (DB)</th>
                  <th className="p-2.5">Mill / Supplier</th>
                  <th className="p-2.5">Shade</th>
                  <th className="p-2.5 w-20">GSM</th>
                  <th className="p-2.5 w-16">BF</th>
                  <th className="p-2.5 w-24">Rate (₹/kg)</th>
                  <th className="p-2.5 w-24">Weight (g)</th>
                  <th className="p-2.5 w-24">Cost / Box</th>
                  <th className="p-2.5 w-12 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.paperCombination.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputClass}
                        value={item.layer}
                        onChange={(e) => handleLayerChange(idx, 'layer', e.target.value)}
                        placeholder="e.g. Top Liner"
                      />
                    </td>
                    <td className="p-2 min-w-[180px]">
                      <select
                        className={selectClass}
                        value={item.materialId || ''}
                        onChange={(e) => handleLayerChange(idx, 'materialId', e.target.value)}
                      >
                        <option value="">-- Select Material --</option>
                        {rawMaterials.length === 0 ? (
                          <option value="" disabled>
                            No raw materials in database
                          </option>
                        ) : (
                          rawMaterials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.code || 'RM'}) - {m.gsm || 0} GSM
                            </option>
                          ))
                        )}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        className={selectClass}
                        value={item.mill || ''}
                        onChange={(e) => handleLayerChange(idx, 'mill', e.target.value)}
                      >
                        <option value="">-- Select Mill --</option>
                        {suppliers.length === 0 ? (
                          <option value="" disabled>
                            No suppliers in database
                          </option>
                        ) : (
                          suppliers.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))
                        )}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputClass}
                        value={item.shade || ''}
                        onChange={(e) => handleLayerChange(idx, 'shade', e.target.value)}
                        placeholder="Natural/Golden"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={item.gsm}
                        onChange={(e) => handleLayerChange(idx, 'gsm', Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={item.bf || ''}
                        onChange={(e) => handleLayerChange(idx, 'bf', Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={item.ratePerKg}
                        onChange={(e) =>
                          handleLayerChange(idx, 'ratePerKg', Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={item.weightGrams}
                        onChange={(e) =>
                          handleLayerChange(idx, 'weightGrams', Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        className={`${inputClass} font-semibold text-emerald-600 dark:text-emerald-400`}
                        value={item.costPerBox}
                        readOnly
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePaperLayer(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                        title="Delete layer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 10. Box Calculations */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            10
          </span>
          <Calculator className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Box Calculations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Total Board GSM</label>
            <input
              type="number"
              className={`${inputClass} font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30`}
              value={data.boxCalculations.totalBoardGsm}
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Net Box Weight (g)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.boxCalculations.netBoxWeightGrams}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxCalculations: {
                    ...prev.boxCalculations,
                    netBoxWeightGrams: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Gross Box Weight (g)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.boxCalculations.grossBoxWeightGrams}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxCalculations: {
                    ...prev.boxCalculations,
                    grossBoxWeightGrams: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Board Caliper (mm)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.boxCalculations.boardCaliperMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxCalculations: {
                    ...prev.boxCalculations,
                    boardCaliperMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Calculated BF</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.boxCalculations.calculatedBF}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxCalculations: {
                    ...prev.boxCalculations,
                    calculatedBF: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
