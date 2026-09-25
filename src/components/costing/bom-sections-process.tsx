'use client';

import React from 'react';
import {
  Cog,
  Plus,
  Trash2,
  Compass,
  Maximize,
  SlidersHorizontal,
  Printer,
  Sparkles,
} from 'lucide-react';
import { BomSectionsData, ProductionProcessItem } from './bom-types';

interface BomSectionsProcessProps {
  darkMode?: boolean;
  data: BomSectionsData;
  onChange: (updater: (prev: BomSectionsData) => BomSectionsData) => void;
  machines: any[];
}

export function BomSectionsProcess({
  darkMode,
  data,
  onChange,
  machines,
}: BomSectionsProcessProps) {
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

  const handleAddProcess = () => {
    const newProcess: ProductionProcessItem = {
      id: `proc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sequence: data.productionProcesses.length + 1,
      processName: 'Corrugation',
      machineName: '',
      speedPerHour: 0,
      setupTimeMin: 0,
      costPerHour: 0,
      costPerBox: 0,
      notes: '',
    };

    onChange((prev) => {
      const updated = [...prev.productionProcesses, newProcess];
      const totalProcessCost = updated.reduce(
        (acc, curr) => acc + (Number(curr.costPerBox) || 0),
        0
      );
      return {
        ...prev,
        productionProcesses: updated,
        bomCostCalculations: {
          ...prev.bomCostCalculations,
          processCostPerBox: Number(totalProcessCost.toFixed(2)),
        },
      };
    });
  };

  const handleRemoveProcess = (index: number) => {
    onChange((prev) => {
      const updated = prev.productionProcesses.filter((_, i) => i !== index);
      const totalProcessCost = updated.reduce(
        (acc, curr) => acc + (Number(curr.costPerBox) || 0),
        0
      );
      return {
        ...prev,
        productionProcesses: updated,
        bomCostCalculations: {
          ...prev.bomCostCalculations,
          processCostPerBox: Number(totalProcessCost.toFixed(2)),
        },
      };
    });
  };

  const handleProcessChange = (index: number, field: keyof ProductionProcessItem, value: any) => {
    onChange((prev) => {
      const updated = [...prev.productionProcesses];
      const item = { ...updated[index], [field]: value };

      if (field === 'machineId') {
        const m = machines.find((mach) => mach.id === value);
        if (m) {
          item.machineName = m.name;
          if (m.capacityPerHour) item.speedPerHour = Number(m.capacityPerHour);
        }
      }

      // Compute cost per box if speed and cost per hour available
      const speed = Number(item.speedPerHour) || 0;
      const rateHour = Number(item.costPerHour) || 0;
      if (speed > 0 && rateHour > 0) {
        item.costPerBox = Number((rateHour / speed).toFixed(2));
      }

      updated[index] = item;
      const totalProcessCost = updated.reduce(
        (acc, curr) => acc + (Number(curr.costPerBox) || 0),
        0
      );

      return {
        ...prev,
        productionProcesses: updated,
        bomCostCalculations: {
          ...prev.bomCostCalculations,
          processCostPerBox: Number(totalProcessCost.toFixed(2)),
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* 11. Production Process */}
      <div className={cardClass}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
              11
            </span>
            <Cog className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Production Process
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sequence of manufacturing operations and machine allocation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddProcess}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" /> + Add Process
          </button>
        </div>

        {data.productionProcesses.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Cog className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No processes configured
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Click &ldquo;+ Add Process&rdquo; to define the corrugation and conversion steps
            </p>
            <button
              type="button"
              onClick={handleAddProcess}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Process
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-2.5 w-12 text-center">#</th>
                  <th className="p-2.5">Process Step</th>
                  <th className="p-2.5">Machine (From DB)</th>
                  <th className="p-2.5 w-24">Speed / Hr</th>
                  <th className="p-2.5 w-24">Setup (min)</th>
                  <th className="p-2.5 w-28">Cost / Hr (₹)</th>
                  <th className="p-2.5 w-24">Cost / Box</th>
                  <th className="p-2.5">Notes</th>
                  <th className="p-2.5 w-12 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.productionProcesses.map((proc, idx) => (
                  <tr key={proc.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <select
                        className={selectClass}
                        value={proc.processName}
                        onChange={(e) => handleProcessChange(idx, 'processName', e.target.value)}
                      >
                        <option value="Corrugation">Corrugation</option>
                        <option value="Sheet Cutting">Sheet Cutting</option>
                        <option value="Flexo Printing">Flexo Printing</option>
                        <option value="RS4 Slotting / Scoring">RS4 Slotting / Scoring</option>
                        <option value="Rotary Die Cutting">Rotary Die Cutting</option>
                        <option value="Flatbed Die Cutting">Flatbed Die Cutting</option>
                        <option value="Lamination">Lamination</option>
                        <option value="Auto Folder Gluer">Auto Folder Gluer</option>
                        <option value="Stitching (Manual/Semi)">Stitching (Manual/Semi)</option>
                        <option value="Quality Inspection & Bundling">
                          Quality Inspection & Bundling
                        </option>
                        <option value="Palletizing & Wrapping">Palletizing & Wrapping</option>
                      </select>
                    </td>
                    <td className="p-2 min-w-[160px]">
                      <select
                        className={selectClass}
                        value={proc.machineId || ''}
                        onChange={(e) => handleProcessChange(idx, 'machineId', e.target.value)}
                      >
                        <option value="">-- Select Machine from DB --</option>
                        {machines.length === 0 ? (
                          <option value="" disabled>
                            No machines found in database
                          </option>
                        ) : (
                          machines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.code || 'Line'})
                            </option>
                          ))
                        )}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={proc.speedPerHour}
                        onChange={(e) =>
                          handleProcessChange(idx, 'speedPerHour', Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={proc.setupTimeMin}
                        onChange={(e) =>
                          handleProcessChange(idx, 'setupTimeMin', Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="10"
                        className={inputClass}
                        value={proc.costPerHour}
                        onChange={(e) =>
                          handleProcessChange(idx, 'costPerHour', Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        className={`${inputClass} font-semibold text-emerald-600 dark:text-emerald-400`}
                        value={proc.costPerBox}
                        onChange={(e) =>
                          handleProcessChange(idx, 'costPerBox', Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputClass}
                        value={proc.notes || ''}
                        onChange={(e) => handleProcessChange(idx, 'notes', e.target.value)}
                        placeholder="Operator/Special instructions"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveProcess(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                        title="Delete process"
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

      {/* 12. Flute Directions */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            12
          </span>
          <Compass className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Flute Directions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Flute Profile</label>
            <select
              className={selectClass}
              value={data.fluteDirections.fluteProfile}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  fluteDirections: {
                    ...prev.fluteDirections,
                    fluteProfile: e.target.value,
                  },
                }))
              }
            >
              <option value="B-Flute Profile">B-Flute Profile (Standard)</option>
              <option value="C-Flute Profile">C-Flute Profile (High Cushioning)</option>
              <option value="E-Flute Profile">E-Flute Profile (Micro / Fine)</option>
              <option value="BC-Flute Double Profile">BC-Flute Double Profile</option>
              <option value="AB-Flute Heavy Profile">AB-Flute Heavy Profile</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Corrugation Direction</label>
            <select
              className={selectClass}
              value={data.fluteDirections.corrugationDirection}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  fluteDirections: {
                    ...prev.fluteDirections,
                    corrugationDirection: e.target.value,
                  },
                }))
              }
            >
              <option value="Vertical / Parallel to Depth">Vertical / Parallel to Depth</option>
              <option value="Horizontal / Parallel to Length">
                Horizontal / Parallel to Length
              </option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Take-Up Ratio</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.fluteDirections.takeUpRatio}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  fluteDirections: {
                    ...prev.fluteDirections,
                    takeUpRatio: Number(e.target.value) || 1.4,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 13. Rotary Size */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            13
          </span>
          <Maximize className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Rotary Size</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Cylinder Circumference (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.rotarySize.cylinderCircumferenceMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rotarySize: {
                    ...prev.rotarySize,
                    cylinderCircumferenceMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Die Diameter (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.rotarySize.dieDiameterMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rotarySize: {
                    ...prev.rotarySize,
                    dieDiameterMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Repeat Length (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.rotarySize.repeatLengthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rotarySize: {
                    ...prev.rotarySize,
                    repeatLengthMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Impressions Per Rev</label>
            <input
              type="number"
              className={inputClass}
              value={data.rotarySize.impressionsPerRev}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rotarySize: {
                    ...prev.rotarySize,
                    impressionsPerRev: Number(e.target.value) || 1,
                  },
                }))
              }
              min={1}
            />
          </div>
        </div>
      </div>

      {/* 14. RS4 Slotter Size */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            14
          </span>
          <SlidersHorizontal className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">RS4 Slotter Size</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Slot Knife Width (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.rs4Slotter.slotKnifeWidthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rs4Slotter: {
                    ...prev.rs4Slotter,
                    slotKnifeWidthMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Creasing Rule (mm)</label>
            <input
              type="number"
              step="0.5"
              className={inputClass}
              value={data.rs4Slotter.creasingRuleMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rs4Slotter: {
                    ...prev.rs4Slotter,
                    creasingRuleMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Blade Gap (mm)</label>
            <input
              type="number"
              step="0.5"
              className={inputClass}
              value={data.rs4Slotter.bladeGapMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rs4Slotter: {
                    ...prev.rs4Slotter,
                    bladeGapMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Slotting Depth (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.rs4Slotter.slottingDepthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  rs4Slotter: {
                    ...prev.rs4Slotter,
                    slottingDepthMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 15. Printing Details */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            15
          </span>
          <Printer className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Printing Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Print Machine</label>
            <input
              type="text"
              className={inputClass}
              value={data.printingDetails.machineName}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  printingDetails: {
                    ...prev.printingDetails,
                    machineName: e.target.value,
                  },
                }))
              }
              placeholder="e.g. 4-Color Flexo Printer Slotter"
            />
          </div>

          <div>
            <label className={labelClass}>Ink Consumption (g/m²)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.printingDetails.inkConsumptionGsm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  printingDetails: {
                    ...prev.printingDetails,
                    inkConsumptionGsm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Stereo Plate Thickness (mm)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.printingDetails.stereoThicknessMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  printingDetails: {
                    ...prev.printingDetails,
                    stereoThicknessMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Anilox Roller (LPI)</label>
            <input
              type="number"
              className={inputClass}
              value={data.printingDetails.aniloxLpi}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  printingDetails: {
                    ...prev.printingDetails,
                    aniloxLpi: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 16. Lamination */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            16
          </span>
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Lamination</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Lamination Type</label>
            <select
              className={selectClass}
              value={data.lamination.laminationType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  lamination: {
                    ...prev.lamination,
                    laminationType: e.target.value,
                  },
                }))
              }
            >
              <option value="None">None (Unlaminated)</option>
              <option value="Gloss BOPP Film">Gloss BOPP Film</option>
              <option value="Matt BOPP Film">Matt BOPP Film</option>
              <option value="Thermal Lamination">Thermal Lamination</option>
              <option value="MetPET Lamination">MetPET Lamination</option>
              <option value="UV Varnish Coating">UV Varnish Coating</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Film Thickness (Micron)</label>
            <input
              type="number"
              className={inputClass}
              value={data.lamination.filmMicron}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  lamination: {
                    ...prev.lamination,
                    filmMicron: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Adhesive Type</label>
            <input
              type="text"
              className={inputClass}
              value={data.lamination.adhesiveType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  lamination: {
                    ...prev.lamination,
                    adhesiveType: e.target.value,
                  },
                }))
              }
              placeholder="e.g. Water-based Acrylic"
            />
          </div>

          <div>
            <label className={labelClass}>Adhesive GSM</label>
            <input
              type="number"
              step="0.5"
              className={inputClass}
              value={data.lamination.adhesiveGsm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  lamination: {
                    ...prev.lamination,
                    adhesiveGsm: Number(e.target.value) || 0,
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
