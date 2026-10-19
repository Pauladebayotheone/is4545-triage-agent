import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Flame,
  AlertTriangle,
  ShieldAlert,
  Building2,
  PlusCircle,
  RotateCcw,
  BadgeCheck,
} from 'lucide-react';
import {
  ComplaintRecord,
  TriageResult,
  PrimaryCategory,
  SeverityLevel,
} from '../types/triage';

interface QuickTriageViewProps {
  onAddToQueue: (record: ComplaintRecord) => void;
}

const PRESET_SCENARIOS = [
  {
    title: 'Severe Drug Allergy',
    channel: 'Grievance Report',
    unit: 'ICU / Med-Surg',
    text: 'Patient was given IV Ampicillin despite red allergy band indicating life-threatening Penicillin allergy. Developed immediate facial angioedema and stridor requiring emergency intramuscular epinephrine and ICU transfer.',
  },
  {
    title: 'Racial Bias Allegation',
    channel: 'Patient Portal',
    unit: 'Orthopedic Surgery',
    text: 'Dr. Vance dismissed my post-op surgical pain as "drug-seeking behavior common in your ethnic group" and refused to inspect my wound. I was racially profiled and humiliated in front of junior staff.',
  },
  {
    title: 'Wheelchair Inaccessibility',
    channel: 'Online Review',
    unit: 'Chemotherapy Suite',
    text: 'The only ADA wheelchair restroom in the chemotherapy unit was locked and filled with supply boxes. Staff told me to hold it for 4 hours, causing an involuntary incontinence episode in the infusion chair.',
  },
  {
    title: 'PHI / HIPAA Breach',
    channel: 'Feedback Submission',
    unit: 'Patient Financial Services',
    text: 'Billing mailed me another patient\'s complete psychiatric intake notes, HIV laboratory panel, and Social Security Number mixed in with my hospital billing statement.',
  },
  {
    title: 'Surprise Out-of-Network Bill',
    channel: 'Survey Comment',
    unit: 'Ambulatory Surgery',
    text: 'I confirmed prior to surgery that everything was covered in-network. Today I received a surprise bill for $4,850 from a non-contracted surgical assistant in violation of the federal No Surprises Act.',
  },
  {
    title: 'Portal Password Timeout',
    channel: 'Patient Portal',
    unit: 'IT / Digital Health',
    text: 'The patient portal SMS two-factor verification code expires after only 30 seconds on Safari mobile, locking me out from viewing my blood tests and requesting prescription refills.',
  },
];

