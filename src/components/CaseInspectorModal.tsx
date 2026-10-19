import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Flame,
  ArrowRight,
  UserCheck,
  Building2,
  Calendar,
  FileText,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  ComplaintRecord,
  PrimaryCategory,
  SeverityLevel,
  DepartmentRoute,
  EscalationPriority,
  HumanReviewStatus,
  ALL_CATEGORIES,
  ALL_SEVERITIES,
  ALL_DEPARTMENTS,
  ALL_PRIORITIES,
  ALL_REVIEW_STATUSES,
} from '../types/triage';

interface CaseInspectorModalProps {
  record: ComplaintRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSignOff: (
    recordId: string,
    signOffData: NonNullable<ComplaintRecord['humanSignOff']>
  ) => void;
  onTriageSingle: (recordId: string) => Promise<void>;
  onNavigateCase?: (direction: 'next' | 'prev') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const CaseInspectorModal: React.FC<CaseInspectorModalProps> = ({
  record,
  isOpen,
  onClose,
  onSaveSignOff,
  onTriageSingle,
  onNavigateCase,
  hasPrev,
  hasNext,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRetriaging, setIsRetriaging] = useState(false);

  // Sign off form state
  const [reviewerName, setReviewerName] = useState(
    record?.humanSignOff?.reviewedBy || 'Nurse Supervisor / Clinical Risk Officer'
  );
  const [signOffAction, setSignOffAction] = useState<'Approved' | 'Adjusted' | 'Escalated Further'>(
    record?.humanSignOff?.action || 'Approved'
  );
  const [signOffNotes, setSignOffNotes] = useState(record?.humanSignOff?.notes || '');
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  // Override fields
  const [overrideCategory, setOverrideCategory] = useState<PrimaryCategory | undefined>(
    record?.humanSignOff?.adjustedCategory || record?.triageResult?.complaintCategory
  );
  const [overrideSeverity, setOverrideSeverity] = useState<SeverityLevel | undefined>(
    record?.humanSignOff?.adjustedSeverity || record?.triageResult?.severityLevel
  );
  const [overrideDept, setOverrideDept] = useState<DepartmentRoute | undefined>(
    record?.humanSignOff?.adjustedDepartment || record?.triageResult?.recommendedDepartment
  );
  const [overridePriority, setOverridePriority] = useState<EscalationPriority | undefined>(
    record?.humanSignOff?.adjustedPriority || record?.triageResult?.escalationPriority
  );
  const [overrideHumanReview, setOverrideHumanReview] = useState<HumanReviewStatus | undefined>(
    record?.humanSignOff?.adjustedHumanReviewStatus || record?.triageResult?.humanReviewStatus
  );

  if (!isOpen || !record) return null;

  const result = record.triageResult;
  const signOff = record.humanSignOff;

  const handleCopyNote = () => {
    if (!result?.rawFormattedOutput) return;
    navigator.clipboard.writeText(result.rawFormattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetriage = async () => {
    setIsRetriaging(true);
    try {
      await onTriageSingle(record.id);
    } finally {
      setIsRetriaging(false);
    }
  };

  const handleSubmitSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSignOff(record.id, {
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      action: signOffAction,
      notes: signOffNotes,
      adjustedCategory: showOverrideForm ? overrideCategory : undefined,
      adjustedSeverity: showOverrideForm ? overrideSeverity : undefined,
      adjustedDepartment: showOverrideForm ? overrideDept : undefined,
      adjustedPriority: showOverrideForm ? overridePriority : undefined,
      adjustedHumanReviewStatus: showOverrideForm ? overrideHumanReview : undefined,
    });
  };

  // Severity styling helper
  const getSeverityBadge = (level?: string) => {
    if (!level) return <span className="text-slate-400">Pending</span>;
    if (level.includes('LEVEL 4')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
          <Flame className="w-3.5 h-3.5" />
          {level}
        </span>
      );
    }
    if (level.includes('LEVEL 3')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          {level}
        </span>
      );
    }
    if (level.includes('LEVEL 2')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {level}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        {level}
      </span>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'Immediate') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          Immediate
        </span>
      );
    }
    if (priority === 'Priority') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Priority
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        Routine
      </span>
    );
  };

  const getHumanReviewBadge = (status?: string) => {
    if (status === 'Human Review Required') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Human Review Required
        </span>
      );
    }
    if (status === 'Human Review Recommended') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Human Review Recommended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <BadgeCheck className="w-4 h-4 text-emerald-600" />
        AI Review Only
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold bg-slate-200/80 text-slate-800 px-2.5 py-1 rounded-md">
              {record.id}
            </span>
            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <span className="font-semibold text-slate-800">{record.patientName || 'Anonymous Submitter'}</span>
              <span>•</span>
              {record.mrn && <span>{record.mrn} •</span>}
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{record.sourceChannel}</span>
              {record.departmentUnit && (
                <>
                  <span>•</span>
                  <span>{record.departmentUnit}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateCase && (
              <div className="flex items-center mr-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => onNavigateCase('prev')}
                  disabled={!hasPrev}
                  className="p-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
                  title="Previous Case"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-slate-200" />
                <button
                  onClick={() => onNavigateCase('next')}
                  disabled={!hasNext}
                  className="p-1.5 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
                  title="Next Case"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleRetriage}
              disabled={isRetriaging}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRetriaging ? 'animate-spin' : ''}`} />
              <span>{isRetriaging ? 'Analyzing...' : 'Re-Triage with AI'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top banner: Original narrative */}
          <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-500 font-bold">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Patient Narrative / Submission
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Received: {record.dateReceived || 'Not recorded'}
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-normal bg-white p-3.5 rounded-lg border border-slate-200/70 shadow-2xs">
              "{record.complaintText}"
            </p>
          </div>

          {/* If not triaged yet */}
          {!result && record.triageStatus !== 'completed' ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800">Triage Not Run Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Execute the 6-Step clinical triage model to classify this grievance, assess severity, detect risks, and recommend routing.
              </p>
              <button
                onClick={handleRetriage}
                disabled={isRetriaging}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
              >
                {isRetriaging ? 'Processing Triage...' : 'Execute Triage Now'}
              </button>
            </div>
          ) : (
            result && (
              <>
                {/* 6-Step Triage Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* STEP 1: Category */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      STEP 1: Complaint Category
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-bold text-slate-900">
                        {signOff?.adjustedCategory || result.complaintCategory}
                      </span>
                      {signOff?.adjustedCategory && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                          Auditor Overridden
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">Secondary Categories: </span>
                      {result.secondaryCategories && result.secondaryCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {result.secondaryCategories.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">None identified</span>
                      )}
                    </div>
                  </div>

                  {/* STEP 2: Severity */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      STEP 2: Severity Assessment
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityBadge(signOff?.adjustedSeverity || result.severityLevel)}
                      {signOff?.adjustedSeverity && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                          Auditor Overridden
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700 block mb-0.5">
                        Severity Justification:
                      </span>
                      <p className="leading-relaxed">{result.severityJustification}</p>
                    </div>
                  </div>

                  {/* STEP 3: Risk Detection */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs md:col-span-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-2">
                      STEP 3: Risk Detection
                    </div>
                    {result.riskFlags && result.riskFlags.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {result.riskFlags.map((risk, idx) => {
                          const explanation = result.riskJustifications?.[risk];
                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs"
                            >
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                                {risk}
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">
                                {explanation || 'Flagged based on narrative clinical analysis.'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No major risks identified.</p>
                    )}
                  </div>

                  {/* STEP 4: Escalation Recommendation */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      STEP 4: Escalation Recommendation
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-slate-900">
                          {signOff?.adjustedDepartment || result.recommendedDepartment}
                        </span>
                      </div>
                      {getPriorityBadge(signOff?.adjustedPriority || result.escalationPriority)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Routing target: Organization department responsible for clinical audit or operational resolution.
                    </div>
                  </div>

                  {/* STEP 5: Human Review Requirement */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      STEP 5: Human Review Requirement
                    </div>
                    <div className="mb-2">
                      {getHumanReviewBadge(
                        signOff?.adjustedHumanReviewStatus || result.humanReviewStatus
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {result.humanReviewStatus === 'Human Review Required'
                        ? 'Triggered per governance policy: Safety concerns, discrimination, privacy breach, or legal/compliance risks require mandatory human review.'
                        : result.humanReviewStatus === 'Human Review Recommended'
                        ? 'Recommended: Moderate operational or communication friction warrants supervisor follow-up.'
                        : 'AI Review Only: Routine operational comment or low-severity general inquiry.'}
                    </p>
                  </div>

                  {/* STEP 6: Executive Summary */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs md:col-span-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2">
                      STEP 6: Executive Summary
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                          Category
                        </span>
                        <span className="font-bold text-slate-900">
                          {result.executiveSummary?.category || result.complaintCategory}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                          Severity Level
                        </span>
                        <span className="font-bold text-slate-900">
                          {result.executiveSummary?.severity || result.severityLevel}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                          Major Risk
                        </span>
                        <span className="font-bold text-slate-900">
                          {result.executiveSummary?.majorRisk || 'Operational'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                          Action
                        </span>
                        <span className="font-bold text-slate-900 truncate block">
                          {result.executiveSummary?.recommendedAction || 'Review'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-950 font-medium leading-relaxed bg-white/80 p-3 rounded-lg border border-blue-100/70">
                      {result.executiveSummary?.summaryText ||
                        `${result.complaintCategory} - ${result.severityLevel}. Recommended route to ${result.recommendedDepartment}.`}
                    </p>
                  </div>
                </div>

                {/* Exact Prompt OUTPUT FORMAT Block */}
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                      Standard Clinical Triage Note (Prompt Output Format)
                    </span>
                    <button
                      onClick={handleCopyNote}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-[11px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Note</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed font-mono text-[11.5px] text-slate-300 overflow-x-auto">
                    {result.rawFormattedOutput}
                  </pre>
                </div>

                {/* Human Oversight & Supervisor Sign-Off Card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Human Oversight & Clinical Audit Sign-Off
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Ensures appropriate clinician or compliance officer governance
                        </p>
                      </div>
                    </div>
                    {signOff && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Signed Off by {signOff.reviewedBy}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSubmitSignOff} className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Auditor / Reviewer Name:
                        </label>
                        <input
                          type="text"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                          placeholder="e.g. Dr. Vance, Chief Medical Officer"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Action:
                        </label>
                        <select
                          value={signOffAction}
                          onChange={(e: any) => setSignOffAction(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                        >
                          <option value="Approved">Approved AI Triage As-Is</option>
                          <option value="Adjusted">Adjusted / Overridden Classification</option>
                          <option value="Escalated Further">Escalated to Executive Leadership</option>
                        </select>
                      </div>
                    </div>

                    {/* Override fields toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowOverrideForm(!showOverrideForm)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                      >
                        {showOverrideForm
                          ? '– Hide Manual Classification Overrides'
                          : '+ Override Classification, Severity, or Routing'}
                      </button>
                    </div>

                    {showOverrideForm && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Override Category:
                          </label>
                          <select
                            value={overrideCategory}
                            onChange={(e: any) => setOverrideCategory(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          >
                            {ALL_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Override Severity:
                          </label>
                          <select
                            value={overrideSeverity}
                            onChange={(e: any) => setOverrideSeverity(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          >
                            {ALL_SEVERITIES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Override Department:
                          </label>
                          <select
                            value={overrideDept}
                            onChange={(e: any) => setOverrideDept(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          >
                            {ALL_DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Override Priority:
                          </label>
                          <select
                            value={overridePriority}
                            onChange={(e: any) => setOverridePriority(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          >
                            {ALL_PRIORITIES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Override Review Status:
                          </label>
                          <select
                            value={overrideHumanReview}
                            onChange={(e: any) => setOverrideHumanReview(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                          >
                            {ALL_REVIEW_STATUSES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Auditor Notes / Clinical Justification:
                      </label>
                      <textarea
                        value={signOffNotes}
                        onChange={(e) => setSignOffNotes(e.target.value)}
                        rows={2}
                        placeholder="Add human reviewer comments, investigation findings, or specific dispatch instructions..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Save Human Oversight Sign-Off
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <div className="text-[11px] text-slate-400">
            {record.id} • Triage Engine: Gemini 3.8 Flash • Safety Guardrails Enforced
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
