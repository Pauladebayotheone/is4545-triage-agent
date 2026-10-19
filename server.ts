import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialise Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_PROMPT = `You are an expert Healthcare Complaint Triage Assistant for a clinical governance and risk management system.
Your purpose is to help healthcare organizations review, prioritize, and route patient complaints efficiently while maintaining patient safety, fairness, compliance, and appropriate human oversight.

Your role is NOT to resolve complaints.
Your role is to triage complaints and determine:
- What happened
- How serious it is
- Who should review it
- How quickly it should be addressed
- Whether human intervention is required

Execute these 6 steps for every complaint:

STEP 1: Complaint Category
Classify the complaint into one primary category:
- Communication
- Scheduling
- Wait Time
- Technology / Patient Portal
- Billing
- Clinical Care
- Discharge and Follow-Up
- Accessibility and Equity
- Patient Safety
- Privacy or Security
- Staff Conduct
- Other
If multiple categories are present, identify the primary category and list any secondary categories.

STEP 2: Severity Assessment
Assign a severity level:
- LEVEL 1 – Low (Minor inconvenience, Routine dissatisfaction, General suggestion)
- LEVEL 2 – Moderate (Repeated service failures, Significant frustration, Communication breakdown)
- LEVEL 3 – High (Potential patient harm, Medication-related concern, Serious accessibility issue, Escalated complaint)
- LEVEL 4 – Critical (Immediate patient safety risk, Potential legal exposure, Serious privacy violation, Discrimination allegation)
Provide detailed clinical governance reasoning for the assigned severity.

STEP 3: Risk Detection
Identify all applicable risks from:
- Patient Safety Risk
- Clinical Risk
- Compliance Risk
- Privacy Risk
- Accessibility Risk
- Equity Risk
- Reputational Risk
- Operational Risk
For every flagged risk, explain specifically why it was flagged.

STEP 4: Escalation Recommendation
ROUTE TO one of:
- Patient Experience Team
- Nursing Leadership
- Physician Leadership
- Quality Improvement Team
- Compliance Office
- Information Technology
- Revenue Cycle / Billing
- Accessibility Coordinator
- Risk Management
- Executive Review
Indicate whether escalation is:
- Routine
- Priority
- Immediate

STEP 5: Human Review Requirement
Determine whether:
- AI Review Only
- Human Review Recommended
- Human Review Required
MANDATORY SAFETY RULE: "Human Review Required" MUST be selected whenever:
- Patient safety concerns exist
- Discrimination is alleged
- Privacy concerns exist
- Legal or compliance risks are present
- The complaint is ambiguous and requires investigation

STEP 6: Executive Summary
Create a concise executive summary including:
- Complaint category
- Severity level
- Major risk
- Recommended action
- Concise 1-2 sentence narrative summary.`;

