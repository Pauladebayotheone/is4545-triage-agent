import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Flame,
  AlertTriangle,
  ShieldAlert,
  ArrowUpDown,
  Download,
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  BadgeCheck,
} from 'lucide-react';
import {
  ComplaintRecord,
  ALL_CATEGORIES,
  ALL_SEVERITIES,
  ALL_DEPARTMENTS,
  ALL_PRIORITIES,
  ALL_REVIEW_STATUSES,
} from '../types/triage';
import { exportTriagedData } from '../utils/fileParser';

interface TriageTableProps {
  records: ComplaintRecord[];
  onOpenCase: (record: ComplaintRecord) => void;
  onTriageSingle: (recordId: string) => Promise<void>;
  onTriageBatch: (recordIds: string[]) => Promise<void>;
  onDeleteRecord: (recordId: string) => void;
  onClearAll: () => void;
  isProcessingBatch: boolean;
  batchProgress: { current: number; total: number } | null;
  activeFilter: string | null;
  onClearActiveFilter: () => void;
}

export const TriageTable: React.FC<TriageTableProps> = ({
  records,
  onOpenCase,
  onTriageSingle,
  onTriageBatch,
  onDeleteRecord,
  onClearAll,
  isProcessingBatch,
  batchProgress,
  activeFilter,
  onClearActiveFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting
  const [sortField, setSortField] = useState<'id' | 'severity' | 'date' | 'status'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Check top KPI active filter if set
      if (activeFilter) {
        if (activeFilter === 'LEVEL 4' && !rec.triageResult?.severityLevel?.includes('LEVEL 4'))
          return false;
        if (activeFilter === 'LEVEL 3' && !rec.triageResult?.severityLevel?.includes('LEVEL 3'))
          return false;
        if (
          activeFilter === 'Human Review Required' &&
          rec.triageResult?.humanReviewStatus !== 'Human Review Required'
        )
          return false;
        if (activeFilter === 'Immediate' && rec.triageResult?.escalationPriority !== 'Immediate')
          return false;
        if (activeFilter === 'SignedOff' && !rec.humanSignOff) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = rec.complaintText.toLowerCase().includes(query);
        const nameMatch = rec.patientName?.toLowerCase().includes(query);
        const idMatch = rec.id.toLowerCase().includes(query);
        const unitMatch = rec.departmentUnit?.toLowerCase().includes(query);
        const mrnMatch = rec.mrn?.toLowerCase().includes(query);
        if (!textMatch && !nameMatch && !idMatch && !unitMatch && !mrnMatch) {
          return false;
        }
      }

      // Dropdown filters
      if (
        selectedCategory !== 'ALL' &&
        rec.triageResult?.complaintCategory !== selectedCategory &&
        rec.humanSignOff?.adjustedCategory !== selectedCategory
      ) {
        return false;
      }

      if (selectedSeverity !== 'ALL') {
        const currentSev = rec.humanSignOff?.adjustedSeverity || rec.triageResult?.severityLevel;
        if (!currentSev || !currentSev.includes(selectedSeverity)) return false;
      }

      if (
        selectedDepartment !== 'ALL' &&
        rec.triageResult?.recommendedDepartment !== selectedDepartment &&
        rec.humanSignOff?.adjustedDepartment !== selectedDepartment
      ) {
        return false;
      }

      if (
        selectedPriority !== 'ALL' &&
        rec.triageResult?.escalationPriority !== selectedPriority &&
        rec.humanSignOff?.adjustedPriority !== selectedPriority
      ) {
        return false;
      }

      if (
        selectedReviewStatus !== 'ALL' &&
        rec.triageResult?.humanReviewStatus !== selectedReviewStatus &&
        rec.humanSignOff?.adjustedHumanReviewStatus !== selectedReviewStatus
      ) {
        return false;
      }

      if (selectedSource !== 'ALL' && rec.sourceChannel !== selectedSource) {
        return false;
      }

      return true;
    });
  }, [
    records,
    activeFilter,
    searchQuery,
    selectedCategory,
    selectedSeverity,
    selectedDepartment,
    selectedPriority,
    selectedReviewStatus,
    selectedSource,
  ]);

  // Sort logic
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (sortField === 'date') {
        comparison = (a.dateReceived || '').localeCompare(b.dateReceived || '');
      } else if (sortField === 'severity') {
        const getWeight = (lvl?: string) => {
          if (lvl?.includes('LEVEL 4')) return 4;
          if (lvl?.includes('LEVEL 3')) return 3;
          if (lvl?.includes('LEVEL 2')) return 2;
          if (lvl?.includes('LEVEL 1')) return 1;
          return 0;
        };
        const aW = getWeight(a.humanSignOff?.adjustedSeverity || a.triageResult?.severityLevel);
        const bW = getWeight(b.humanSignOff?.adjustedSeverity || b.triageResult?.severityLevel);
        comparison = aW - bW;
      } else if (sortField === 'status') {
        comparison = a.triageStatus.localeCompare(b.triageStatus);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRecords, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === sortedRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedRecords.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const pendingCount = records.filter((r) => r.triageStatus === 'pending').length;

  const handleTriagePending = () => {
    const pendingIds = records.filter((r) => r.triageStatus === 'pending').map((r) => r.id);
    if (pendingIds.length > 0) {
      onTriageBatch(pendingIds);
    }
  };

  const handleTriageSelected = () => {
    if (selectedIds.size > 0) {
      onTriageBatch(Array.from(selectedIds));
    }
  };

  // Severity rendering badge
  const renderSeverityBadge = (level?: string) => {
    if (!level) return <span className="text-slate-400 text-xs italic">Pending</span>;
    if (level.includes('LEVEL 4')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
          <Flame className="w-3 h-3" />
          L4 Critical
        </span>
      );
    }
    if (level.includes('LEVEL 3')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-2xs">
          <AlertTriangle className="w-3 h-3" />
          L3 High
        </span>
      );
    }
    if (level.includes('LEVEL 2')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
          L2 Moderate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
        L1 Low
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Filter and Actions Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search narrative, patient name, MRN, ID, unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Batch Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {pendingCount > 0 && (
              <button
                onClick={handleTriagePending}
                disabled={isProcessingBatch}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
                <span>
                  {isProcessingBatch
                    ? `Triaging (${batchProgress?.current || 0}/${batchProgress?.total || pendingCount})...`
                    : `Triage Pending (${pendingCount})`}
                </span>
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                onClick={handleTriageSelected}
                disabled={isProcessingBatch}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Triage Selected ({selectedIds.size})</span>
              </button>
            )}

            {/* Export Dropdown */}
            <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden text-xs">
              <span className="px-2.5 py-1.5 text-slate-500 font-medium border-r border-slate-200 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                Export
              </span>
              <button
                onClick={() => exportTriagedData(filteredRecords, 'csv')}
                className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-semibold"
                title="Export Filtered Rows as CSV"
              >
                CSV
              </button>
              <button
                onClick={() => exportTriagedData(filteredRecords, 'xlsx')}
                className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-semibold border-l border-slate-200"
                title="Export Filtered Rows as Excel (.xlsx)"
              >
                Excel
              </button>
              <button
                onClick={() => exportTriagedData(filteredRecords, 'json')}
                className="px-2 py-1.5 hover:bg-slate-100 text-slate-700 font-medium border-l border-slate-200"
                title="Export as JSON"
              >
                JSON
              </button>
            </div>

            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Clear All Complaints"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1 text-slate-400 text-[11px] font-semibold uppercase mr-1">
            <Filter className="w-3 h-3" />
            Filters:
          </div>

          {/* Active Filter notification tag if clicked from top stats */}
          {activeFilter && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-[11px]">
              <span>Active: {activeFilter}</span>
              <button onClick={onClearActiveFilter} className="hover:text-blue-950 font-bold ml-1">
                ×
              </button>
            </div>
          )}

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">All Categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">All Severities</option>
            <option value="LEVEL 4">Level 4 – Critical</option>
            <option value="LEVEL 3">Level 3 – High</option>
            <option value="LEVEL 2">Level 2 – Moderate</option>
            <option value="LEVEL 1">Level 1 – Low</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">All Routed Departments</option>
            {ALL_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">All Priorities</option>
            {ALL_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Human Review Status Filter */}
          <select
            value={selectedReviewStatus}
            onChange={(e) => setSelectedReviewStatus(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">All Review Statuses</option>
            {ALL_REVIEW_STATUSES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Channel */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
          >
            <option value="ALL">All Channels</option>
            <option value="Patient Portal">Patient Portal</option>
            <option value="Grievance Report">Grievance Report</option>
            <option value="Survey Comment">Survey Comment</option>
            <option value="Online Review">Online Review</option>
            <option value="Feedback Submission">Feedback Submission</option>
            <option value="In-Person / Phone">In-Person / Phone</option>
          </select>

          {(selectedCategory !== 'ALL' ||
            selectedSeverity !== 'ALL' ||
            selectedDepartment !== 'ALL' ||
            selectedPriority !== 'ALL' ||
            selectedReviewStatus !== 'ALL' ||
            selectedSource !== 'ALL' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSeverity('ALL');
                setSelectedDepartment('ALL');
                setSelectedPriority('ALL');
                setSelectedReviewStatus('ALL');
                setSelectedSource('ALL');
                setSearchQuery('');
                onClearActiveFilter();
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3 px-3.5 w-10">
                <button onClick={handleSelectAll} className="text-slate-500 hover:text-slate-800">
                  {selectedIds.size === sortedRecords.length && sortedRecords.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/50" onClick={() => {
                setSortField('id');
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              }}>
                <div className="flex items-center space-x-1">
                  <span>Case ID / Submitter</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 min-w-[280px]">Complaint Narrative</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/50" onClick={() => {
                setSortField('severity');
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              }}>
                <div className="flex items-center space-x-1">
                  <span>Severity</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Escalation Route</th>
              <th className="py-3 px-3">Human Review</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">No complaints matching the criteria</p>
                    <p className="text-[11px] text-slate-400">
                      Try adjusting filters or upload a spreadsheet / load benchmark dataset.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRecords.map((record) => {
                const res = record.triageResult;
                const signOff = record.humanSignOff;
                const isSelected = selectedIds.has(record.id);

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-blue-50/40 transition-colors cursor-pointer group ${
                      isSelected ? 'bg-blue-50/60' : ''
                    }`}
                    onClick={() => onOpenCase(record)}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3 px-3.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(record.id);
                      }}
                    >
                      <button className="text-slate-400 hover:text-slate-700">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Case ID & Patient */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-blue-600">
                        {record.id}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {record.patientName || 'Anonymous'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {record.sourceChannel} • {record.dateReceived}
                      </div>
                    </td>

                    {/* Complaint Narrative */}
                    <td className="py-3 px-3">
                      <p className="text-slate-700 line-clamp-2 leading-relaxed">
                        {record.complaintText}
                      </p>
                      {record.departmentUnit && (
                        <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                          Unit: {record.departmentUnit}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res || signOff ? (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {signOff?.adjustedCategory || res?.complaintCategory}
                          </span>
                          {res?.secondaryCategories && res.secondaryCategories.length > 0 && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                              + {res.secondaryCategories.join(', ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pending triage</span>
                      )}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderSeverityBadge(signOff?.adjustedSeverity || res?.severityLevel)}
                      {signOff?.adjustedSeverity && (
                        <span className="text-[9px] text-emerald-700 block font-bold">Overridden</span>
                      )}
                    </td>

                    {/* Escalation Route */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res || signOff ? (
                        <div>
                          <span className="font-medium text-slate-800 block text-[11px]">
                            {signOff?.adjustedDepartment || res?.recommendedDepartment}
                          </span>
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              (signOff?.adjustedPriority || res?.escalationPriority) === 'Immediate'
                                ? 'bg-red-100 text-red-700'
                                : (signOff?.adjustedPriority || res?.escalationPriority) === 'Priority'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {signOff?.adjustedPriority || res?.escalationPriority}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Human Review Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res ? (
                        <div className="space-y-0.5">
                          {res.humanReviewStatus === 'Human Review Required' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              Required
                            </span>
                          ) : res.humanReviewStatus === 'Human Review Recommended' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Recommended
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium">AI Only</span>
                          )}
                          {signOff && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                              <BadgeCheck className="w-3 h-3" />
                              <span>Audited</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td
                      className="py-3 px-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        {!res && (
                          <button
                            onClick={() => onTriageSingle(record.id)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Run Triage with AI"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenCase(record)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Open Triage Inspector"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Footer Info Bar */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {sortedRecords.length} of {records.length} complaints in queue
          {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
        </div>
        <div className="flex items-center space-x-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> L4 Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> L3 High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> L2 Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> L1 Low
          </span>
        </div>
      </div>
    </div>
  );
};
