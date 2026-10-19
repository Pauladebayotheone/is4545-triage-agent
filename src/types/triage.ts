/**
 * Types and definitions for Healthcare Complaint Triage Assistant
 * Based on the 6-Step Clinical Governance Framework
 */

export type PrimaryCategory =
  | 'Communication'
  | 'Scheduling'
  | 'Wait Time'
  | 'Technology / Patient Portal'
  | 'Billing'
  | 'Clinical Care'
  | 'Discharge and Follow-Up'
  | 'Accessibility and Equity'
  | 'Patient Safety'
  | 'Privacy or Security'
  | 'Staff Conduct'
  | 'Other';

export const ALL_CATEGORIES: PrimaryCategory[] = [
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
];

export type SeverityLevel =
  | 'LEVEL 1 – Low'
  | 'LEVEL 2 – Moderate'
  | 'LEVEL 3 – High'
  | 'LEVEL 4 – Critical';

export const ALL_SEVERITIES: SeverityLevel[] = [
  'LEVEL 1 – Low',
  'LEVEL 2 – Moderate',
  'LEVEL 3 – High',
  'LEVEL 4 – Critical',
];

export type RiskFlag =
  | 'Patient Safety Risk'
  | 'Clinical Risk'
  | 'Compliance Risk'
  | 'Privacy Risk'
  | 'Accessibility Risk'
  | 'Equity Risk'
  | 'Reputational Risk'
  | 'Operational Risk';

export const ALL_RISK_FLAGS: RiskFlag[] = [
  'Patient Safety Risk',
  'Clinical Risk',
  'Compliance Risk',
  'Privacy Risk',
  'Accessibility Risk',
  'Equity Risk',
  'Reputational Risk',
  'Operational Risk',
];

export type DepartmentRoute =
  | 'Patient Experience Team'
  | 'Nursing Leadership'
  | 'Physician Leadership'
  | 'Quality Improvement Team'
  | 'Compliance Office'
  | 'Information Technology'
  | 'Revenue Cycle / Billing'
  | 'Accessibility Coordinator'
  | 'Risk Management'
  | 'Executive Review';

export const ALL_DEPARTMENTS: DepartmentRoute[] = [
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
];

export type EscalationPriority = 'Routine' | 'Priority' | 'Immediate';

export const ALL_PRIORITIES: EscalationPriority[] = ['Routine', 'Priority', 'Immediate'];

export type HumanReviewStatus =
  | 'AI Review Only'
  | 'Human Review Recommended'
  | 'Human Review Required';

export const ALL_REVIEW_STATUSES: HumanReviewStatus[] = [
  'AI Review Only',
  'Human Review Recommended',
  'Human Review Required',
];

export interface ExecutiveSummary {
  category: PrimaryCategory;
  severity: SeverityLevel;
  majorRisk: string;
  recommendedAction: string;
  summaryText: string;
}

export interface TriageResult {
  complaintCategory: PrimaryCategory;
  secondaryCategories: PrimaryCategory[];
  severityLevel: SeverityLevel;
  severityJustification: string;
  riskFlags: RiskFlag[];
  riskJustifications: Record<string, string>;
  recommendedDepartment: DepartmentRoute;
  escalationPriority: EscalationPriority;
  humanReviewStatus: HumanReviewStatus;
  executiveSummary: ExecutiveSummary;
  rawFormattedOutput: string;
  triagedAt: string;
}

export interface ComplaintRecord {
  id: string;
  complaintText: string;
  patientName?: string;
  mrn?: string;
  dateReceived?: string;
  sourceChannel?:
    | 'Patient Portal'
    | 'Survey Comment'
    | 'Grievance Report'
    | 'Online Review'
    | 'Feedback Submission'
    | 'In-Person / Phone'
    | 'Other';
  departmentUnit?: string;
  triageStatus: 'pending' | 'processing' | 'completed' | 'failed';
  triageError?: string;
  triageResult?: TriageResult;
  humanSignOff?: {
    reviewedBy: string;
    reviewedAt: string;
    action: 'Approved' | 'Adjusted' | 'Escalated Further';
    notes?: string;
    adjustedCategory?: PrimaryCategory;
    adjustedSeverity?: SeverityLevel;
    adjustedDepartment?: DepartmentRoute;
    adjustedPriority?: EscalationPriority;
    adjustedHumanReviewStatus?: HumanReviewStatus;
  };
}
