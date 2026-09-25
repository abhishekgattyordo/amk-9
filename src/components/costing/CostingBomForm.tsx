'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Check,
  ChevronRight,
} from 'lucide-react';
import { BillOfMaterial, User } from '@/types';
import { BomSectionsData, PaperLayerItem, ProductionProcessItem } from './bom-types';
import { BomSectionsBasic } from './bom-sections-basic';
import { BomSectionsSheet } from './bom-sections-sheet';
import { BomSectionsProcess } from './bom-sections-process';
import { BomSectionsFinishing } from './bom-sections-finishing';

interface CostingBomFormProps {
  darkMode?: boolean;
  currentUser?: User | null;
  bomId?: string; // If editing
  initialProductId?: string;
  initialCustomerId?: string;
  initialLeadId?: string;
  initialQuotationId?: string;
  onBack: () => void;
  onSaved: (savedBom: BillOfMaterial, proceedToCostSheet?: boolean) => void;
}

const initialBomData: BomSectionsData = {
  // 1. Basic Information
  basicInfo: {
    bomNumber: '',
    bomName: '',
    customerId: '',
    customerName: '',
    productId: '',
    productName: '',
    plantUnit: '',
    orderDate: new Date().toISOString().split('T')[0],
    requiredQuantity: 0,
    version: 1,
    status: 'Active',
    npdRef: '',
    salesLeadId: '',
    quotationId: '',
    notes: '',
  },
  // 2. Box Specification
  boxSpec: {
    boxType: 'Regular Slotted Carton (RSC)',
    categoryId: '',
    categoryName: '',
    subCategoryId: '',
    subCategoryName: '',
    ply: 3,
    fluteType: 'B-Flute (Single)',
    fluteHeightMm: 0,
    burstingFactorBF: 0,
    targetBCTKgf: 0,
  },
  // 3. Dimensions
  dimensions: {
    lengthMm: 0,
    widthMm: 0,
    heightMm: 0,
    dimensionUnit: 'mm',
    dimensionType: 'Inner',
    toleranceMm: 0,
  },
  // 4. Additional Details
  additionalDetails: {
    jointType: 'Stitched',
    flapSizeMm: 0,
    slotDepthMm: 0,
    dieNumber: '',
    artworkRef: '',
    colorCount: 0,
    printingType: 'Flexo Printing',
  },
  // 5. Client Requirements
  clientRequirements: {
    targetGsm: 0,
    burstingStrengthBS: 0,
    ectKnm: 0,
    cobbValueGsm: 0,
    moisturePercent: 0,
    coatingType: 'None / Standard Kraft',
  },
  // 6. Sheet Parameters
  sheetParameters: {
    deckleSizeMm: 0,
    cuttingSizeMm: 0,
    upsAcross: 1,
    upsAround: 1,
    totalUps: 1,
    sheetAreaSqm: 0,
    grainDirection: 'Parallel to Length',
  },
  // 7. Sheet Size
  sheetSize: {
    grossDeckleMm: 0,
    netDeckleMm: 0,
    grossCutLengthMm: 0,
    netCutLengthMm: 0,
    runningMetersPer1000: 0,
  },
  // 8. Wastage Calculations
  wastageCalculations: {
    trimWastagePercent: 0,
    flutingFactor: 1.0,
    slotterWastagePercent: 0,
    printingWastagePercent: 0,
    totalWastagePercent: 0,
  },
  // 9. Paper Combination
  paperCombination: [],
  // 10. Box Calculations
  boxCalculations: {
    totalBoardGsm: 0,
    netBoxWeightGrams: 0,
    grossBoxWeightGrams: 0,
    boardCaliperMm: 0,
    calculatedBF: 0,
  },
  // 11. Production Process
  productionProcesses: [],
  // 12. Flute Directions
  fluteDirections: {
    fluteProfile: 'B-Flute Profile',
    corrugationDirection: 'Vertical / Parallel to Depth',
    takeUpRatio: 1.0,
  },
  // 13. Rotary Size
  rotarySize: {
    cylinderCircumferenceMm: 0,
    dieDiameterMm: 0,
    repeatLengthMm: 0,
    impressionsPerRev: 1,
  },
  // 14. RS4 Slotter Size
  rs4Slotter: {
    slotKnifeWidthMm: 0,
    creasingRuleMm: 0,
    bladeGapMm: 0,
    slottingDepthMm: 0,
  },
  // 15. Printing Details
  printingDetails: {
    machineName: '',
    inkShades: [],
    inkConsumptionGsm: 0,
    stereoThicknessMm: 0,
    aniloxLpi: 0,
  },
  // 16. Lamination
  lamination: {
    laminationType: 'None',
    filmMicron: 0,
    adhesiveType: 'Water-based Acrylic',
    adhesiveGsm: 0,
  },
  // 17. Punching Details
  punchingDetails: {
    punchingType: 'None / Rotary Slotter Only',
    dieCode: '',
    strippingMethod: 'Manual Stripping',
    embossingType: 'None',
    creasingMatrix: '',
  },
  // 18. Joint Details
  jointDetails: {
    jointType: 'Wire Stitched',
    wireGauge: '',
    stitchCount: 0,
    stitchPitchMm: 0,
    glueGrade: '',
    glueConsumptionGrams: 0,
  },
  // 19. Bundling Details
  bundlingDetails: {
    packingMode: 'PP Strapped Bundles',
    boxesPerBundle: 0,
    bundlesPerPallet: 0,
    strapMaterial: '',
    cornerProtectors: false,
  },
  // 20. Partition Details
  partitionDetails: {
    hasPartition: false,
    partitionMaterial: '',
    horizontalCells: 0,
    verticalCells: 0,
    partitionWeightGrams: 0,
    partitionCostPerBox: 0,
  },
  // 21. BOM Parameters
  bomParameters: {
    batchSize: 0,
    moq: 0,
    leadTimeDays: 0,
    inspectionLevel: 'Normal Level II (AQL 1.5)',
    safetyStock: 0,
  },
  // 22. BOM Cost Calculations
  bomCostCalculations: {
    paperCostPerBox: 0,
    processCostPerBox: 0,
    consumablesCostPerBox: 0,
    toolingAmortizationPerBox: 0,
    laminationCostPerBox: 0,
    packingCostPerBox: 0,
    totalMfgCostPerBox: 0,
    marginPercent: 0,
    quotedPricePerBox: 0,
  },
};

