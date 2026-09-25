import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Layers,
  Calendar,
  Clock,
  User,
  Cpu,
  FileCheck,
  FileText,
  Check,
  Save,
  Trash2,
  PlusCircle,
  ExternalLink,
  Printer,
  PackageCheck,
  History,
  ShieldCheck,
  Truck,
  Building2,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { WorkOrder, WorkOrderOperation } from '../../types';

interface WorkOrderDetailViewProps {
  darkMode: boolean;
  workOrderId: string;
  workOrder: any | null;
  loading: boolean;
  onBack: () => void;
  onEdit: (id: string) => void;
  onRelease: (id: string) => void;
  onRefresh: () => void;
  onNavigateTab: (tab: any, subPage?: string, selectedId?: string) => void;
  warehouses?: any[];
}

export const WorkOrderDetailView: React.FC<WorkOrderDetailViewProps> = ({
  darkMode,
  workOrderId,
  workOrder,
  loading,
  onBack,
  onEdit,
  onRelease,
  onRefresh,
  onNavigateTab,
  warehouses = [],
}) => {
  const [updatingOpId, setUpdatingOpId] = useState<string | null>(null);
  const [opOutputQty, setOpOutputQty] = useState<number>(0);
  const [opScrapQty, setOpScrapQty] = useState<number>(0);
  const [opStatus, setOpStatus] = useState<string>('In Progress');
  const [opNotes, setOpNotes] = useState<string>('');
  const [opOperator, setOpOperator] = useState<string>('');
  const [savingOp, setSavingOp] = useState(false);

  // Material Issue Modal State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [issueWarehouseId, setIssueWarehouseId] = useState('');
  const [issueQty, setIssueQty] = useState<number>(0);
  const [issueReelNo, setIssueReelNo] = useState('');
  const [issueBatchNo, setIssueBatchNo] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [issuingMaterial, setIssuingMaterial] = useState(false);

  // QC Approval Modal State
  const [showQCApprovalModal, setShowQCApprovalModal] = useState(false);
  const [fgWarehouseId, setFgWarehouseId] = useState('');
  const [fgQuantity, setFgQuantity] = useState<number>(0);
  const [fgRemarks, setFgRemarks] = useState('');
  const [approvingFG, setApprovingFG] = useState(false);

  // Delete State
  const [deleting, setDeleting] = useState(false);

  if (loading || !workOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading Work Order details...</p>
      </div>
    );
  }

  const progress =
    workOrder.orderedQuantity > 0
      ? Math.min(100, Math.round((workOrder.producedQuantity / workOrder.orderedQuantity) * 100))
      : 0;

  const handleOpenOpUpdate = (op: WorkOrderOperation) => {
    setUpdatingOpId(op.id);
    setOpOutputQty(op.outputQuantity || op.inputQuantity || workOrder.orderedQuantity);
    setOpScrapQty(op.scrapQuantity || 0);
    setOpStatus(op.status === 'Completed' ? 'Completed' : 'In Progress');
    setOpNotes(op.notes || '');
    setOpOperator(op.operatorName || workOrder.supervisor || '');
  };

  const handleSaveOpProgress = async (opId: string, markCompleted = false) => {
    try {
      setSavingOp(true);
      const res = await fetch('/api/production/operations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId: opId,
          status: markCompleted ? 'Completed' : opStatus,
          outputQuantity: Number(opOutputQty),
          scrapQuantity: Number(opScrapQty),
          operatorName: opOperator,
          notes: opNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update operation');

      setUpdatingOpId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating operation');
    } finally {
      setSavingOp(false);
    }
  };

  const handleOpenIssueModal = (materialId?: string, defaultQty?: number) => {
    if (materialId) setSelectedMaterialId(materialId);
    else if (workOrder.bom?.items?.[0]?.materialId) {
      setSelectedMaterialId(workOrder.bom.items[0].materialId);
    }
    setIssueQty(defaultQty || 100);
    if (warehouses.length > 0 && !issueWarehouseId) {
      const rawWh = warehouses.find((w) => w.type === 'Raw Materials' || w.name.toLowerCase().includes('raw')) || warehouses[0];
      setIssueWarehouseId(rawWh.id);
    }
    setShowMaterialModal(true);
  };

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || !issueWarehouseId || issueQty <= 0) {
      alert('Please select raw material, warehouse, and a positive quantity.');
      return;
    }

    try {
      setIssuingMaterial(true);
      const res = await fetch('/api/production/work-orders/material-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: workOrder.id,
          materialId: selectedMaterialId,
          warehouseId: issueWarehouseId,
          quantity: Number(issueQty),
          reelNumber: issueReelNo,
          batchNumber: issueBatchNo,
          notes: issueNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to issue material');

      setShowMaterialModal(false);
      setIssueReelNo('');
      setIssueBatchNo('');
      setIssueNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error issuing material');
    } finally {
      setIssuingMaterial(false);
    }
  };

  const handleOpenQCApproval = () => {
    setFgQuantity(workOrder.producedQuantity || workOrder.orderedQuantity);
    if (warehouses.length > 0 && !fgWarehouseId) {
      const fgWh = warehouses.find((w) => w.type === 'Finished Goods' || w.name.toLowerCase().includes('finish')) || warehouses[0];
      setFgWarehouseId(fgWh.id);
    }
    setShowQCApprovalModal(true);
  };

  const handleApproveFG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fgWarehouseId || fgQuantity <= 0) {
      alert('Please select Finished Goods Warehouse and valid quantity.');
      return;
    }

    try {
      setApprovingFG(true);
      const res = await fetch('/api/production/qc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: workOrder.id,
          warehouseId: fgWarehouseId,
          quantity: Number(fgQuantity),
          remarks: fgRemarks || 'Passed final box QC inspection and stocked into warehouse.',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to approve Finished Goods');

      setShowQCApprovalModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error approving Finished Goods');
    } finally {
      setApprovingFG(false);
    }
  };

  const handleDeleteWorkOrder = async () => {
    if (!window.confirm(`Are you sure you want to delete Work Order ${workOrder.orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/production/work-orders?id=${workOrder.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete work order');

      onBack();
    } catch (err: any) {
      alert(err.message || 'Error deleting Work Order');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrintJobCard = () => {
    window.print();
  };

  // Extract Material Issuances from linked inventory transactions
  const issuedTransactions = workOrder.inventoryTransactions?.filter(
    (t: any) => t.transactionType === 'Stock Out' || t.referenceType === 'Work Order Material Issue'
  ) || [];

  const fgTransactions = workOrder.inventoryTransactions?.filter(
    (t: any) => t.transactionType === 'Stock In' && t.referenceType === 'Work Order'
  ) || [];

  // Parse structured data from remarks if present
  let parsedSpecs: any = null;
  let customNotes = '';
  if (workOrder?.remarks) {
    try {
      parsedSpecs = JSON.parse(workOrder.remarks);
      customNotes = parsedSpecs.notes || '';
    } catch {
      parsedSpecs = null;
      customNotes = workOrder.remarks;
    }
  }

  const boxSpecs = parsedSpecs?.boxSpecs || {
    length: workOrder.product?.length || 350,
    width: workOrder.product?.width || 250,
    height: workOrder.product?.height || 200,
    idOd: 'OD',
    boxSize: workOrder.product?.dimensions || `${workOrder.product?.length || 350} × ${workOrder.product?.width || 250} × ${workOrder.product?.height || 200} mm (OD)`,
    deckleCm: (workOrder.bom?.deckleSizeMm ? Number((workOrder.bom.deckleSizeMm / 10).toFixed(1)) : 120),
    sheetSizeMm: `${workOrder.bom?.cutSizeMm || 800} × ${workOrder.bom?.deckleSizeMm || 1200} mm`,
    cuttingLengthMm: workOrder.bom?.cutSizeMm || 800,
    boardSizePly: `${workOrder.bom?.ply || 5}-Ply`,
    ups: 1,
    ply: workOrder.bom?.ply || 5,
    rotaryCreasingSize: '350 × 250 × 350',
    die: 'DIE-042',
    sheetQty: workOrder.orderedQuantity || 1000,
    boxQty: workOrder.orderedQuantity || 1000,
    boardWeightKg: 0,
  };

  const corrugationDetails: any[] = parsedSpecs?.corrugationDetails || [
    { layer: 'Top', flute: '-', gsm: 180, bf: 22, shade: 'Kraft Golden', requiredWeight: 360 },
    { layer: 'Flute 1', flute: 'B-Flute (1.35x)', gsm: 140, bf: 18, shade: 'Semi-Kraft', requiredWeight: 380 },
    { layer: 'Liner 1', flute: '-', gsm: 150, bf: 20, shade: 'Natural', requiredWeight: 300 },
    { layer: 'Flute 2', flute: 'C-Flute (1.45x)', gsm: 140, bf: 18, shade: 'Semi-Kraft', requiredWeight: 410 },
    { layer: 'Liner 2', flute: '-', gsm: 150, bf: 20, shade: 'Natural', requiredWeight: 300 },
    { layer: 'Flute 3', flute: '-', gsm: 0, bf: 0, shade: '-', requiredWeight: 0 },
    { layer: 'Liner 3', flute: '-', gsm: 0, bf: 0, shade: '-', requiredWeight: 0 },
  ];

  const totalCorrugationWeight = corrugationDetails.reduce(
    (sum: number, l: any) => sum + (Number(l.requiredWeight) || 0),
    0
  );

  const printingJoint = parsedSpecs?.printingJoint || {
    printingType: 'Flexo Printing (2 Colors)',
    printingColour: 'Black & Red',
    jointDetails: 'Stitched (Single Wire)',
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {workOrder.orderNumber}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  workOrder.status === 'In Production'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : workOrder.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : workOrder.status === 'Production Completed'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {workOrder.status}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  workOrder.priority === 'Urgent'
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    : workOrder.priority === 'High'
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    : 'bg-slate-500/10 text-slate-500'
                }`}
              >
                {workOrder.priority} Priority
              </span>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Current Stage: <strong className="text-emerald-600 dark:text-emerald-400">{workOrder.currentStage}</strong> • Line: {workOrder.assignedLine || 'Main Corrugator Line'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {(workOrder.status === 'Draft' || workOrder.status === 'Planned') && (
            <button
              type="button"
              onClick={() => onRelease(workOrder.id)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Release to Floor</span>
            </button>
          )}

          {workOrder.status === 'In Production' && workOrder.currentStage === 'QC' && (
            <button
              type="button"
              onClick={handleOpenQCApproval}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Approve & Receive Finished Goods</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenIssueModal()}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Issue Material</span>
          </button>

          <button
            type="button"
            onClick={handlePrintJobCard}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Print Job Card"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(workOrder.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDeleteWorkOrder}
            className={`p-2 rounded-lg border text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${
              darkMode ? 'border-slate-700' : 'border-slate-200'
            }`}
            title="Delete Work Order"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Production Job Card - 5 Key Specification Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Sales Order Details */}
        <div
          className={`p-5 rounded-xl border space-y-3 ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 border-b pb-2.5 border-slate-200 dark:border-slate-700">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              1. Sales Order Details
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Sales Order No</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {workOrder.salesOrder?.soNumber || 'Direct Production'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Item Code / BOM</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {workOrder.bom?.bomNumber || workOrder.product?.code || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sales Order Date</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {workOrder.salesOrder?.orderDate || workOrder.salesOrder?.createdAt?.split('T')[0] || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Customer Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {workOrder.salesOrder?.customerName || workOrder.salesOrder?.customer?.name || 'In-House'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Customer PO No</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {workOrder.salesOrder?.customerPoNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Delivery Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {workOrder.targetDate || workOrder.salesOrder?.deliveryDate || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sheet Qty</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {(boxSpecs.sheetQty || workOrder.orderedQuantity)?.toLocaleString()} Pcs
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Box Qty</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                {(boxSpecs.boxQty || workOrder.orderedQuantity)?.toLocaleString()} Pcs
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Board Weight</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                {boxSpecs.boardWeightKg || totalCorrugationWeight || '-'} KG
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Box Specifications */}
        <div
          className={`p-5 rounded-xl border space-y-3 ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 border-b pb-2.5 border-slate-200 dark:border-slate-700">
            <Boxes className="w-4 h-4 text-indigo-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              2. Box Specifications
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">L × W × H</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {boxSpecs.length} × {boxSpecs.width} × {boxSpecs.height} mm
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ID / OD</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{boxSpecs.idOd}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Deckle (CM)</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {boxSpecs.deckleCm} CM
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Cutting Length</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {boxSpecs.cuttingLengthMm} MM
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Board Size (Ply)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{boxSpecs.boardSizePly}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">UPS</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{boxSpecs.ups} UPS</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Rotary / Creasing</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {boxSpecs.rotaryCreasingSize || 'Standard'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[10px]">Die Reference</span>
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {boxSpecs.die || 'Standard Rotary Slotter'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Corrugation Details (Table) */}
        <div
          className={`p-5 rounded-xl border space-y-3 lg:col-span-2 ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                3. Corrugation Recipe (Layer Details)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Total Weight: {totalCorrugationWeight.toFixed(2)} KG
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`${darkMode ? 'bg-slate-850 text-slate-400' : 'bg-slate-50 text-slate-600'} text-[11px] font-semibold border-b`}>
                <tr>
                  <th className="py-2 px-3">Process / Layer</th>
                  <th className="py-2 px-3">Flute</th>
                  <th className="py-2 px-3">GSM</th>
                  <th className="py-2 px-3">BF</th>
                  <th className="py-2 px-3">Shade</th>
                  <th className="py-2 px-3 text-right">Required Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {corrugationDetails.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-500/5">
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{c.layer}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{c.flute || '-'}</td>
                    <td className="py-2 px-3 font-mono">{c.gsm || '-'} GSM</td>
                    <td className="py-2 px-3 font-mono">{c.bf || '-'} BF</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{c.shade || '-'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {c.requiredWeight ? `${Number(c.requiredWeight).toFixed(2)} KG` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Printing & Joint Details */}
        <div
          className={`p-5 rounded-xl border space-y-3 lg:col-span-2 ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 border-b pb-2.5 border-slate-200 dark:border-slate-700">
            <Printer className="w-4 h-4 text-purple-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              4. Printing & Joint Details
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Printing Type</span>
              <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm">
                {printingJoint.printingType}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Printing Colour</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {printingJoint.printingColour}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Joint Details</span>
              <span className="font-semibold text-teal-700 dark:text-teal-300 text-sm">
                {printingJoint.jointDetails}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div
        className={`p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Finished Product</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block truncate">
              {workOrder.product?.name}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {workOrder.product?.code} • {workOrder.product?.dimensions || 'Std Box'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Batch Quantities</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {workOrder.producedQuantity?.toLocaleString() || 0} / {workOrder.orderedQuantity?.toLocaleString()} Pcs
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
              {progress}% Completed ({Math.max(0, workOrder.orderedQuantity - (workOrder.producedQuantity || 0)).toLocaleString()} Pcs Balance)
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Sales Order Link</span>
            {workOrder.salesOrder ? (
              <div className="mt-1">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 block">
                  {workOrder.salesOrder.soNumber}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {workOrder.salesOrder.customerName || workOrder.salesOrder.customer?.name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 block mt-1">Make-to-Stock (Standard Inventory)</span>
            )}
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Production Schedule</span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
              Start: {workOrder.startDate || 'Immediate'} • Target: {workOrder.targetDate || 'Flexible'}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Supervisor: {workOrder.supervisor || 'Production Manager'}
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Sequential Floor Routing Operations */}
      <div
        className={`p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Corrugated Manufacturing Routing & Stage Execution
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Sequential stage routing through corrugator, flexo printing, die-cutter, and box stitcher
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {workOrder.operations?.length || 0} Routing Stages
          </span>
        </div>

        <div className="space-y-3">
          {(workOrder.operations || []).map((op: any, idx: number) => {
            const isCompleted = op.status === 'Completed';
            const isInProgress = op.status === 'In Progress';
            const isEditingThis = updatingOpId === op.id;

            return (
              <div
                key={op.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? darkMode
                      ? 'bg-emerald-950/10 border-emerald-800/30'
                      : 'bg-emerald-50/40 border-emerald-200/60'
                    : isInProgress
                    ? darkMode
                      ? 'bg-blue-950/20 border-blue-700/50 shadow-sm'
                      : 'bg-blue-50/50 border-blue-200 shadow-sm'
                    : darkMode
                    ? 'bg-slate-850/40 border-slate-700/60'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isInProgress
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {op.stageName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Machine: {op.machineName || 'Assigned Machine'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isInProgress
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {op.status}
                    </span>

                    {!isEditingThis && (
                      <button
                        type="button"
                        onClick={() => handleOpenOpUpdate(op)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Record Output
                      </button>
                    )}
                  </div>
                </div>

                {/* Operation Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Input Quantity</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {op.inputQuantity?.toLocaleString()} Pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Good Output</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {op.outputQuantity?.toLocaleString()} Pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Scrap / Trimming</span>
                    <span className="font-semibold text-rose-500">
                      {op.scrapQuantity?.toLocaleString()} Kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Operator</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                      {op.operatorName || 'Assigned Lead'}
                    </span>
                  </div>
                </div>

                {/* Edit Inline Form for this Operation */}
                {isEditingThis && (
                  <div className="mt-4 p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-slate-400 block mb-1">
                          Output Good Quantity (Pcs)
                        </label>
                        <input
                          type="number"
                          value={opOutputQty}
                          onChange={(e) => setOpOutputQty(Number(e.target.value))}
                          className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-400 block mb-1">
                          Scrap / Waste (Kg)
                        </label>
                        <input
                          type="number"
                          value={opScrapQty}
                          onChange={(e) => setOpScrapQty(Number(e.target.value))}
                          className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-400 block mb-1">
                          Operator Name
                        </label>
                        <input
                          type="text"
                          value={opOperator}
                          onChange={(e) => setOpOperator(e.target.value)}
                          placeholder="Operator name"
                          className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-400 block mb-1">
                          Stage Status
                        </label>
                        <select
                          value={opStatus}
                          onChange={(e) => setOpStatus(e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Paused">Paused</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={opNotes}
                        onChange={(e) => setOpNotes(e.target.value)}
                        placeholder="Operator notes, blade sharpness, ink shade confirmation..."
                        className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setUpdatingOpId(null)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingOp}
                        onClick={() => handleSaveOpProgress(op.id, false)}
                        className="px-3.5 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Progress</span>
                      </button>
                      <button
                        type="button"
                        disabled={savingOp}
                        onClick={() => handleSaveOpProgress(op.id, true)}
                        className="px-3.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Stage & Advance</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Material Requirements & Store Issue Tracker */}
      <div
        className={`p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Raw Material Requirements & Store Issues
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                BOM paper roll GSM, fluting medium, adhesives, and warehouse stock issue traceability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenIssueModal()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Issue Paper Roll / Material</span>
          </button>
        </div>

        {/* BOM Items Requirement Table */}
        {workOrder.bom?.items && workOrder.bom.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b ${
                  darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Layer / Role</th>
                  <th className="py-2.5 px-3 font-semibold">Material Name & Code</th>
                  <th className="py-2.5 px-3 font-semibold">GSM</th>
                  <th className="py-2.5 px-3 font-semibold">Qty / Box</th>
                  <th className="py-2.5 px-3 font-semibold">Total Required</th>
                  <th className="py-2.5 px-3 font-semibold">Stock Available</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {workOrder.bom.items.map((item: any) => {
                  const reqQty = Number(((item.quantityPerUnit || 0) * (workOrder.orderedQuantity || 0)).toFixed(1));
                  const stockAvail = item.material?.currentStock ?? 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-500/5">
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {item.layer}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {item.materialName}
                        </span>
                        <span className="text-[11px] text-slate-400">{item.materialCode || 'RM-STD'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {item.gsm ? `${item.gsm} GSM` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {item.quantityPerUnit} {item.unit || 'Kg'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                        {reqQty} {item.unit || 'Kg'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold ${
                            stockAvail >= reqQty ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          }`}
                        >
                          {stockAvail.toLocaleString()} {item.unit || 'Kg'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenIssueModal(item.materialId, reqQty)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                        >
                          Issue Roll
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No BOM recipe attached or no layer specs found.</p>
        )}

        {/* Issued Traceability Log */}
        {issuedTransactions.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Issued Raw Materials & Roll Traceability Log ({issuedTransactions.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead
                  className={`border-b ${
                    darkMode ? 'bg-slate-850 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <tr>
                    <th className="py-2 px-2.5 font-semibold">Tx Number</th>
                    <th className="py-2 px-2.5 font-semibold">Material</th>
                    <th className="py-2 px-2.5 font-semibold">Warehouse</th>
                    <th className="py-2 px-2.5 font-semibold">Quantity Issued</th>
                    <th className="py-2 px-2.5 font-semibold">Details / Reel #</th>
                    <th className="py-2 px-2.5 font-semibold">Issued By / Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {issuedTransactions.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-2 px-2.5 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        {tx.transactionNumber}
                      </td>
                      <td className="py-2 px-2.5 font-medium text-slate-900 dark:text-white">
                        {tx.itemName}
                      </td>
                      <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">
                        {tx.warehouse?.name || 'Main Raw Material Warehouse'}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-rose-500">
                        -{tx.quantity} {tx.rawMaterial?.unit || 'Kg'}
                      </td>
                      <td className="py-2 px-2.5 text-slate-500 truncate max-w-xs">
                        {tx.remarks || '-'}
                      </td>
                      <td className="py-2 px-2.5 text-slate-500">
                        {tx.user} • {tx.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Activity Timeline & History Audit */}
      <div
        className={`p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-blue-500" />
          <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Activity Timeline & History Audit Log
          </h3>
        </div>

        {workOrder.activityLogs && workOrder.activityLogs.length > 0 ? (
          <div className="space-y-2.5">
            {workOrder.activityLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{log.details}</p>
                  <span className="text-[10px] text-slate-400 font-medium">By: {log.user}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No activity logs recorded yet.</p>
        )}
      </div>

      {/* Material Issue Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold">Issue Raw Material from Store</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="p-1 rounded-lg hover:bg-slate-500/20 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueMaterial} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Select Raw Material</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">Select Paper Roll / Raw Material</option>
                  {(workOrder.bom?.items || []).map((item: any) => (
                    <option key={item.id} value={item.materialId}>
                      {item.layer}: {item.materialName} ({item.gsm ? `${item.gsm} GSM` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">From Warehouse / Bin</label>
                <select
                  value={issueWarehouseId}
                  onChange={(e) => setIssueWarehouseId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">Select Store Warehouse</option>
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Quantity (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={issueQty}
                    onChange={(e) => setIssueQty(Number(e.target.value))}
                    required
                    className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Reel / Roll #</label>
                  <input
                    type="text"
                    value={issueReelNo}
                    onChange={(e) => setIssueReelNo(e.target.value)}
                    placeholder="e.g. ROLL-8821"
                    className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Batch / Lot #</label>
                  <input
                    type="text"
                    value={issueBatchNo}
                    onChange={(e) => setIssueBatchNo(e.target.value)}
                    placeholder="e.g. BATCH-A04"
                    className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Remarks / Operator Notes</label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="e.g. Verified moisture and basis weight before loading to reel stand"
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                    darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuingMaterial}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{issuingMaterial ? 'Issuing...' : 'Confirm Store Issue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC Finished Goods Receipt Modal */}
      {showQCApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold">Approve & Receive Finished Goods</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQCApprovalModal(false)}
                className="p-1 rounded-lg hover:bg-slate-500/20 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveFG} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Finished Goods Warehouse</label>
                <select
                  value={fgWarehouseId}
                  onChange={(e) => setFgWarehouseId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">Select Finished Goods Warehouse</option>
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Approved Quantity (Pcs / Boxes)</label>
                <input
                  type="number"
                  value={fgQuantity}
                  onChange={(e) => setFgQuantity(Number(e.target.value))}
                  required
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">QC Remarks / Inspection Notes</label>
                <input
                  type="text"
                  value={fgRemarks}
                  onChange={(e) => setFgRemarks(e.target.value)}
                  placeholder="e.g. Passed bursting strength and dimension checks. 100% good quality."
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowQCApprovalModal(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                    darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approvingFG}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{approvingFG ? 'Stocking...' : 'Approve & Stock Finished Goods'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
