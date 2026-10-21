/**
 * Data Types for Tinubu Movement Worldwide (TMW) Electoral Ward Registration Form
 */

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
}

export interface WardSheetRow {
  sn: number;
  names: string;
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
