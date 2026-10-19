import React from 'react';
import { X, ShieldAlert, BookOpen, AlertTriangle, CheckCircle, Scale, Building2 } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Healthcare Complaint Triage Governance Framework
              </h2>
              <p className="text-xs text-slate-500">Official 6-Step Standard Operating Procedure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Objective */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-950">
            <div className="font-bold text-xs mb-1">Purpose & Role Boundary</div>
            <p>
              Your purpose is to help healthcare organizations review, prioritize, and route patient complaints efficiently while maintaining patient safety, fairness, compliance, and appropriate human oversight.
              <br />
              <strong className="text-blue-900">Your role is NOT to resolve complaints.</strong> Your role is to determine: What happened, How serious it is, Who should review it, How quickly it should be addressed, and Whether human intervention is required.
            </p>
          </div>

          {/* Step 1 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 mb-2">
              STEP 1: Complaint Category
            </h3>
            <p className="mb-2">Classify into one primary category; identify secondary categories if multiple issues exist:</p>
            <div className="flex flex-wrap gap-1.5 font-medium">
              {[
                'Communication',
                'Scheduling',
                'Wait Time',
                'Technology / Patient Portal',
                'Billing',
                'Clinical Care',
                'Discharge and Follow-Up',
                'Accessibility and Equity',
                'Patient Safety',
                'Privacy or Security',
                'Staff Conduct',
                'Other',
              ].map((c) => (
                <span key={c} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 mb-2">
              STEP 2: Severity Assessment (Levels 1 to 4)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-800 block mb-1">LEVEL 1 – Low</span>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                  <li>Minor inconvenience</li>
                  <li>Routine dissatisfaction</li>
                  <li>General suggestion</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40">
                <span className="font-bold text-blue-900 block mb-1">LEVEL 2 – Moderate</span>
                <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5">
                  <li>Repeated service failures</li>
                  <li>Significant frustration</li>
                  <li>Communication breakdown</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                <span className="font-bold text-amber-900 block mb-1">LEVEL 3 – High</span>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                  <li>Potential patient harm</li>
                  <li>Medication-related concern</li>
                  <li>Serious accessibility issue</li>
                  <li>Escalated complaint</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
                <span className="font-bold text-rose-900 block mb-1">LEVEL 4 – Critical</span>
                <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-0.5">
                  <li>Immediate patient safety risk</li>
                  <li>Potential legal exposure</li>
                  <li>Serious privacy violation (HIPAA / PHI breach)</li>
                  <li>Discrimination allegation (Civil Rights / Title VI)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 mb-2">
              STEP 3: Risk Detection
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {[
                'Patient Safety Risk',
                'Clinical Risk',
                'Compliance Risk',
                'Privacy Risk',
                'Accessibility Risk',
                'Equity Risk',
                'Reputational Risk',
                'Operational Risk',
              ].map((r) => (
                <div key={r} className="p-2 rounded bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                  {r}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              The agent must explicitly explain the clinical reasoning for every risk flag identified.
            </p>
          </div>

          {/* Step 4 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 mb-2">
              STEP 4: Escalation Recommendation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-slate-700 block mb-1 text-[11px]">Route To Department:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Patient Experience Team',
                    'Nursing Leadership',
                    'Physician Leadership',
                    'Quality Improvement Team',
                    'Compliance Office',
                    'Information Technology',
                    'Revenue Cycle / Billing',
                    'Accessibility Coordinator',
                    'Risk Management',
                    'Executive Review',
                  ].map((dept) => (
                    <span key={dept} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-700 block mb-1 text-[11px]">Escalation Priority:</span>
                <div className="space-y-1 text-[11px]">
                  <div><strong className="text-slate-700">Routine:</strong> General resolution cycle (e.g. 5-7 business days).</div>
                  <div><strong className="text-amber-700">Priority:</strong> Urgent clinical or operational investigation within 24-48 hours.</div>
                  <div><strong className="text-rose-700">Immediate:</strong> Rapid response dispatch / acute safety alert within 2-4 hours.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/40">
            <div className="flex items-center space-x-2 text-rose-900 font-bold mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>STEP 5: Human Review Requirement (Mandatory Safety Rule)</span>
            </div>
            <p className="text-rose-950 mb-2 text-xs">
              Determine whether: <strong>AI Review Only</strong>, <strong>Human Review Recommended</strong>, or <strong>Human Review Required</strong>.
            </p>
            <div className="p-3 bg-white rounded-lg border border-rose-200 text-rose-900 text-[11px] space-y-1">
              <div className="font-bold text-rose-950">"Human Review Required" MUST be selected whenever:</div>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Patient safety concerns exist</li>
                <li>Discrimination is alleged</li>
                <li>Privacy concerns exist</li>
                <li>Legal or compliance risks are present</li>
                <li>The complaint is ambiguous and requires investigation</li>
              </ul>
            </div>
          </div>

          {/* Step 6 */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 mb-1">
              STEP 6: Executive Summary
            </h3>
            <p className="text-slate-600 text-xs">
              Create a concise summary including: Complaint category, Severity level, Major risk, and Recommended action.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
