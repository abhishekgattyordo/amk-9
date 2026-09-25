import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  ShieldCheck,
  Boxes,
  FileText,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  MapPin,
} from 'lucide-react';
import { QualityCheckItem, Warehouse } from '../../types';

interface QCInspectionFormModalProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: string;
  warehouses?: Warehouse[];
}

export const QCInspectionFormModal: React.FC<QCInspectionFormModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  onSuccess,
  initialType = 'Reel Inward QC',
  warehouses = [],
}) => {
  const [qcType, setQcType] = useState<string>(initialType);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Candidate queues
  const [candidateReels, setCandidateReels] = useState<any[]>([]);
  const [candidateSampleSOs, setCandidateSampleSOs] = useState<any[]>([]);
  const [candidateWorkOrders, setCandidateWorkOrders] = useState<any[]>([]);

  // Selected Reference
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>('');
  const [selectedReferenceObj, setSelectedReferenceObj] = useState<any>(null);

  // General QC Fields
  const [inspectorName, setInspectorName] = useState('Sunita Menon (QC Lead)');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [stage, setStage] = useState('Final Finished Box Inspection');
  const [expectedQty, setExpectedQty] = useState<number>(0);
  const [inspectedQty, setInspectedQty] = useState<number>(1);
  const [passedQty, setPassedQty] = useState<number>(1);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [status, setStatus] = useState<'Approved' | 'Rejected' | 'Partially Approved' | 'Pending'>('Approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [remarks, setRemarks] = useState('');

  // Specialized Test Parameters
  const [burstingFactor, setBurstingFactor] = useState<number>(24);
  const [burstingStrength, setBurstingStrength] = useState<number>(14.5);
  const [moisturePercent, setMoisturePercent] = useState<number>(8.2);
  const [boxCompressionTest, setBoxCompressionTest] = useState<number>(380);
  const [caliperThicknessMm, setCaliperThicknessMm] = useState<number>(6.5);
  const [dimensionCheck, setDimensionCheck] = useState('Pass');
  const [printQuality, setPrintQuality] = useState('Pass');
  const [jointStrength, setJointStrength] = useState('Pass');
  const [dropTest, setDropTest] = useState('Pass');

  // Reel Inspection Items Table
  const [reelRows, setReelRows] = useState<QualityCheckItem[]>([]);

  // Load candidates when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchCandidates = async () => {
      try {
        setLoadingCandidates(true);
        const res = await fetch('/api/quality-checks?mode=pending-queue');
        const json = await res.json();
        if (json.success && json.data) {
          setCandidateReels(json.data.pendingReels || []);
          setCandidateSampleSOs(json.data.sampleSalesOrders || []);
          setCandidateWorkOrders(json.data.activeWorkOrders || []);

          // Auto select first candidate if available
          if (qcType === 'Reel Inward QC' && json.data.pendingReels?.length > 0) {
            handleSelectReelCandidate(json.data.pendingReels[0]);
          } else if (qcType === 'Sample SO QC' && json.data.sampleSalesOrders?.length > 0) {
            handleSelectSampleCandidate(json.data.sampleSalesOrders[0]);
          } else if (json.data.activeWorkOrders?.length > 0) {
            handleSelectWoCandidate(json.data.activeWorkOrders[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching candidates:', err);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [isOpen]);

  // Handle Type Change
  const handleTypeChange = (newType: string) => {
    setQcType(newType);
    setSelectedReferenceId('');
    setSelectedReferenceObj(null);
    setReelRows([]);

    if (newType === 'Reel Inward QC') {
      setStage('Raw Paper Reel Inward');
      if (candidateReels.length > 0) handleSelectReelCandidate(candidateReels[0]);
    } else if (newType === 'Sample SO QC') {
      setStage('Sample Evaluation');
      if (candidateSampleSOs.length > 0) handleSelectSampleCandidate(candidateSampleSOs[0]);
    } else if (newType === 'Production QC') {
      setStage('In-Process Corrugation / Fluting');
      if (candidateWorkOrders.length > 0) handleSelectWoCandidate(candidateWorkOrders[0]);
    } else {
      setStage('Final Finished Box Inspection');
      if (candidateWorkOrders.length > 0) handleSelectWoCandidate(candidateWorkOrders[0]);
    }
  };

  const handleSelectReelCandidate = (reel: any) => {
    setSelectedReferenceId(reel.id);
    setSelectedReferenceObj(reel);
    setExpectedQty(reel.expectedWeight || reel.weight || 1000);

    const items = reel.items || [];
    if (items.length > 0) {
      const rows: QualityCheckItem[] = items.map((it: any, idx: number) => ({
        slNo: idx + 1,
        reelNo: it.reelNumber,
        deckle: reel.deckle || 140,
        gsm: it.gsm || reel.gsm || 180,
        observationGsm: it.gsm || reel.gsm || 180,
        bf: it.bf || reel.bf || 22,
        observationBf: it.bf || reel.bf || 22,
        netWeight: it.weight || 500,
        actualWeight: it.weight || 500,
        moisturePercent: 7.5,
        result: 'Passed',
        status: 'PASSED',
        remarks: 'Optimal GSM and BF',
      }));
      setReelRows(rows);
      setInspectedQty(rows.length);
      setPassedQty(rows.length);
      setRejectedQty(0);
    } else {
      setReelRows([
        {
          slNo: 1,
          reelNo: reel.reelNumber || reel.inwardNumber || 'REEL-001',
          deckle: reel.deckle || 140,
          gsm: reel.gsm || 180,
          observationGsm: reel.gsm || 180,
          bf: reel.bf || 22,
          observationBf: reel.bf || 22,
          netWeight: reel.weight || 500,
          actualWeight: reel.weight || 500,
          moisturePercent: 7.5,
          result: 'Passed',
          status: 'PASSED',
          remarks: 'Nominal surface and BF',
        },
      ]);
      setInspectedQty(1);
      setPassedQty(1);
      setRejectedQty(0);
    }
  };

  const handleSelectSampleCandidate = (so: any) => {
    setSelectedReferenceId(so.id);
    setSelectedReferenceObj(so);
    setExpectedQty(so.quantity || 10);
    setInspectedQty(so.quantity || 10);
    setPassedQty(so.quantity || 10);
    setRejectedQty(0);
  };

  const handleSelectWoCandidate = (wo: any) => {
    setSelectedReferenceId(wo.id);
    setSelectedReferenceObj(wo);
    setExpectedQty(wo.orderedQuantity || 5000);
    setInspectedQty(Math.min(50, wo.orderedQuantity || 50));
    setPassedQty(Math.min(50, wo.orderedQuantity || 50));
    setRejectedQty(0);
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setSubmitting(true);

      let payload: any = {
        qcType,
        stage,
        inspector: inspectorName,
        inspectionDate,
        testedAt: new Date().toISOString(),
        expectedQuantity: Number(expectedQty),
        inspectedQuantity: Number(inspectedQty),
        passedQuantity: Number(passedQty),
        rejectedQuantity: Number(rejectedQty),
        status,
        result: status,
        rejectionReason: status === 'Rejected' || status === 'Partially Approved' ? rejectionReason : null,
        rootCause: status === 'Rejected' || status === 'Partially Approved' ? rootCause : null,
        correctiveAction: status === 'Rejected' || status === 'Partially Approved' ? correctiveAction : null,
        remarks,
      };

      if (qcType === 'Reel Inward QC') {
        payload.reelInwardId = selectedReferenceId;
        payload.referenceNumber = selectedReferenceObj?.inwardNumber || selectedReferenceObj?.reelNumber;
        payload.referenceType = 'Reel Inward';
        payload.parameters = JSON.stringify(reelRows);
      } else if (qcType === 'Sample SO QC') {
        payload.salesOrderId = selectedReferenceId;
        payload.productId = selectedReferenceObj?.productId;
        payload.referenceNumber = selectedReferenceObj?.soNumber;
        payload.referenceType = 'Sales Order';
        payload.parameters = JSON.stringify([
          {
            burstingFactor,
            burstingStrength,
            dimensionCheck,
            printQuality,
            jointStrength,
            dropTest,
            status: status === 'Approved' ? 'PASSED' : 'FAILED',
          },
        ]);
      } else {
        payload.workOrderId = selectedReferenceId;
        payload.productId = selectedReferenceObj?.productId;
        payload.referenceNumber = selectedReferenceObj?.woNumber;
        payload.referenceType = 'Work Order';
        payload.parameters = JSON.stringify([
          {
            burstingFactor,
            burstingStrength,
            boxCompressionTest,
            caliperThicknessMm,
            moisturePercent,
            dimensionCheck,
            printQuality,
            dropTest,
            status: status === 'Approved' ? 'PASSED' : 'FAILED',
          },
        ]);
      }

      const res = await fetch('/api/quality-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record QC inspection');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving QC inspection:', err);
      setErrorMsg(err.message || 'Error saving inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-4xl my-8 rounded-2xl border shadow-2xl p-6 space-y-5 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Record Quality Control Inspection</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log laboratory observations, verify tolerance thresholds, and certify release.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inspection Category Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'Reel Inward QC', label: 'Reel Inward QC', icon: Boxes },
              { id: 'Sample SO QC', label: 'Sample SO QC', icon: FileText },
              { id: 'Production QC', label: 'In-Process QC', icon: Layers },
              { id: 'Final QC', label: 'Final Box QC', icon: ShieldCheck },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = qcType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : darkMode
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Reference Selection & General Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Candidate Selector */}
            <div>
              <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                Select Reference Order / Item *
              </label>
              {qcType === 'Reel Inward QC' && (
                <select
                  value={selectedReferenceId}
                  onChange={(e) => {
                    const found = candidateReels.find((r) => r.id === e.target.value);
                    if (found) handleSelectReelCandidate(found);
                  }}
                  required
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">-- Choose Reel Inward --</option>
                  {candidateReels.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.inwardNumber || r.reelNumber} - {r.supplier?.name || 'Supplier'} ({r.weight || 0} Kg)
                    </option>
                  ))}
                </select>
              )}

              {qcType === 'Sample SO QC' && (
                <select
                  value={selectedReferenceId}
                  onChange={(e) => {
                    const found = candidateSampleSOs.find((s) => s.id === e.target.value);
                    if (found) handleSelectSampleCandidate(found);
                  }}
                  required
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">-- Choose Sample SO --</option>
                  {candidateSampleSOs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.soNumber} - {s.customerName} ({s.productName || s.product?.name})
                    </option>
                  ))}
                </select>
              )}

              {(qcType === 'Production QC' || qcType === 'Final QC') && (
                <select
                  value={selectedReferenceId}
                  onChange={(e) => {
                    const found = candidateWorkOrders.find((w) => w.id === e.target.value);
                    if (found) handleSelectWoCandidate(found);
                  }}
                  required
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">-- Choose Work Order --</option>
                  {candidateWorkOrders.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.woNumber} - {w.productName || w.product?.name} ({w.orderedQuantity} pcs)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Inspector Name */}
            <div>
              <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                Lead Inspector Name *
              </label>
              <input
                type="text"
                required
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            {/* Inspection Date */}
            <div>
              <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
                Inspection Date *
              </label>
              <input
                type="date"
                required
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Specialized Observation Inputs */}
          {qcType === 'Reel Inward QC' ? (
            /* Reel Inward Parameters Table */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Paper Reel Inspection & Measurements
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setReelRows((prev) => [
                      ...prev,
                      {
                        slNo: prev.length + 1,
                        reelNo: `REEL-${Date.now().toString().slice(-4)}`,
                        deckle: 140,
                        gsm: 180,
                        observationGsm: 180,
                        bf: 22,
                        observationBf: 22,
                        netWeight: 500,
                        moisturePercent: 7.5,
                        result: 'Passed',
                        status: 'PASSED',
                      },
                    ])
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Reel
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      <th className="p-2.5">Reel Number</th>
                      <th className="p-2.5 text-center">Declared GSM</th>
                      <th className="p-2.5 text-center">Tested GSM</th>
                      <th className="p-2.5 text-center">Tested BF</th>
                      <th className="p-2.5 text-right">Weight (Kg)</th>
                      <th className="p-2.5 text-center">Moisture %</th>
                      <th className="p-2.5 text-center">Verdict</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reelRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.reelNo || ''}
                            onChange={(e) => {
                              const copy = [...reelRows];
                              copy[i].reelNo = e.target.value;
                              setReelRows(copy);
                            }}
                            className="w-28 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                          />
                        </td>
                        <td className="p-2 text-center font-mono">{r.gsm || 180}</td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            value={r.observationGsm || r.gsm || ''}
                            onChange={(e) => {
                              const copy = [...reelRows];
                              copy[i].observationGsm = Number(e.target.value);
                              setReelRows(copy);
                            }}
                            className="w-16 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            value={r.observationBf || r.bf || ''}
                            onChange={(e) => {
                              const copy = [...reelRows];
                              copy[i].observationBf = Number(e.target.value);
                              setReelRows(copy);
                            }}
                            className="w-16 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            value={r.netWeight || ''}
                            onChange={(e) => {
                              const copy = [...reelRows];
                              copy[i].netWeight = Number(e.target.value);
                              copy[i].actualWeight = Number(e.target.value);
                              setReelRows(copy);
                            }}
                            className="w-20 p-1.5 text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={r.moisturePercent || 7.5}
                            onChange={(e) => {
                              const copy = [...reelRows];
                              copy[i].moisturePercent = Number(e.target.value);
                              setReelRows(copy);
                            }}
                            className="w-16 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={r.result || 'Passed'}
                            onChange={(e) => {
                              const copy = [...reelRows];
                              copy[i].result = e.target.value;
                              copy[i].status = e.target.value === 'Passed' ? 'PASSED' : 'FAILED';
                              setReelRows(copy);

                              const pCount = copy.filter((c) => c.result === 'Passed').length;
                              const fCount = copy.filter((c) => c.result === 'Failed').length;
                              setPassedQty(pCount);
                              setRejectedQty(fCount);
                              if (fCount === copy.length) setStatus('Rejected');
                              else if (pCount === copy.length) setStatus('Approved');
                              else setStatus('Partially Approved');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-semibold"
                          >
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => setReelRows(reelRows.filter((_, idx) => idx !== i))}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Box & Physical Test Parameters Grid */
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Box Strength & Compliance Tests
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Bursting Strength (kg/cm²)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={burstingStrength}
                    onChange={(e) => setBurstingStrength(Number(e.target.value))}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Burst Factor (BF)</label>
                  <input
                    type="number"
                    value={burstingFactor}
                    onChange={(e) => setBurstingFactor(Number(e.target.value))}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Box Compression Test (kgf)</label>
                  <input
                    type="number"
                    value={boxCompressionTest}
                    onChange={(e) => setBoxCompressionTest(Number(e.target.value))}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Caliper Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={caliperThicknessMm}
                    onChange={(e) => setCaliperThicknessMm(Number(e.target.value))}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Moisture %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisturePercent}
                    onChange={(e) => setMoisturePercent(Number(e.target.value))}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Dimension Check</label>
                  <select
                    value={dimensionCheck}
                    onChange={(e) => setDimensionCheck(e.target.value)}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Pass">Pass (Within ±2mm)</option>
                    <option value="Fail">Fail (Deviation)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Print Quality</label>
                  <select
                    value={printQuality}
                    onChange={(e) => setPrintQuality(e.target.value)}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Pass">Pass (Crisp & Aligned)</option>
                    <option value="Fail">Fail (Smudged / Off-register)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Joint Strength & Drop Test</label>
                  <select
                    value={dropTest}
                    onChange={(e) => setDropTest(e.target.value)}
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Pass">Pass (No Rupture)</option>
                    <option value="Fail">Fail (Flap Opening)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Inspection Verdict & Quantities */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="font-semibold block mb-1">Inspection Verdict *</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className={`w-full p-2.5 rounded-xl border outline-none font-bold ${
                  status === 'Approved'
                    ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
                    : status === 'Rejected'
                    ? 'text-rose-600 bg-rose-500/10 border-rose-500/30'
                    : 'text-amber-600 bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <option value="Approved">Approved / Passed</option>
                <option value="Partially Approved">Partially Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Inspected Qty</label>
              <input
                type="number"
                value={inspectedQty}
                onChange={(e) => setInspectedQty(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Passed Qty</label>
              <input
                type="number"
                value={passedQty}
                onChange={(e) => setPassedQty(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border outline-none text-emerald-600 font-bold ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Rejected Qty</label>
              <input
                type="number"
                value={rejectedQty}
                onChange={(e) => setRejectedQty(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border outline-none text-rose-600 font-bold ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Rejection / NCR Details if Rejected */}
          {(status === 'Rejected' || status === 'Partially Approved') && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3 text-xs">
              <h4 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Non-Conformance & Corrective Action (NCR)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Rejection Reason *</label>
                  <input
                    type="text"
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Burst strength below 12 kg/cm²"
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Root Cause Analysis</label>
                  <input
                    type="text"
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="e.g. Low BF Kraft paper used"
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Corrective Action</label>
                  <input
                    type="text"
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder="e.g. Quarantined for scrap / rework"
                    className={`w-full p-2 rounded-xl border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="text-xs">
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              General Remarks / Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Certified conforming to IS-2771 / TAPPI standard"
              className={`w-full p-2.5 rounded-xl border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedReferenceId}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Recording Inspection...' : 'Record & Certify QC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