export const QuickTriageView: React.FC<QuickTriageViewProps> = ({ onAddToQueue }) => {
  const [complaintText, setComplaintText] = useState('');
  const [patientName, setPatientName] = useState('');
  const [sourceChannel, setSourceChannel] = useState<ComplaintRecord['sourceChannel']>('Patient Portal');
  const [departmentUnit, setDepartmentUnit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [addedToQueue, setAddedToQueue] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTriage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!complaintText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAddedToQueue(false);

    try {
      const response = await fetch('/api/triage/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintText,
          metadata: {
            patientName: patientName || 'Anonymous',
            sourceChannel,
            departmentUnit: departmentUnit || 'General',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        setTriageResult(data.result);
      } else {
        throw new Error('Invalid response structure from triage engine');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing AI triage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setComplaintText(preset.text);
    setSourceChannel(preset.channel as any);
    setDepartmentUnit(preset.unit);
    setTriageResult(null);
    setAddedToQueue(false);
  };

  const handleCopyNote = () => {
    if (!triageResult?.rawFormattedOutput) return;
    navigator.clipboard.writeText(triageResult.rawFormattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToMainQueue = () => {
    if (!complaintText.trim()) return;
    const newRecord: ComplaintRecord = {
      id: `CMP-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
      complaintText,
      patientName: patientName || undefined,
      dateReceived: new Date().toISOString().split('T')[0],
      sourceChannel,
      departmentUnit: departmentUnit || undefined,
      triageStatus: triageResult ? 'completed' : 'pending',
      triageResult: triageResult || undefined,
    };
    onAddToQueue(newRecord);
    setAddedToQueue(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Input Form */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Quick Complaint Triage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate individual patient portal messages, grievances, or reviews in real-time.
          </p>
        </div>

        {/* Preset chips */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Load Clinical Test Scenarios:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SCENARIOS.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 transition-colors font-medium text-left"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleTriage} className="space-y-3.5 pt-2">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Source Channel:
              </label>
              <select
                value={sourceChannel}
                onChange={(e: any) => setSourceChannel(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="Patient Portal">Patient Portal</option>
                <option value="Grievance Report">Grievance Report</option>
                <option value="Survey Comment">Survey Comment</option>
                <option value="Online Review">Online Review</option>
                <option value="Feedback Submission">Feedback Submission</option>
                <option value="In-Person / Phone">In-Person / Phone</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Department / Unit:
              </label>
              <input
                type="text"
                value={departmentUnit}
                onChange={(e) => setDepartmentUnit(e.target.value)}
                placeholder="e.g. Med-Surg, Oncology, Billing"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Patient / Submitter Name (Optional):
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Eleanor Vance (or leave blank for Anonymous)"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Complaint / Grievance Narrative:
            </label>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              rows={6}
              required
              placeholder="Paste or type patient portal message, grievance report, or survey feedback text here..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden leading-relaxed"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="submit"
              disabled={isLoading || !complaintText.trim()}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Triaging with Gemini 3.8 Flash...' : 'Execute Triage (6 Steps)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintText('');
                setPatientName('');
                setDepartmentUnit('');
                setTriageResult(null);
                setAddedToQueue(false);
              }}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Reset fields"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Triage Results & Exact Format */}
      <div className="lg:col-span-7 space-y-4">
        {!triageResult ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Awaiting Grievance Submission</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Select one of the preset clinical benchmark scenarios on the left or paste custom patient text to execute the 6-Step Triage model.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Triaged Successfully
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Engine: Gemini 3.8 Flash
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyNote}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Note</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveToMainQueue}
                  disabled={addedToQueue}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{addedToQueue ? 'Added to Queue' : 'Save to Queue'}</span>
                </button>
              </div>
            </div>

            {/* 6 Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 & 2 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                  STEP 1: Complaint Category
                </div>
                <div className="text-base font-bold text-slate-900 mb-1">
                  {triageResult.complaintCategory}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-semibold">Secondary: </span>
                  {triageResult.secondaryCategories?.length > 0
                    ? triageResult.secondaryCategories.join(', ')
                    : 'None'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                  STEP 2: Severity Assessment
                </div>
                <div className="mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      triageResult.severityLevel.includes('LEVEL 4')
                        ? 'bg-rose-600 text-white'
                        : triageResult.severityLevel.includes('LEVEL 3')
                        ? 'bg-amber-500 text-white'
                        : triageResult.severityLevel.includes('LEVEL 2')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {triageResult.severityLevel.includes('LEVEL 4') && <Flame className="w-3 h-3" />}
                    {triageResult.severityLevel.includes('LEVEL 3') && <AlertTriangle className="w-3 h-3" />}
                    {triageResult.severityLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {triageResult.severityJustification}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs sm:col-span-2">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">
                  STEP 3: Risk Detection
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {triageResult.riskFlags.map((risk, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="font-bold text-slate-900 flex items-center gap-1 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {risk}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {triageResult.riskJustifications?.[risk] || 'Identified in narrative.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4 & 5 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                  STEP 4: Escalation Recommendation
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 mb-1">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {triageResult.recommendedDepartment}
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-600">Priority: </span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      triageResult.escalationPriority === 'Immediate'
                        ? 'bg-red-100 text-red-700'
                        : triageResult.escalationPriority === 'Priority'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {triageResult.escalationPriority}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                  STEP 5: Human Review Requirement
                </div>
                <div className="mb-1">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
                      triageResult.humanReviewStatus === 'Human Review Required'
                        ? 'bg-rose-50 text-rose-800 border border-rose-300'
                        : triageResult.humanReviewStatus === 'Human Review Recommended'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {triageResult.humanReviewStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {triageResult.humanReviewStatus === 'Human Review Required'
                    ? 'Mandatory: Patient safety, discrimination, privacy, or legal/compliance exposure detected.'
                    : 'Discretionary clinical leadership review.'}
                </p>
              </div>

              {/* Step 6 */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 sm:col-span-2">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                  STEP 6: Executive Summary
                </div>
                <p className="text-xs font-semibold text-blue-950 mb-1">
                  Category: {triageResult.executiveSummary?.category} • Severity: {triageResult.executiveSummary?.severity} • Major Risk: {triageResult.executiveSummary?.majorRisk}
                </p>
                <p className="text-xs text-blue-900 leading-relaxed">
                  {triageResult.executiveSummary?.summaryText ||
                    `${triageResult.complaintCategory} - ${triageResult.severityLevel}. Recommended route to ${triageResult.recommendedDepartment}.`}
                </p>
              </div>
            </div>

            {/* Prompt Output Format Box */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Raw Output Format (Prompt Specification)
                </span>
                <span className="text-[10px] text-slate-500">Ready to copy to EHR / Ticketing</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-300">
                {triageResult.rawFormattedOutput}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
