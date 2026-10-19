import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ComplaintRecord, TriageResult } from '../types/triage';

export interface ColumnMapping {
  complaintTextCol: string;
  patientNameCol?: string;
  mrnCol?: string;
  dateCol?: string;
  sourceChannelCol?: string;
  departmentCol?: string;
  idCol?: string;
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const findMatch = (patterns: RegExp[]): string | undefined => {
    for (const pattern of patterns) {
      const match = headers.find((h) => pattern.test(h.trim()));
      if (match) return match;
    }
    return undefined;
  };

  const complaintTextCol =
    findMatch([
      /complaint/i,
      /narrative/i,
      /grievance/i,
      /feedback/i,
      /comment/i,
      /description/i,
      /message/i,
      /issue/i,
      /detail/i,
      /text/i,
    ]) || headers[0] || 'Complaint';

  const patientNameCol = findMatch([/patient.*name/i, /name/i, /submitter/i, /complainant/i]);
  const mrnCol = findMatch([/mrn/i, /record.*num/i, /patient.*id/i, /chart.*id/i]);
  const dateCol = findMatch([/date/i, /received/i, /submitted/i, /timestamp/i, /time/i]);
  const sourceChannelCol = findMatch([/channel/i, /source/i, /origin/i, /medium/i, /category/i]);
  const departmentCol = findMatch([/department/i, /unit/i, /clinic/i, /ward/i, /service/i, /facility/i]);
  const idCol = findMatch([/^id$/i, /complaint.*id/i, /case.*id/i, /ticket/i, /ref/i]);

  return {
    complaintTextCol,
    patientNameCol,
    mrnCol,
    dateCol,
    sourceChannelCol,
    departmentCol,
    idCol,
  };
}

export async function parseFile(file: File): Promise<{
  rows: Record<string, any>[];
  headers: string[];
  records: ComplaintRecord[];
  detectedMapping: ColumnMapping;
}> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let rows: Record<string, any>[] = [];
  let headers: string[] = [];

  if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (jsonData.length > 0) {
      headers = Object.keys(jsonData[0]);
      rows = jsonData;
    }
  } else {
    // CSV or TSV
    const text = await file.text();
    const parsed = Papa.parse<Record<string, any>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    rows = parsed.data;
    headers = parsed.meta.fields || (rows[0] ? Object.keys(rows[0]) : []);
  }

  const detectedMapping = detectColumnMapping(headers);
  const records = convertRowsToRecords(rows, detectedMapping);

  return {
    rows,
    headers,
    records,
    detectedMapping,
  };
}

export function convertRowsToRecords(
  rows: Record<string, any>[],
  mapping: ColumnMapping
): ComplaintRecord[] {
  const records: ComplaintRecord[] = [];

  rows.forEach((row, index) => {
    const complaintText = String(row[mapping.complaintTextCol] || '').trim();
    if (!complaintText) return;

    const id =
      mapping.idCol && row[mapping.idCol]
        ? String(row[mapping.idCol])
        : `CMP-${Date.now().toString().slice(-4)}-${String(index + 1).padStart(3, '0')}`;

    const patientName = mapping.patientNameCol ? String(row[mapping.patientNameCol] || '') : undefined;
    const mrn = mapping.mrnCol ? String(row[mapping.mrnCol] || '') : undefined;
    const dateReceived = mapping.dateCol ? String(row[mapping.dateCol] || '') : undefined;
    const sourceChannelRaw = mapping.sourceChannelCol ? String(row[mapping.sourceChannelCol] || '') : '';
    const departmentUnit = mapping.departmentCol ? String(row[mapping.departmentCol] || '') : undefined;

    let sourceChannel: ComplaintRecord['sourceChannel'] = 'Feedback Submission';
    if (/portal|mychart/i.test(sourceChannelRaw)) sourceChannel = 'Patient Portal';
    else if (/survey|hcaphs/i.test(sourceChannelRaw)) sourceChannel = 'Survey Comment';
    else if (/grievance|formal/i.test(sourceChannelRaw)) sourceChannel = 'Grievance Report';
    else if (/review|google|yelp/i.test(sourceChannelRaw)) sourceChannel = 'Online Review';
    else if (/phone|call|in-person|desk/i.test(sourceChannelRaw)) sourceChannel = 'In-Person / Phone';

    const record: ComplaintRecord = {
      id,
      complaintText,
      patientName: patientName || undefined,
      mrn: mrn || undefined,
      dateReceived: dateReceived || new Date().toISOString().split('T')[0],
      sourceChannel,
      departmentUnit: departmentUnit || undefined,
      triageStatus: 'pending',
    };

    records.push(record);
  });

  return records;
}

