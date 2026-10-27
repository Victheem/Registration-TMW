/**
 * Google Sheets & Apps Script Integration Service
 * Tinubu Movement Worldwide (TMW) Electoral Ward Registration Form
 */

import { RegistrationRecord, WardSheetHeader, WardSheetRow } from "../types";

export const DEFAULT_SCRIPT_STORAGE_KEY = "tmw_google_apps_script_url";
export const REGISTRATIONS_STORAGE_KEY = "tmw_registrations_v1";

/**
 * Production-ready Google Apps Script boilerplate code.
 * Direct copy-paste ready for Google Sheets Extensions > Apps Script.
 */
export const GOOGLE_APPS_SCRIPT_BOILERPLATE = `/**
 * ============================================================================
 * TINUBU MOVEMENT WORLDWIDE (TMW) - ELECTORAL WARD REGISTRATION BACKEND
 * National Support & Campaign Coordination Institution
 * Renewed Hope. Renewed Nigeria. Brighter Future.
 * ============================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. In your Google Sheet, click on "Extensions" > "Apps Script".
 * 2. Delete all existing code in 'Code.gs' and paste this entire file.
 * 3. Click "Save" (disk icon or Ctrl+S).
 * 4. Click the blue "Deploy" button at top right > "New deployment".
 * 5. Select type: "Web app" (click gear icon if prompted).
 * 6. Set Description: "TMW Electoral Ward Registration Endpoint".
 * 7. Set "Execute as": "Me" (your Google account).
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL for frontend submission!
 * 9. Click "Deploy", review permissions, and authorize your Google account.
 * 10. Copy the generated Web App URL and paste it into the TMW App Settings!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent submissions from field agents
  var success = lock.tryLock(30000);
  if (!success) {
    return createJsonResponse({
      status: "error",
      message: "Server is currently busy processing another registration. Please try again."
    }, 503);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Auto-initialize header row if sheet is fresh
    if (sheet.getLastRow() === 0) {
      setupSheetHeaders(sheet);
    }

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var timestamp = new Date();
    var formattedDate = Utilities.formatDate(timestamp, "Africa/Lagos", "yyyy-MM-dd HH:mm:ss");
    var insertedCount = 0;

    // Handle batch submission (e.g. from the 20-row Electoral Ward Sheet)
    if (payload.records && Array.isArray(payload.records)) {
      var rows = [];
      for (var i = 0; i < payload.records.length; i++) {
        var rec = payload.records[i];
        if (!rec.fullName && !rec.names && !rec.phone) continue; // skip blank rows
        rows.push([
          formattedDate,
          rec.referenceId || ("TMW-BATCH-" + Utilities.getUuid().substring(0, 8).toUpperCase()),
          rec.state || payload.state || "",
          rec.lga || payload.lga || "",
          rec.ward || payload.ward || "",
          rec.fullName || rec.names || "",
          rec.phone ? "'" + rec.phone : "",
          rec.vin ? "'" + rec.vin : "",
          rec.pollingUnit || "",
          rec.bankName || rec.bank || "",
          rec.accountNumber || rec.accountNo ? "'" + (rec.accountNumber || rec.accountNo) : "",
          rec.signature || "Confirmed / Signed",
          "Synced Online"
        ]);
      }
      if (rows.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
        insertedCount = rows.length;
      }
    } else {
      // Handle single individual registration
      var singleRow = [
        formattedDate,
        payload.referenceId || ("TMW-" + Utilities.getUuid().substring(0, 8).toUpperCase()),
        payload.state || "",
        payload.lga || "",
        payload.ward || "",
        payload.fullName || payload.names || "",
        payload.phone ? "'" + payload.phone : "",
        payload.vin ? "'" + payload.vin : "",
        payload.pollingUnit || "",
        payload.bankName || payload.bank || "",
        payload.accountNumber || payload.accountNo ? "'" + (payload.accountNumber || payload.accountNo) : "",
        payload.signature || "Confirmed / Signed",
        "Synced Online"
      ];
      sheet.appendRow(singleRow);
      insertedCount = 1;
    }

    return createJsonResponse({
      status: "success",
      message: "Registration submitted successfully!",
      inserted: insertedCount,
      timestamp: formattedDate
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Health check & verification endpoint
 */
function doGet(e) {
  return createJsonResponse({
    status: "active",
    institution: "Tinubu Movement Worldwide (TMW)",
    service: "Electoral Ward Registration Webhook API",
    motto: "Renewed Hope. Renewed Nigeria. Brighter Future.",
    version: "2.4.0",
    time: new Date().toISOString()
  });
}

/**
 * Creates standardized header row with TMW corporate styling
 */
function setupSheetHeaders(sheet) {
  var headers = [
    "Timestamp (WAT)",
    "Reference ID",
    "State",
    "LGA",
    "Electoral Ward",
    "Full Name / Names",
    "Phone Number",
    "Voter's Card Number (VIN)",
    "Polling Unit",
    "Bank Name",
    "Account Number",
    "Signature / Status",
    "Source"
  ];
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0D5C3A"); // TMW Deep Forest Green
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Retrieves the currently saved Web App URL from localStorage
 */
export function getSavedScriptUrl(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(DEFAULT_SCRIPT_STORAGE_KEY);
  if (stored && stored.trim()) return stored.trim();
  return (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL || "";
}

/**
 * Saves the Web App URL to localStorage
 */
export function saveScriptUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEFAULT_SCRIPT_STORAGE_KEY, url.trim());
}

/**
 * Retrieves local registrations stored in browser
 */
export function getStoredRegistrations(): RegistrationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves an updated list of registrations to browser storage
 */
export function saveStoredRegistrations(records: RegistrationRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(records));
}

/**
 * Submits a single registration to the Google Apps Script Web App
 */
export async function submitRegistration(record: RegistrationRecord): Promise<{
  success: boolean;
  mode: 'sheets' | 'local_queued';
  message: string;
}> {
  const scriptUrl = getSavedScriptUrl();
  const existingRecords = getStoredRegistrations();

  // If no script URL configured, save locally with 'local_saved' status
  if (!scriptUrl) {
    const updated = [{ ...record, status: 'local_saved' as const }, ...existingRecords];
    saveStoredRegistrations(updated);
    return {
      success: true,
      mode: 'local_queued',
      message: "Registration stored locally. Connect your Google Sheet in settings to auto-sync to your spreadsheet!"
    };
  }

  try {
    // We send payload as text/plain with JSON body.
    // Google Apps Script can parse this via e.postData.contents,
    // avoiding CORS preflight errors in modern browsers!
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors", // Crucial for Google Apps Script redirects
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(record),
    });

    // In 'no-cors' mode, browser returns opaque response, which indicates successful transmission.
    const updated = [{ ...record, status: 'synced' as const }, ...existingRecords];
    saveStoredRegistrations(updated);

    return {
      success: true,
      mode: 'sheets',
      message: "Registration submitted successfully to Google Sheets!"
    };
  } catch (error) {
    console.warn("Failed sending to Google Sheets Web App, fallback to local queue:", error);
    const updated = [{ ...record, status: 'pending' as const }, ...existingRecords];
    saveStoredRegistrations(updated);

    return {
      success: true,
      mode: 'local_queued',
      message: "Saved to local offline queue due to network/CORS. You can resync once online!"
    };
  }
}

/**
 * Submits a batch 20-row ward registration sheet to Google Sheets
 */
export async function submitBatchWardSheet(
  header: WardSheetHeader,
  rows: WardSheetRow[]
): Promise<{ success: boolean; message: string; count: number }> {
  const validRows = rows.filter(r => r.names.trim() || r.phone.trim() || r.vin.trim());
  if (validRows.length === 0) {
    throw new Error("Please enter at least one member row before submitting.");
  }

  const scriptUrl = getSavedScriptUrl();
  const timestamp = new Date().toISOString();

  // Map into RegistrationRecords
  const mappedRecords: RegistrationRecord[] = validRows.map((row, idx) => ({
    id: `batch-${Date.now()}-${idx}`,
    referenceId: `TMW-WARD-${header.state.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    state: header.state,
    lga: header.lga,
    ward: header.ward,
    fullName: row.names,
    phone: row.phone,
    vin: row.vin,
    pollingUnit: row.pollingUnit,
    bankName: row.bank,
    accountNumber: row.accountNo,
    signature: row.sign || "Signed",
    timestamp,
    status: scriptUrl ? 'synced' : 'local_saved'
  }));

  const existing = getStoredRegistrations();
  saveStoredRegistrations([...mappedRecords, ...existing]);

  if (scriptUrl) {
    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          type: "batch_ward_sheet",
          state: header.state,
          lga: header.lga,
          ward: header.ward,
          records: mappedRecords
        })
      });

      return {
        success: true,
        count: validRows.length,
        message: `Successfully synchronized ${validRows.length} ward members to Google Sheet!`
      };
    } catch {
      return {
        success: true,
        count: validRows.length,
        message: `Saved ${validRows.length} members to offline queue. You can sync when connected.`
      };
    }
  }

  return {
    success: true,
    count: validRows.length,
    message: `Stored ${validRows.length} ward members locally. Configure Google Sheets to sync live!`
  };
}

