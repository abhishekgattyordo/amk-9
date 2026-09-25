'use client';

import React from 'react';
import {
  FileText,
  Package,
  Layers,
  Sparkles,
  Sliders,
  Building2,
  Calendar,
  Hash,
  Ruler,
  CheckCircle2,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { BomSectionsData } from './bom-types';

interface BomSectionsBasicProps {
  darkMode?: boolean;
  data: BomSectionsData;
  onChange: (updater: (prev: BomSectionsData) => BomSectionsData) => void;
  onRefreshBomNumber?: () => void;
  masters: {
    customers: any[];
    products: any[];
    categories: any[];
    subCategories: any[];
    leads: any[];
    quotations: any[];
  };
}

export function BomSectionsBasic({
  darkMode,
  data,
  onChange,
  onRefreshBomNumber,
  masters,
}: BomSectionsBasicProps) {
  const cardClass = `p-5 rounded-xl border transition-all ${
    darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 uppercase tracking-wider ${
    darkMode ? 'text-slate-300' : 'text-slate-600'
  }`;

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all ${
    darkMode
      ? 'bg-slate-900/80 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
  }`;

  const selectClass = `w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all ${
    darkMode
      ? 'bg-slate-900/80 border-slate-700 text-slate-100 focus:border-blue-500'
      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600'
  }`;

  return (
    <div className="space-y-6">
      {/* 1. Basic Information */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            1
          </span>
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>BOM Number</label>
              <div className="flex items-center gap-1.5">
                {data.basicInfo.bomNumber ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Auto
                  </span>
                ) : null}
                {onRefreshBomNumber && (
                  <button
                    type="button"
                    onClick={onRefreshBomNumber}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    title="Generate / Re-sync Next Sequence Number"
                  >
                    <RefreshCw className="w-3 h-3" /> Gen
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                className={`${inputClass} font-mono font-medium`}
                value={data.basicInfo.bomNumber}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    basicInfo: { ...prev.basicInfo, bomNumber: e.target.value },
                  }))
                }
                placeholder="e.g. BOM-2026-0001"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              BOM Title / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={data.basicInfo.bomName}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, bomName: e.target.value },
                }))
              }
              placeholder="e.g., Heavy Duty Master Carton 5-Ply"
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Customer (From DB)
            </label>
            <select
              className={selectClass}
              value={data.basicInfo.customerId}
              onChange={(e) => {
                const cid = e.target.value;
                const found = masters.customers.find((c) => c.id === cid);
                onChange((prev) => ({
                  ...prev,
                  basicInfo: {
                    ...prev.basicInfo,
                    customerId: cid,
                    customerName: found ? found.name : '',
                  },
                }));
              }}
            >
              <option value="">-- Select Customer from Database --</option>
              {masters.customers.length === 0 ? (
                <option value="" disabled>
                  No customers found in database
                </option>
              ) : (
                masters.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code || 'No Code'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Product / Item Code <span className="text-rose-500">*</span>
            </label>
            <select
              className={selectClass}
              value={data.basicInfo.productId}
              onChange={(e) => {
                const pid = e.target.value;
                const prod = masters.products.find((p) => p.id === pid);
                onChange((prev) => ({
                  ...prev,
                  basicInfo: {
                    ...prev.basicInfo,
                    productId: pid,
                    productName: prod ? prod.name : '',
                    bomName: prev.basicInfo.bomName || (prod ? `BOM for ${prod.name}` : ''),
                  },
                  boxSpec: {
                    ...prev.boxSpec,
                    boxType: prod?.boxType || prev.boxSpec.boxType,
                  },
                }));
              }}
              required
            >
              <option value="">-- Select Product from Database --</option>
              {masters.products.length === 0 ? (
                <option value="" disabled>
                  No products found in database
                </option>
              ) : (
                masters.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || 'Item'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>Plant / Production Unit</label>
            <input
              type="text"
              className={inputClass}
              value={data.basicInfo.plantUnit}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, plantUnit: e.target.value },
                }))
              }
              placeholder="e.g., Unit 1 - Main Corrugation Line"
            />
          </div>

          <div>
            <label className={labelClass}>Order / Target Date</label>
            <input
              type="date"
              className={inputClass}
              value={data.basicInfo.orderDate}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, orderDate: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Required Batch Quantity</label>
            <input
              type="number"
              className={inputClass}
              value={data.basicInfo.requiredQuantity}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: {
                    ...prev.basicInfo,
                    requiredQuantity: Number(e.target.value) || 0,
                  },
                }))
              }
              min={0}
            />
          </div>

          <div>
            <label className={labelClass}>BOM Status</label>
            <select
              className={selectClass}
              value={data.basicInfo.status}
              onChange={(e: any) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, status: e.target.value },
                }))
              }
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>NPD Reference Code</label>
            <input
              type="text"
              className={inputClass}
              value={data.basicInfo.npdRef || ''}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, npdRef: e.target.value },
                }))
              }
              placeholder="e.g., NPD-2026-908"
            />
          </div>

          <div>
            <label className={labelClass}>Sales Lead Reference</label>
            <select
              className={selectClass}
              value={data.basicInfo.salesLeadId || ''}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, salesLeadId: e.target.value },
                }))
              }
            >
              <option value="">-- No Linked Lead --</option>
              {masters.leads.length === 0 ? (
                <option value="" disabled>
                  No active leads in database
                </option>
              ) : (
                masters.leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.leadNumber} - {l.customerName || 'Lead'}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>Quotation Reference</label>
            <select
              className={selectClass}
              value={data.basicInfo.quotationId || ''}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, quotationId: e.target.value },
                }))
              }
            >
              <option value="">-- No Linked Quotation --</option>
              {masters.quotations.length === 0 ? (
                <option value="" disabled>
                  No quotations found in database
                </option>
              ) : (
                masters.quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quotationNumber} - {q.customerName}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>BOM Version</label>
            <input
              type="number"
              className={inputClass}
              value={data.basicInfo.version}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  basicInfo: {
                    ...prev.basicInfo,
                    version: Math.max(1, Number(e.target.value) || 1),
                  },
                }))
              }
              min={1}
            />
          </div>
        </div>
      </div>

      {/* 2. Box Specification */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            2
          </span>
          <Package className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Box Specification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Box Type / Style</label>
            <select
              className={selectClass}
              value={data.boxSpec.boxType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxSpec: { ...prev.boxSpec, boxType: e.target.value },
                }))
              }
            >
              <option value="Regular Slotted Carton (RSC)">Regular Slotted Carton (RSC)</option>
              <option value="Die Cut Box">Die Cut Box</option>
              <option value="Universal Box">Universal Box</option>
              <option value="Full Overlap Slotted (FOL)">Full Overlap Slotted (FOL)</option>
              <option value="Half Slotted Container (HSC)">Half Slotted Container (HSC)</option>
              <option value="Telescopic Box (Top + Bottom)">Telescopic Box (Top + Bottom)</option>
              <option value="Wrap Around Blank">Wrap Around Blank</option>
              <option value="Tray / Punched Lid">Tray / Punched Lid</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Category (From DB)</label>
            <select
              className={selectClass}
              value={data.boxSpec.categoryId || ''}
              onChange={(e) => {
                const cid = e.target.value;
                const cat = masters.categories.find((c) => c.id === cid);
                onChange((prev) => ({
                  ...prev,
                  boxSpec: {
                    ...prev.boxSpec,
                    categoryId: cid,
                    categoryName: cat ? cat.name : '',
                  },
                }));
              }}
            >
              <option value="">-- Select Category --</option>
              {masters.categories.length === 0 ? (
                <option value="" disabled>
                  No categories found in database
                </option>
              ) : (
                masters.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>Sub-Category (From DB)</label>
            <select
              className={selectClass}
              value={data.boxSpec.subCategoryId || ''}
              onChange={(e) => {
                const scid = e.target.value;
                const scat = masters.subCategories.find((s) => s.id === scid);
                onChange((prev) => ({
                  ...prev,
                  boxSpec: {
                    ...prev.boxSpec,
                    subCategoryId: scid,
                    subCategoryName: scat ? scat.name : '',
                  },
                }));
              }}
            >
              <option value="">-- Select Sub-Category --</option>
              {masters.subCategories.length === 0 ? (
                <option value="" disabled>
                  No subcategories found in database
                </option>
              ) : (
                masters.subCategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={labelClass}>Ply Count</label>
            <select
              className={selectClass}
              value={data.boxSpec.ply}
              onChange={(e) => {
                const p = Number(e.target.value) || 5;
                onChange((prev) => ({
                  ...prev,
                  boxSpec: {
                    ...prev.boxSpec,
                    ply: p,
                    fluteType:
                      p === 3
                        ? 'B-Flute'
                        : p === 5
                        ? 'BC-Flute (5-Ply)'
                        : p === 7
                        ? 'BCA-Flute (7-Ply)'
                        : 'E-Flute',
                  },
                }));
              }}
            >
              <option value={3}>3-Ply (Single Wall)</option>
              <option value={5}>5-Ply (Double Wall)</option>
              <option value={7}>7-Ply (Triple Wall)</option>
              <option value={9}>9-Ply (Heavy Duty)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Flute Type</label>
            <select
              className={selectClass}
              value={data.boxSpec.fluteType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxSpec: { ...prev.boxSpec, fluteType: e.target.value },
                }))
              }
            >
              <option value="B-Flute (Single)">B-Flute (Single Wall, 3mm)</option>
              <option value="C-Flute (Single)">C-Flute (Single Wall, 4mm)</option>
              <option value="E-Flute (Micro)">E-Flute (Micro Flute, 1.5mm)</option>
              <option value="BC-Flute (5-Ply)">BC-Flute (Double Wall, 7mm)</option>
              <option value="AB-Flute (5-Ply)">AB-Flute (Double Wall, 8mm)</option>
              <option value="BCA-Flute (7-Ply)">BCA-Flute (Triple Wall, 12mm)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Flute Height (mm)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.boxSpec.fluteHeightMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxSpec: {
                    ...prev.boxSpec,
                    fluteHeightMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Target Bursting Factor (BF)</label>
            <input
              type="number"
              className={inputClass}
              value={data.boxSpec.burstingFactorBF}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxSpec: {
                    ...prev.boxSpec,
                    burstingFactorBF: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Target Compression (BCT kgf)</label>
            <input
              type="number"
              className={inputClass}
              value={data.boxSpec.targetBCTKgf}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  boxSpec: {
                    ...prev.boxSpec,
                    targetBCTKgf: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 3. Dimensions */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            3
          </span>
          <Ruler className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Dimensions</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className={labelClass}>Length (L)</label>
            <input
              type="number"
              className={inputClass}
              value={data.dimensions.lengthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  dimensions: {
                    ...prev.dimensions,
                    lengthMm: Number(e.target.value) || 0,
                  },
                }))
              }
              placeholder="e.g. 400"
            />
          </div>

          <div>
            <label className={labelClass}>Width (W)</label>
            <input
              type="number"
              className={inputClass}
              value={data.dimensions.widthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  dimensions: {
                    ...prev.dimensions,
                    widthMm: Number(e.target.value) || 0,
                  },
                }))
              }
              placeholder="e.g. 300"
            />
          </div>

          <div>
            <label className={labelClass}>Height (H)</label>
            <input
              type="number"
              className={inputClass}
              value={data.dimensions.heightMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  dimensions: {
                    ...prev.dimensions,
                    heightMm: Number(e.target.value) || 0,
                  },
                }))
              }
              placeholder="e.g. 250"
            />
          </div>

          <div>
            <label className={labelClass}>Dimension Unit</label>
            <select
              className={selectClass}
              value={data.dimensions.dimensionUnit}
              onChange={(e: any) =>
                onChange((prev) => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, dimensionUnit: e.target.value },
                }))
              }
            >
              <option value="mm">Millimeters (mm)</option>
              <option value="inch">Inches (inch)</option>
              <option value="cm">Centimeters (cm)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Dimension Type</label>
            <select
              className={selectClass}
              value={data.dimensions.dimensionType}
              onChange={(e: any) =>
                onChange((prev) => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, dimensionType: e.target.value },
                }))
              }
            >
              <option value="Inner">Inner Dimensions (ID)</option>
              <option value="Outer">Outer Dimensions (OD)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tolerance (± mm)</label>
            <input
              type="number"
              step="0.5"
              className={inputClass}
              value={data.dimensions.toleranceMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  dimensions: {
                    ...prev.dimensions,
                    toleranceMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 4. Additional Details */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            4
          </span>
          <Sliders className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Additional Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Joint Type</label>
            <select
              className={selectClass}
              value={data.additionalDetails.jointType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  additionalDetails: {
                    ...prev.additionalDetails,
                    jointType: e.target.value,
                  },
                }))
              }
            >
              <option value="Stitched">Stitched (Wire)</option>
              <option value="Glued (PVA)">Glued (PVA Adhesive)</option>
              <option value="Self-Locking / Tuck-In">Self-Locking / Tuck-In</option>
              <option value="Glued + Stitched">Glued + Stitched Combination</option>
              <option value="Reinforced Taped">Reinforced Taped</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Flap Size (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.additionalDetails.flapSizeMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  additionalDetails: {
                    ...prev.additionalDetails,
                    flapSizeMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Slot Depth (mm)</label>
            <input
              type="number"
              className={inputClass}
              value={data.additionalDetails.slotDepthMm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  additionalDetails: {
                    ...prev.additionalDetails,
                    slotDepthMm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Die Number / Tooling ID</label>
            <input
              type="text"
              className={inputClass}
              value={data.additionalDetails.dieNumber}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  additionalDetails: {
                    ...prev.additionalDetails,
                    dieNumber: e.target.value,
                  },
                }))
              }
              placeholder="e.g. DIE-400x300-RSC"
            />
          </div>

          <div>
            <label className={labelClass}>Artwork / Stereo Ref</label>
            <input
              type="text"
              className={inputClass}
              value={data.additionalDetails.artworkRef}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  additionalDetails: {
                    ...prev.additionalDetails,
                    artworkRef: e.target.value,
                  },
                }))
              }
              placeholder="e.g. ART-KRAFT-V2"
            />
          </div>

          <div>
            <label className={labelClass}>Printing Type</label>
            <select
              className={selectClass}
              value={data.additionalDetails.printingType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  additionalDetails: {
                    ...prev.additionalDetails,
                    printingType: e.target.value,
                  },
                }))
              }
            >
              <option value="Flexo Printing">Flexo Printing</option>
              <option value="Offset / Litho Laminated">Offset / Litho Laminated</option>
              <option value="Screen Printing">Screen Printing</option>
              <option value="Digital Direct-to-Board">Digital Direct-to-Board</option>
              <option value="Unprinted (Plain)">Unprinted (Plain)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Number of Colors</label>
            <input
              type="number"
              className={inputClass}
              value={data.additionalDetails.colorCount}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  additionalDetails: {
                    ...prev.additionalDetails,
                    colorCount: Math.max(0, Number(e.target.value) || 0),
                  },
                }))
              }
              min={0}
              max={8}
            />
          </div>
        </div>
      </div>

      {/* 5. Client Requirements */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            5
          </span>
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Client Requirements</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className={labelClass}>Target Total GSM</label>
            <input
              type="number"
              className={inputClass}
              value={data.clientRequirements.targetGsm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  clientRequirements: {
                    ...prev.clientRequirements,
                    targetGsm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Bursting Strength (BS kg/cm²)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.clientRequirements.burstingStrengthBS}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  clientRequirements: {
                    ...prev.clientRequirements,
                    burstingStrengthBS: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Edge Crush Test (ECT kN/m)</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.clientRequirements.ectKnm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  clientRequirements: {
                    ...prev.clientRequirements,
                    ectKnm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Cobb Value (g/m² 30min)</label>
            <input
              type="number"
              className={inputClass}
              value={data.clientRequirements.cobbValueGsm}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  clientRequirements: {
                    ...prev.clientRequirements,
                    cobbValueGsm: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Moisture Max (%)</label>
            <input
              type="number"
              step="0.5"
              className={inputClass}
              value={data.clientRequirements.moisturePercent}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  clientRequirements: {
                    ...prev.clientRequirements,
                    moisturePercent: Number(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>Special Coating</label>
            <select
              className={selectClass}
              value={data.clientRequirements.coatingType}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  clientRequirements: {
                    ...prev.clientRequirements,
                    coatingType: e.target.value,
                  },
                }))
              }
            >
              <option value="None / Standard Kraft">None / Standard Kraft</option>
              <option value="Water-Resistant Varnish">Water-Resistant Varnish</option>
              <option value="Oil & Grease Resistant (OGR)">Oil & Grease Resistant (OGR)</option>
              <option value="Anti-Static Coating">Anti-Static Coating</option>
              <option value="Fire Retardant">Fire Retardant</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
