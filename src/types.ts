/**
 * Data Types for Tinubu Movement Worldwide (TMW) Electoral Ward Registration Form
 */

export type ExcoLevel = 'National' | 'State' | 'LGA' | 'Ward' | 'None';

export interface RegistrationRecord {
  id: string;
  referenceId: string;
  state: string;
  lga: string;
  ward: string;
  fullName: string;
  phone: string;
  vin: string;
  pollingUnit: string;
  bankName: string;
  accountNumber: string;
  signature: string;
  timestamp: string;
  status: 'synced' | 'pending' | 'local_saved';
  // EXCO vs Non-EXCO distinction at all administrative levels
  isExco: boolean;
  excoLevel: ExcoLevel;
  role: string;
}

export interface WardSheetRow {
  sn: number;
  names: string;
  role?: string;
  isExco?: boolean;
  phone: string;
  vin: string;
  pollingUnit: string;
  bank: string;
  accountNo: string;
  sign: string;
}

export interface WardSheetHeader {
  state: string;
  lga: string;
  ward: string;
  coordinatorName?: string;
  submissionDate?: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetName?: string;
  autoSync: boolean;
  lastTestedAt?: string;
  isOnline: boolean;
}

// ---------------------------------------------------------------------------
// Reporting Portal & Role-Based Dashboard Types
// ---------------------------------------------------------------------------

export type OfficerRole = 
  | 'National Coordinator'
  | 'State Coordinator'
  | 'Deputy/Operations Lead'
  | 'State Secretary'
  | 'State Finance/Admin Lead'
  | 'State Communications Lead'
  | 'State Mobilisation Lead'
  | 'State Policy/Engagement Lead'
  | 'LGA Coordinators'
  | 'Ward Coordinators';

export interface OfficerSession {
  id: string;
  role: OfficerRole;
  name: string;
  phone?: string;
  state: string;
  lga?: string;
  ward?: string;
  isSuperAdmin: boolean;
  loginAt: string;
}

export type ReportPeriod = 'Weekly' | 'Monthly' | 'Flash / Urgent' | 'Quarterly' | 'Ad-hoc';
export type ReportPriority = 'Routine' | 'High' | 'Critical / Urgent';
export type ReportStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Actioned';

export interface OfficerReport {
  id: string;
  refNumber: string;
  role: OfficerRole;
  officerName: string;
  officerPhone?: string;
  state: string;
  lga?: string;
  ward?: string;
  title: string;
  period: ReportPeriod;
  category: string;
  priority: ReportPriority;
  summary: string;
  keyActivities: string;
  mobilizationFigures?: {
    newMembersRegistered?: number;
    pvcCollected?: number;
    pollingUnitsCovered?: number;
  };
  challenges: string;
  financialAdminNeeds?: string;
  recommendations: string;
  status: ReportStatus;
  nationalCoordinatorNotes?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  category: 'National Directive' | 'Mobilisation Alert' | 'Circular' | 'Media Briefing' | 'Security / Compliance';
  date: string;
  publishedBy: string;
  content: string;
  targetRoles: OfficerRole[] | 'ALL';
  priority: 'Normal' | 'High' | 'Urgent';
  badgeText?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole: OfficerRole | 'ALL';
  type: 'report_status' | 'announcement' | 'deadline' | 'system';
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  officerName: string;
  role: OfficerRole;
  action: string;
  location: string;
  type: 'report_submission' | 'announcement_broadcast' | 'status_update' | 'login';
}