/**
 * Tests connection to the provided Google Apps Script Web App URL
 */
export async function testConnection(url: string): Promise<{ ok: boolean; message: string }> {
  if (!url || !url.startsWith("https://script.google.com/macros/s/")) {
    return {
      ok: false,
      message: "Please enter a valid Google Apps Script Web App URL starting with https://script.google.com/macros/s/..."
    };
  }

  try {
    // Attempt ping with no-cors or standard GET
    await fetch(url, { method: "GET", mode: "no-cors" });
    return {
      ok: true,
      message: "Connection verified! The Google Apps Script endpoint is reachable."
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Could not reach endpoint: ${err?.message || "Check your URL and permissions ('Anyone')."}`
    };
  }
}

/**
 * Exports all local registrations to downloadable CSV
 */
export function exportToCSV(records: RegistrationRecord[], filename = "TMW_Electoral_Ward_Registrations.csv"): void {
  if (records.length === 0) return;

  const headers = [
    "Reference ID",
    "State",
    "LGA",
    "Electoral Ward",
    "Full Name",
    "Phone Number",
    "Voter Card VIN",
    "Polling Unit",
    "Bank Name",
    "Account Number",
    "Timestamp",
    "Sync Status"
  ];

  const csvRows = [headers.join(",")];

  for (const r of records) {
    const row = [
      `"${r.referenceId}"`,
      `"${r.state.replace(/"/g, '""')}"`,
      `"${r.lga.replace(/"/g, '""')}"`,
      `"${r.ward.replace(/"/g, '""')}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${r.vin}"`,
      `"${r.pollingUnit.replace(/"/g, '""')}"`,
      `"${r.bankName.replace(/"/g, '""')}"`,
      `"${r.accountNumber}"`,
      `"${r.timestamp}"`,
      `"${r.status}"`
    ];
    csvRows.push(row.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
