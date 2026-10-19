import { TriageResult } from '../types/triage';

export function formatTriageOutput(result: TriageResult): string {
  const secondary =
    result.secondaryCategories && result.secondaryCategories.length > 0
      ? result.secondaryCategories.join(', ')
      : 'None';

  const riskLines =
    result.riskFlags && result.riskFlags.length > 0
      ? result.riskFlags
          .map((flag) => {
            const why = result.riskJustifications?.[flag];
            return why ? `${flag} (${why})` : flag;
          })
          .join('; ')
      : 'None identified';

  const execSummary = result.executiveSummary
    ? `Category: ${result.executiveSummary.category}; Severity: ${result.executiveSummary.severity}; Major Risk: ${result.executiveSummary.majorRisk}; Recommended Action: ${result.executiveSummary.recommendedAction}. ${result.executiveSummary.summaryText || ''}`.trim()
    : `${result.complaintCategory} - ${result.severityLevel}. Recommended route to ${result.recommendedDepartment} (${result.escalationPriority}).`;

  return [
    `Complaint Category: ${result.complaintCategory}`,
    `Secondary Categories: ${secondary}`,
    `Severity Level: ${result.severityLevel}`,
    `Severity Justification: ${result.severityJustification}`,
    `Risk Flags: ${riskLines}`,
    `Recommended Department: ${result.recommendedDepartment}`,
    `Escalation Priority: ${result.escalationPriority}`,
    `Human Review Status: ${result.humanReviewStatus}`,
    `Executive Summary: ${execSummary}`,
  ].join('\n');
}

/**
 * Enforces the strict clinical governance safety rule:
 * Human Review Required should be selected whenever:
 * - Patient safety concerns exist
 * - Discrimination is alleged
 * - Privacy concerns exist
 * - Legal or compliance risks are present
 * - The complaint is ambiguous and requires investigation
 */
export function enforceHumanReviewRule(result: TriageResult): TriageResult {
  const flags = result.riskFlags || [];
  const hasSafety =
    flags.includes('Patient Safety Risk') ||
    flags.includes('Clinical Risk') ||
    result.complaintCategory === 'Patient Safety' ||
    result.severityLevel === 'LEVEL 4 – Critical' ||
    result.severityLevel === 'LEVEL 3 – High';

  const hasPrivacy =
    flags.includes('Privacy Risk') ||
    result.complaintCategory === 'Privacy or Security';

  const hasEquityOrDiscrimination =
    flags.includes('Equity Risk') ||
    result.complaintCategory === 'Accessibility and Equity' ||
    result.severityJustification?.toLowerCase().includes('discriminat') ||
    result.executiveSummary?.summaryText?.toLowerCase().includes('discriminat');

  const hasComplianceOrLegal =
    flags.includes('Compliance Risk') ||
    result.severityJustification?.toLowerCase().includes('legal') ||
    result.severityJustification?.toLowerCase().includes('violation');

  if (hasSafety || hasPrivacy || hasEquityOrDiscrimination || hasComplianceOrLegal) {
    if (result.humanReviewStatus !== 'Human Review Required') {
      result.humanReviewStatus = 'Human Review Required';
    }
  }

  // Update raw formatted output
  result.rawFormattedOutput = formatTriageOutput(result);
  return result;
}