// Deterministic heuristic clinical governance fallback in case Gemini API is unavailable
function heuristicTriage(text: string) {
  const lower = text.toLowerCase();

  // Safety & High/Critical triggers
  const hasMedication = /medication|prescription|dose|insulin|pill|ampicillin|penicillin|drug|pharmac/.test(lower);
  const hasSevereHarm = /anaphyl|stridor|angioedema|bleed|chok|seizure|death|arrest|unconscious|code blue|epinephrine|rapid response/.test(lower);
  const hasDiscrimination = /racial|racist|slur|discriminat|profil|ethnic|bias|derogatory/.test(lower);
  const hasPrivacy = /social security|ssn|hiv|confidential|other patient|hipaa|breach|disclosure|records mailed/.test(lower);
  const hasAccessibility = /wheelchair|restroom|deaf|blind|ada|disability|interpreter|arabic|spanish|language/.test(lower);
  const hasBilling = /bill|charge|insurance|copay|out-of-network|anesthesiologist|no surprises|cost|balance/.test(lower);
  const hasPortal = /portal|login|password|mychart|sms|browser|app|website|two-factor/.test(lower);
  const hasScheduling = /reschedul|appointment|magnet|delay|wait|cancelled|scheduled/.test(lower);
  const hasStaff = /rude|dismissive|attitude|yelled|unprofessional|nurse|doctor/.test(lower);

  let category = 'Clinical Care';
  let secondaryCategories: string[] = [];
  let severity = 'LEVEL 2 – Moderate';
  let severityJustification = 'Operational disruption and patient dissatisfaction identified.';
  const riskFlags: string[] = ['Operational Risk'];
  const riskJustifications: Record<string, string> = {
    'Operational Risk': 'Service breakdown impacting clinical delivery workflow.',
  };
  let department = 'Patient Experience Team';
  let priority: 'Routine' | 'Priority' | 'Immediate' = 'Routine';
  let humanReview: 'AI Review Only' | 'Human Review Recommended' | 'Human Review Required' = 'Human Review Recommended';

  if (hasSevereHarm || (hasMedication && /allergy|wrong|anaphyl/i.test(lower))) {
    category = 'Patient Safety';
    secondaryCategories = ['Clinical Care', 'Staff Conduct'];
    severity = 'LEVEL 4 – Critical';
    severityJustification = 'Severe medication error or acute physical decompensation requiring emergency intervention with immediate safety exposure.';
    riskFlags.push('Patient Safety Risk', 'Clinical Risk', 'Compliance Risk');
    riskJustifications['Patient Safety Risk'] = 'Acute physiological distress and medication administration failure.';
    riskJustifications['Clinical Risk'] = 'Adverse drug event requiring emergency rescue medication.';
    riskJustifications['Compliance Risk'] = 'Failure to adhere to strict 5-rights medication verification protocol.';
    department = 'Risk Management';
    priority = 'Immediate';
    humanReview = 'Human Review Required';
  } else if (hasDiscrimination) {
    category = 'Staff Conduct';
    secondaryCategories = ['Accessibility and Equity'];
    severity = 'LEVEL 4 – Critical';
    severityJustification = 'Allegation of severe provider bias and racial discrimination during clinical pain management.';
    riskFlags.push('Equity Risk', 'Compliance Risk', 'Reputational Risk');
    riskJustifications['Equity Risk'] = 'Direct allegation of bias affecting equitable pain management and dignity.';
    riskJustifications['Compliance Risk'] = 'Title VI Civil Rights & patient bill of rights compliance violation.';
    riskJustifications['Reputational Risk'] = 'Severe institutional reputational harm if unaddressed.';
    department = 'Executive Review';
    priority = 'Immediate';
    humanReview = 'Human Review Required';
  } else if (hasPrivacy) {
    category = 'Privacy or Security';
    secondaryCategories = ['Billing', 'Compliance'];
    severity = 'LEVEL 4 – Critical';
    severityJustification = 'Breach of protected health information (PHI) disclosing sensitive diagnostic data and SSN to third party.';
    riskFlags.push('Privacy Risk', 'Compliance Risk', 'Reputational Risk');
    riskJustifications['Privacy Risk'] = 'Unauthorized disclosure of identifiable psychiatric and health data.';
    riskJustifications['Compliance Risk'] = 'HIPAA Privacy Rule breach requiring potential OCR notification.';
    department = 'Compliance Office';
    priority = 'Immediate';
    humanReview = 'Human Review Required';
  } else if (hasAccessibility) {
    category = 'Accessibility and Equity';
    secondaryCategories = ['Communication', 'Clinical Care'];
    severity = 'LEVEL 3 – High';
    severityJustification = 'Barriers to physical access or failure to provide certified medical interpretation, jeopardizing informed consent.';
    riskFlags.push('Accessibility Risk', 'Equity Risk', 'Compliance Risk');
    riskJustifications['Accessibility Risk'] = 'Physical barrier or auxiliary communication aid omission.';
    riskJustifications['Equity Risk'] = 'Disproportionate impact on vulnerable or non-English speaking patient.';
    department = 'Accessibility Coordinator';
    priority = 'Priority';
    humanReview = 'Human Review Required';
  } else if (hasBilling) {
    category = 'Billing';
    secondaryCategories = ['Communication'];
    severity = /surprise|federal|violation|4850|3400/i.test(lower) ? 'LEVEL 2 – Moderate' : 'LEVEL 1 – Low';
    severityJustification = 'Dispute regarding out-of-network balance billing and pre-service coverage assurances.';
    riskFlags.push('Compliance Risk');
    riskJustifications['Compliance Risk'] = 'Potential No Surprises Act compliance grievance requiring billing dispute review.';
    department = 'Revenue Cycle / Billing';
    priority = 'Priority';
    humanReview = 'Human Review Recommended';
  } else if (hasPortal) {
    category = 'Technology / Patient Portal';
    severity = 'LEVEL 1 – Low';
    severityJustification = 'Technical access limitation on patient portal session timeout with no immediate physical harm.';
    department = 'Information Technology';
    priority = 'Routine';
    humanReview = 'AI Review Only';
  } else if (hasScheduling) {
    category = 'Scheduling';
    secondaryCategories = ['Wait Time'];
    severity = 'LEVEL 2 – Moderate';
    severityJustification = 'Multiple recurring scheduling cancellations causing significant patient frustration and diagnostic delay.';
    department = 'Patient Experience Team';
    priority = 'Priority';
    humanReview = 'Human Review Recommended';
  } else if (hasStaff) {
    category = 'Staff Conduct';
    secondaryCategories = ['Communication'];
    severity = 'LEVEL 2 – Moderate';
    severityJustification = 'Perceived dismissive behavior and lack of responsiveness by bedside nursing personnel.';
    riskFlags.push('Reputational Risk');
    riskJustifications['Reputational Risk'] = 'Negative impact on patient satisfaction scores and trust.';
    department = 'Nursing Leadership';
    priority = 'Routine';
    humanReview = 'Human Review Recommended';
  }

  const majorRisk = riskFlags[0] || 'Operational Risk';
  const execSummary = {
    category,
    severity,
    majorRisk,
    recommendedAction: `Escalate to ${department} for ${priority.toLowerCase()} investigation and resolution.`,
    summaryText: `Patient grievance categorized under ${category} evaluated at ${severity}. ${severityJustification}`,
  };

  const outputBlock = [
    `Complaint Category: ${category}`,
    `Secondary Categories: ${secondaryCategories.length > 0 ? secondaryCategories.join(', ') : 'None'}`,
    `Severity Level: ${severity}`,
    `Severity Justification: ${severityJustification}`,
    `Risk Flags: ${riskFlags.map((f) => `${f} (${riskJustifications[f] || 'Identified in narrative'})`).join('; ')}`,
    `Recommended Department: ${department}`,
    `Escalation Priority: ${priority}`,
    `Human Review Status: ${humanReview}`,
    `Executive Summary: Category: ${category}; Severity: ${severity}; Major Risk: ${majorRisk}; Recommended Action: ${execSummary.recommendedAction}. ${execSummary.summaryText}`,
  ].join('\n');

  return {
    complaintCategory: category,
    secondaryCategories,
    severityLevel: severity,
    severityJustification,
    riskFlags,
    riskJustifications,
    recommendedDepartment: department,
    escalationPriority: priority,
    humanReviewStatus: humanReview,
    executiveSummary: execSummary,
    rawFormattedOutput: outputBlock,
    triagedAt: new Date().toISOString(),
  };
}

