import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  ArrowRight,
  ArrowLeftRight,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Box,
  Truck,
  TrendingDown,
  Warehouse as WarehouseIcon,
  Trash2,
} from 'lucide-react';
import { RawMaterial, Warehouse } from '../../types';

interface MaterialIndentAllocationViewProps {
  darkMode: boolean;
  warehouses?: Warehouse[];
  rawMaterials?: RawMaterial[];
}

export const MaterialIndentAllocationView: React.FC<MaterialIndentAllocationViewProps> = ({
  darkMode,
  warehouses = [],
  rawMaterials = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'indents' | 'allocations' | 'issues' | 'returns'>('indents');
  const [loading, setLoading] = useState(false);

  // Data lists
  const [indents, setIndents] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);

  // Indent Modal
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [indentPoId, setIndentPoId] = useState('');
  const [indentRmId, setIndentRmId] = useState('');
  const [indentQty, setIndentQty] = useState<number>(100);
  const [indentDate, setIndentDate] = useState(new Date().toISOString().split('T')[0]);
  const [indentRemarks, setIndentRemarks] = useState('');

  // Allocation Modal (Godown 1 -> Godown 2)
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocPoId, setAllocPoId] = useState('');
  const [allocRmId, setAllocRmId] = useState('');
  const [allocQty, setAllocQty] = useState<number>(100);
  const [allocSourceWh, setAllocSourceWh] = useState('');
  const [allocDestWh, setAllocDestWh] = useState('');
  const [allocBatch, setAllocBatch] = useState('');
  const [allocRemarks, setAllocRemarks] = useState('');

  // Issue to Floor Modal (Godown 2 -> Floor)
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issuePoId, setIssuePoId] = useState('');
  const [issueRmId, setIssueRmId] = useState('');
  const [issueQty, setIssueQty] = useState<number>(100);
  const [issueWhId, setIssueWhId] = useState('');
  const [issueRemarks, setIssueRemarks] = useState('');

  // Return to Godown Modal (Floor -> Godown 2)
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnPoId, setReturnPoId] = useState('');
  const [returnRmId, setReturnRmId] = useState('');
  const [returnQty, setReturnQty] = useState<number>(10);
  const [returnWhId, setReturnWhId] = useState('');
  const [returnReason, setReturnReason] = useState('Excess unused paper reel returned from floor');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchProductionOrders = async () => {
    try {
      const res = await fetch('/api/production/orders?limit=100');
      const data = await res.json();
      if (data.success) {
        setProductionOrders(data.data?.productionOrders || data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIndents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production/material-requests');
      const data = await res.json();
      if (data.success) {
        setIndents(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production/material-allocations');
      const data = await res.json();
      if (data.success) {
        setAllocations(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/production/material-issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionOrders();
    if (activeSubTab === 'indents') fetchIndents();
    if (activeSubTab === 'allocations') fetchAllocations();
    if (activeSubTab === 'issues') fetchIssues();
  }, [activeSubTab]);

  // Set default warehouses when available
  useEffect(() => {
    if (warehouses.length > 0) {
      const g1 = warehouses.find((w) => w.name.toLowerCase().includes('godown 1') || w.name.toLowerCase().includes('main') || w.name.toLowerCase().includes('raw'));
      const g2 = warehouses.find((w) => w.name.toLowerCase().includes('godown 2') || w.name.toLowerCase().includes('prod') || w.name.toLowerCase().includes('stage'));
      if (g1) setAllocSourceWh(g1.id);
      if (g2) {
        setAllocDestWh(g2.id);
        setIssueWhId(g2.id);
        setReturnWhId(g2.id);
      } else if (warehouses[1]) {
        setAllocDestWh(warehouses[1].id);
        setIssueWhId(warehouses[1].id);
        setReturnWhId(warehouses[1].id);
      }
    }
  }, [warehouses]);

  const handleCreateIndent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/production/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionOrderId: indentPoId || undefined,
          rawMaterialId: indentRmId,
          requiredQuantity: Number(indentQty),
          requiredDate: indentDate,
          remarks: indentRemarks,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create indent');

      setShowIndentModal(false);
      fetchIndents();
    } catch (err: any) {
      alert(err.message || 'Error creating indent');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIndent = async (id: string, reqNum: string) => {
    if (!confirm(`Are you sure you want to delete material indent "${reqNum}"? It will be moved to the Recycle Bin.`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/production/material-requests/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchIndents();
      } else {
        alert(data.error || 'Failed to delete indent');
      }
    } catch (err: any) {
      console.error('Error deleting indent:', err);
      alert(err.message || 'Error deleting indent');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/production/material-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionOrderId: allocPoId || undefined,
          rawMaterialId: allocRmId,
          quantity: Number(allocQty),
          sourceWarehouseId: allocSourceWh,
          destinationWarehouseId: allocDestWh,
          batchLotNumber: allocBatch,
          remarks: allocRemarks,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to allocate material');

      alert(data.message || 'Stock successfully transferred from Godown 1 to Godown 2!');
      setShowAllocModal(false);
      fetchAllocations();
    } catch (err: any) {
      alert(err.message || 'Error allocating material');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseAllocation = async (allocId: string) => {
    if (!confirm('Are you sure you want to release this allocation and return stock to Godown 1?')) return;
    try {
      const res = await fetch(`/api/production/material-allocations/${allocId}/release`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to release allocation');

      alert(data.message || 'Allocation released and stock restored to Godown 1');
      fetchAllocations();
    } catch (err: any) {
      alert(err.message || 'Error releasing allocation');
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/production/material-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionOrderId: issuePoId,
          rawMaterialId: issueRmId,
          quantityIssued: Number(issueQty),
          warehouseId: issueWhId,
          remarks: issueRemarks,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to issue material');

      alert(data.message || 'Material issued to production floor successfully!');
      setShowIssueModal(false);
      fetchIssues();
    } catch (err: any) {
      alert(err.message || 'Error issuing material');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/production/material-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionOrderId: returnPoId,
          rawMaterialId: returnRmId,
          quantityReturned: Number(returnQty),
          destinationWarehouseId: returnWhId,
          reason: returnReason,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to return material');

      alert(data.message || 'Unused material returned and credited back to warehouse inventory!');
      setShowReturnModal(false);
      if (activeSubTab === 'issues') fetchIssues();
    } catch (err: any) {
      alert(err.message || 'Error returning material');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Material Indents, Allocations & Floor Issues
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict Two-Godown Flow: Godown 1 (Main Store) → Godown 2 (Production Store) → Floor Issue & Returns
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'indents') fetchIndents();
              if (activeSubTab === 'allocations') fetchAllocations();
              if (activeSubTab === 'issues') fetchIssues();
            }}
            className={`p-2 rounded-lg border text-xs font-semibold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeSubTab === 'indents' && (
            <button
              type="button"
              onClick={() => setShowIndentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Material Indent</span>
            </button>
          )}

          {activeSubTab === 'allocations' && (
            <button
              type="button"
              onClick={() => setShowAllocModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Allocate (Godown 1 → Godown 2)</span>
            </button>
          )}

          {activeSubTab === 'issues' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return Unused to Godown 2</span>
              </button>
              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Issue Material to Floor</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('indents')}
          className={`py-2.5 border-b-2 transition-all ${
            activeSubTab === 'indents'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          1. Material Indents (Requests)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('allocations')}
          className={`py-2.5 border-b-2 transition-all ${
            activeSubTab === 'allocations'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          2. Material Allocation (Godown 1 → Godown 2)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('issues')}
          className={`py-2.5 border-b-2 transition-all ${
            activeSubTab === 'issues'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          3. Floor Issues & Material Returns
        </button>
      </div>

      {/* SUB-TAB 1: INDENTS */}
      {activeSubTab === 'indents' && (
        <div
          className={`rounded-xl border overflow-hidden shadow-xs ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading indents...</div>
          ) : indents.length === 0 ? (
            <div className="p-8 text-center">
              <Box className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Material Indents Found</p>
              <button
                type="button"
                onClick={() => setShowIndentModal(true)}
                className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs"
              >
                Raise First Indent
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">Indent #</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4">Production Order</th>
                    <th className="py-3 px-4 text-right">Required Qty</th>
                    <th className="py-3 px-4 text-right">Allocated Qty</th>
                    <th className="py-3 px-4 text-right">Issued Qty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Required Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {indents.map((ind) => (
                    <tr key={ind.id}>
                      <td className="py-3 px-4 font-semibold text-blue-600">{ind.requestNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{ind.rawMaterial?.name}</div>
                        <div className="text-[11px] text-slate-400">{ind.rawMaterial?.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        {ind.productionOrder ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {ind.productionOrder.orderNumber}
                            </span>
                            <div className="text-[11px] text-slate-400">{ind.productionOrder.product?.name}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">General Floor Indent</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {ind.requiredQuantity} {ind.rawMaterial?.unit || 'kg'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-600">
                        {ind.allocatedQuantity || 0} {ind.rawMaterial?.unit || 'kg'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">
                        {ind.issuedQuantity || 0} {ind.rawMaterial?.unit || 'kg'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ind.status === 'Issued'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : ind.status === 'Allocated'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {ind.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{ind.requiredDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteIndent(ind.id, ind.requestNumber)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors cursor-pointer"
                          title="Delete Indent (Move to Recycle Bin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ALLOCATIONS */}
      {activeSubTab === 'allocations' && (
        <div
          className={`rounded-xl border overflow-hidden shadow-xs ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading allocations...</div>
          ) : allocations.length === 0 ? (
            <div className="p-8 text-center">
              <ArrowLeftRight className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Stock Allocations Recorded</p>
              <button
                type="button"
                onClick={() => setShowAllocModal(true)}
                className="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs"
              >
                Create First Allocation (Godown 1 → Godown 2)
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">Allocation #</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4">Transfer Route</th>
                    <th className="py-3 px-4">Batch / Lot</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Linked Order</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {allocations.map((alc) => (
                    <tr key={alc.id}>
                      <td className="py-3 px-4 font-semibold text-blue-600">{alc.allocationNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{alc.rawMaterial?.name}</div>
                        <div className="text-[11px] text-slate-400">{alc.rawMaterial?.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {alc.sourceWarehouse?.name || 'Godown 1'}
                        </span>{' '}
                        →{' '}
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {alc.destinationWarehouse?.name || 'Godown 2'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{alc.batchLotNumber || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {alc.quantity} {alc.rawMaterial?.unit || 'kg'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {alc.productionOrder?.orderNumber || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            alc.status === 'Issued'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : alc.status === 'Allocated'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {alc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {alc.status === 'Allocated' && (
                          <button
                            type="button"
                            onClick={() => handleReleaseAllocation(alc.id)}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            Release back to G1
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: ISSUES & RETURNS */}
      {activeSubTab === 'issues' && (
        <div
          className={`rounded-xl border overflow-hidden shadow-xs ${
            darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading material issues...</div>
          ) : issues.length === 0 ? (
            <div className="p-8 text-center">
              <PackageCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Floor Material Issues Logged</p>
              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs"
              >
                Issue Material to Floor
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">Issue #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Production Order</th>
                    <th className="py-3 px-4">Raw Material</th>
                    <th className="py-3 px-4">Issued From</th>
                    <th className="py-3 px-4 text-right">Qty Issued</th>
                    <th className="py-3 px-4">Issued By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {issues.map((iss) => (
                    <tr key={iss.id}>
                      <td className="py-3 px-4 font-semibold text-blue-600">{iss.issueNumber}</td>
                      <td className="py-3 px-4 text-slate-500">{iss.issueDate}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {iss.productionOrder?.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">{iss.rawMaterial?.name}</div>
                        <div className="text-[11px] text-slate-400">{iss.rawMaterial?.code}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {iss.warehouse?.name || 'Godown 2 (Production Store)'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {iss.quantityIssued} {iss.rawMaterial?.unit || 'kg'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{iss.issuedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: RAISE INDENT */}
      {showIndentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Raise Material Indent</h3>
              <button type="button" onClick={() => setShowIndentModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateIndent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Target Production Order (Optional)
                </label>
                <select
                  value={indentPoId}
                  onChange={(e) => setIndentPoId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- General Stock Indent --</option>
                  {productionOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderNumber} - {po.product?.name} ({po.plannedQuantity} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Raw Material *
                </label>
                <select
                  required
                  value={indentRmId}
                  onChange={(e) => setIndentRmId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- Select Material / Paper Reel --</option>
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.code} - {rm.name} ({rm.category || 'Raw Material'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Required Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={indentQty}
                    onChange={(e) => setIndentQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Required Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={indentDate}
                    onChange={(e) => setIndentDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. For batch run flute B+C"
                  value={indentRemarks}
                  onChange={(e) => setIndentRemarks(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIndentModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Submit Indent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ALLOCATE (GODOWN 1 -> GODOWN 2) */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Allocate Material (G1 → G2)</h3>
              <button type="button" onClick={() => setShowAllocModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateAllocation} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Target Production Order (Optional)
                </label>
                <select
                  value={allocPoId}
                  onChange={(e) => setAllocPoId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- General Stock Allocation --</option>
                  {productionOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderNumber} - {po.product?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Raw Material *
                </label>
                <select
                  required
                  value={allocRmId}
                  onChange={(e) => setAllocRmId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- Select Material / Paper Reel --</option>
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.code} - {rm.name} (Stock: {rm.currentStock || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Source (Godown 1) *
                  </label>
                  <select
                    required
                    value={allocSourceWh}
                    onChange={(e) => setAllocSourceWh(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">-- Source Godown --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Destination (Godown 2) *
                  </label>
                  <select
                    required
                    value={allocDestWh}
                    onChange={(e) => setAllocDestWh(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">-- Dest Godown --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={allocQty}
                    onChange={(e) => setAllocQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Batch / Lot #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOT-2025-01"
                    value={allocBatch}
                    onChange={(e) => setAllocBatch(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAllocModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Confirm Transfer to G2
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE MATERIAL TO FLOOR */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Issue Material to Floor</h3>
              <button type="button" onClick={() => setShowIssueModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateIssue} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Target Production Order *
                </label>
                <select
                  required
                  value={issuePoId}
                  onChange={(e) => setIssuePoId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- Choose Production Order --</option>
                  {productionOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderNumber} - {po.product?.name} ({po.plannedQuantity} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Raw Material *
                </label>
                <select
                  required
                  value={issueRmId}
                  onChange={(e) => setIssueRmId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- Select Material / Reel --</option>
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.code} - {rm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Issuing Warehouse (Godown 2) *
                  </label>
                  <select
                    required
                    value={issueWhId}
                    onChange={(e) => setIssueWhId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">-- Warehouse --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={issueQty}
                    onChange={(e) => setIssueQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Issue to Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RETURN UNUSED MATERIAL TO GODOWN 2 */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Return Material from Floor</h3>
              <button type="button" onClick={() => setShowReturnModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateReturn} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Production Order *
                </label>
                <select
                  required
                  value={returnPoId}
                  onChange={(e) => setReturnPoId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- Choose Production Order --</option>
                  {productionOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.orderNumber} - {po.product?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Raw Material *
                </label>
                <select
                  required
                  value={returnRmId}
                  onChange={(e) => setReturnRmId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- Select Material / Reel --</option>
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.code} - {rm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Destination (Godown 2) *
                  </label>
                  <select
                    required
                    value={returnWhId}
                    onChange={(e) => setReturnWhId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">-- Warehouse --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Returned Qty (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Return Reason *
                </label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-900 rounded-lg"
                >
                  Confirm Return to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
