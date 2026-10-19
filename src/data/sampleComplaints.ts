import { ComplaintRecord } from '../types/triage';

export const SAMPLE_COMPLAINTS: Omit<ComplaintRecord, 'triageStatus'>[] = [
  {
    id: 'CMP-2026-0891',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-784102',
    dateReceived: '2026-10-18',
    sourceChannel: 'Grievance Report',
    departmentUnit: 'Inpatient Med-Surg 3B',
    complaintText:
      'My father was admitted with severe pneumonia. Despite his bright red allergy wristband indicating a documented anaphylactic allergy to penicillin, a float nurse administered IV Ampicillin at 11:30 PM. Within 8 minutes he developed facial angioedema, stridor, and severe bronchospasm. The rapid response team had to administer intramuscular epinephrine, diphenhydramine, and oxygen. The charge nurse tried to brush it off as a mild rash and told us not to worry about reporting it.',
  },
  {
    id: 'CMP-2026-0892',
    patientName: 'Marcus Washington',
    mrn: 'MRN-912384',
    dateReceived: '2026-10-18',
    sourceChannel: 'Patient Portal',
    departmentUnit: 'Orthopedic Surgery Clinic',
    complaintText:
      'When I attended my post-operative evaluation for knee reconstruction, Dr. Vance refused to listen to my concerns about 8/10 persistent pain. He made derogatory comments insinuating that patients from my neighborhood are "drug seekers just trying to get narcotics." He dismissed me without examining the swollen surgical site. I felt completely dehumanized and racially profiled in front of the clinical student.',
  },
  {
    id: 'CMP-2026-0893',
    patientName: 'David K. Miller',
    mrn: 'MRN-449182',
    dateReceived: '2026-10-17',
    sourceChannel: 'Patient Portal',
    departmentUnit: 'Cardiology Ambulatory Care',
    complaintText:
      'I was discharged yesterday afternoon following stent placement, but the hospital pharmacy failed to dispense my ticagrelor (Brilinta) and blood pressure medication before closing. When I called the on-call nursing hotline this morning reporting chest tightness and shortness of breath, I was kept on hold for 47 minutes before being disconnected.',
  },
  {
    id: 'CMP-2026-0894',
    patientName: 'Sarah Jenkins',
    mrn: 'MRN-330918',
    dateReceived: '2026-10-17',
    sourceChannel: 'Online Review',
    departmentUnit: 'Infusion & Oncology Center',
    complaintText:
      'I am an electric wheelchair user receiving chemotherapy. The designated accessible restroom in the infusion suite was locked and blocked by supply pallets. When I asked staff for assistance, the charge nurse told me "you should have gone before your 4-hour infusion, you\'ll have to wait." I had an incontinence episode in the infusion chair. It was humiliating and violated basic accessibility standards.',
  },
  {
    id: 'CMP-2026-0895',
    patientName: 'Robert Hernandez',
    mrn: 'MRN-602811',
    dateReceived: '2026-10-16',
    sourceChannel: 'Feedback Submission',
    departmentUnit: 'Patient Financial Services',
    complaintText:
      'In the mail today I received an itemized billing statement and insurance explanation of benefits intended for another patient, including their full legal name, date of birth, Social Security Number, HIV diagnostic codes, and psychiatric consultation records. How could your billing office mail out someone else\'s most sensitive medical and psychiatric history?',
  },
  {
    id: 'CMP-2026-0896',
    patientName: 'Patricia Adams',
    mrn: 'MRN-552109',
    dateReceived: '2026-10-16',
    sourceChannel: 'Survey Comment',
    departmentUnit: 'Outpatient Imaging / MRI',
    complaintText:
      'My brain MRI scan has been rescheduled four separate times over the last six weeks. Each time I took unpaid time off work and arranged transportation. When I arrived today, the front desk informed me that the magnet has been down for scheduled maintenance all week and nobody called me to notify me before I drove 40 miles.',
  },
  {
    id: 'CMP-2026-0897',
    patientName: 'Liam Chen',
    mrn: 'MRN-881903',
    dateReceived: '2026-10-15',
    sourceChannel: 'Patient Portal',
    departmentUnit: 'Revenue Cycle Management',
    complaintText:
      'Prior to my scheduled outpatient shoulder arthroscopy, I verified in writing that both the facility and all surgical providers were in-network with Blue Cross PPO. Today I received a surprise "balance bill" of $4,850 from an out-of-network assistant anesthesiologist whom I never met or authorized. This is a direct violation of the federal No Surprises Act.',
  },
  {
    id: 'CMP-2026-0898',
    patientName: 'Grace Hopper',
    mrn: 'MRN-210934',
    dateReceived: '2026-10-15',
    sourceChannel: 'Feedback Submission',
    departmentUnit: 'Health Information Technology',
    complaintText:
      'The MyChart patient portal two-factor authentication SMS verification code is consistently expiring after 30 seconds, making it impossible to log in on iPhone Safari browser. I cannot access my lab results or request prescription refills before the weekend.',
  },
  {
    id: 'CMP-2026-0899',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-119283',
    dateReceived: '2026-10-14',
    sourceChannel: 'Survey Comment',
    departmentUnit: 'Hospital Facilities & Wayfinding',
    complaintText:
      'The visitor parking garage elevator in Pavilion C was out of service, and the signage directing patients to the laboratory blood draw stations from the garage lobby is confusing and obscured by construction walls. I spent 25 minutes wandering the basement corridors.',
  },
  {
    id: 'CMP-2026-0900',
    patientName: 'Miriam Al-Mansoor',
    mrn: 'MRN-773412',
    dateReceived: '2026-10-14',
    sourceChannel: 'Grievance Report',
    departmentUnit: 'Labor & Delivery',
    complaintText:
      'During my labor admission, I requested a certified medical Arabic interpreter multiple times as English is my second language and my husband was in transit. The staff repeatedly relied on my 11-year-old niece to translate surgical consent forms for an urgent epidural and C-section. My family felt terrified and unable to give truly informed consent.',
  },
];
