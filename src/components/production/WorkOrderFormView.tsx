import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Boxes,
  Layers,
  Calendar,
  AlertCircle,
  FileCheck,
  Building2,
  Sparkles,
  Package,
  Printer,
  Scissors,
  Clock,
  CheckCircle2,
  RefreshCw,
  Hash,
  User,
  Info,
  ChevronRight,
  ShieldCheck,
  Tag,
  Settings2,
} from 'lucide-react';
import { Product, Warehouse, BillOfMaterial } from '../../types';

interface CorrugationLayer {
  layer: string;
  flute: string;
  gsm: number | string;
  bf: number | string;
  shade: string;
  requiredWeight: number | string;
}

interface ProcessStepInput {
  process: string;
  startTime: string;
  endTime: string;
  receiverQty: number | string;
  productionQty: number | string;
  rejectedQty: number | string;
}

interface WorkOrderFormViewProps {
  darkMode: boolean;
  workOrderId?: string | null;
  products: Product[];
  warehouses: Warehouse[];
  boms: BillOfMaterial[];
  salesOrders?: any[];
  onBack: () => void;
  onSaved: () => void;
}

const DEFAULT_CORRUGATION_ROWS: CorrugationLayer[] = [
  { layer: 'Top', flute: '-', gsm: 180, bf: 22, shade: 'Kraft Golden', requiredWeight: 0 },
  { layer: 'Flute 1', flute: 'B-Flute (1.35x)', gsm: 140, bf: 18, shade: 'Semi-Kraft', requiredWeight: 0 },
  { layer: 'Liner 1', flute: '-', gsm: 150, bf: 20, shade: 'Natural', requiredWeight: 0 },
  { layer: 'Flute 2', flute: 'C-Flute (1.45x)', gsm: 140, bf: 18, shade: 'Semi-Kraft', requiredWeight: 0 },
  { layer: 'Liner 2', flute: '-', gsm: 150, bf: 20, shade: 'Natural', requiredWeight: 0 },
  { layer: 'Flute 3', flute: '-', gsm: 0, bf: 0, shade: '-', requiredWeight: 0 },
  { layer: 'Liner 3', flute: '-', gsm: 0, bf: 0, shade: '-', requiredWeight: 0 },
];

const DEFAULT_PROCESS_ROWS: ProcessStepInput[] = [
  { process: 'Corrugation', startTime: '', endTime: '', receiverQty: 0, productionQty: 0, rejectedQty: 0 },
  { process: 'Corrugation 2 Ply', startTime: '', endTime: '', receiverQty: 0, productionQty: 0, rejectedQty: 0 },
  { process: 'Pasting', startTime: '', endTime: '', receiverQty: 0, productionQty: 0, rejectedQty: 0 },
  { process: 'Printing', startTime: '', endTime: '', receiverQty: 0, productionQty: 0, rejectedQty: 0 },
  { process: 'Manual Punching', startTime: '', endTime: '', receiverQty: 0, productionQty: 0, rejectedQty: 0 },
  { process: 'Joint Details', startTime: '', endTime: '', receiverQty: 0, productionQty: 0, rejectedQty: 0 },
  { process: 'Bundling', startTime: '', endTime: '', receiverQty: 0, productionQty: 0, rejectedQty: 0 },
];