export function downloadSampleTemplate(format: 'csv' | 'xlsx' = 'csv') {
  const sampleData = [
    {
      'Complaint ID': 'CMP-SAMPLE-001',
      'Patient Name': 'Jane Doe',
      'MRN': 'MRN-102938',
      'Date Received': '2026-10-19',
      'Source Channel': 'Patient Portal',
      'Department / Clinic': 'Emergency Department',
      'Complaint Narrative':
        'Patient was told to wait 6 hours with severe abdominal pain and fever while other patients who arrived later were brought back immediately. When I asked the triage nurse, she rolled her eyes.',
    },
    {
      'Complaint ID': 'CMP-SAMPLE-002',
      'Patient Name': 'John Smith',
      'MRN': 'MRN-449102',
      'Date Received': '2026-10-18',
      'Source Channel': 'Grievance Report',
      'Department / Clinic': 'Inpatient Surgery',
      'Complaint Narrative':
        'Wrong dose of anticoagulant (Heparin) administered post-operatively despite clear orders in EPIC chart. Required urgent lab draw and reversal agent.',
    },
    {
      'Complaint ID': 'CMP-SAMPLE-003',
      'Patient Name': 'Maria Garcia',
      'MRN': 'MRN-558291',
      'Date Received': '2026-10-18',
      'Source Channel': 'Survey Comment',
      'Department / Clinic': 'Patient Financial Services',
      'Complaint Narrative':
        'I received a surprise billing invoice of $2,300 for out-of-network pathology that was sent out without my consent or prior notice.',
    },
  ];

  if (format === 'csv') {
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthcare_complaint_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Complaints');
    XLSX.writeFile(wb, 'healthcare_complaint_template.xlsx');
  }
}

export function exportTriagedData(
  records: ComplaintRecord[],
  format: 'csv' | 'xlsx' | 'json' = 'csv'
) {
  const exportRows = records.map((r) => {
    const res = r.triageResult;
    const signOff = r.humanSignOff;

    return {
      'Case ID': r.id,
      'Patient Name': r.patientName || 'N/A',
      'MRN': r.mrn || 'N/A',
      'Date Received': r.dateReceived || '',
      'Source Channel': r.sourceChannel || '',
      'Department / Unit': r.departmentUnit || '',
      'Original Complaint': r.complaintText,
      'Triage Status': r.triageStatus,
      'Primary Category': signOff?.adjustedCategory || res?.complaintCategory || 'Pending',
      'Secondary Categories': res?.secondaryCategories?.join(', ') || 'None',
      'Severity Level': signOff?.adjustedSeverity || res?.severityLevel || 'Pending',
      'Severity Justification': res?.severityJustification || '',
      'Risk Flags': res?.riskFlags?.join('; ') || '',
      'Recommended Department': signOff?.adjustedDepartment || res?.recommendedDepartment || 'Pending',
      'Escalation Priority': signOff?.adjustedPriority || res?.escalationPriority || 'Pending',
      'Human Review Status': signOff?.adjustedHumanReviewStatus || res?.humanReviewStatus || 'Pending',
      'Major Risk': res?.executiveSummary?.majorRisk || '',
      'Recommended Action': res?.executiveSummary?.recommendedAction || '',
      'Executive Summary': res?.executiveSummary?.summaryText || '',
      'Human Oversight Signed Off By': signOff ? `${signOff.reviewedBy} (${signOff.action})` : 'Not signed off',
      'Human Oversight Notes': signOff?.notes || '',
      'Triaged At': res?.triagedAt || '',
    };
  });

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthcare_triage_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (format === 'csv') {
    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthcare_triage_results_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Triage Results');
    XLSX.writeFile(wb, `healthcare_triage_results_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
