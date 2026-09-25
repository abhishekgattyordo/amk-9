import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertOctagon,
  History,
  Plus,
  RefreshCw,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';
import { QualityCheck, QCMetrics, Warehouse } from '../../types';
import { QCDashboardView } from './QCDashboardView';
import { QCInspectionsListView } from './QCInspectionsListView';
import { QCDetailView } from './QCDetailView';
import { QCInspectionFormModal } from './QCInspectionFormModal';
import { QCPendingQueueView } from './QCPendingQueueView';
import { QCRejectionNCRView } from './QCRejectionNCRView';
import { QCHistoryView } from './QCHistoryView';

interface QualityControlModuleProps {
  darkMode: boolean;
  warehouses?: Warehouse[];
  onNavigateEntity?: (module: string, subPage?: string, entityId?: string) => void;
}

export const QualityControlModule: React.FC<QualityControlModuleProps> = ({
  darkMode,
  warehouses = [],
  onNavigateEntity,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'pending' | 'ncr' | 'history'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<QualityCheck[]>([]);
  const [metrics, setMetrics] = useState<QCMetrics>({
    totalInspections: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    partiallyApprovedCount: 0,
    todayCount: 0,
    passRate: 0,
    reelQcPending: 0,
    reelInwardPending: 0,
    sampleQcPending: 0,
    productionQcPending: 0,
    finalQcPending: 0,
    byType: [],
    byStatus: [],
    recentInspections: [],
    pendingInspections: [],
    rejectedInspections: [],
  });

  // Selected Inspection for Detail View
  const [selectedInspection, setSelectedInspection] = useState<QualityCheck | null>(null);

  // New Inspection Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<string>('Reel Inward QC');

  // Load all inspections and stats
  const fetchQCData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        fetch('/api/quality-checks'),
        fetch('/api/quality-checks?mode=stats'),
      ]);

      const listJson = await listRes.json();
      const statsJson = await statsRes.json();

      if (listJson.success && listJson.data) {
        setInspections(listJson.data);
      }
      if (statsJson.success && statsJson.data) {
        setMetrics(statsJson.data);
      }
    } catch (err) {
      console.error('Error fetching QC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQCData();
  }, []);

  const handleOpenNewModal = (type = 'Reel Inward QC') => {
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  const handleUpdateInspectionStatus = async (id: string, updateData: any) => {
    try {
      const res = await fetch(`/api/quality-checks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const json = await res.json();
      if (json.success) {
        await fetchQCData();
        if (selectedInspection && selectedInspection.id === id) {
          setSelectedInspection(json.data);
        }
      } else {
        alert(json.error || 'Failed to update QC status');
      }
    } catch (e: any) {
      console.error('Error updating QC inspection:', e);
      alert(e.message || 'Error updating inspection');
    }
  };

  const handleDeleteInspection = async (id: string) => {
    try {
      const res = await fetch(`/api/quality-checks/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        if (selectedInspection?.id === id) {
          setSelectedInspection(null);
        }
        await fetchQCData();
      } else {
        alert(json.error || 'Failed to delete QC inspection');
      }
    } catch (e: any) {
      console.error('Error deleting QC inspection:', e);
      alert(e.message || 'Error deleting inspection');
    }
  };

  const rejectionsList = inspections.filter(
    (i) =>
      i.status === 'Rejected' ||
      i.result === 'Rejected' ||
      i.status === 'Partially Approved' ||
      i.result === 'Partially Approved' ||
      Boolean(i.rejectionReason)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Quality Control & Assurance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                ISO / TAPPI / IS-2771
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive paper reel, in-process corrugation, sample batch, and finished box quality verification.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchQCData}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => handleOpenNewModal('Reel Inward QC')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Inspection
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs (Hidden when viewing individual inspection) */}
      {!selectedInspection && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'dashboard', label: 'QC Dashboard', icon: LayoutDashboard },
            {
              id: 'pending',
              label: `Pending Queues (${(metrics.reelInwardPending || 0) + (metrics.sampleQcPending || 0) + (metrics.productionQcPending || 0) + (metrics.finalQcPending || 0)})`,
              icon: Clock,
            },
            { id: 'inspections', label: `All Inspections (${inspections.length})`, icon: CheckCircle2 },
            { id: 'ncr', label: `NCR & Rejections (${rejectionsList.length})`, icon: AlertOctagon },
            { id: 'history', label: 'Audit History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : darkMode
                    ? 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Tab Content */}
      {selectedInspection ? (
        <QCDetailView
          darkMode={darkMode}
          inspection={selectedInspection}
          onBack={() => setSelectedInspection(null)}
          onUpdateStatus={handleUpdateInspectionStatus}
          onNavigateEntity={onNavigateEntity}
        />
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <QCDashboardView
              darkMode={darkMode}
              metrics={metrics}
              loading={loading}
              onRefresh={fetchQCData}
              onNavigateTab={(tab: string) => setActiveTab(tab as any)}
              onSelectInspection={(qc: QualityCheck) => setSelectedInspection(qc)}
              onOpenNewInspectionModal={handleOpenNewModal}
            />
          )}

          {activeTab === 'pending' && (
            <QCPendingQueueView
              darkMode={darkMode}
              onOpenInspectModal={(qcType, refId) => handleOpenNewModal(qcType)}
              onRefreshAll={fetchQCData}
            />
          )}

          {activeTab === 'inspections' && (
            <QCInspectionsListView
              darkMode={darkMode}
              inspections={inspections}
              loading={loading}
              onRefresh={fetchQCData}
              onSelectInspection={(qc: QualityCheck) => setSelectedInspection(qc)}
              onOpenNewInspectionModal={handleOpenNewModal}
              onDeleteInspection={handleDeleteInspection}
            />
          )}

          {activeTab === 'ncr' && (
            <QCRejectionNCRView
              darkMode={darkMode}
              rejections={rejectionsList}
              loading={loading}
              onSelectInspection={(qc: QualityCheck) => setSelectedInspection(qc)}
              onRefresh={fetchQCData}
            />
          )}

          {activeTab === 'history' && (
            <QCHistoryView
              darkMode={darkMode}
              history={inspections}
              loading={loading}
              onSelectInspection={(qc: QualityCheck) => setSelectedInspection(qc)}
              onRefresh={fetchQCData}
            />
          )}
        </>
      )}

      {/* New Quality Inspection Modal */}
      {isModalOpen && (
        <QCInspectionFormModal
          darkMode={darkMode}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchQCData();
            setActiveTab('inspections');
          }}
          initialType={modalInitialType}
          warehouses={warehouses}
        />
      )}
    </div>
  );
};