export const WorkOrderFormView: React.FC<WorkOrderFormViewProps> = ({
  darkMode,
  workOrderId,
  products: initialProducts,
  warehouses: initialWarehouses,
  boms: initialBoms,
  salesOrders: initialSalesOrders = [],
  onBack,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real DB datasets
  const [salesOrdersList, setSalesOrdersList] = useState<any[]>(initialSalesOrders);
  const [bomsList, setBomsList] = useState<BillOfMaterial[]>(initialBoms);
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>(initialWarehouses);

  // 1. Sales Order & Work Order Header Details
  const [salesOrderId, setSalesOrderId] = useState<string>('');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<any | null>(null);
  const [salesOrderNumber, setSalesOrderNumber] = useState<string>('');
  const [itemCode, setItemCode] = useState<string>('');
  const [bomNumber, setBomNumber] = useState<string>('');
  const [selectedBomId, setSelectedBomId] = useState<string>('');
  const [salesOrderDate, setSalesOrderDate] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [workOrderNo, setWorkOrderNo] = useState<string>('');
  const [workOrderDate, setWorkOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customerPoNumber, setCustomerPoNumber] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [boxQty, setBoxQty] = useState<number>(1000);
  const [sheetQty, setSheetQty] = useState<number>(1000);
  const [boardWeightKg, setBoardWeightKg] = useState<number>(0);

  // General & Operational fields
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [assignedLine, setAssignedLine] = useState('Corrugator Line 1 (5-Ply)');
  const [warehouseId, setWarehouseId] = useState('');
  const [supervisor, setSupervisor] = useState('Production Floor Manager');
  const [remarks, setRemarks] = useState('');

  // 2. Box Specifications
  const [boxLength, setBoxLength] = useState<number>(350);
  const [boxWidth, setBoxWidth] = useState<number>(250);
  const [boxHeight, setBoxHeight] = useState<number>(200);
  const [dimensionType, setDimensionType] = useState<'ID' | 'OD'>('OD');
  const [boxSizeFormatted, setBoxSizeFormatted] = useState<string>('350 × 250 × 200 mm');
  const [deckleCm, setDeckleCm] = useState<number>(120);
  const [sheetSizeMm, setSheetSizeMm] = useState<string>('800 × 1200 mm');
  const [cuttingLengthMm, setCuttingLengthMm] = useState<number>(800);
  const [boardSizePly, setBoardSizePly] = useState<string>('5-Ply');
  const [ups, setUps] = useState<number>(1);
  const [plyCount, setPlyCount] = useState<number>(5);
  const [rotaryCreasingSize, setRotaryCreasingSize] = useState<string>('350 × 250 × 350');
  const [dieNumber, setDieNumber] = useState<string>('DIE-042');

  // 3. Corrugation Details (Layer by Layer)
  const [corrugationLayers, setCorrugationLayers] = useState<CorrugationLayer[]>(DEFAULT_CORRUGATION_ROWS);

  // 4. Printing & Joint Details
  const [printingType, setPrintingType] = useState<string>('Flexo Printing (2 Colors)');
  const [printingColour, setPrintingColour] = useState<string>('Black & Red');
  const [jointDetails, setJointDetails] = useState<string>('Stitched (Single Wire)');

  // 5. Production Process Input (Table)
  const [processRows, setProcessRows] = useState<ProcessStepInput[]>(DEFAULT_PROCESS_ROWS);

  // Fetch missing DB references (Sales Orders, BOMs, Next WO Number, etc.)
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const [soRes, bomRes, prodRes, whRes] = await Promise.all([
          fetch('/api/sales/orders?limit=100'),
          fetch('/api/production/boms?limit=100'),
          fetch('/api/inventory/products?limit=100'),
          fetch('/api/inventory/warehouses'),
        ]);

        const [soData, bomData, prodData, whData] = await Promise.all([
          soRes.json().catch(() => ({})),
          bomRes.json().catch(() => ({})),
          prodRes.json().catch(() => ({})),
          whRes.json().catch(() => ({})),
        ]);

        if (soData.success && Array.isArray(soData.data)) {
          setSalesOrdersList(soData.data);
        }
        if (bomData.success && Array.isArray(bomData.data)) {
          setBomsList(bomData.data);
        }
        if (prodData.success && Array.isArray(prodData.data)) {
          setProductsList(prodData.data);
        }
        if (whData.success && Array.isArray(whData.data)) {
          setWarehousesList(whData.data);
          if (!warehouseId && whData.data.length > 0) {
            const fg = whData.data.find((w: any) => w.type === 'Finished Goods' || w.name?.toLowerCase().includes('finish')) || whData.data[0];
            setWarehouseId(fg.id);
          }
        }
      } catch (err) {
        console.error('Failed to load database references for work order:', err);
      }
    };

    fetchRealData();
  }, []);

  // Generate Next Work Order Number if creating new
  useEffect(() => {
    if (!workOrderId && !workOrderNo) {
      fetch('/api/production/work-orders/next-number')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.nextOrderNumber) {
            setWorkOrderNo(json.data.nextOrderNumber);
          } else {
            const year = new Date().getFullYear();
            setWorkOrderNo(`WO-${year}-0001`);
          }
        })
        .catch(() => {
          const year = new Date().getFullYear();
          setWorkOrderNo(`WO-${year}-0001`);
        });
    }
  }, [workOrderId, workOrderNo]);

  // Load existing work order if editing
  useEffect(() => {
    if (!workOrderId) return;

    const loadWo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/production/work-orders?id=${workOrderId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const wo = data.data;
          setWorkOrderNo(wo.orderNumber || '');
          setProductId(wo.productId || '');
          setSelectedBomId(wo.bomId || '');
          setSalesOrderId(wo.salesOrderId || '');
          setBoxQty(wo.orderedQuantity || 0);
          setPriority(wo.priority || 'Medium');
          setWorkOrderDate(wo.startDate || new Date().toISOString().split('T')[0]);
          setDeliveryDate(wo.targetDate || '');
          setAssignedLine(wo.assignedLine || 'Corrugator Line 1 (5-Ply)');
          setWarehouseId(wo.warehouseId || '');
          setSupervisor(wo.supervisor || '');
          
          if (wo.salesOrder) {
            setSelectedSalesOrder(wo.salesOrder);
            setSalesOrderNumber(wo.salesOrder.soNumber || '');
            setSalesOrderDate(wo.salesOrder.orderDate || wo.salesOrder.createdAt?.split('T')[0] || '');
            setCustomerName(wo.salesOrder.customerName || wo.salesOrder.customer?.name || '');
            setCustomerPoNumber(wo.salesOrder.customerPoNumber || '');
          }

          if (wo.product) {
            setProductName(wo.product.name || '');
            setItemCode(wo.product.code || '');
          }

          if (wo.bom) {
            setBomNumber(wo.bom.bomNumber || '');
          }

          // Parse serialized structured specs if present in remarks
          if (wo.remarks) {
            try {
              const parsed = JSON.parse(wo.remarks);
              if (parsed.boxSpecs) {
                const bs = parsed.boxSpecs;
                if (bs.length) setBoxLength(Number(bs.length));
                if (bs.width) setBoxWidth(Number(bs.width));
                if (bs.height) setBoxHeight(Number(bs.height));
                if (bs.idOd) setDimensionType(bs.idOd);
                if (bs.boxSize) setBoxSizeFormatted(bs.boxSize);
                if (bs.deckleCm) setDeckleCm(Number(bs.deckleCm));
                if (bs.sheetSizeMm) setSheetSizeMm(bs.sheetSizeMm);
                if (bs.cuttingLengthMm) setCuttingLengthMm(Number(bs.cuttingLengthMm));
                if (bs.boardSizePly) setBoardSizePly(bs.boardSizePly);
                if (bs.ups) setUps(Number(bs.ups));
                if (bs.ply) setPlyCount(Number(bs.ply));
                if (bs.rotaryCreasingSize) setRotaryCreasingSize(bs.rotaryCreasingSize);
                if (bs.die) setDieNumber(bs.die);
                if (bs.sheetQty) setSheetQty(Number(bs.sheetQty));
                if (bs.boardWeightKg) setBoardWeightKg(Number(bs.boardWeightKg));
              }
              if (parsed.corrugationDetails && Array.isArray(parsed.corrugationDetails)) {
                setCorrugationLayers(parsed.corrugationDetails);
              }
              if (parsed.printingJoint) {
                const pj = parsed.printingJoint;
                if (pj.printingType) setPrintingType(pj.printingType);
                if (pj.printingColour) setPrintingColour(pj.printingColour);
                if (pj.jointDetails) setJointDetails(pj.jointDetails);
              }
              if (parsed.processTable && Array.isArray(parsed.processTable)) {
                setProcessRows(parsed.processTable);
              }
              if (parsed.notes) {
                setRemarks(parsed.notes);
              }
            } catch {
              setRemarks(wo.remarks);
            }
          }

          // If operations exist from DB, populate process rows
          if (wo.operations && Array.isArray(wo.operations) && wo.operations.length > 0) {
            const mappedOps: ProcessStepInput[] = DEFAULT_PROCESS_ROWS.map((defRow) => {
              const found = wo.operations.find((op: any) => 
                op.stageName?.toLowerCase().trim() === defRow.process.toLowerCase().trim()
              );
              if (found) {
                return {
                  process: defRow.process,
                  startTime: found.startTime ? new Date(found.startTime).toTimeString().substring(0, 5) : '',
                  endTime: found.endTime ? new Date(found.endTime).toTimeString().substring(0, 5) : '',
                  receiverQty: found.inputQuantity || 0,
                  productionQty: found.outputQuantity || 0,
                  rejectedQty: found.scrapQuantity || 0,
                };
              }
              return defRow;
            });
            setProcessRows(mappedOps);
          }
        }
      } catch (err) {
        console.error('Error loading Work Order:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWo();
  }, [workOrderId]);

  // Derived dynamic Box Size string
  useEffect(() => {
    setBoxSizeFormatted(`${boxLength} × ${boxWidth} × ${boxHeight} mm (${dimensionType})`);
    if (deckleCm && cuttingLengthMm) {
      const deckleMm = Math.round(deckleCm * 10);
      setSheetSizeMm(`${cuttingLengthMm} × ${deckleMm} mm`);
    }
  }, [boxLength, boxWidth, boxHeight, dimensionType, deckleCm, cuttingLengthMm]);

  // Derived Sheet Qty when Box Qty or UPS changes
  useEffect(() => {
    const calculatedSheets = Math.ceil((boxQty || 0) / (ups > 0 ? ups : 1));
    setSheetQty(calculatedSheets);

    // Update receiver quantity for first process step if untouched
    setProcessRows((prev) =>
      prev.map((r, i) => {
        if (i === 0 && (!r.receiverQty || r.receiverQty === 0)) {
          return { ...r, receiverQty: calculatedSheets };
        }
        return r;
      })
    );
  }, [boxQty, ups]);

  // Total Required Weight from corrugation table
  const totalRequiredWeight = useMemo(() => {
    return corrugationLayers.reduce((sum, layer) => sum + (Number(layer.requiredWeight) || 0), 0);
  }, [corrugationLayers]);

  // Update Board Weight (kg) based on calculated corrugation layers or sheet size
  useEffect(() => {
    if (totalRequiredWeight > 0) {
      setBoardWeightKg(Number(totalRequiredWeight.toFixed(2)));
    } else {
      // Fallback calculation from GSM and Sheet size
      const sheetAreaM2 = ((cuttingLengthMm || 800) * (deckleCm * 10 || 1200)) / 1000000;
      const totalGsm = corrugationLayers.reduce((sum, l) => sum + (Number(l.gsm) || 0), 0) || 750;
      const weightPerSheetKg = (sheetAreaM2 * totalGsm) / 1000;
      const totalKg = weightPerSheetKg * (sheetQty || 1000);
      setBoardWeightKg(Number(totalKg.toFixed(2)));
    }
  }, [totalRequiredWeight, cuttingLengthMm, deckleCm, sheetQty, corrugationLayers]);

  // Handle Sales Order Selection & Auto-fill
  const handleSelectSalesOrder = (soId: string) => {
    setSalesOrderId(soId);
    if (!soId) {
      setSelectedSalesOrder(null);
      return;
    }

    const so = salesOrdersList.find((s) => s.id === soId);
    if (so) {
      setSelectedSalesOrder(so);
      setSalesOrderNumber(so.soNumber || '');
      setSalesOrderDate(so.orderDate || (so.createdAt ? so.createdAt.split('T')[0] : ''));
      setCustomerName(so.customerName || so.customer?.name || 'Customer');
      setCustomerPoNumber(so.customerPoNumber || '');
      setDeliveryDate(so.deliveryDate || '');

      const quantity = Number(so.quantity) || 1000;
      setBoxQty(quantity);

      // Match product if available
      let prodId = so.productId;
      if (!prodId && so.product?.id) prodId = so.product.id;
      if (!prodId && so.productName) {
        const found = productsList.find((p) => p.name.toLowerCase() === so.productName.toLowerCase());
        if (found) prodId = found.id;
      }

      if (prodId) {
        setProductId(prodId);
        const prod = productsList.find((p) => p.id === prodId) || so.product;
        if (prod) {
          setProductName(prod.name || so.productName || '');
          setItemCode(prod.code || '');
          if (prod.length) setBoxLength(Number(prod.length));
          if (prod.width) setBoxWidth(Number(prod.width));
          if (prod.height) setBoxHeight(Number(prod.height));
          if (prod.fluteType) {
            setBoardSizePly(prod.fluteType.includes('3') ? '3-Ply' : prod.fluteType.includes('7') ? '7-Ply' : '5-Ply');
          }
        }
      } else {
        setProductName(so.productName || 'Corrugated Box');
      }

      // Find approved BOM for this product / quotation / customer
      const matchingBom = bomsList.find(
        (b) =>
          (b.productId === prodId || b.product?.name === so.productName) &&
          b.status === 'Active' &&
          !b.isDeleted
      ) || bomsList.find((b) => b.productId === prodId);

      if (matchingBom) {
        applyBomDetails(matchingBom, quantity);
      } else {
        // Calculate default corrugation layer weights based on default GSM
        recalculateLayerWeights(DEFAULT_CORRUGATION_ROWS, quantity, 1, deckleCm, cuttingLengthMm);
      }

      setRemarks(
        `Production Order generated against Sales Order ${so.soNumber} for ${so.customerName}. Customer PO: ${so.customerPoNumber || 'N/A'}`
      );
    }
  };

  // Helper to apply approved BOM data into Box Specs and Corrugation Table
  const applyBomDetails = (bom: BillOfMaterial, targetBoxQty: number) => {
    setSelectedBomId(bom.id);
    setBomNumber(bom.bomNumber);
    if (bom.ply) {
      setPlyCount(bom.ply);
      setBoardSizePly(`${bom.ply}-Ply`);
    }
    if (bom.deckleSizeMm) {
      setDeckleCm(Number((bom.deckleSizeMm / 10).toFixed(1)));
    }
    if (bom.cutSizeMm) {
      setCuttingLengthMm(Number(bom.cutSizeMm));
    }

    // Map BOM items to standard 7 layers: Top, Flute 1, Liner 1, Flute 2, Liner 2, Flute 3, Liner 3
    if (bom.items && bom.items.length > 0) {
      const mappedLayers: CorrugationLayer[] = [
        { layer: 'Top', flute: '-', gsm: 180, bf: 22, shade: 'Kraft Golden', requiredWeight: 0 },
        { layer: 'Flute 1', flute: 'B-Flute (1.35x)', gsm: 140, bf: 18, shade: 'Semi-Kraft', requiredWeight: 0 },
        { layer: 'Liner 1', flute: '-', gsm: 150, bf: 20, shade: 'Natural', requiredWeight: 0 },
        { layer: 'Flute 2', flute: 'C-Flute (1.45x)', gsm: 140, bf: 18, shade: 'Semi-Kraft', requiredWeight: 0 },
        { layer: 'Liner 2', flute: '-', gsm: 150, bf: 20, shade: 'Natural', requiredWeight: 0 },
        { layer: 'Flute 3', flute: '-', gsm: 0, bf: 0, shade: '-', requiredWeight: 0 },
        { layer: 'Liner 3', flute: '-', gsm: 0, bf: 0, shade: '-', requiredWeight: 0 },
      ];

      // Fill in from actual BOM items
      bom.items.forEach((item, index) => {
        if (index < mappedLayers.length) {
          const l = mappedLayers[index];
          l.layer = item.layer || l.layer;
          l.gsm = item.gsm || (item.material?.gsm ? Number(item.material.gsm) : l.gsm);
          l.bf = item.material?.burstFactor ? Number(item.material.burstFactor) : 20;
          l.shade = item.material?.shade || item.materialName || 'Kraft Paper';
          if (item.layer?.toLowerCase().includes('flute') || item.layer?.toLowerCase().includes('medium')) {
            l.flute = bom.fluteType || 'B-Flute (1.35x)';
          }
          // Calculate required weight: quantityPerUnit * targetBoxQty
          const weightPerBox = item.quantityPerUnit || 0.15;
          l.requiredWeight = Number((weightPerBox * targetBoxQty).toFixed(2));
        }
      });

      setCorrugationLayers(mappedLayers);
    } else {
      recalculateLayerWeights(DEFAULT_CORRUGATION_ROWS, targetBoxQty, ups, deckleCm, cuttingLengthMm);
    }
  };

  // Helper to recalculate required weights for all layers
  const recalculateLayerWeights = (
    layers: CorrugationLayer[],
    targetBoxQty: number,
    currentUps: number,
    dCm: number,
    cMm: number
  ) => {
    const sQty = Math.ceil(targetBoxQty / (currentUps > 0 ? currentUps : 1));
    const sheetAreaM2 = ((cMm || 800) * (dCm * 10 || 1200)) / 1000000;

    const updated = layers.map((layer) => {
      const gsmNum = Number(layer.gsm) || 0;
      if (gsmNum === 0) return { ...layer, requiredWeight: 0 };

      // Take-up factor for flutes
      let takeUp = 1.0;
      if (layer.flute.toLowerCase().includes('b-flute') || layer.layer.toLowerCase().includes('flute 1')) {
        takeUp = 1.35;
      } else if (layer.flute.toLowerCase().includes('c-flute') || layer.layer.toLowerCase().includes('flute 2')) {
        takeUp = 1.45;
      } else if (layer.flute.toLowerCase().includes('e-flute')) {
        takeUp = 1.25;
      }

      const layerWeightKg = (sheetAreaM2 * gsmNum * takeUp * sQty) / 1000;
      return {
        ...layer,
        requiredWeight: Number(layerWeightKg.toFixed(2)),
      };
    });

    setCorrugationLayers(updated);
  };

  // Handle layer field changes
  const handleLayerChange = (index: number, field: keyof CorrugationLayer, value: any) => {
    setCorrugationLayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Handle process table row field changes
  const handleProcessChange = (index: number, field: keyof ProcessStepInput, value: any) => {
    setProcessRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError('Please select or specify a Target Product.');
      return;
    }
    if (!boxQty || boxQty <= 0) {
      setError('Box quantity must be greater than zero.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Package full specifications & tables into JSON payload in remarks
      const structuredPayload = {
        notes: remarks,
        boxSpecs: {
          length: boxLength,
          width: boxWidth,
          height: boxHeight,
          idOd: dimensionType,
          boxSize: boxSizeFormatted,
          deckleCm,
          sheetSizeMm,
          cuttingLengthMm,
          boardSizePly,
          ups,
          ply: plyCount,
          rotaryCreasingSize,
          die: dieNumber,
          sheetQty,
          boxQty,
          boardWeightKg,
        },
        corrugationDetails: corrugationLayers,
        printingJoint: {
          printingType,
          printingColour,
          jointDetails,
        },
        processTable: processRows,
      };

      // Construct operations array for database
      const operationsData = processRows.map((p, idx) => ({
        sequence: idx + 1,
        stageName: p.process,
        inputQuantity: Number(p.receiverQty) || 0,
        outputQuantity: Number(p.productionQty) || 0,
        scrapQuantity: Number(p.rejectedQty) || 0,
        status:
          Number(p.productionQty) > 0
            ? Number(p.productionQty) >= Number(p.receiverQty)
              ? 'Completed'
              : 'In Progress'
            : 'Pending',
        notes: p.startTime && p.endTime ? `Shift time: ${p.startTime} - ${p.endTime}` : undefined,
      }));

      const payload = {
        orderNumber: workOrderNo,
        productId,
        bomId: selectedBomId || null,
        salesOrderId: salesOrderId || null,
        orderedQuantity: Number(boxQty),
        priority,
        startDate: workOrderDate,
        targetDate: deliveryDate || null,
        assignedLine,
        warehouseId: warehouseId || null,
        supervisor: supervisor || 'Production Supervisor',
        remarks: JSON.stringify(structuredPayload),
        operations: operationsData,
      };

      const url = workOrderId ? '/api/production/work-orders' : '/api/production/work-orders';
      const method = workOrderId ? 'PUT' : 'POST';
      const body = workOrderId ? { id: workOrderId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save Production Work Order');
      }

      onSaved();
    } catch (err: any) {
      console.error('Work order save error:', err);
      setError(err.message || 'An error occurred while saving the Work Order.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading Work Order details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            type="button"
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Production Module
              </span>
              {workOrderId ? (
                <span className="text-xs font-mono text-slate-500">Edit Mode</span>
              ) : (
                <span className="text-xs font-mono text-slate-500">New Work Order</span>
              )}
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {workOrderId ? `Edit Work Order: ${workOrderNo}` : 'Create Production Work Order'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Work Order...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{workOrderId ? 'Update Work Order' : 'Save & Issue Work Order'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start space-x-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ========================================================================= */}
        {/* SECTION 1: SALES ORDER DETAILS & AUTO-FILL */}
        {/* ========================================================================= */}
        <div
          className={`p-6 rounded-xl border shadow-sm transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-5 border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  1. Sales Order Details
                </h2>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select an active Sales Order to auto-populate customer, BOM, dimensions, and order quantities.
                </p>
              </div>
            </div>

            {/* Sales Order Selection Dropdown */}
            <div className="min-w-[280px]">
              <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Select Existing Sales Order (Auto-Fill)
              </label>
              <select
                value={salesOrderId}
                onChange={(e) => handleSelectSalesOrder(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                    : 'bg-blue-50/50 border-blue-200 text-slate-900 focus:border-blue-500'
                }`}
              >
                <option value="">-- Choose Sales Order --</option>
                {salesOrdersList.map((so) => (
                  <option key={so.id} value={so.id}>
                    {so.soNumber} - {so.customerName} ({so.productName || 'Box'} · {so.quantity} units)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Sales Order Number */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Sales Order Number
              </label>
              <input
                type="text"
                readOnly
                value={salesOrderNumber || 'N/A (Direct WO)'}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono font-semibold ${
                  darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>

            {/* Item Code / BOM Number */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Item Code / BOM Number
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={bomNumber || itemCode || ''}
                  onChange={(e) => setBomNumber(e.target.value)}
                  placeholder="e.g. BOM-2026-0001 / ITM-042"
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
                {bomsList.length > 0 && (
                  <select
                    value={selectedBomId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      const selected = bomsList.find((b) => b.id === bId);
                      if (selected) applyBomDetails(selected, boxQty);
                    }}
                    className={`px-2 py-2 text-xs rounded-lg border font-medium ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                    title="Select from approved BOMs"
                  >
                    <option value="">Link BOM</option>
                    {bomsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bomNumber}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Sales Order Date */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Sales Order Date
              </label>
              <input
                type="date"
                value={salesOrderDate}
                onChange={(e) => setSalesOrderDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Apex Packaging Ltd"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Product Name */}
            <div className="lg:col-span-2">
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Product Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={productId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setProductId(pId);
                    const p = productsList.find((item) => item.id === pId);
                    if (p) {
                      setProductName(p.name);
                      setItemCode(p.code || '');
                      if (p.length) setBoxLength(Number(p.length));
                      if (p.width) setBoxWidth(Number(p.width));
                      if (p.height) setBoxHeight(Number(p.height));
                      const mb = bomsList.find((b) => b.productId === pId && b.status === 'Active');
                      if (mb) applyBomDetails(mb, boxQty);
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                  required
                >
                  <option value="">-- Select Master Product --</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `[${p.code}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Order No */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Work Order No <span className="text-emerald-500 font-semibold">(Auto-Gen)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={workOrderNo}
                  onChange={(e) => setWorkOrderNo(e.target.value)}
                  placeholder="WO-2026-0001"
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-mono font-bold ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-emerald-400 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-emerald-700 focus:border-emerald-500'
                  }`}
                  required
                />
                <Tag className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Work Order Date */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Work Order Date
              </label>
              <input
                type="date"
                value={workOrderDate}
                onChange={(e) => setWorkOrderDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
                required
              />
            </div>

            {/* Customer PO Number */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Customer PO Number
              </label>
              <input
                type="text"
                value={customerPoNumber}
                onChange={(e) => setCustomerPoNumber(e.target.value)}
                placeholder="PO-APEX-8942"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Box Qty */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Box Qty <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={boxQty}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 0);
                  setBoxQty(val);
                  recalculateLayerWeights(corrugationLayers, val, ups, deckleCm, cuttingLengthMm);
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-bold text-lg ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
                required
              />
            </div>

            {/* Sheet Qty */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Sheet Qty <span className="text-xs text-slate-400 font-normal">(Box Qty ÷ UPS)</span>
              </label>
              <input
                type="number"
                min="1"
                value={sheetQty}
                onChange={(e) => setSheetQty(Number(e.target.value) || 0)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-bold text-lg ${
                  darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-blue-400'
                    : 'bg-blue-50/50 border-blue-200 text-blue-700'
                }`}
              />
            </div>

            {/* Board Weight (kg) */}
            <div className="lg:col-span-2">
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Board Weight (kg) <span className="text-xs text-slate-400 font-normal">(Calculated from total layers)</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={boardWeightKg}
                  onChange={(e) => setBoardWeightKg(Number(e.target.value) || 0)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-bold text-lg ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-emerald-400 focus:border-emerald-500'
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-800 focus:border-emerald-500'
                  }`}
                />
                <span className={`text-xs px-3 py-2 rounded border font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                  KG Total
                </span>
              </div>
            </div>

            {/* Assigned Line & Supervisor */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Assigned Production Line
              </label>
              <select
                value={assignedLine}
                onChange={(e) => setAssignedLine(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              >
                <option value="Corrugator Line 1 (5-Ply)">Corrugator Line 1 (5-Ply)</option>
                <option value="Corrugator Line 2 (3-Ply)">Corrugator Line 2 (3-Ply)</option>
                <option value="Heavy Duty 7-Ply Line">Heavy Duty 7-Ply Line</option>
                <option value="Flexo Printer Slotter Line 1">Flexo Printer Slotter Line 1</option>
                <option value="Semi-Auto Stitcher & Gluer">Semi-Auto Stitcher & Gluer</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-semibold ${
                  priority === 'Urgent'
                    ? 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-300'
                    : priority === 'High'
                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300'
                    : darkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: BOX SPECIFICATIONS */}
        {/* ========================================================================= */}
        <div
          className={`p-6 rounded-xl border shadow-sm transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3 border-b pb-4 mb-5 border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                2. Box Specifications
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Physical box sizing, cutting sheet lengths, deckle sizes, ply configurations, creasing, and die references.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Length */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Length (mm)
              </label>
              <input
                type="number"
                value={boxLength}
                onChange={(e) => setBoxLength(Number(e.target.value) || 0)}
                placeholder="350"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Width */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Width (mm)
              </label>
              <input
                type="number"
                value={boxWidth}
                onChange={(e) => setBoxWidth(Number(e.target.value) || 0)}
                placeholder="250"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Height */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Height (mm)
              </label>
              <input
                type="number"
                value={boxHeight}
                onChange={(e) => setBoxHeight(Number(e.target.value) || 0)}
                placeholder="200"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* ID/OD Selector */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                ID / OD Dimension Type
              </label>
              <select
                value={dimensionType}
                onChange={(e) => setDimensionType(e.target.value as any)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-semibold ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              >
                <option value="OD">OD (Outer Dimension)</option>
                <option value="ID">ID (Inner Dimension)</option>
              </select>
            </div>

            {/* Box Size (Formatted display) */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Box Size
              </label>
              <input
                type="text"
                value={boxSizeFormatted}
                onChange={(e) => setBoxSizeFormatted(e.target.value)}
                placeholder="350 × 250 × 200 mm"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${
                  darkMode ? 'bg-slate-800/60 border-slate-700 text-indigo-300' : 'bg-indigo-50/40 border-indigo-200 text-indigo-900'
                }`}
              />
            </div>

            {/* Deckle (CM) */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Deckle (CM)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={deckleCm}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setDeckleCm(val);
                    recalculateLayerWeights(corrugationLayers, boxQty, ups, val, cuttingLengthMm);
                  }}
                  placeholder="120"
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                />
                <span className={`text-xs px-2.5 py-2 rounded border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                  CM
                </span>
              </div>
            </div>

            {/* Sheet Size in MM / Cutting Length */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Cutting Length (MM)
              </label>
              <input
                type="number"
                value={cuttingLengthMm}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setCuttingLengthMm(val);
                  recalculateLayerWeights(corrugationLayers, boxQty, ups, deckleCm, val);
                }}
                placeholder="800"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Sheet Size Display */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Sheet Size (MM)
              </label>
              <input
                type="text"
                value={sheetSizeMm}
                onChange={(e) => setSheetSizeMm(e.target.value)}
                placeholder="800 × 1200 mm"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>

            {/* Board Size (Ply) */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Board Size (Ply)
              </label>
              <select
                value={boardSizePly}
                onChange={(e) => {
                  const val = e.target.value;
                  setBoardSizePly(val);
                  const pNum = val.includes('3') ? 3 : val.includes('7') ? 7 : 5;
                  setPlyCount(pNum);
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-semibold ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              >
                <option value="3-Ply">3-Ply (Single Wall)</option>
                <option value="5-Ply">5-Ply (Double Wall)</option>
                <option value="7-Ply">7-Ply (Triple Wall)</option>
              </select>
            </div>

            {/* UPS */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                UPS (Boxes per Sheet)
              </label>
              <select
                value={ups}
                onChange={(e) => setUps(Number(e.target.value) || 1)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-semibold ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              >
                <option value={1}>1 UPS (1 Box / Sheet)</option>
                <option value={2}>2 UPS (2 Boxes / Sheet)</option>
                <option value={3}>3 UPS (3 Boxes / Sheet)</option>
                <option value={4}>4 UPS (4 Boxes / Sheet)</option>
              </select>
            </div>

            {/* Ply Number */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Ply
              </label>
              <input
                type="number"
                value={plyCount}
                onChange={(e) => setPlyCount(Number(e.target.value) || 5)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Rotary / Creasing Size */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Rotary / Creasing Size
              </label>
              <input
                type="text"
                value={rotaryCreasingSize}
                onChange={(e) => setRotaryCreasingSize(e.target.value)}
                placeholder="350 × 250 × 350"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Die */}
            <div className="lg:col-span-2">
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Die (Die Code / Number)
              </label>
              <input
                type="text"
                value={dieNumber}
                onChange={(e) => setDieNumber(e.target.value)}
                placeholder="e.g. DIE-042 (Standard RSC Rotary Die)"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: CORRUGATION DETAILS (TABLE) */}
        {/* ========================================================================= */}
        <div
          className={`p-6 rounded-xl border shadow-sm transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-5 border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  3. Corrugation Details
                </h2>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Layer-by-layer paper recipe including Top liner, Flutes, GSM, Bursting Factor (BF), Shade, and Required Weight.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => recalculateLayerWeights(corrugationLayers, boxQty, ups, deckleCm, cuttingLengthMm)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recalculate Weights</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-50 text-slate-700'} border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider`}>
                  <th className="py-3 px-4">Process / Layer</th>
                  <th className="py-3 px-4">Flute</th>
                  <th className="py-3 px-4">GSM</th>
                  <th className="py-3 px-4">BF (Burst Factor)</th>
                  <th className="py-3 px-4">Shade</th>
                  <th className="py-3 px-4 text-right">Required Weight (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {corrugationLayers.map((layer, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Layer Name */}
                    <td className="py-2.5 px-4 font-semibold text-xs">
                      <span className={`px-2 py-1 rounded inline-block font-mono ${
                        layer.layer.includes('Top')
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                          : layer.layer.includes('Flute')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {layer.layer}
                      </span>
                    </td>

                    {/* Flute */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={layer.flute}
                        onChange={(e) => handleLayerChange(idx, 'flute', e.target.value)}
                        placeholder="e.g. B-Flute (1.35x)"
                        className={`w-full max-w-[160px] px-2.5 py-1.5 text-xs rounded border ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* GSM */}
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        value={layer.gsm}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          handleLayerChange(idx, 'gsm', val);
                        }}
                        placeholder="180"
                        className={`w-24 px-2.5 py-1.5 text-xs rounded border font-mono ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* BF */}
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        value={layer.bf}
                        onChange={(e) => handleLayerChange(idx, 'bf', Number(e.target.value) || 0)}
                        placeholder="22"
                        className={`w-20 px-2.5 py-1.5 text-xs rounded border font-mono ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* Shade */}
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={layer.shade}
                        onChange={(e) => handleLayerChange(idx, 'shade', e.target.value)}
                        placeholder="Kraft Golden / Natural"
                        className={`w-full max-w-[180px] px-2.5 py-1.5 text-xs rounded border ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* Required Weight */}
                    <td className="py-2.5 px-4 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={layer.requiredWeight}
                        onChange={(e) => handleLayerChange(idx, 'requiredWeight', Number(e.target.value) || 0)}
                        className={`w-28 px-2.5 py-1.5 text-xs rounded border font-mono font-bold text-right ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-emerald-400'
                            : 'bg-white border-slate-300 text-emerald-700'
                        }`}
                      />
                    </td>
                  </tr>
                ))}

                {/* Total Required Weight Row */}
                <tr className={`${darkMode ? 'bg-slate-800/90 text-white' : 'bg-emerald-50/70 text-emerald-950'} font-bold border-t-2 border-slate-300 dark:border-slate-700`}>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase text-xs tracking-wider">
                    Total Required Weight:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                    {totalRequiredWeight.toFixed(2)} KG
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: PRINTING & JOINT DETAILS */}
        {/* ========================================================================= */}
        <div
          className={`p-6 rounded-xl border shadow-sm transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3 border-b pb-4 mb-5 border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                4. Printing & Joint Details
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Specify print technology, ink color combination, and box closure joining specifications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Printing Type */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Printing Type
              </label>
              <select
                value={printingType}
                onChange={(e) => setPrintingType(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                }`}
              >
                <option value="Flexo Printing (1 Color)">Flexo Printing (1 Color)</option>
                <option value="Flexo Printing (2 Colors)">Flexo Printing (2 Colors)</option>
                <option value="Flexo Printing (3 Colors)">Flexo Printing (3 Colors)</option>
                <option value="Flexo Printing (4 Colors / CMYK)">Flexo Printing (4 Colors / CMYK)</option>
                <option value="Offset Printing (Laminated)">Offset Printing (Laminated)</option>
                <option value="Screen Printing">Screen Printing</option>
                <option value="Digital Printing">Digital Printing</option>
                <option value="Plain (Unprinted / Brown)">Plain (Unprinted / Brown)</option>
              </select>
            </div>

            {/* Printing Colour */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Printing Colour
              </label>
              <input
                type="text"
                value={printingColour}
                onChange={(e) => setPrintingColour(e.target.value)}
                placeholder="e.g. Black & Red / CMYK / Single Black"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                }`}
              />
            </div>

            {/* Joint Details */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Joint Details
              </label>
              <select
                value={jointDetails}
                onChange={(e) => setJointDetails(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-medium ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
                }`}
              >
                <option value="Stitched (Single Wire)">Stitched (Single Wire)</option>
                <option value="Stitched (Double Wire)">Stitched (Double Wire)</option>
                <option value="Glued (PVA / Water-based)">Glued (PVA / Water-based)</option>
                <option value="Glued (Hot Melt Adhesive)">Glued (Hot Melt Adhesive)</option>
                <option value="Stitched & Glued">Stitched & Glued</option>
                <option value="Tape Joint">Tape Joint</option>
                <option value="Die-cut Self Locking (No Joint)">Die-cut Self Locking (No Joint)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: PRODUCTION PROCESS INPUT */}
        {/* ========================================================================= */}
        <div
          className={`p-6 rounded-xl border shadow-sm transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-5 border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  5. Production Process Input
                </h2>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Track start & end schedule times, receiver qty, production output, and rejected quantities across all packaging stages.
                </p>
              </div>
            </div>

            <div className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-medium">
              Bundling included as active process stage
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-50 text-slate-700'} border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider`}>
                  <th className="py-3 px-4">Process</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">End Time</th>
                  <th className="py-3 px-4 text-right">Receiver Qty</th>
                  <th className="py-3 px-4 text-right">Production Qty</th>
                  <th className="py-3 px-4 text-right">Rejected Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {processRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.process === 'Bundling'
                        ? darkMode ? 'bg-teal-950/20 hover:bg-teal-950/30' : 'bg-teal-50/40 hover:bg-teal-50/60'
                        : darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Process Name */}
                    <td className="py-2.5 px-4 font-semibold text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          row.process === 'Bundling' ? 'bg-teal-500' : 'bg-emerald-500'
                        }`} />
                        <span className={`${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {row.process}
                        </span>
                        {row.process === 'Bundling' && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                            Final Stage
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Start Time */}
                    <td className="py-2.5 px-4">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(e) => handleProcessChange(idx, 'startTime', e.target.value)}
                        className={`px-2.5 py-1.5 text-xs rounded border font-mono ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* End Time */}
                    <td className="py-2.5 px-4">
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => handleProcessChange(idx, 'endTime', e.target.value)}
                        className={`px-2.5 py-1.5 text-xs rounded border font-mono ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* Receiver Qty */}
                    <td className="py-2.5 px-4 text-right">
                      <input
                        type="number"
                        value={row.receiverQty}
                        onChange={(e) => handleProcessChange(idx, 'receiverQty', Number(e.target.value) || 0)}
                        className={`w-24 px-2.5 py-1.5 text-xs rounded border font-mono text-right ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </td>

                    {/* Production Qty */}
                    <td className="py-2.5 px-4 text-right">
                      <input
                        type="number"
                        value={row.productionQty}
                        onChange={(e) => handleProcessChange(idx, 'productionQty', Number(e.target.value) || 0)}
                        className={`w-24 px-2.5 py-1.5 text-xs rounded border font-mono font-bold text-right ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-emerald-400'
                            : 'bg-white border-slate-300 text-emerald-700'
                        }`}
                      />
                    </td>

                    {/* Rejected Qty */}
                    <td className="py-2.5 px-4 text-right">
                      <input
                        type="number"
                        value={row.rejectedQty}
                        onChange={(e) => handleProcessChange(idx, 'rejectedQty', Number(e.target.value) || 0)}
                        className={`w-24 px-2.5 py-1.5 text-xs rounded border font-mono text-right ${
                          Number(row.rejectedQty) > 0
                            ? 'text-red-600 font-bold bg-red-50 dark:bg-red-950/40 border-red-300'
                            : darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-white border-slate-300 text-slate-500'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REMARKS / SPECIAL INSTRUCTIONS */}
        {/* ========================================================================= */}
        <div
          className={`p-6 rounded-xl border shadow-sm transition-all ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3 border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Additional Notes & Instructions
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Special instructions for production operators, strapping, palletization, or quality parameters.
              </p>
            </div>
          </div>

          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter production notes, flute orientation requirements, bundling guidelines, or customer specific labels..."
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border resize-y ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Work Order...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{workOrderId ? 'Update Work Order' : 'Save & Issue Work Order'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
