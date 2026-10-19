import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { TriageTable } from './components/TriageTable';
import { CaseInspectorModal } from './components/CaseInspectorModal';
import { UploadModal } from './components/UploadModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { QuickTriageView } from './components/QuickTriageView';
import { ComplaintRecord, TriageResult } from './types/triage';
import { SAMPLE_COMPLAINTS } from './data/sampleComplaints';
import { FileSpreadsheet, Sparkles, AlertCircle, Info } from 'lucide-react';

const STORAGE_KEY = 'healthcare_complaint_triage_records_v1';

export default function App() {
  const [records, setRecords] = useState<ComplaintRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load saved records:', e);
    }
    // Default to sample benchmark complaints with pending status
    return SAMPLE_COMPLAINTS.map((c) => ({
      ...c,
      triageStatus: 'pending',
    }));
  });

  const [activeTab, setActiveTab] = useState<'queue' | 'quick'>('queue');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  // Batch triage progress state
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to persist records:', e);
    }
  }, [records]);

  // Current record in inspector
  const selectedRecord = records.find((r) => r.id === selectedRecordId) || null;
  const currentRecordIndex = records.findIndex((r) => r.id === selectedRecordId);

  // Single complaint triage
  const handleTriageSingle = async (recordId: string) => {
    const target = records.find((r) => r.id === recordId);
    if (!target) return;

    // Update status to processing
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, triageStatus: 'processing' } : r))
    );

    try {
      const response = await fetch('/api/triage/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintText: target.complaintText,
          metadata: {
            id: target.id,
            patientName: target.patientName,
            sourceChannel: target.sourceChannel,
            departmentUnit: target.departmentUnit,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  triageStatus: 'completed',
                  triageResult: data.result,
                  triageError: undefined,
                }
              : r
          )
        );
      } else {
        throw new Error('Failed to retrieve structured triage result');
      }
    } catch (err: any) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? {
                ...r,
                triageStatus: 'failed',
                triageError: err.message || 'Triage analysis failed',
              }
            : r
        )
      );
    }
  };

  // Batch triage execution
  const handleTriageBatch = async (recordIds: string[]) => {
    if (recordIds.length === 0 || isProcessingBatch) return;

    setIsProcessingBatch(true);
    setBatchProgress({ current: 0, total: recordIds.length });

    for (let i = 0; i < recordIds.length; i++) {
      const id = recordIds[i];
      setBatchProgress({ current: i + 1, total: recordIds.length });
      await handleTriageSingle(id);
    }

    setIsProcessingBatch(false);
    setBatchProgress(null);
  };

  // Save human auditor sign-off
  const handleSaveSignOff = (
    recordId: string,
    signOffData: NonNullable<ComplaintRecord['humanSignOff']>
  ) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              humanSignOff: signOffData,
            }
          : r
      )
    );
  };

  // Add ad-hoc complaint to queue
  const handleAddRecordToQueue = (newRecord: ComplaintRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setActiveTab('queue');
  };

  // Import batch records from file
  const handleLoadedRecords = (newRecords: ComplaintRecord[]) => {
    setRecords((prev) => [...newRecords, ...prev]);
  };

  // Reset to benchmark 10 cases
  const handleLoadBenchmark = () => {
    const benchmarks: ComplaintRecord[] = SAMPLE_COMPLAINTS.map((c) => ({
      ...c,
      triageStatus: 'pending',
    }));
    setRecords(benchmarks);
    setActiveFilter(null);
  };

  // Clear all records
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all complaints in the queue?')) {
      setRecords([]);
      setSelectedRecordId(null);
    }
  };

  // Delete individual record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  // Modal navigation
  const handleNavigateCase = (direction: 'next' | 'prev') => {
    if (currentRecordIndex === -1) return;
    const nextIdx = direction === 'next' ? currentRecordIndex + 1 : currentRecordIndex - 1;
    if (nextIdx >= 0 && nextIdx < records.length) {
      setSelectedRecordId(records[nextIdx].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onLoadBenchmark={handleLoadBenchmark}
        totalRecordsCount={records.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Metric Summary Cards */}
        <StatsCards
          records={records}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* Clinical Disclaimer Banner */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Clinical Governance Policy:</strong> The Triage Assistant evaluates severity, detects risk factors, and recommends routing. It does not resolve grievances and enforces mandatory human review for patient safety, civil rights, privacy breaches, and legal exposure.
            </span>
          </div>
          <button
            onClick={() => setIsGuidelinesOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-semibold underline shrink-0 ml-3"
          >
            Review SOP
          </button>
        </div>

        {/* View Content */}
        {activeTab === 'queue' ? (
          <TriageTable
            records={records}
            onOpenCase={(rec) => setSelectedRecordId(rec.id)}
            onTriageSingle={handleTriageSingle}
            onTriageBatch={handleTriageBatch}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAll}
            isProcessingBatch={isProcessingBatch}
            batchProgress={batchProgress}
            activeFilter={activeFilter}
            onClearActiveFilter={() => setActiveFilter(null)}
          />
        ) : (
          <QuickTriageView onAddToQueue={handleAddRecordToQueue} />
        )}
      </main>

      {/* Modals */}
      <CaseInspectorModal
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecordId(null)}
        onSaveSignOff={handleSaveSignOff}
        onTriageSingle={handleTriageSingle}
        onNavigateCase={handleNavigateCase}
        hasPrev={currentRecordIndex > 0}
        hasNext={currentRecordIndex < records.length - 1}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadedRecords={handleLoadedRecords}
        onLoadBenchmarkData={handleLoadBenchmark}
      />

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
}