export function CostingBomForm({
  darkMode,
  currentUser,
  bomId,
  initialProductId,
  initialCustomerId,
  initialLeadId,
  initialQuotationId,
  onBack,
  onSaved,
}: CostingBomFormProps) {
  const [formData, setFormData] = useState<BomSectionsData>(() => {
    const d = JSON.parse(JSON.stringify(initialBomData));
    if (initialProductId) d.basicInfo.productId = initialProductId;
    if (initialCustomerId) d.basicInfo.customerId = initialCustomerId;
    if (initialLeadId) d.basicInfo.salesLeadId = initialLeadId;
    if (initialQuotationId) d.basicInfo.quotationId = initialQuotationId;
    return d;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'basic' | 'sheet' | 'process' | 'finishing'>('all');
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Database master states
  const [masters, setMasters] = useState<{
    customers: any[];
    products: any[];
    rawMaterials: any[];
    categories: any[];
    subCategories: any[];
    machines: any[];
    suppliers: any[];
    leads: any[];
    quotations: any[];
  }>({
    customers: [],
    products: [],
    rawMaterials: [],
    categories: [],
    subCategories: [],
    machines: [],
    suppliers: [],
    leads: [],
    quotations: [],
  });

  // Load masters and BOM from Postgres
  useEffect(() => {
    async function loadMasterData() {
      try {
        setLoadingInitial(true);
        setError(null);

        // 1. Fetch masters from API
        const res = await fetch('/api/costing/masters');
        const json = await res.json();

        if (json.success && json.data) {
          setMasters(json.data);

          // Auto-generate and prefill BOM number for new BOMs
          if (!bomId && json.data.nextBomNumber) {
            setFormData((prev) => {
              if (!prev.basicInfo.bomNumber) {
                return {
                  ...prev,
                  basicInfo: {
                    ...prev.basicInfo,
                    bomNumber: json.data.nextBomNumber,
                  },
                };
              }
              return prev;
            });
          }
        }

        // 2. If editing existing BOM, fetch its details
        if (bomId) {
          const bomRes = await fetch(`/api/costing/bom/${bomId}`);
          const bomJson = await bomRes.json();

          if (bomJson.success && bomJson.data) {
            const b = bomJson.data;

            setFormData((prev) => {
              const updated = { ...prev };

              // Basic Info
              updated.basicInfo.bomNumber = b.bomNumber || '';
              updated.basicInfo.bomName = b.name || '';
              updated.basicInfo.productId = b.productId || '';
              updated.basicInfo.productName = b.product?.name || '';
              updated.basicInfo.customerId = b.customerId || '';
              updated.basicInfo.customerName = b.customerName || b.customer?.name || '';
              updated.basicInfo.salesLeadId = b.leadId || '';
              updated.basicInfo.quotationId = b.quotationId || '';
              updated.basicInfo.requiredQuantity = b.requiredQuantity || 1000;
              updated.basicInfo.version = b.version || 1;
              updated.basicInfo.status = b.status || 'Active';
              updated.basicInfo.notes = b.notes || '';

              // Box spec & sheet
              updated.boxSpec.ply = b.ply || 5;
              updated.boxSpec.fluteType = b.fluteType || 'BC-Flute (5-Ply)';
              updated.sheetParameters.deckleSizeMm = b.deckleSizeMm || 1200;
              updated.sheetParameters.cuttingSizeMm = b.cutSizeMm || 800;

              // Parse sections if stored in notes
              if (b.sections) {
                return {
                  ...updated,
                  ...b.sections,
                  basicInfo: {
                    ...updated.basicInfo,
                    ...b.sections.basicInfo,
                    bomNumber: b.bomNumber,
                    bomName: b.name,
                    productId: b.productId,
                    customerId: b.customerId,
                  },
                };
              }

              // Load items from b.items if paperCombination not in sections
              if (b.items && b.items.length > 0) {
                updated.paperCombination = b.items.map((it: any, idx: number) => ({
                  id: it.id || `layer-${idx}`,
                  layer: it.layer || `Layer ${idx + 1}`,
                  materialId: it.materialId,
                  materialCode: it.materialCode || it.material?.code,
                  materialName: it.materialName || it.material?.name || 'Raw Material',
                  gsm: it.gsm || it.material?.gsm || 140,
                  ratePerKg: it.unitCost || 40,
                  weightGrams: (it.quantityPerUnit || 0) * 1000,
                  costPerBox: it.totalCost || Number((it.quantityPerUnit * it.unitCost).toFixed(2)),
                  unit: it.unit || 'Kg',
                }));
              }

              return updated;
            });
          }
        } else if (initialLeadId) {
          // Pre-populate BOM from Sales Lead
          try {
            const leadRes = await fetch(`/api/sales/leads/${initialLeadId}`);
            const leadJson = await leadRes.json();
            if (leadJson.success && leadJson.data) {
              const ld = leadJson.data;
              setFormData((prev) => {
                const updated = { ...prev };
                updated.basicInfo.salesLeadId = ld.id;
                updated.basicInfo.customerId = ld.customerId || prev.basicInfo.customerId;
                updated.basicInfo.customerName = ld.customerName || prev.basicInfo.customerName;
                updated.basicInfo.requiredQuantity = ld.expectedQuantity ? Number(ld.expectedQuantity) : prev.basicInfo.requiredQuantity;
                updated.basicInfo.bomName = prev.basicInfo.bomName || (ld.customerName && ld.productRequirement ? `BOM for ${ld.customerName} - ${ld.productRequirement}` : prev.basicInfo.bomName);
                updated.basicInfo.notes = ld.productDescription || ld.specifications || '';
                
                // If product matches one in products list
                if (json.data?.products && ld.productRequirement) {
                  const matchedProd = json.data.products.find((p: any) => 
                    p.name.toLowerCase().includes(ld.productRequirement.toLowerCase()) ||
                    ld.productRequirement.toLowerCase().includes(p.name.toLowerCase())
                  );
                  if (matchedProd) {
                    updated.basicInfo.productId = matchedProd.id;
                    updated.basicInfo.productName = matchedProd.name;
                    if (matchedProd.boxType) updated.boxSpec.boxType = matchedProd.boxType;
                  }
                }
                return updated;
              });
            }
          } catch (leadErr) {
            console.warn('Could not auto-populate lead details in BOM form:', leadErr);
          }
        } else if (initialCustomerId) {
          setFormData((prev) => ({
            ...prev,
            basicInfo: {
              ...prev.basicInfo,
              customerId: initialCustomerId,
            },
          }));
        }
      } catch (err: any) {
        console.error('Failed to load master data:', err);
        setError('Failed to connect to database masters. Please verify database connectivity.');
      } finally {
        setLoadingInitial(false);
      }
    }

    loadMasterData();
  }, [bomId, initialLeadId, initialCustomerId]);

  const handleRefreshBomNumber = async () => {
    try {
      const res = await fetch('/api/costing/bom/next-number');
      const json = await res.json();
      if (json.success && json.data?.nextBomNumber) {
        setFormData((prev) => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            bomNumber: json.data.nextBomNumber,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to refresh BOM number:', err);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent, proceedToCostSheet = false) => {
    e.preventDefault();

    if (!formData.basicInfo.bomName.trim()) {
      setError('BOM Title / Name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.basicInfo.productId) {
      setError('Please select a Product from the database.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      // Convert paper combination to standard BOM items format for Prisma
      const itemsPayload = formData.paperCombination.map((p) => ({
        layer: p.layer || 'Material Layer',
        materialId: p.materialId || null,
        materialCode: p.materialCode || null,
        materialName: p.materialName || 'Material',
        gsm: Number(p.gsm) || null,
        quantityPerUnit: Number(((p.weightGrams || 0) / 1000).toFixed(4)), // kg per box
        unit: 'Kg',
        unitCost: Number(p.ratePerKg) || 0,
        totalCost: Number(p.costPerBox) || 0,
      }));

      const payload = {
        bomNumber: formData.basicInfo.bomNumber || undefined,
        name: formData.basicInfo.bomName,
        productId: formData.basicInfo.productId,
        customerId: formData.basicInfo.customerId || null,
        customerName: formData.basicInfo.customerName || null,
        leadId: formData.basicInfo.salesLeadId || null,
        quotationId: formData.basicInfo.quotationId || null,
        requiredQuantity: Number(formData.basicInfo.requiredQuantity) || 1000,
        version: Number(formData.basicInfo.version) || 1,
        fluteType: formData.boxSpec.fluteType,
        ply: Number(formData.boxSpec.ply) || 5,
        deckleSizeMm: Number(formData.sheetParameters.deckleSizeMm) || null,
        cutSizeMm: Number(formData.sheetParameters.cuttingSizeMm) || null,
        totalWeightGrams: Number(formData.boxCalculations.netBoxWeightGrams) || null,
        estimatedCost: Number(formData.bomCostCalculations.totalMfgCostPerBox) || 0,
        status: formData.basicInfo.status || 'Active',
        notes: formData.basicInfo.notes || '',
        createdBy: currentUser?.name || 'System User',
        items: itemsPayload,
        // All 22 structured sections
        sections: formData,
      };

      const url = bomId ? `/api/costing/bom/${bomId}` : '/api/costing/bom';
      const method = bomId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save BOM to database');
      }

      setSuccessMsg(`BOM ${result.data?.bomNumber || ''} saved successfully to PostgreSQL!`);

      // Redirect after brief acknowledgement
      setTimeout(() => {
        onSaved(result.data, proceedToCostSheet);
      }, 600);
    } catch (err: any) {
      console.error('Error saving BOM:', err);
      setError(err.message || 'An error occurred while saving the BOM.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Connecting to PostgreSQL and loading ERP Masters...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 pb-20">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 rounded">
                Costing &bull; Bill of Materials
              </span>
              <span className="text-xs font-medium text-slate-500">
                22 Standard ERP Sections
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {bomId ? `Edit BOM (${formData.basicInfo.bomNumber || 'Draft'})` : 'Create New BOM'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {bomId ? 'Update BOM in DB' : 'Save BOM to DB'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All 22 Sections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'basic'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          1-5: Basic &amp; Specifications
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sheet')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'sheet'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          6-10: Sheet &amp; Paper Combo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('process')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'process'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          11-16: Processes &amp; Tooling
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('finishing')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'finishing'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          17-22: Finishing &amp; Costing
        </button>
      </div>

      {/* Sections 1-5 */}
      {(activeTab === 'all' || activeTab === 'basic') && (
        <BomSectionsBasic
          darkMode={darkMode}
          data={formData}
          onChange={setFormData}
          masters={masters}
          onRefreshBomNumber={handleRefreshBomNumber}
        />
      )}

      {/* Sections 6-10 */}
      {(activeTab === 'all' || activeTab === 'sheet') && (
        <BomSectionsSheet
          darkMode={darkMode}
          data={formData}
          onChange={setFormData}
          rawMaterials={masters.rawMaterials}
          suppliers={masters.suppliers}
        />
      )}

      {/* Sections 11-16 */}
      {(activeTab === 'all' || activeTab === 'process') && (
        <BomSectionsProcess
          darkMode={darkMode}
          data={formData}
          onChange={setFormData}
          machines={masters.machines}
        />
      )}

      {/* Sections 17-22 */}
      {(activeTab === 'all' || activeTab === 'finishing') && (
        <BomSectionsFinishing
          darkMode={darkMode}
          data={formData}
          onChange={setFormData}
        />
      )}

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-lg">
        <div>
          <p className="text-xs text-slate-400">Total Manufacturing Unit Cost</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-400">
              ₹{formData.bomCostCalculations.totalMfgCostPerBox.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">
              | Quoted: ₹{formData.bomCostCalculations.quotedPricePerBox.toFixed(2)} ({formData.bomCostCalculations.marginPercent}% Margin)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
          >
            Back to List
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Complete BOM
          </button>
        </div>
      </div>
    </form>
  );
}
