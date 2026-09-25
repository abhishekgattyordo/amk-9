import React, { useState, useMemo, useEffect } from 'react';
import { Truck, Plus, Search, Eye, Trash2, Calendar, FileText, AlertTriangle, Sparkles, Loader2, X, CheckCircle2 } from 'lucide-react';
import { InvoiceScanner, ExtractedInvoiceData } from '../common/InvoiceScanner';
import { UniversalServerSelect } from '../common/UniversalServerSelect';
import { formatLocalDateTime } from '../../utils/date-utils';

interface GateEntryViewProps {
  darkMode: boolean;
  gateEntries: any[];
  suppliers: any[];
  purchaseOrders: any[];
  warehouses: any[];
  rawMaterials: any[];
  currentUser?: any;
  getSupplierDisplayName: (supplierId?: string, supplierName?: string, millName?: string, supplierObj?: any) => string;
  onRefreshData?: () => Promise<void>;
  onAddNotification?: (notif: any) => void;
  onGateEntryCreated?: (newEntry: any) => void;
  onGateEntryDeleted?: (id: string) => void;
}

export const GateEntryView: React.FC<GateEntryViewProps> = ({
  darkMode,
  gateEntries = [],
  suppliers = [],
  purchaseOrders = [],
  warehouses = [],
  rawMaterials = [],
  currentUser,
  getSupplierDisplayName,
  onRefreshData,
  onAddNotification,
  onGateEntryCreated,
  onGateEntryDeleted
}) => {
  const effectiveWarehouses = warehouses || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeModalOpen, setIsGeModalOpen] = useState(false);
  const [selectedGe, setSelectedGe] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdatingInventory, setIsUpdatingInventory] = useState(false);

  useEffect(() => {
    if (gateEntries.length === 0 && onRefreshData) {
      onRefreshData();
    }
  }, []);

  useEffect(() => {
    if (isDetailModalOpen && selectedGe) {
      setIsLoadingHistory(true);
      fetch(`/api/audit-logs?entity=GateEntry&entityId=${selectedGe.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setHistory(data.data);
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isDetailModalOpen, selectedGe]);

  // New Gate Entry Form State supporting Multiple POs
  const [newGe, setNewGe] = useState({
    warehouseId: warehouses[0]?.id || '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    transportCompany: '',
    remarks: '',
    selectedPOs: [] as any[], // Array of selected PO objects
    items: [] as any[] // Flattened items from all selected POs
  });

  const [poSearchValue, setPoSearchValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const getTransporterName = (ge: any) => {
    if (!ge) return 'N/A';
    if (ge.transportCompany && ge.transportCompany !== 'N/A') return ge.transportCompany;
    if (ge.remarks) {
      const match = ge.remarks.match(/\[Transporter:\s*([^\]]+)\]/i);
      if (match && match[1]) return match[1].trim();
    }
    return 'N/A';
  };

  const getDriverPhoneNum = (ge: any) => {
    if (!ge) return 'N/A';
    if (ge.driverPhone && ge.driverPhone !== 'N/A') return ge.driverPhone;
    if (ge.remarks) {
      const match = ge.remarks.match(/\[Driver Phone:\s*([^\]]+)\]/i);
      if (match && match[1]) return match[1].trim();
    }
    return 'N/A';
  };

  const getSupplierForGe = (ge: any) => {
    if (!ge) return 'N/A';
    // Check linked purchase orders first
    if (ge.purchaseOrders && ge.purchaseOrders.length > 0) {
      const uniqueSuppliers = new Set();
      ge.purchaseOrders.forEach((link: any) => {
        const sup = link.purchaseOrder?.supplier;
        if (sup) {
          uniqueSuppliers.add(getSupplierDisplayName(sup.id, sup.supplierName, sup.millName, sup));
        } else if (link.purchaseOrder?.supplierName) {
          uniqueSuppliers.add(link.purchaseOrder.supplierName);
        }
      });
      if (uniqueSuppliers.size === 1) {
        return Array.from(uniqueSuppliers)[0];
      } else if (uniqueSuppliers.size > 1) {
        return 'Multiple Suppliers';
      }
    }
    if (ge.purchaseOrder?.supplier) {
      return getSupplierDisplayName(
        ge.purchaseOrder.supplier.id,
        ge.purchaseOrder.supplier.supplierName,
        ge.purchaseOrder.supplier.millName,
        ge.purchaseOrder.supplier
      );
    }
    if (ge.purchaseOrder?.supplierName) {
      return ge.purchaseOrder.supplierName;
    }
    const matchedPo = purchaseOrders.find(p => p.poNumber === ge.poNumber || p.id === ge.poId);
    if (matchedPo) {
      if (matchedPo.supplier) {
        return getSupplierDisplayName(
          matchedPo.supplier.id,
          matchedPo.supplier.supplierName,
          matchedPo.supplier.millName,
          matchedPo.supplier
        );
      }
      if (matchedPo.supplierName) return matchedPo.supplierName;
    }
    if (ge.supplierName) return ge.supplierName;
    return 'N/A';
  };

  const filteredGateEntries = useMemo(() => {
    if (!searchTerm.trim()) return gateEntries;
    const q = searchTerm.toLowerCase();
    return gateEntries.filter(ge => {
      const transporter = getTransporterName(ge);
      const supplier = getSupplierForGe(ge);
      const linkedPoNums = ge.purchaseOrders?.map((lp: any) => lp.purchaseOrder?.poNumber).join(' ') || ge.poNumber || '';
      return (
        (ge.gateEntryNumber && ge.gateEntryNumber.toLowerCase().includes(q)) ||
        (linkedPoNums.toLowerCase().includes(q)) ||
        (ge.vehicleNumber && ge.vehicleNumber.toLowerCase().includes(q)) ||
        (transporter && transporter.toLowerCase().includes(q)) ||
        (supplier && supplier.toLowerCase().includes(q)) ||
        (ge.driverName && ge.driverName.toLowerCase().includes(q)) ||
        (ge.items && ge.items.some((it: any) => it.materialName?.toLowerCase().includes(q) || it.materialCode?.toLowerCase().includes(q)))
      );
    });
  }, [gateEntries, searchTerm, purchaseOrders, suppliers]);

  const handleAddPoToGateEntry = (po: any) => {
    if (!po || !po.id) return;
    if (newGe.selectedPOs.some(p => p.id === po.id)) return; // already added

    const updatedPOs = [...newGe.selectedPOs, po];
    
    // Rebuild items list from all selected POs
    const allItems: any[] = [];
    updatedPOs.forEach(p => {
      if (p.items && p.items.length > 0) {
        p.items.forEach((poi: any) => {
          const ordered = Number(poi.quantityOrdered || 0);
          const receivedSoFar = Number(poi.quantityReceived || 0);
          const remaining = Math.max(0, ordered - receivedSoFar);
          allItems.push({
            purchaseOrderId: p.id,
            poNumber: p.poNumber,
            purchaseOrderItemId: poi.id,
            materialCode: poi.materialCode,
            materialName: poi.materialName,
            quantityOrdered: ordered,
            previouslyReceived: receivedSoFar,
            remainingQty: remaining,
            quantityReceived: remaining,
            quantityVerified: remaining,
            unit: poi.unit || 'Kg'
          });
        });
      }
    });

    setNewGe(prev => ({
      ...prev,
      selectedPOs: updatedPOs,
      items: allItems
    }));
    setPoSearchValue('');
  };

  const handleRemovePoFromGateEntry = (poId: string) => {
    const updatedPOs = newGe.selectedPOs.filter(p => p.id !== poId);
    const allItems: any[] = [];
    updatedPOs.forEach(p => {
      if (p.items && p.items.length > 0) {
        p.items.forEach((poi: any) => {
          const ordered = Number(poi.quantityOrdered || 0);
          const receivedSoFar = Number(poi.quantityReceived || 0);
          const remaining = Math.max(0, ordered - receivedSoFar);
          allItems.push({
            purchaseOrderId: p.id,
            poNumber: p.poNumber,
            purchaseOrderItemId: poi.id,
            materialCode: poi.materialCode,
            materialName: poi.materialName,
            quantityOrdered: ordered,
            previouslyReceived: receivedSoFar,
            remainingQty: remaining,
            quantityReceived: remaining,
            quantityVerified: remaining,
            unit: poi.unit || 'Kg'
          });
        });
      }
    });

    setNewGe(prev => ({
      ...prev,
      selectedPOs: updatedPOs,
      items: allItems
    }));
  };

  const handleItemQuantityChange = (index: number, field: 'quantityReceived' | 'quantityVerified', val: number) => {
    const updated = [...newGe.items];
    const item = { ...updated[index] };
    if (field === 'quantityReceived') {
      item.quantityReceived = val;
      // If verified qty exceeds new received qty, adjust verified qty
      if (item.quantityVerified > val) {
        item.quantityVerified = val;
      }
    } else {
      item.quantityVerified = val;
    }
    updated[index] = item;
    setNewGe(prev => ({ ...prev, items: updated }));
  };

  const handleAiInvoiceDataExtracted = async (extracted: ExtractedInvoiceData) => {
    setIsScanning(false);
    setIsMatching(true);
    setScanStatus('Matching extracted invoice with Purchase Orders & Suppliers...');

    try {
      const matchRes = await fetch('/api/procurement/match-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extracted)
      });
      const matchData = await matchRes.json();
      
      let matchedPo = null;
      if (matchData.success && matchData.data && matchData.data.poNumber) {
        matchedPo = purchaseOrders.find(p => p.poNumber === matchData.data.poNumber);
      }
      if (!matchedPo && extracted.invoiceNumber) {
        matchedPo = purchaseOrders.find(p => p.poNumber === extracted.invoiceNumber || p.id === extracted.invoiceNumber);
      }

      if (matchedPo) {
        handleAddPoToGateEntry(matchedPo);
      }

      setNewGe(prev => ({
        ...prev,
        vehicleNumber: extracted.vehicleNumber || prev.vehicleNumber,
        driverName: extracted.driverName || prev.driverName,
        transportCompany: extracted.transportCompany || prev.transportCompany,
      }));

      setScanStatus('Successfully extracted and matched invoice details!');
      setTimeout(() => setScanStatus(null), 3000);
    } catch (err) {
      console.error('Error matching scanned invoice:', err);
      setScanError('Failed to match invoice with database records.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleCreateGateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGe.selectedPOs.length === 0) {
      alert('Please select at least one Purchase Order.');
      return;
    }
    if (!newGe.vehicleNumber || !newGe.vehicleNumber.trim()) {
      alert('Please enter a vehicle number.');
      return;
    }
    if (!newGe.warehouseId) {
      alert('Please select a warehouse.');
      return;
    }

    // Validate quantities
    for (const it of newGe.items) {
      if (it.quantityReceived < 0 || it.quantityVerified < 0) {
        alert('Quantities cannot be negative.');
        return;
      }
      if (it.quantityVerified > it.quantityReceived) {
        alert(`Verified quantity cannot exceed received quantity for ${it.materialName}.`);
        return;
      }
      if (it.quantityReceived > it.remainingQty + 0.0001) {
        alert(`Received quantity (${it.quantityReceived}) cannot exceed remaining quantity (${it.remainingQty}) for PO Item ${it.materialName} (${it.poNumber}).`);
        return;
      }
    }

    const payload = {
      purchaseOrderIds: newGe.selectedPOs.map(p => p.id),
      poId: newGe.selectedPOs[0]?.id || null,
      poNumber: newGe.selectedPOs.map(p => p.poNumber).join(', '),
      warehouseId: newGe.warehouseId,
      vehicleNumber: newGe.vehicleNumber.trim(),
      driverName: newGe.driverName.trim(),
      driverPhone: newGe.driverPhone.trim(),
      transportCompany: newGe.transportCompany.trim(),
      remarks: newGe.remarks,
      items: newGe.items.map((it: any) => ({
        purchaseOrderId: it.purchaseOrderId,
        purchaseOrderItemId: it.purchaseOrderItemId,
        materialCode: it.materialCode,
        materialName: it.materialName,
        quantityReceived: Number(it.quantityReceived),
        quantityVerified: Number(it.quantityVerified),
        unit: it.unit || 'Kg'
      }))
    };

    try {
      const res = await fetch('/api/gate-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create gate entry');

      const entry = {
        ...data.data,
        arrivalDate: data.data.createdAt ? formatLocalDateTime(data.data.createdAt) : 'N/A',
        itemsReceived: data.data.items || []
      };

      if (onGateEntryCreated) onGateEntryCreated(entry);
      if (onAddNotification) {
        onAddNotification({
          title: 'Gate Entry Logged',
          message: `Gate Entry #${entry.gateEntryNumber} recorded for Vehicle ${entry.vehicleNumber} linking ${newGe.selectedPOs.length} PO(s).`,
          type: 'success',
          time: 'Just Now',
          module: 'Procurement'
        });
      }
      setIsGeModalOpen(false);
      setNewGe({
        warehouseId: warehouses[0]?.id || '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        transportCompany: '',
        remarks: '',
        selectedPOs: [],
        items: []
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error creating gate entry:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateInventoryForGe = async (geId: string) => {
    setIsUpdatingInventory(true);
    try {
      const res = await fetch(`/api/gate-entries/update-inventory?id=${geId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update inventory');

      alert('Inventory successfully updated with verified quantities!');
      setSelectedGe(data.data);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error updating inventory:', err);
      alert(`Failed to update inventory: ${err.message}`);
    } finally {
      setIsUpdatingInventory(false);
    }
  };

  const handleDeleteGateEntry = async (id: string, geNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete Gate Entry #${geNumber}?`)) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/gate-entries?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete');
      if (onGateEntryDeleted) onGateEntryDeleted(id);
      if (onAddNotification) {
        onAddNotification({
          title: 'Gate Entry Deleted',
          message: `Gate Entry #${geNumber} has been deleted.`,
          type: 'alert',
          time: 'Just Now',
          module: 'Procurement'
        });
      }
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error deleting gate entry:', err);
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Gate Entry Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Log incoming transport vehicles, link multiple Purchase Orders, and record verified material receipts.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search gate entries, PO, vehicle, supplier..."
              className={`pl-9 pr-4 py-2 rounded-xl border text-xs w-64 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
            />
          </div>
          <button
            onClick={() => setIsGeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Gate Entry</span>
          </button>
        </div>
      </div>

      {/* Gate Entry Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <th className="p-3">Gate Entry No. / PO(s)</th>
                <th className="p-3">Supplier(s)</th>
                <th className="p-3">Vehicle Detail</th>
                <th className="p-3">Transporter</th>
                <th className="p-3">Warehouse</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
              {filteredGateEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
                    <p className="font-medium">No gate entry records found.</p>
                  </td>
                </tr>
              ) : (
                filteredGateEntries.map(ge => {
                  const transporter = getTransporterName(ge);
                  const driverPhone = getDriverPhoneNum(ge);
                  const supplierName = getSupplierForGe(ge);
                  const linkedPos = ge.purchaseOrders?.map((lp: any) => lp.purchaseOrder?.poNumber).filter(Boolean) || (ge.poNumber ? [ge.poNumber] : []);

                  return (
                    <tr key={ge.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td 
                        className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline"
                        onClick={() => {
                          setSelectedGe(ge);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        {ge.gateEntryNumber}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">
                          {linkedPos.length > 0 ? linkedPos.join(', ') : 'No PO'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {supplierName}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-amber-600 dark:text-amber-400">{ge.vehicleNumber}</span>
                        <span className="text-slate-600 dark:text-slate-400 block text-[10px]">{ge.driverName || 'N/A'} ({driverPhone})</span>
                      </td>
                      <td className="p-3 text-slate-900 dark:text-slate-100 font-semibold">
                        {transporter !== 'N/A' ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800/50">
                            {transporter}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                        {ge.warehouse?.name || (warehouses.find(w => w.id === ge.warehouseId)?.name || 'N/A')}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          ge.inventoryUpdated || ge.status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {ge.inventoryUpdated || ge.status === 'Verified' ? 'Inventory Updated' : (ge.status || 'Entered')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{formatLocalDateTime(ge.arrivalDate || ge.entryTime || ge.createdAt)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedGe(ge);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                            title="View Gate Entry"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGateEntry(ge.id, ge.gateEntryNumber)}
                            disabled={isDeleting === ge.id}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                            title="Delete Gate Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE GATE ENTRY MODAL */}
      {isGeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-3xl shadow-2xl border p-6 relative max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsGeModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold mb-1 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <span>Create Gate Entry (Multi-PO Support)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Select one or multiple Purchase Orders to receive items against in this Gate Entry.</p>

            {/* AI Invoice Scanner helper */}
            <div className="mb-4">
              <InvoiceScanner
                darkMode={darkMode}
                onDataExtracted={handleAiInvoiceDataExtracted}
              />
              {(isScanning || isMatching) && (
                <div className="mt-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-400">{scanStatus || 'Processing...'}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateGateEntry} className="space-y-4">
              {/* PO Multi-select Search */}
              <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Select Purchase Orders *</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <UniversalServerSelect
                      endpoint="/api/purchase-orders"
                      value=""
                      onChange={(id, po) => {
                        if (po) handleAddPoToGateEntry(po);
                      }}
                      placeholder="Search and select PO (e.g. PO-001)..."
                      searchPlaceholder="Search PO number or supplier..."
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                {/* Selected POs Badges */}
                {newGe.selectedPOs.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {newGe.selectedPOs.map(po => {
                      const supName = po.supplier?.supplierName || suppliers.find(s => s.id === po.supplierId)?.supplierName || 'Supplier';
                      return (
                        <div key={po.id} className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-indigo-300' : 'bg-white border-indigo-200 text-indigo-700 shadow-sm'}`}>
                          <span>{po.poNumber} — {supName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePoFromGateEntry(po.id)}
                            className="p-0.5 rounded-full hover:bg-rose-500/20 text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No Purchase Orders selected yet. Search above to add one or more POs.</p>
                )}
              </div>

              {/* Items Receiving Table */}
              {newGe.items.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Receiving Items from Selected POs</label>
                  <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b font-bold uppercase text-[10px] ${darkMode ? 'bg-slate-800 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                          <th className="p-2.5">PO Number</th>
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5">Ordered</th>
                          <th className="p-2.5">Prev. Rec.</th>
                          <th className="p-2.5">Remaining</th>
                          <th className="p-2.5">Received Qty</th>
                          <th className="p-2.5">Verified Qty</th>
                          <th className="p-2.5">UOM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                        {newGe.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{it.poNumber}</td>
                            <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                              {it.materialName}
                              <span className="block text-[10px] font-normal text-slate-400">{it.materialCode}</span>
                            </td>
                            <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">{it.quantityOrdered.toLocaleString()}</td>
                            <td className="p-2.5 font-medium text-slate-500">{it.previouslyReceived.toLocaleString()}</td>
                            <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{it.remainingQty.toLocaleString()}</td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                max={it.remainingQty}
                                step="any"
                                value={it.quantityReceived}
                                onChange={(e) => handleItemQuantityChange(idx, 'quantityReceived', parseFloat(e.target.value) || 0)}
                                className={`w-24 px-2 py-1 rounded-lg border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                max={it.quantityReceived}
                                step="any"
                                value={it.quantityVerified}
                                onChange={(e) => handleItemQuantityChange(idx, 'quantityVerified', parseFloat(e.target.value) || 0)}
                                className={`w-24 px-2 py-1 rounded-lg border text-xs font-bold text-emerald-600 dark:text-emerald-400 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}
                              />
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400 font-medium">{it.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Warehouse *</label>
                  <select
                    id="gate-entry-warehouse-select"
                    required
                    value={newGe.warehouseId}
                    onChange={(e) => setNewGe({ ...newGe, warehouseId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  >
                    <option value="" className="text-slate-500">-- Select Warehouse --</option>
                    {effectiveWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">
                        {wh.name} {wh.code ? `(${wh.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-01-EF-1234"
                    value={newGe.vehicleNumber}
                    onChange={(e) => setNewGe({ ...newGe, vehicleNumber: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="Driver name"
                    value={newGe.driverName}
                    onChange={(e) => setNewGe({ ...newGe, driverName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={newGe.driverPhone}
                    onChange={(e) => setNewGe({ ...newGe, driverPhone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Transporter</label>
                  <input
                    type="text"
                    placeholder="Transport company"
                    value={newGe.transportCompany}
                    onChange={(e) => setNewGe({ ...newGe, transportCompany: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery remarks..."
                  value={newGe.remarks}
                  onChange={(e) => setNewGe({ ...newGe, remarks: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsGeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Record Gate Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedGe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl border p-6 relative max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <span>Gate Entry: {selectedGe.gateEntryNumber}</span>
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedGe.inventoryUpdated || selectedGe.status === 'Verified'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {selectedGe.inventoryUpdated || selectedGe.status === 'Verified' ? 'Inventory Updated' : (selectedGe.status || 'Entered')}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-2xl ${darkMode ? 'bg-slate-800/40' : 'bg-slate-100'}`}>
                <div><span className="text-slate-500 dark:text-slate-400">Supplier(s):</span> <span className="font-bold text-slate-900 dark:text-slate-100 block">{getSupplierForGe(selectedGe)}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Arrival Date:</span> <span className="font-medium text-slate-800 dark:text-slate-200 block">{formatLocalDateTime(selectedGe.arrivalDate || selectedGe.entryTime || selectedGe.createdAt)}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Vehicle:</span> <span className="font-bold text-amber-600 dark:text-amber-400 block">{selectedGe.vehicleNumber}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Transporter:</span> <span className="font-bold text-indigo-600 dark:text-indigo-300 block">{getTransporterName(selectedGe)}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Driver:</span> <span className="font-medium text-slate-800 dark:text-slate-200 block">{selectedGe.driverName || 'N/A'} ({getDriverPhoneNum(selectedGe)})</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Warehouse:</span> <span className="font-medium text-slate-800 dark:text-slate-200 block">{selectedGe.warehouse?.name || 'Main Warehouse'}</span></div>
              </div>

              {/* Linked Purchase Orders */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">Linked Purchase Orders</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGe.purchaseOrders && selectedGe.purchaseOrders.length > 0 ? (
                    selectedGe.purchaseOrders.map((link: any, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800/50">
                        {link.purchaseOrder?.poNumber || 'PO'}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs">{selectedGe.poNumber || 'N/A'}</span>
                  )}
                </div>
              </div>

              {/* Received & Verified Items Table */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">Received & Verified Items</h4>
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b font-bold uppercase text-[10px] ${darkMode ? 'bg-slate-800 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        <th className="p-2.5">PO</th>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-right">Received</th>
                        <th className="p-2.5 text-right">Verified</th>
                        <th className="p-2.5">UOM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {(selectedGe.items || selectedGe.itemsReceived || []).map((it: any, idx: number) => {
                        const poNum = it.purchaseOrder?.poNumber || selectedGe.purchaseOrders?.find((lp: any) => lp.purchaseOrderId === it.purchaseOrderId)?.purchaseOrder?.poNumber || selectedGe.poNumber || 'PO';
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{poNum}</td>
                            <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                              {it.materialName}
                              <span className="block text-[10px] font-normal text-slate-400">{it.materialCode}</span>
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{(it.quantityReceived || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">{(it.quantityVerified !== undefined ? it.quantityVerified : it.quantityReceived || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400 font-medium">{it.unit || 'Kg'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedGe.remarks && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">Remarks:</span>
                  <p className={`mt-1 p-2.5 rounded-xl text-slate-800 dark:text-slate-300 ${darkMode ? 'bg-slate-800/30' : 'bg-slate-100'}`}>{selectedGe.remarks}</p>
                </div>
              )}

              {/* Audit History */}
              <div className="pt-4 border-t border-slate-800/40">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">Activity History</h4>
                {isLoadingHistory ? (
                  <p className="text-xs text-slate-500">Loading history...</p>
                ) : history.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {history.map((log: any) => (
                      <div key={log.id} className="text-[10px] p-2 rounded bg-slate-100 dark:bg-slate-800/50">
                        <span className="font-bold text-slate-900 dark:text-slate-200">[{log.action}]</span> {log.details}
                        <span className="text-slate-500 block">{new Date(log.timestamp).toLocaleString()} by {log.user || 'System'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No activity history found.</p>
                )}
              </div>

              {/* Action Button: Update Inventory */}
              <div className="pt-4 border-t border-slate-800/40 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  {selectedGe.inventoryUpdated ? '✓ Verified stock posted to inventory.' : 'Click to post verified quantities to warehouse stock.'}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateInventoryForGe(selectedGe.id)}
                  disabled={isUpdatingInventory}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-lg flex items-center space-x-2 transition-all cursor-pointer ${
                    selectedGe.inventoryUpdated
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  }`}
                >
                  {isUpdatingInventory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Inventory...</span>
                    </>
                  ) : selectedGe.inventoryUpdated ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Inventory Again (Idempotent)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Inventory</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
