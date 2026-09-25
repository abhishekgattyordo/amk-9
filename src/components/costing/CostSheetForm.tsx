'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Layers,
  TrendingUp,
  Save,
  Send,
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sliders,
  DollarSign,
  Package,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import {
  CostSheetItem,
  CostSheetLayerItem,
  BoxType,
  RawMaterial,
  Product,
  User,
} from '@/types';
import {
  calculateCostSheet,
  CalculationInput,
  CalculationResult,
  getDefaultLayersForPly,
  STANDARD_FLUTE_FACTORS,
} from '@/lib/costing-calculator';

interface CostSheetFormProps {
  darkMode?: boolean;
  currentUser?: User | null;
  costSheetId?: string; // If provided, edit mode
  initialLeadId?: string; // If creating from a lead
  initialBomId?: string; // If creating from a BOM
  initialBomData?: any;
  onBack: () => void;
  onSaved: (costSheet: CostSheetItem) => void;
}

export function CostSheetForm({
  darkMode,
  currentUser,
  costSheetId,
  initialLeadId,
  initialBomId,
  initialBomData,
  onBack,
  onSaved,
}: CostSheetFormProps) {
  // Master data state
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields state
  const [boxType, setBoxType] = useState<BoxType>('Universal Box');
  const [title, setTitle] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || '');
  const [selectedBomId, setSelectedBomId] = useState(initialBomId || '');
  const [linkedBom, setLinkedBom] = useState<any>(initialBomData || null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [targetQuantity, setTargetQuantity] = useState<number>(1000);
  const [unit, setUnit] = useState('Pcs');

  // Dimension inputs
  const [dimensionUnit, setDimensionUnit] = useState<'mm' | 'inch'>('mm');
  const [length, setLength] = useState<number>(400);
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(250);
  const [jointFlapMm, setJointFlapMm] = useState<number>(35);
  const [creaseAllowanceMm, setCreaseAllowanceMm] = useState<number>(0);
  const [customDeckleMm, setCustomDeckleMm] = useState<number>(0);
  const [customCuttingLengthMm, setCustomCuttingLengthMm] = useState<number>(0);

  // Ply and Layers
  const [ply, setPly] = useState<3 | 5 | 7>(3);
  const [fluteType, setFluteType] = useState<string>('B');
  const [layers, setLayers] = useState<any[]>([]);

  // Operational costs
  const [starchCostPerBox, setStarchCostPerBox] = useState<number>(0.85);
  const [printingCostPerBox, setPrintingCostPerBox] = useState<number>(0.65);
  const [stitchingGlueCostPerBox, setStitchingGlueCostPerBox] = useState<number>(0.45);
  const [dieCostTotal, setDieCostTotal] = useState<number>(0);
  const [plateStereoCostTotal, setPlateStereoCostTotal] = useState<number>(0);
  const [wastagePercent, setWastagePercent] = useState<number>(3);
  const [conversionLaborCostPerBox, setConversionLaborCostPerBox] = useState<number>(1.25);
  const [overheadCostPerBox, setOverheadCostPerBox] = useState<number>(0.8);
  const [freightCostPerBox, setFreightCostPerBox] = useState<number>(0.5);
  const [otherCostPerBox, setOtherCostPerBox] = useState<number>(0);

  // Commercials
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(15);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [notes, setNotes] = useState('');
  const [specifications, setSpecifications] = useState('');

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [custRes, leadRes, prodRes, rmRes, bomRes] = await Promise.all([
          fetch('/api/customers').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/sales-leads').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/products').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/raw-materials').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/costing/bom').then((r) => r.json()).catch(() => ({ data: [] })),
        ]);

        const extractArray = (res: any) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.data?.customers)) return res.data.customers;
          if (Array.isArray(res.data?.leads)) return res.data.leads;
          if (Array.isArray(res.data?.products)) return res.data.products;
          if (Array.isArray(res.data?.rawMaterials)) return res.data.rawMaterials;
          if (Array.isArray(res.data?.boms)) return res.data.boms;
          return [];
        };

        const loadedCustomers = extractArray(custRes);
        const loadedLeads = extractArray(leadRes);
        const loadedProducts = extractArray(prodRes);
        const loadedRawMaterials = extractArray(rmRes);
        const loadedBoms = extractArray(bomRes);

        setCustomers(loadedCustomers);
        setLeads(loadedLeads);
        setProducts(loadedProducts);
        setRawMaterials(loadedRawMaterials);
        setBoms(loadedBoms);

        if (costSheetId) {
          // Fetch existing cost sheet for editing
          const csRes = await fetch(`/api/costing/${costSheetId}`);
          const csData = await csRes.json();
          if (csData.success && csData.data) {
            const cs = csData.data;
            setBoxType(cs.boxType || 'Universal Box');
            setTitle(cs.title || '');
            setSelectedLeadId(cs.leadId || '');
            setSelectedBomId(cs.bomId || '');
            setLinkedBom(cs.bom || null);
            setSelectedCustomerId(cs.customerId || '');
            setCustomerName(cs.customerName || '');
            setSelectedProductId(cs.productId || '');
            setProductName(cs.productName || '');
            setTargetQuantity(cs.targetQuantity || 1000);
            setUnit(cs.unit || 'Pcs');
            setDimensionUnit(cs.dimensionUnit || 'mm');
            setLength(cs.length || 400);
            setWidth(cs.width || 300);
            setHeight(cs.height || 250);
            setJointFlapMm(cs.jointFlapMm || 35);
            setCreaseAllowanceMm(cs.creaseAllowanceMm || 0);
            setCustomDeckleMm(cs.deckleSizeMm || 0);
            setCustomCuttingLengthMm(cs.cuttingLengthMm || 0);
            setPly(cs.ply || 3);
            setFluteType(cs.fluteType || 'B');
            setStarchCostPerBox(cs.starchCostPerBox || 0.85);
            setPrintingCostPerBox(cs.printingCostPerBox || 0.65);
            setStitchingGlueCostPerBox(cs.stitchingGlueCostPerBox || 0.45);
            setDieCostTotal(cs.dieCostTotal || 0);
            setPlateStereoCostTotal(cs.plateStereoCostTotal || 0);
            setWastagePercent(cs.wastagePercent !== undefined ? cs.wastagePercent : 3);
            setConversionLaborCostPerBox(cs.conversionLaborCostPerBox || 1.25);
            setOverheadCostPerBox(cs.overheadCostPerBox || 0.8);
            setFreightCostPerBox(cs.freightCostPerBox || 0.5);
            setOtherCostPerBox(cs.otherCostPerBox || 0);
            setProfitMarginPercent(cs.profitMarginPercent !== undefined ? cs.profitMarginPercent : 15);
            setTaxRate(cs.taxRate !== undefined ? cs.taxRate : 18);
            setNotes(cs.notes || '');
            setSpecifications(cs.specifications || '');

            if (cs.layers && cs.layers.length > 0) {
              setLayers(cs.layers);
            } else {
              setLayers(getDefaultLayersForPly(cs.ply || 3, cs.fluteType || 'B'));
            }
          }
        } else if (initialBomId || initialBomData) {
          // Initialize from BOM
          const bomToApply = initialBomData || loadedBoms.find((b: any) => b.id === initialBomId);
          if (bomToApply) {
            applyBomToForm(bomToApply, loadedProducts, loadedCustomers);
          } else if (initialBomId) {
            // Fetch directly
            fetch(`/api/costing/bom/${initialBomId}`)
              .then((r) => r.json())
              .then((bData) => {
                if (bData.success && bData.data) {
                  applyBomToForm(bData.data, loadedProducts, loadedCustomers);
                }
              })
              .catch(() => {});
          }
        } else {
          // New cost sheet defaults
          setLayers(getDefaultLayersForPly(3, 'B'));
        }
      } catch (err: any) {
        console.error('Error loading initial costing form data:', err);
        setError('Failed to load initial data');
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, [costSheetId, initialBomId]);

  // Helper to apply BOM data to costing form
  const applyBomToForm = (bom: any, prods: Product[], custs: any[]) => {
    setSelectedBomId(bom.id);
    setLinkedBom(bom);
    if (!title) {
      setTitle(`Cost Sheet for ${bom.bomNumber || bom.name || 'BOM'}`);
    }
    const matchedProd = prods.find((p) => p.id === bom.productId) as any;
    if (bom.productId) {
      setSelectedProductId(bom.productId);
      if (matchedProd) {
        setProductName(matchedProd.name);
      }
    }
    
    // Extract dimensions from product or BOM
    const bLength = bom.length || bom.dimensions?.lengthMm || matchedProd?.length;
    if (bLength) setLength(Number(bLength));
    const bWidth = bom.width || bom.dimensions?.widthMm || matchedProd?.width;
    if (bWidth) setWidth(Number(bWidth));
    const bHeight = bom.height || bom.dimensions?.heightMm || matchedProd?.height;
    if (bHeight) setHeight(Number(bHeight));

    const bBoxType = bom.boxType || bom.boxSpec?.boxType || matchedProd?.boxType;
    if (bBoxType) {
      if (bBoxType.includes('Universal') || bBoxType.includes('RSC')) setBoxType('Universal Box');
      else if (bBoxType.includes('Die')) setBoxType('Die-Cut');
      else if (bBoxType.includes('Sheet')) setBoxType('Sheet Board');
      else if (bBoxType.includes('Partition')) setBoxType('Partition');
      else setBoxType('Customized Box');
    }

    if (bom.customerId) {
      setSelectedCustomerId(bom.customerId);
      const matchedCust = custs.find((c) => c.id === bom.customerId);
      if (matchedCust) setCustomerName(matchedCust.name);
      else if (bom.customerName) setCustomerName(bom.customerName);
    } else if (bom.customerName) {
      setCustomerName(bom.customerName);
    }
    if (bom.leadId) {
      setSelectedLeadId(bom.leadId);
    }
    if (bom.requiredQuantity) {
      setTargetQuantity(bom.requiredQuantity);
    }
    if (bom.ply) {
      const plyVal = Number(bom.ply) as 3 | 5 | 7;
      if (plyVal === 3 || plyVal === 5 || plyVal === 7) {
        setPly(plyVal);
      }
    }
    if (bom.fluteType) {
      const cleanFlute = bom.fluteType.includes('BC')
        ? 'BC'
        : bom.fluteType.includes('B')
        ? 'B'
        : bom.fluteType.includes('C')
        ? 'C'
        : bom.fluteType.includes('E')
        ? 'E'
        : 'B';
      setFluteType(cleanFlute);
    }
    if (bom.deckleSizeMm && Number(bom.deckleSizeMm) >= 50) {
      setCustomDeckleMm(Number(bom.deckleSizeMm));
    }
    if (bom.cutSizeMm && Number(bom.cutSizeMm) >= 50) {
      setCustomCuttingLengthMm(Number(bom.cutSizeMm));
    }
    if (bom.notes) {
      setNotes((prev) => (prev ? `${prev}\nBOM Notes: ${bom.notes}` : `BOM Notes: ${bom.notes}`));
    }
    // Convert BOM items or paperCombination to layers if available
    const bomLayers = bom.paperCombination || bom.items || [];
    if (bomLayers && bomLayers.length > 0) {
      const paperItems = bomLayers.filter((it: any) =>
        !it.layer ||
        it.layer?.toLowerCase().includes('liner') ||
        it.layer?.toLowerCase().includes('flut') ||
        it.layer?.toLowerCase().includes('medium') ||
        it.layer?.toLowerCase().includes('partition') ||
        it.layer?.toLowerCase().includes('face') ||
        it.layer?.toLowerCase().includes('back') ||
        it.materialName ||
        it.gsm
      );
      if (paperItems.length > 0) {
        const mappedLayers = paperItems.map((it: any, idx: number) => {
          const isFlute = it.layer?.toLowerCase().includes('flut') || it.layerType === 'Fluting' || (idx % 2 === 1);
          return {
            layerIndex: idx,
            layerName: it.layer || it.layerName || `Layer ${idx + 1}`,
            layerType: isFlute ? 'Fluting' : 'Liner',
            materialId: it.materialId,
            paperGrade: it.materialName || it.paperGrade || 'Standard Kraft Paper',
            gsm: Number(it.gsm) || 140,
            bf: Number(it.bf) || 18,
            fluteType: isFlute ? 'B' : undefined,
            fluteFactor: isFlute ? 1.35 : 1.0,
            ratePerKg: Number(it.unitCost || it.ratePerKg) || 38,
          };
        });
        setLayers(mappedLayers);
      } else {
        setLayers(getDefaultLayersForPly((bom.ply || 3) as any, 'B'));
      }
    } else {
      setLayers(getDefaultLayersForPly((bom.ply || 3) as any, 'B'));
    }
  };

  // Handle BOM selection change
  const handleBomChange = (bomId: string) => {
    setSelectedBomId(bomId);
    if (!bomId) {
      setLinkedBom(null);
      return;
    }
    const foundBom = boms.find((b) => b.id === bomId);
    if (foundBom) {
      applyBomToForm(foundBom, products, customers);
    }
  };

  // When Ply changes, reset layers if user selects different ply count
  const handlePlyChange = (newPly: 3 | 5 | 7) => {
    setPly(newPly);
    setLayers(getDefaultLayersForPly(newPly, fluteType));
  };

  // When flute type changes, update flute layers
  const handleFluteChange = (newFlute: string) => {
    setFluteType(newFlute);
    const factor = STANDARD_FLUTE_FACTORS[newFlute] || 1.35;
    setLayers((prev) =>
      prev.map((l) =>
        l.layerType === 'Fluting'
          ? { ...l, fluteType: newFlute, fluteFactor: factor }
          : l
      )
    );
  };

  // Live calculated results
  const calcResult: CalculationResult = useMemo(() => {
    const input: CalculationInput = {
      boxType,
      dimensionUnit,
      length: Number(length) || 0,
      width: Number(width) || 0,
      height: Number(height) || 0,
      targetQuantity: Number(targetQuantity) || 1,
      jointFlapMm: Number(jointFlapMm) || 35,
      creaseAllowanceMm: Number(creaseAllowanceMm) || 0,
      deckleSizeMm: boxType !== 'Universal Box' && customDeckleMm > 0 ? customDeckleMm : undefined,
      cuttingLengthMm: boxType !== 'Universal Box' && customCuttingLengthMm > 0 ? customCuttingLengthMm : undefined,
      ply,
      fluteType,
      layers: layers.map((l, idx) => ({
        layerIndex: idx,
        layerName: l.layerName || `Layer ${idx + 1}`,
        layerType: l.layerType || (idx % 2 === 1 ? 'Fluting' : 'Liner'),
        materialId: l.materialId,
        paperGrade: l.paperGrade || 'Standard Paper',
        gsm: Number(l.gsm) || 120,
        bf: Number(l.bf) || 18,
        fluteType: l.fluteType,
        fluteFactor: Number(l.fluteFactor) || (l.layerType === 'Fluting' ? 1.35 : 1.0),
        ratePerKg: Number(l.ratePerKg) || 0,
        remarks: l.remarks,
      })),
      starchCostPerBox: Number(starchCostPerBox) || 0,
      printingCostPerBox: Number(printingCostPerBox) || 0,
      stitchingGlueCostPerBox: Number(stitchingGlueCostPerBox) || 0,
      dieCostTotal: Number(dieCostTotal) || 0,
      plateStereoCostTotal: Number(plateStereoCostTotal) || 0,
      wastagePercent: Number(wastagePercent) || 0,
      conversionLaborCostPerBox: Number(conversionLaborCostPerBox) || 0,
      overheadCostPerBox: Number(overheadCostPerBox) || 0,
      freightCostPerBox: Number(freightCostPerBox) || 0,
      otherCostPerBox: Number(otherCostPerBox) || 0,
      profitMarginPercent: Number(profitMarginPercent) || 0,
      taxRate: Number(taxRate) || 0,
    };

    return calculateCostSheet(input);
  }, [
    boxType,
    dimensionUnit,
    length,
    width,
    height,
    targetQuantity,
    jointFlapMm,
    creaseAllowanceMm,
    customDeckleMm,
    customCuttingLengthMm,
    ply,
    fluteType,
    layers,
    starchCostPerBox,
    printingCostPerBox,
    stitchingGlueCostPerBox,
    dieCostTotal,
    plateStereoCostTotal,
    wastagePercent,
    conversionLaborCostPerBox,
    overheadCostPerBox,
    freightCostPerBox,
    otherCostPerBox,
    profitMarginPercent,
    taxRate,
  ]);

  // Handle Layer Row Changes
  const updateLayer = (idx: number, field: string, val: any) => {
    setLayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };

      // If user selected a RawMaterial, auto-populate Paper Grade, GSM, BF, rate
      if (field === 'materialId') {
        const mat = rawMaterials.find((rm) => rm.id === val);
        if (mat) {
          next[idx].paperGrade = mat.name;
          next[idx].gsm = mat.gsm || 120;
          next[idx].bf = parseInt(mat.grade.replace(/[^0-9]/g, ''), 10) || 18;
          next[idx].ratePerKg = mat.purchasePrice || 35;
        }
      }
      return next;
    });
  };

  const addLayer = () => {
    setLayers((prev) => [
      ...prev,
      {
        layerIndex: prev.length,
        layerName: `Layer ${prev.length + 1}`,
        layerType: prev.length % 2 === 1 ? 'Fluting' : 'Liner',
        paperGrade: 'Testliner Paper',
        gsm: 140,
        bf: 18,
        fluteFactor: 1.0,
        ratePerKg: 35,
      },
    ]);
  };

  const removeLayer = (idx: number) => {
    if (layers.length <= 2) {
      alert('A corrugated box must have at least 2 layers.');
      return;
    }
    setLayers((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle Customer Selection
  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.name);
    }
  };

  // Handle Lead Selection
  const handleLeadChange = (lId: string) => {
    setSelectedLeadId(lId);
    const found = leads.find((l) => l.id === lId);
    if (found) {
      if (found.customerId) {
        setSelectedCustomerId(found.customerId);
      }
      if (found.companyName || found.customerName) {
        setCustomerName(found.companyName || found.customerName);
      }
      if (found.estimatedQuantity) {
        setTargetQuantity(found.estimatedQuantity);
      }
    }
  };

  // Handle Product Selection
  const handleProductChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId) as any;
    if (prod) {
      setProductName(prod.name);
      if (prod.length) setLength(Number(prod.length));
      if (prod.width) setWidth(Number(prod.width));
      if (prod.height) setHeight(Number(prod.height));
      if (prod.ply) setPly(Number(prod.ply) as any);
      if (prod.boxType) setBoxType(prod.boxType as any);
    }
  };

  // Submit Handler
  const handleSubmit = async (submitStatus: 'Draft' | 'Pending MD Approval') => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        title:
          title ||
          `${customerName || 'Client'} - ${length}x${width}x${height}${dimensionUnit} ${boxType}`,
        boxType,
        calculationType: boxType,
        leadId: selectedLeadId || undefined,
        bomId: selectedBomId || undefined,
        customerId: selectedCustomerId || undefined,
        customerName: customerName || undefined,
        productId: selectedProductId || undefined,
        productName: productName || undefined,
        targetQuantity: Number(targetQuantity),
        unit,
        dimensionUnit,
        length: Number(length),
        width: Number(width),
        height: Number(height),
        jointFlapMm: Number(jointFlapMm),
        creaseAllowanceMm: Number(creaseAllowanceMm),
        deckleSizeMm: calcResult.deckleSizeMm,
        cuttingLengthMm: calcResult.cuttingLengthMm,
        ply,
        fluteType,
        layers: calcResult.calculatedLayers,
        starchCostPerBox: Number(starchCostPerBox),
        printingCostPerBox: Number(printingCostPerBox),
        stitchingGlueCostPerBox: Number(stitchingGlueCostPerBox),
        dieCostTotal: Number(dieCostTotal),
        plateStereoCostTotal: Number(plateStereoCostTotal),
        wastagePercent: Number(wastagePercent),
        conversionLaborCostPerBox: Number(conversionLaborCostPerBox),
        overheadCostPerBox: Number(overheadCostPerBox),
        freightCostPerBox: Number(freightCostPerBox),
        otherCostPerBox: Number(otherCostPerBox),
        profitMarginPercent: Number(profitMarginPercent),
        taxRate: Number(taxRate),
        status: submitStatus,
        preparedBy: currentUser?.name || 'Costing Officer',
        notes,
        specifications,
        revisionReason: costSheetId ? 'Updated costing variables & engineering specs' : undefined,
      };

      const endpoint = costSheetId ? `/api/costing/${costSheetId}` : '/api/costing';
      const method = costSheetId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSaved(data.data);
      } else {
        setError(data.error || 'Failed to save cost sheet');
      }
    } catch (err: any) {
      console.error('Error saving cost sheet:', err);
      setError(err.message || 'Error saving cost sheet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Initializing Cost Sheet Builder & Inventory Pricing...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Header */}
      <div
        className={`p-5 rounded-2xl border ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                darkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Back to Cost Sheets"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1
                className={`text-xl font-bold tracking-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {costSheetId ? 'Edit Cost Sheet' : 'New Cost Sheet'}
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Configure corrugated box parameters, paper grades, conversion
                costs, and commercial margins.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => handleSubmit('Draft')}
              disabled={submitting}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                darkMode
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Save className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
              <span>Save as Draft</span>
            </button>

            <button
              onClick={() => handleSubmit('Pending MD Approval')}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for MD Approval</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Two Column Layout: Left Configuration / Right Live Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Sections (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer & Lead Linking */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-slate-900/80 border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-sm font-bold uppercase tracking-wider ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-700'
                } flex items-center space-x-2`}
              >
                <Package className="w-4 h-4" />
                <span>1. Customer & Product Reference</span>
              </h2>

              {/* BOM Linked Indicator */}
              {selectedBomId && (
                <div className={`flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-xl ${
                  darkMode
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                }`}>
                  <Layers className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`} />
                  <span>Linked BOM: {linkedBom?.bomNumber || selectedBomId}</span>
                  <button
                    type="button"
                    onClick={() => handleBomChange('')}
                    className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer font-bold"
                    title="Unlink BOM"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Bill of Material (BOM) Selector */}
              <div>
                <label className={`block text-xs font-semibold mb-1 flex items-center space-x-1 ${
                  darkMode ? 'text-indigo-400' : 'text-indigo-800'
                }`}>
                  <Layers className="w-3 h-3" />
                  <span>Bill of Material (BOM)</span>
                </label>
                <select
                  value={selectedBomId}
                  onChange={(e) => handleBomChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    selectedBomId
                      ? darkMode
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                        : 'border-indigo-300 bg-indigo-50 text-indigo-900 font-semibold'
                      : darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- Direct / Select BOM --</option>
                  {boms.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.bomNumber} - {b.name} ({b.ply || 5}-Ply)
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Link */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Sales Lead (Optional)
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleLeadChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- Select Sales Lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.leadNumber} - {l.companyName || l.customerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Link */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- Direct Customer / New --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code || 'CUST'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Customer Name if not selected */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Reliance Retail Ltd"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200 placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium'
                  }`}
                />
              </div>

              {/* Product Catalog Link */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Product Catalog (Optional)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- Select Finished Good Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code || (p as any).sku || p.id} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Quantity */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Target Batch Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900 font-medium'
                  }`}
                />
              </div>

              {/* Box Type */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Box Type
                </label>
                <select
                  value={boxType}
                  onChange={(e) => setBoxType(e.target.value as BoxType)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Universal Box">Universal Box (RSC)</option>
                  <option value="Customized Box">Customized Box</option>
                  <option value="Die-Cut">Die-Cut Box</option>
                  <option value="Sheet Board">Sheet Board</option>
                  <option value="Partition">Partition / Fitment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Box Dimensions & Deckle Geometry */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-slate-900/80 border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-sm font-bold uppercase tracking-wider ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-700'
                } flex items-center space-x-2`}
              >
                <Calculator className="w-4 h-4" />
                <span>2. Box Dimensions & Sheet Geometry</span>
              </h2>

              {/* Unit Toggle */}
              <div className={`flex items-center space-x-1 p-1 rounded-xl text-[11px] font-semibold ${
                darkMode ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setDimensionUnit('mm')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    dimensionUnit === 'mm'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Millimeters (mm)
                </button>
                <button
                  type="button"
                  onClick={() => setDimensionUnit('inch')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    dimensionUnit === 'inch'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Inches (in)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Length ({dimensionUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Width ({dimensionUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Height ({dimensionUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Joint Flap (mm)
                </label>
                <input
                  type="number"
                  step="any"
                  value={jointFlapMm}
                  onChange={(e) => setJointFlapMm(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Geometry Formula Indicator */}
            <div
              className={`mt-4 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                darkMode
                  ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                  : 'bg-emerald-50 border-emerald-200 text-slate-800'
              }`}
            >
              <div>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Calculated Deckle Size:</span>{' '}
                <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>
                  {calcResult.deckleSizeMm} mm
                </strong>{' '}
                <span className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                  ((W+H)*2 + Flap)
                </span>
              </div>
              <div>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Cutting Length:</span>{' '}
                <strong className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>
                  {calcResult.cuttingLengthMm} mm
                </strong>{' '}
                <span className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>(L + W)</span>
              </div>
              <div>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Sheet Area:</span>{' '}
                <strong className={darkMode ? 'text-teal-400' : 'text-teal-700 font-bold'}>
                  {calcResult.sheetAreaSqM} m²
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: Board Ply, Flutes & Paper Layers Architecture */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-slate-900/80 border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2
                className={`text-sm font-bold uppercase tracking-wider ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-700'
                } flex items-center space-x-2`}
              >
                <Layers className="w-4 h-4" />
                <span>3. Board Architecture & Paper Layers</span>
              </h2>

              <div className="flex items-center space-x-2.5">
                {/* Ply Selector */}
                <div className={`flex items-center space-x-1 p-1 rounded-xl text-[11px] font-semibold ${
                  darkMode ? 'bg-slate-800' : 'bg-slate-100 border border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => handlePlyChange(3)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      ply === 3
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    3-Ply
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlyChange(5)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      ply === 5
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    5-Ply
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlyChange(7)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      ply === 7
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    7-Ply
                  </button>
                </div>

                {/* Flute Selector */}
                <select
                  value={fluteType}
                  onChange={(e) => handleFluteChange(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="B">B-Flute (Take-up: 1.35)</option>
                  <option value="C">C-Flute (Take-up: 1.43)</option>
                  <option value="A">A-Flute (Take-up: 1.54)</option>
                  <option value="E">E-Flute (Take-up: 1.25)</option>
                  <option value="F">F-Flute (Take-up: 1.15)</option>
                  <option value="BC">BC-Flute (Multi-wall: 1.39)</option>
                </select>

                <button
                  type="button"
                  onClick={addLayer}
                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/20"
                  title="Add Custom Layer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Layers Table */}
            <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      darkMode
                        ? 'bg-slate-800/60 border-slate-800 text-slate-300'
                        : 'bg-slate-100 border-slate-200 text-slate-800 font-bold'
                    }`}
                  >
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap min-w-[120px]">Layer</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap min-w-[90px]">Type</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap min-w-[180px]">Paper Grade / Inventory</th>
                    <th className="px-3 py-2.5 font-bold text-right whitespace-nowrap min-w-[70px]">GSM</th>
                    <th className="px-3 py-2.5 font-bold text-right whitespace-nowrap min-w-[65px]">BF</th>
                    <th className="px-3 py-2.5 font-bold text-right whitespace-nowrap min-w-[65px]">Factor</th>
                    <th className="px-3 py-2.5 font-bold text-right whitespace-nowrap min-w-[90px]">Weight (g)</th>
                    <th className="px-3 py-2.5 font-bold text-right whitespace-nowrap min-w-[85px]">Rate (₹/kg)</th>
                    <th className="px-3 py-2.5 font-bold text-right whitespace-nowrap min-w-[85px]">Cost/Box</th>
                    <th className="px-3 py-2.5 font-bold text-center whitespace-nowrap min-w-[50px]">Del</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {layers.map((l, idx) => {
                    const calcLayer = (calcResult.calculatedLayers?.[idx] || {}) as any;
                    return (
                      <tr key={idx} className={darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}>
                        {/* Layer Name */}
                        <td className="px-3 py-2 font-semibold">
                          <input
                            type="text"
                            value={l.layerName || `Layer ${idx + 1}`}
                            onChange={(e) =>
                              updateLayer(idx, 'layerName', e.target.value)
                            }
                            className={`w-full px-2 py-1 rounded-lg text-xs font-semibold border outline-none ${
                              darkMode
                                ? 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-emerald-500'
                                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                            }`}
                          />
                        </td>

                        {/* Layer Type */}
                        <td className="px-3 py-2">
                          <select
                            value={l.layerType || 'Liner'}
                            onChange={(e) =>
                              updateLayer(idx, 'layerType', e.target.value)
                            }
                            className={`w-full px-2 py-1 rounded-lg text-[11px] font-bold border outline-none ${
                              l.layerType === 'Fluting'
                                ? darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-800 border-amber-300'
                                : darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            <option value="Liner">Liner</option>
                            <option value="Fluting">Fluting</option>
                          </select>
                        </td>

                        {/* Inventory / Grade Selector */}
                        <td className="px-3 py-2">
                          <select
                            value={l.materialId || ''}
                            onChange={(e) =>
                              updateLayer(idx, 'materialId', e.target.value)
                            }
                            className={`w-full px-2 py-1 rounded-lg text-xs font-medium border outline-none ${
                              darkMode
                                ? 'bg-slate-800 border-slate-700 text-slate-200'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="">
                              {l.paperGrade || 'Custom Grade'}
                            </option>
                            {rawMaterials.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.name} ({rm.gsm} GSM, {rm.grade}, ₹{rm.purchasePrice}/kg)
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* GSM */}
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            value={l.gsm || 0}
                            onChange={(e) =>
                              updateLayer(idx, 'gsm', Number(e.target.value))
                            }
                            className={`w-16 text-right px-2 py-1 rounded-lg font-bold outline-none border ${
                              darkMode
                                ? 'bg-slate-800/80 text-white border-slate-700 focus:border-emerald-500'
                                : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-600'
                            }`}
                          />
                        </td>

                        {/* BF */}
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            value={l.bf || 0}
                            onChange={(e) =>
                              updateLayer(idx, 'bf', Number(e.target.value))
                            }
                            className={`w-14 text-right px-2 py-1 rounded-lg font-bold outline-none border ${
                              darkMode
                                ? 'bg-slate-800/80 text-white border-slate-700 focus:border-emerald-500'
                                : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-600'
                            }`}
                          />
                        </td>

                        {/* Flute Factor */}
                        <td className={`px-3 py-2 text-right font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {l.layerType === 'Fluting'
                            ? (calcLayer.fluteFactor || 1.35).toFixed(2)
                            : '1.00'}
                        </td>

                        {/* Computed Weight */}
                        <td className={`px-3 py-2 text-right font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {(calcLayer.weightGrams || 0).toFixed(1)}g
                        </td>

                        {/* Rate per kg */}
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="any"
                            value={l.ratePerKg || 0}
                            onChange={(e) =>
                              updateLayer(idx, 'ratePerKg', Number(e.target.value))
                            }
                            className={`w-16 text-right px-2 py-1 rounded-lg font-bold outline-none border ${
                              darkMode
                                ? 'bg-slate-800/80 text-white border-slate-700 focus:border-emerald-500'
                                : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-600'
                            }`}
                          />
                        </td>

                        {/* Cost per Box */}
                        <td className={`px-3 py-2 text-right font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          ₹{(calcLayer.costPerBox || 0).toFixed(2)}
                        </td>

                        {/* Delete */}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLayer(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete layer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Paper Cost Banner */}
            <div
              className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                darkMode
                  ? 'bg-slate-800/40 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <span className={darkMode ? 'text-slate-300' : 'text-slate-800 font-bold'}>Total Raw Paper Cost per Box:</span>
              <span className={`text-sm font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                ₹{calcResult.paperCostPerBox.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Section 4: Operational, Conversion & Auxiliary Costs */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-slate-900/80 border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h2
              className={`text-sm font-bold uppercase tracking-wider mb-4 ${
                darkMode ? 'text-emerald-400' : 'text-emerald-700'
              } flex items-center space-x-2`}
            >
              <DollarSign className="w-4 h-4" />
              <span>4. Conversion & Auxiliary Costs</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Paper Wastage % */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Wastage Allowance (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={wastagePercent}
                  onChange={(e) => setWastagePercent(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Starch / Gum Cost */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Starch / Gum (₹/box)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={starchCostPerBox}
                  onChange={(e) => setStarchCostPerBox(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Printing Cost */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Printing Cost (₹/box)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={printingCostPerBox}
                  onChange={(e) => setPrintingCostPerBox(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Stitching / Glue */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Stitching / Glue (₹/box)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={stitchingGlueCostPerBox}
                  onChange={(e) =>
                    setStitchingGlueCostPerBox(Number(e.target.value))
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Conversion / Labor */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Labor / Conversion (₹/box)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={conversionLaborCostPerBox}
                  onChange={(e) =>
                    setConversionLaborCostPerBox(Number(e.target.value))
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Overheads */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Factory Overheads (₹/box)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={overheadCostPerBox}
                  onChange={(e) => setOverheadCostPerBox(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Freight / Logistics */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Freight / Logistics (₹/box)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={freightCostPerBox}
                  onChange={(e) => setFreightCostPerBox(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Die Cost Total */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Die Development Total (₹)
                </label>
                <input
                  type="number"
                  value={dieCostTotal}
                  onChange={(e) => setDieCostTotal(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Stereo / Plate Cost Total */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Stereo / Plate Total (₹)
                </label>
                <input
                  type="number"
                  value={plateStereoCostTotal}
                  onChange={(e) =>
                    setPlateStereoCostTotal(Number(e.target.value))
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Quality & Commercial Simulator (4 Cols Sticky) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Engineering Metrics Card */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-slate-950/40'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h2
              className={`text-sm font-bold uppercase tracking-wider mb-4 ${
                darkMode ? 'text-emerald-400' : 'text-emerald-700'
              } flex items-center space-x-2`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Engineering Specifications</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Total Board GSM:</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {calcResult.totalBoardGsm} GSM
                </span>
              </div>

              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Bursting Strength (BS):</span>
                <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {calcResult.burstingStrength} kg/cm²
                </span>
              </div>

              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Bursting Factor (BF):</span>
                <span className={`font-bold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                  {calcResult.burstingFactor} BF
                </span>
              </div>

              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Est. Box Compression (BCT):</span>
                <span className={`font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                  {calcResult.boxCompressionTest} kgf
                </span>
              </div>

              <div className={`flex justify-between py-1.5 border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Single Box Weight:</span>
                <span className={`font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  {calcResult.singleBoxWeightGrams} g ({calcResult.singleBoxWeightKg} kg)
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Commercial Simulation Card */}
          <div
            className={`p-5 rounded-2xl border ${
              darkMode
                ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 shadow-xl shadow-slate-950/40'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h2
              className={`text-sm font-bold uppercase tracking-wider mb-4 ${
                darkMode ? 'text-emerald-400' : 'text-emerald-700'
              } flex items-center space-x-2`}
            >
              <Sliders className="w-4 h-4" />
              <span>Commercial Pricing Simulator</span>
            </h2>

            {/* Manufacturing Cost Breakdown */}
            <div className="space-y-2 text-xs mb-4">
              <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                <span>Raw Paper Cost:</span>
                <span className={darkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-bold'}>
                  ₹{calcResult.paperCostPerBox.toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                <span>Wastage ({calcResult.wastagePercent}%):</span>
                <span className={darkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-bold'}>
                  ₹{calcResult.wastageCostPerBox.toFixed(2)}
                </span>
              </div>
              <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                <span>Conversion & Overheads:</span>
                <span className={darkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-bold'}>
                  ₹
                  {(
                    calcResult.totalManufacturingCostPerBox -
                    calcResult.paperCostPerBox -
                    calcResult.wastageCostPerBox
                  ).toFixed(2)}
                </span>
              </div>

              <div className={`flex justify-between pt-2 border-t text-xs font-bold ${
                darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
              }`}>
                <span className={darkMode ? 'text-slate-300' : 'text-slate-800 font-bold'}>Total Mfg Cost / Box:</span>
                <span className={darkMode ? 'text-white' : 'text-slate-900 font-extrabold'}>
                  ₹{calcResult.totalManufacturingCostPerBox.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Margin Slider */}
            <div className={`p-3.5 rounded-xl border space-y-2 mb-4 ${
              darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className={darkMode ? 'text-slate-300' : 'text-slate-800 font-bold'}>Profit Margin:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    profitMarginPercent >= 15
                      ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : profitMarginPercent >= 10
                      ? darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      : darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {profitMarginPercent}% (₹
                  {calcResult.profitAmountPerBox.toFixed(2)} / box)
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value={profitMarginPercent}
                onChange={(e) => setProfitMarginPercent(Number(e.target.value))}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-600 ${
                  darkMode ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              />
              <div className={`flex justify-between text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                <span>0% Min</span>
                <span>15% Target</span>
                <span>40% High</span>
              </div>
            </div>

            {/* Final Selling Price Display */}
            <div className={`p-4 rounded-xl border text-center space-y-1 mb-4 ${
              darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                darkMode ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                Final Quoted Selling Price
              </span>
              <div className={`text-2xl sm:text-3xl font-extrabold ${
                darkMode ? 'text-emerald-400' : 'text-emerald-700'
              }`}>
                ₹{calcResult.sellingPricePerBox.toFixed(2)}
                <span className={`text-xs font-normal ml-1 ${
                  darkMode ? 'text-emerald-400/80' : 'text-emerald-700'
                }`}>
                  / {unit}
                </span>
              </div>
            </div>

            {/* Order Totals */}
            <div className="space-y-2 text-xs">
              <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                <span>Order Volume ({targetQuantity.toLocaleString()} pcs):</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  ₹
                  {calcResult.totalOrderValue.toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className={`flex justify-between ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                <span>GST ({calcResult.taxRate}%):</span>
                <span className={darkMode ? 'text-slate-200 font-semibold' : 'text-slate-900 font-semibold'}>
                  ₹
                  {calcResult.taxAmount.toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className={`flex justify-between pt-2 border-t text-sm font-bold ${
                darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
              }`}>
                <span>Grand Total (incl. Tax):</span>
                <span className={darkMode ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>
                  ₹
                  {calcResult.grandTotalValue.toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit('Pending MD Approval')}
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit for MD Approval</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('Draft')}
                disabled={submitting}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                Save as Working Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
