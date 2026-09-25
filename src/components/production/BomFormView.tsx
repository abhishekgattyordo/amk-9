import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Layers,
  HelpCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { BillOfMaterial, Product, RawMaterial } from '../../types';

interface BomFormViewProps {
  darkMode: boolean;
  bomId?: string | null;
  products: Product[];
  rawMaterials: RawMaterial[];
  onBack: () => void;
  onSaved: () => void;
}

export const BomFormView: React.FC<BomFormViewProps> = ({
  darkMode,
  bomId,
  products,
  rawMaterials,
  onBack,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [fluteType, setFluteType] = useState('BC-Flute (5-Ply)');
  const [ply, setPly] = useState<number>(5);
  const [deckleSizeMm, setDeckleSizeMm] = useState<number>(1400);
  const [cutSizeMm, setCutSizeMm] = useState<number>(1050);
  const [totalWeightGrams, setTotalWeightGrams] = useState<number>(450);
  const [status, setStatus] = useState<'Active' | 'Draft' | 'Archived'>('Active');
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState<
    Array<{
      id?: string;
      layer: string;
      materialId?: string;
      materialCode?: string;
      materialName: string;
      gsm?: number;
      quantityPerUnit: number;
      unit: string;
      unitCost: number;
      totalCost: number;
    }>
  >([
    { layer: 'Top Liner (Outer)', materialName: 'Semi-Kraft Liner 180 GSM', gsm: 180, quantityPerUnit: 0.12, unit: 'Kg', unitCost: 0.85, totalCost: 0.102 },
    { layer: 'Fluting Medium 1', materialName: 'High-Strength Fluting 140 GSM', gsm: 140, quantityPerUnit: 0.14, unit: 'Kg', unitCost: 0.72, totalCost: 0.101 },
    { layer: 'Center Liner', materialName: 'Testliner / Kraft 150 GSM', gsm: 150, quantityPerUnit: 0.10, unit: 'Kg', unitCost: 0.75, totalCost: 0.075 },
    { layer: 'Fluting Medium 2', materialName: 'Fluting Medium 120 GSM', gsm: 120, quantityPerUnit: 0.13, unit: 'Kg', unitCost: 0.68, totalCost: 0.088 },
    { layer: 'Bottom Liner (Inner)', materialName: 'Natural Kraft Liner 150 GSM', gsm: 150, quantityPerUnit: 0.10, unit: 'Kg', unitCost: 0.78, totalCost: 0.078 },
    { layer: 'Adhesives / Starch', materialName: 'Corn Starch Adhesive formulation', gsm: 0, quantityPerUnit: 0.03, unit: 'Kg', unitCost: 0.50, totalCost: 0.015 },
  ]);

  // Load existing BOM if editing
  useEffect(() => {
    if (!bomId) {
      if (products.length > 0 && !productId) {
        setProductId(products[0].id);
        setName(`${products[0].name} Standard 5-Ply BOM`);
      }
      return;
    }

    const loadBom = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/production/boms?id=${bomId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const b = data.data;
          setName(b.name || '');
          setProductId(b.productId || '');
          setFluteType(b.fluteType || 'BC-Flute (5-Ply)');
          setPly(b.ply || 5);
          setDeckleSizeMm(b.deckleSizeMm || 0);
          setCutSizeMm(b.cutSizeMm || 0);
          setTotalWeightGrams(b.totalWeightGrams || 0);
          setStatus(b.status || 'Active');
          setNotes(b.notes || '');
          if (b.items && b.items.length > 0) {
            setItems(
              b.items.map((i: any) => ({
                id: i.id,
                layer: i.layer,
                materialId: i.materialId || '',
                materialCode: i.materialCode || '',
                materialName: i.materialName,
                gsm: i.gsm || 0,
                quantityPerUnit: i.quantityPerUnit,
                unit: i.unit || 'Kg',
                unitCost: i.unitCost || 0,
                totalCost: i.totalCost || 0,
              }))
            );
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadBom();
  }, [bomId, products]);

  // Handle product selection change
  const handleProductSelect = (pId: string) => {
    setProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod && !name) {
      setName(`${prod.name} Corrugated Recipe`);
    }
  };

  // Add new layer item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        layer: `Layer ${prev.length + 1}`,
        materialName: 'Kraft Paper',
        gsm: 150,
        quantityPerUnit: 0.1,
        unit: 'Kg',
        unitCost: 0.75,
        totalCost: 0.075,
      },
    ]);
  };

  // Remove layer item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // If material selected from raw materials
      if (field === 'materialId') {
        const mat = rawMaterials.find((m) => m.id === value);
        if (mat) {
          item.materialName = mat.name;
          item.materialCode = mat.code;
          item.gsm = mat.gsm || item.gsm;
          item.unitCost = (mat as any).purchasePrice || item.unitCost || 0.75;
          item.unit = mat.uom || 'Kg';
        }
      }

      // Recalculate total cost
      if (field === 'quantityPerUnit' || field === 'unitCost' || field === 'materialId') {
        item.totalCost = Number(((item.quantityPerUnit || 0) * (item.unitCost || 0)).toFixed(3));
      }

      updated[index] = item;
      return updated;
    });
  };

  const calculatedTotalCost = items.reduce((sum, it) => sum + (it.totalCost || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !productId) {
      setError('Please provide a BOM name and select a product.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one corrugated layer/material component.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name,
        productId,
        fluteType,
        ply,
        deckleSizeMm: Number(deckleSizeMm) || null,
        cutSizeMm: Number(cutSizeMm) || null,
        totalWeightGrams: Number(totalWeightGrams) || null,
        estimatedCost: Number(calculatedTotalCost.toFixed(2)),
        status,
        notes,
        items,
      };

      const url = '/api/production/boms';
      const method = bomId ? 'PUT' : 'POST';
      const body = bomId ? { id: bomId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save BOM');
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the BOM.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {bomId ? 'Edit Corrugated BOM' : 'Create New Bill of Materials (BOM)'}
            </h2>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Configure multi-layer paper grammages, flute geometry, and unit material recipe
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onBack}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
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
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving BOM...' : bomId ? 'Update BOM' : 'Save BOM'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* General Specs Card */}
      <div
        className={`p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Basic Product & Flute Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              BOM Formula Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master Carton 5-Ply Export Grade BOM"
              className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Target Finished Product *
            </label>
            <select
              value={productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg text-xs border outline-none cursor-pointer ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            >
              <option value="">Select a Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Flute Geometry & Ply Type
            </label>
            <select
              value={fluteType}
              onChange={(e) => {
                setFluteType(e.target.value);
                if (e.target.value.includes('3-Ply')) setPly(3);
                else if (e.target.value.includes('5-Ply')) setPly(5);
                else if (e.target.value.includes('7-Ply')) setPly(7);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs border outline-none cursor-pointer ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
              }`}
            >
              <option value="B-Flute (3-Ply Single Wall)">B-Flute (3-Ply Single Wall)</option>
              <option value="C-Flute (3-Ply Single Wall)">C-Flute (3-Ply Single Wall)</option>
              <option value="BC-Flute (5-Ply Double Wall)">BC-Flute (5-Ply Double Wall)</option>
              <option value="E-Flute (3-Ply Micro Flute)">E-Flute (3-Ply Micro Flute)</option>
              <option value="AAA-Flute (7-Ply Heavy Duty)">AAA-Flute (7-Ply Heavy Duty)</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Corrugator Deckle Size (mm)
            </label>
            <input
              type="number"
              value={deckleSizeMm}
              onChange={(e) => setDeckleSizeMm(Number(e.target.value))}
              placeholder="e.g. 1400"
              className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Cut Length (mm)
            </label>
            <input
              type="number"
              value={cutSizeMm}
              onChange={(e) => setCutSizeMm(Number(e.target.value))}
              placeholder="e.g. 1050"
              className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Total Unit Weight (grams)
            </label>
            <input
              type="number"
              value={totalWeightGrams}
              onChange={(e) => setTotalWeightGrams(Number(e.target.value))}
              placeholder="e.g. 450"
              className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Layer breakdown / Raw Material items */}
      <div
        className={`p-5 rounded-xl border space-y-4 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Corrugated Board Layers & Material Recipe
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Select Kraft reels, fluting medium, starch adhesives, and stitching allowances
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Layer</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border grid grid-cols-1 sm:grid-cols-12 gap-3 items-center ${
                darkMode ? 'bg-slate-850/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="sm:col-span-3">
                <label className="text-[10px] text-slate-400 block mb-1">Layer Role / Position</label>
                <input
                  type="text"
                  value={item.layer}
                  onChange={(e) => handleItemChange(idx, 'layer', e.target.value)}
                  placeholder="e.g. Top Liner"
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] text-slate-400 block mb-1">Raw Material Link (Reel / Chemical)</label>
                <select
                  value={item.materialId || ''}
                  onChange={(e) => handleItemChange(idx, 'materialId', e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded text-xs border outline-none cursor-pointer ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">Manual: {item.materialName}</option>
                  {rawMaterials.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.code} - {rm.gsm} GSM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="text-[10px] text-slate-400 block mb-1">GSM</label>
                <input
                  type="number"
                  value={item.gsm || ''}
                  onChange={(e) => handleItemChange(idx, 'gsm', Number(e.target.value))}
                  placeholder="GSM"
                  className={`w-full px-2 py-1.5 rounded text-xs border outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 block mb-1">Qty / Box ({item.unit})</label>
                <input
                  type="number"
                  step="0.001"
                  value={item.quantityPerUnit}
                  onChange={(e) => handleItemChange(idx, 'quantityPerUnit', parseFloat(e.target.value) || 0)}
                  className={`w-full px-2 py-1.5 rounded text-xs border outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-1 text-right">
                <label className="text-[10px] text-slate-400 block mb-1">Cost / Box</label>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block py-1.5">
                  ${item.totalCost?.toFixed(3)}
                </span>
              </div>

              <div className="sm:col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors"
                  title="Remove Layer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cost Summary Banner */}
        <div
          className={`p-4 rounded-lg flex items-center justify-between border ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div>
            <span className="text-xs font-bold block">Estimated Material Cost per Finished Box</span>
            <span className="text-[11px] text-slate-400">
              Includes {items.length} layers (liners, fluting medium, adhesives)
            </span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ${calculatedTotalCost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div
        className={`p-5 rounded-xl border space-y-2 ${
          darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <label className={`block text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          Production Remarks & Instructions
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special starch viscosity guidelines, deckle trim allowance, moisture retention parameters..."
          className={`w-full px-3 py-2 rounded-lg text-xs border outline-none ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500'
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
          }`}
        />
      </div>
    </form>
  );
};