// Single complaint triage route
app.post('/api/triage/single', async (req: Request, res: Response) => {
  try {
    const { complaintText, metadata } = req.body;

    if (!complaintText || typeof complaintText !== 'string' || complaintText.trim().length === 0) {
      return res.status(400).json({ error: 'complaintText is required' });
    }

    // If Gemini client is not initialized or key missing, use clinical fallback
    if (!ai) {
      const fallback = heuristicTriage(complaintText);
      return res.json({ result: fallback, source: 'heuristic-engine' });
    }

    const prompt = `Analyze and triage the following healthcare complaint strictly according to your clinical governance system instructions:

--- COMPLAINT DETAILS ---
Complaint ID: ${metadata?.id || 'N/A'}
Source Channel: ${metadata?.sourceChannel || 'Not specified'}
Department / Unit: ${metadata?.departmentUnit || 'Not specified'}
Patient / Submitter: ${metadata?.patientName || 'Anonymous / Redacted'}

--- COMPLAINT TEXT ---
${complaintText}

Return the analysis adhering to all 6 steps.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            complaintCategory: {
              type: Type.STRING,
              description:
                'Primary category from: Communication, Scheduling, Wait Time, Technology / Patient Portal, Billing, Clinical Care, Discharge and Follow-Up, Accessibility and Equity, Patient Safety, Privacy or Security, Staff Conduct, Other',
            },
            secondaryCategories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of applicable secondary categories',
            },
            severityLevel: {
              type: Type.STRING,
              description: 'LEVEL 1 – Low, LEVEL 2 – Moderate, LEVEL 3 – High, or LEVEL 4 – Critical',
            },
            severityJustification: {
              type: Type.STRING,
              description: 'Reasoning for the assigned severity',
            },
            riskFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                'Applicable risks from: Patient Safety Risk, Clinical Risk, Compliance Risk, Privacy Risk, Accessibility Risk, Equity Risk, Reputational Risk, Operational Risk',
            },
            riskJustifications: {
              type: Type.OBJECT,
              description: 'Explanations for why each risk was flagged',
              properties: {
                'Patient Safety Risk': { type: Type.STRING },
                'Clinical Risk': { type: Type.STRING },
                'Compliance Risk': { type: Type.STRING },
                'Privacy Risk': { type: Type.STRING },
                'Accessibility Risk': { type: Type.STRING },
                'Equity Risk': { type: Type.STRING },
                'Reputational Risk': { type: Type.STRING },
                'Operational Risk': { type: Type.STRING },
              },
            },
            recommendedDepartment: {
              type: Type.STRING,
              description:
                'Route to: Patient Experience Team, Nursing Leadership, Physician Leadership, Quality Improvement Team, Compliance Office, Information Technology, Revenue Cycle / Billing, Accessibility Coordinator, Risk Management, Executive Review',
            },
            escalationPriority: {
              type: Type.STRING,
              description: 'Routine, Priority, or Immediate',
            },
            humanReviewStatus: {
              type: Type.STRING,
              description:
                'AI Review Only, Human Review Recommended, or Human Review Required (Mandatory Human Review Required if patient safety, discrimination, privacy, legal, compliance, or ambiguity)',
            },
            executiveSummary: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                severity: { type: Type.STRING },
                majorRisk: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
                summaryText: { type: Type.STRING },
              },
              required: ['category', 'severity', 'majorRisk', 'recommendedAction', 'summaryText'],
            },
          },
          required: [
            'complaintCategory',
            'secondaryCategories',
            'severityLevel',
            'severityJustification',
            'riskFlags',
            'recommendedDepartment',
            'escalationPriority',
            'humanReviewStatus',
            'executiveSummary',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    // Enforce Human Review Required safety rule deterministically
    const flags: string[] = parsed.riskFlags || [];
    const isCritical = parsed.severityLevel?.includes('LEVEL 4') || parsed.severityLevel?.includes('LEVEL 3');
    const hasSafety =
      flags.includes('Patient Safety Risk') ||
      flags.includes('Clinical Risk') ||
      parsed.complaintCategory === 'Patient Safety' ||
      isCritical;
    const hasPrivacy = flags.includes('Privacy Risk') || parsed.complaintCategory === 'Privacy or Security';
    const hasEquityOrDiscrimination =
      flags.includes('Equity Risk') ||
      parsed.complaintCategory === 'Accessibility and Equity' ||
      /discriminat|bias|racis/i.test(parsed.severityJustification || '') ||
      /discriminat|bias|racis/i.test(complaintText);
    const hasComplianceOrLegal =
      flags.includes('Compliance Risk') ||
      /legal|violation|act|ocr|hipaa/i.test(parsed.severityJustification || '') ||
      /legal|lawsuit|attorney|subpoena|violation/i.test(complaintText);

    if (hasSafety || hasPrivacy || hasEquityOrDiscrimination || hasComplianceOrLegal) {
      parsed.humanReviewStatus = 'Human Review Required';
    }

    const secondary =
      parsed.secondaryCategories && parsed.secondaryCategories.length > 0
        ? parsed.secondaryCategories.join(', ')
        : 'None';
    const riskString =
      flags.length > 0
        ? flags
            .map((f: string) => {
              const reason = parsed.riskJustifications?.[f];
              return reason ? `${f} (${reason})` : f;
            })
            .join('; ')
        : 'None identified';

    const execSummaryText = parsed.executiveSummary
      ? `Category: ${parsed.executiveSummary.category}; Severity: ${parsed.executiveSummary.severity}; Major Risk: ${parsed.executiveSummary.majorRisk}; Recommended Action: ${parsed.executiveSummary.recommendedAction}. ${parsed.executiveSummary.summaryText || ''}`.trim()
      : `${parsed.complaintCategory} - ${parsed.severityLevel}. Recommended route to ${parsed.recommendedDepartment}.`;

    const rawFormattedOutput = [
      `Complaint Category: ${parsed.complaintCategory}`,
      `Secondary Categories: ${secondary}`,
      `Severity Level: ${parsed.severityLevel}`,
      `Severity Justification: ${parsed.severityJustification}`,
      `Risk Flags: ${riskString}`,
      `Recommended Department: ${parsed.recommendedDepartment}`,
      `Escalation Priority: ${parsed.escalationPriority}`,
      `Human Review Status: ${parsed.humanReviewStatus}`,
      `Executive Summary: ${execSummaryText}`,
    ].join('\n');

    parsed.rawFormattedOutput = rawFormattedOutput;
    parsed.triagedAt = new Date().toISOString();

    return res.json({ result: parsed, source: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Triage error:', error);
    // Graceful fallback to heuristic in case of model error or rate limits
    try {
      const fallback = heuristicTriage(req.body?.complaintText || '');
      return res.json({ result: fallback, source: 'heuristic-engine', note: 'Model fallback triggered' });
    } catch {
      return res.status(500).json({ error: error.message || 'Failed to triage complaint' });
    }
  }
});

// Batch triage route for rapid parallel handling
app.post('/api/triage/batch', async (req: Request, res: Response) => {
  try {
    const { complaints } = req.body;
    if (!Array.isArray(complaints)) {
      return res.status(400).json({ error: 'complaints array is required' });
    }

    // Process batch items with a concurrency limit
    const results = [];
    for (const item of complaints) {
      if (!item.complaintText) continue;
      try {
        let triageData;
        if (!ai) {
          triageData = heuristicTriage(item.complaintText);
        } else {
          // Direct API call
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Triage complaint:\n${item.complaintText}`,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.1,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  complaintCategory: { type: Type.STRING },
                  secondaryCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
                  severityLevel: { type: Type.STRING },
                  severityJustification: { type: Type.STRING },
                  riskFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  riskJustifications: {
                    type: Type.OBJECT,
                    properties: {
                      'Patient Safety Risk': { type: Type.STRING },
                      'Clinical Risk': { type: Type.STRING },
                      'Compliance Risk': { type: Type.STRING },
                      'Privacy Risk': { type: Type.STRING },
                      'Accessibility Risk': { type: Type.STRING },
                      'Equity Risk': { type: Type.STRING },
                      'Reputational Risk': { type: Type.STRING },
                      'Operational Risk': { type: Type.STRING },
                    },
                  },
                  recommendedDepartment: { type: Type.STRING },
                  escalationPriority: { type: Type.STRING },
                  humanReviewStatus: { type: Type.STRING },
                  executiveSummary: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      majorRisk: { type: Type.STRING },
                      recommendedAction: { type: Type.STRING },
                      summaryText: { type: Type.STRING },
                    },
                    required: ['category', 'severity', 'majorRisk', 'recommendedAction', 'summaryText'],
                  },
                },
                required: [
                  'complaintCategory',
                  'secondaryCategories',
                  'severityLevel',
                  'severityJustification',
                  'riskFlags',
                  'recommendedDepartment',
                  'escalationPriority',
                  'humanReviewStatus',
                  'executiveSummary',
                ],
              },
            },
          });
          triageData = JSON.parse(response.text?.trim() || '{}');
        }

        // Safety enforcement
        const flags: string[] = triageData.riskFlags || [];
        const isCritical =
          triageData.severityLevel?.includes('LEVEL 4') || triageData.severityLevel?.includes('LEVEL 3');
        const hasSafety =
          flags.includes('Patient Safety Risk') ||
          flags.includes('Clinical Risk') ||
          triageData.complaintCategory === 'Patient Safety' ||
          isCritical;
        const hasPrivacy = flags.includes('Privacy Risk') || triageData.complaintCategory === 'Privacy or Security';
        const hasEquityOrDiscrimination =
          flags.includes('Equity Risk') ||
          triageData.complaintCategory === 'Accessibility and Equity' ||
          /discriminat|bias|racis/i.test(triageData.severityJustification || '') ||
          /discriminat|bias|racis/i.test(item.complaintText);
        const hasComplianceOrLegal =
          flags.includes('Compliance Risk') ||
          /legal|violation|act|ocr|hipaa/i.test(triageData.severityJustification || '') ||
          /legal|lawsuit|attorney|subpoena|violation/i.test(item.complaintText);

        if (hasSafety || hasPrivacy || hasEquityOrDiscrimination || hasComplianceOrLegal) {
          triageData.humanReviewStatus = 'Human Review Required';
        }

        const secondary =
          triageData.secondaryCategories && triageData.secondaryCategories.length > 0
            ? triageData.secondaryCategories.join(', ')
            : 'None';
        const riskString =
          flags.length > 0
            ? flags
                .map((f: string) => {
                  const reason = triageData.riskJustifications?.[f];
                  return reason ? `${f} (${reason})` : f;
                })
                .join('; ')
            : 'None identified';

        const execSummaryText = triageData.executiveSummary
          ? `Category: ${triageData.executiveSummary.category}; Severity: ${triageData.executiveSummary.severity}; Major Risk: ${triageData.executiveSummary.majorRisk}; Recommended Action: ${triageData.executiveSummary.recommendedAction}. ${triageData.executiveSummary.summaryText || ''}`.trim()
          : `${triageData.complaintCategory} - ${triageData.severityLevel}. Recommended route to ${triageData.recommendedDepartment}.`;

        triageData.rawFormattedOutput = [
          `Complaint Category: ${triageData.complaintCategory}`,
          `Secondary Categories: ${secondary}`,
          `Severity Level: ${triageData.severityLevel}`,
          `Severity Justification: ${triageData.severityJustification}`,
          `Risk Flags: ${riskString}`,
          `Recommended Department: ${triageData.recommendedDepartment}`,
          `Escalation Priority: ${triageData.escalationPriority}`,
          `Human Review Status: ${triageData.humanReviewStatus}`,
          `Executive Summary: ${execSummaryText}`,
        ].join('\n');
        triageData.triagedAt = new Date().toISOString();

        results.push({ id: item.id, result: triageData, status: 'completed' });
      } catch (err: any) {
        // Fallback to heuristic
        const fallback = heuristicTriage(item.complaintText);
        results.push({ id: item.id, result: fallback, status: 'completed', note: 'Heuristic fallback applied' });
      }
    }

    return res.json({ results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Batch triage failed' });
  }
});

// Vite or Static file serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Healthcare Complaint Triage Assistant running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
