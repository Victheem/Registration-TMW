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
 * INSTRUCTIONS FOR DEPLOYING ON A BRAND-NEW GOOGLE SHEET:
 * 1. Open your brand-new, empty Google Sheet (e.g. from https://sheets.new).
 * 2. In the top menu, click "Extensions" > "Apps Script".
 * 3. Delete all default code in 'Code.gs' and paste this entire code file.
 * 4. Click the disk icon (Save) or press Ctrl+S.
 * 5. At top-right, click the blue "Deploy" button > "New deployment".
 * 6. Click the gear icon next to 'Select type' and choose "Web app".
 * 7. Set Description: "TMW Electoral Ward Registration Endpoint".
 * 8. Set "Execute as": "Me" (your Google account).
 * 9. Set "Who has access": "Anyone"  <-- CRITICAL FOR PHONES & EXTERNAL DEVICES!
 *    (DO NOT set to "Only myself", or mobile phones and field agents will get 401 Unauthorized!)
 * 10. Click "Deploy", authorize access (Advanced > Go to project > Allow).
 * 11. Copy the Web App URL (ends in /exec) and paste into the TMW App Settings.
 * 
 * * The script will automatically create the official green table headers on the first test or registration!
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

    var ss;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (err) {}

    // Support standalone Apps Script if user passed spreadsheetId
    if (!ss && payload.spreadsheetId) {
      try {
        ss = SpreadsheetApp.openById(payload.spreadsheetId);
      } catch (err) {}
    }

    if (!ss) {
      return createJsonResponse({
        status: "error",
        message: "Spreadsheet not found. Please ensure this Apps Script was opened from Extensions > Apps Script inside your Google Sheet."
      }, 400);
    }

    var sheet = ss.getActiveSheet();
    
    // Auto-initialize header row if sheet is fresh or empty
    if (sheet.getLastRow() === 0) {
      setupSheetHeaders(sheet);
    }

    // Explicit Action: Initialize fresh sheet headers & optional sample row
    if (payload.action === "init_fresh_sheet" || payload.type === "init_fresh_sheet") {
      setupSheetHeaders(sheet);
      var sampleInserted = false;
      if (payload.includeSampleRow) {
        sheet.appendRow([
          formattedDate,
          "TMW-TEST-" + Utilities.getUuid().substring(0, 6).toUpperCase(),
          payload.state || "Lagos",
          payload.lga || "Ikeja",
          payload.ward || "Ward 01 (Alausa)",
          payload.fullName || "TMW Verification & Setup Test Row",
          "EXCO",
          "State",
          "State Coordinator",
          "'08012345678",
          "'90F5B1234567890",
          "PU 001 Alausa Secretariat",
          "Central Bank of Nigeria",
          "'0123456789",
          "Verified / Setup Complete",
          "System Test"
        ]);
        sampleInserted = true;
      }
      return createJsonResponse({
        status: "success",
        message: "Google Sheet headers initialized successfully!" + (sampleInserted ? " Test row inserted." : ""),
        timestamp: formattedDate
      });
    }

    // Explicit Action: Fetch/Read all records from Google Sheet
    if (payload.action === "fetch_records" || payload.type === "fetch_records" || payload.action === "get_records") {
      var fetchedRecords = readSheetRecords(sheet);
      return createJsonResponse({
        status: "success",
        count: fetchedRecords.length,
        records: fetchedRecords,
        timestamp: formattedDate
      });
    }

    // Ping test / connection test
    if (payload.type === "ping_test" || payload.action === "test_connection") {
      return createJsonResponse({
        status: "success",
        message: "Connection active! TMW Webhook is ready to receive registrations.",
        timestamp: formattedDate
      });
    }

    var insertedCount = 0;

    // Handle batch submission (e.g. from the 20-row Electoral Ward Sheet or central sync)
    if (payload.records && Array.isArray(payload.records)) {
      var rows = [];
      for (var i = 0; i < payload.records.length; i++) {
        var rec = payload.records[i];
        if (!rec.fullName && !rec.names && !rec.phone) continue; // skip blank rows
        var isExcoText = rec.isExco ? "EXCO" : "Non-EXCO";
        var excoLevelText = rec.excoLevel || (rec.isExco ? "Ward" : "None");
        var roleText = rec.role || (rec.isExco ? "Ward Coordinators" : "General Member (Non-EXCO)");

        rows.push([
          formattedDate,
          rec.referenceId || ("TMW-BATCH-" + Utilities.getUuid().substring(0, 8).toUpperCase()),
          rec.state || payload.state || "",
          rec.lga || payload.lga || "",
          rec.ward || payload.ward || "",
          rec.fullName || rec.names || "",
          isExcoText,
          excoLevelText,
          roleText,
          rec.phone ? "'" + rec.phone : "",
          rec.vin ? "'" + rec.vin : "",
          rec.pollingUnit || "",
          rec.bankName || rec.bank || "",
          rec.accountNumber || rec.accountNo ? "'" + (rec.accountNumber || rec.accountNo) : "",
          rec.signature || "Confirmed / Signed",
          "Dual-Sync Online"
        ]);
      }
      if (rows.length > 0) {
        var startRow = sheet.getLastRow() + 1;
        sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
        insertedCount = rows.length;
      }
    } else {
      // Handle single individual registration
      var singleIsExcoText = payload.isExco ? "EXCO" : "Non-EXCO";
      var singleExcoLevelText = payload.excoLevel || (payload.isExco ? "Ward" : "None");
      var singleRoleText = payload.role || (payload.isExco ? "Ward Coordinators" : "General Member (Non-EXCO)");

      var singleRow = [
        formattedDate,
        payload.referenceId || ("TMW-" + Utilities.getUuid().substring(0, 8).toUpperCase()),
        payload.state || "",
        payload.lga || "",
        payload.ward || "",
        payload.fullName || payload.names || "",
        singleIsExcoText,
        singleExcoLevelText,
        singleRoleText,
        payload.phone ? "'" + payload.phone : "",
        payload.vin ? "'" + payload.vin : "",
        payload.pollingUnit || "",
        payload.bankName || payload.bank || "",
        payload.accountNumber || payload.accountNo ? "'" + (payload.accountNumber || payload.accountNo) : "",
        payload.signature || "Confirmed / Signed",
        "Dual-Sync Online"
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
 * Health check & record fetch endpoint for coordinator registry
 */
function doGet(e) {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getActiveSheet() && ss.getActiveSheet().getLastRow() === 0) {
      setupSheetHeaders(ss.getActiveSheet());
    }
  } catch (err) {}

  if (!ss && e && e.parameter && e.parameter.spreadsheetId) {
    try {
      ss = SpreadsheetApp.openById(e.parameter.spreadsheetId);
    } catch (err) {}
  }

  if (!ss) {
    return createJsonResponse({
      status: "error",
      message: "Spreadsheet not found."
    }, 400);
  }

  var sheet = ss.getActiveSheet();
  var records = readSheetRecords(sheet);

  return createJsonResponse({
    status: "success",
    institution: "Tinubu Movement Worldwide (TMW)",
    service: "Electoral Ward Registration Webhook API",
    version: "3.5.0",
    count: records.length,
    records: records,
    time: new Date().toISOString()
  });
}

/**
 * Reads all registered members from sheet row 2 downward and returns clean JSON objects
 */
function readSheetRecords(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  var lastCol = Math.max(sheet.getLastColumn(), 16);
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = dataRange.getValues();
  var records = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var fullName = row[5] ? row[5].toString().trim() : "";
    var phone = row[9] ? row[9].toString().trim().replace(/^'/, "") : "";
    var refId = row[1] ? row[1].toString().trim() : "";

    // Skip empty rows
    if (!fullName && !phone && !refId) continue;

    var ts = row[0] ? row[0].toString() : new Date().toISOString();
    var state = row[2] ? row[2].toString().trim() : "";
    var lga = row[3] ? row[3].toString().trim() : "";
    var ward = row[4] ? row[4].toString().trim() : "";
    var classification = row[6] ? row[6].toString().trim() : "";
    var isExco = classification.toUpperCase().indexOf("EXCO") !== -1 && classification.toUpperCase().indexOf("NON") === -1;
    var excoLevel = row[7] ? row[7].toString().trim() : (isExco ? "Ward" : "None");
    var role = row[8] ? row[8].toString().trim() : (isExco ? "Ward Coordinators" : "General Member (Non-EXCO)");
    var vin = row[10] ? row[10].toString().trim().replace(/^'/, "") : "";
    var pollingUnit = row[11] ? row[11].toString().trim() : "";
    var bankName = row[12] ? row[12].toString().trim() : "";
    var accountNumber = row[13] ? row[13].toString().trim().replace(/^'/, "") : "";
    var signature = row[14] ? row[14].toString().trim() : "Verified";

    var recordId = refId ? ("tmw-" + refId.toLowerCase().replace(/[^a-z0-9]/g, "-")) : ("sheet-row-" + (i + 2));

    records.push({
      id: recordId,
      referenceId: refId || ("TMW-ROW-" + (i + 2)),
      fullName: fullName,
      phone: phone,
      vin: vin,
      state: state,
      lga: lga,
      ward: ward,
      pollingUnit: pollingUnit,
      bankName: bankName,
      accountNumber: accountNumber,
      signature: signature,
      isExco: isExco,
      excoLevel: excoLevel,
      role: role,
      timestamp: ts,
      status: "synced"
    });
  }

  return records;
}

/**
 * Creates standardized header row with TMW corporate styling and EXCO/Role tracking.
 * Also configures text column formatting so phone & bank account leading zeros are never lost.
 */
function setupSheetHeaders(sheet) {
  // If header is already there, do not overwrite
  if (sheet.getLastRow() >= 1) {
    var firstCell = sheet.getRange(1, 1).getValue();
    if (firstCell && firstCell.toString().indexOf("Timestamp") !== -1) {
      return;
    }
  }

  var headers = [
    "Timestamp (WAT)",
    "Reference ID",
    "State",
    "LGA",
    "Electoral Ward",
    "Full Name / Names",
    "Membership Classification",
    "Executive Level",
    "Official Role / Designation",
    "Phone Number",
    "Voter's Card Number (VIN)",
    "Polling Unit",
    "Bank Name",
    "Account Number",
    "Signature / Status",
    "Sync Source"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0D5C3A"); // TMW Deep Forest Green
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  // Set Phone (Col 10), VIN (Col 11), Account Number (Col 14) to Plain Text
  // This guarantees leading zeroes like 080... or 0123... are preserved
  try {
    var maxRows = Math.max(sheet.getMaxRows(), 500);
    sheet.getRange(2, 10, maxRows - 1, 1).setNumberFormat("@");
    sheet.getRange(2, 11, maxRows - 1, 1).setNumberFormat("@");
    sheet.getRange(2, 14, maxRows - 1, 1).setNumberFormat("@");
  } catch (fmtErr) {}
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

let inMemoryScriptUrl: string = "";

/**
 * Retrieves the currently saved Web App URL from memory, localStorage, or env
 */
export function getSavedScriptUrl(): string {
  if (inMemoryScriptUrl && inMemoryScriptUrl.trim()) {
    return inMemoryScriptUrl.trim();
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(DEFAULT_SCRIPT_STORAGE_KEY);
    if (stored && stored.trim()) {
      inMemoryScriptUrl = stored.trim();
      return stored.trim();
    }
  }
  return (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL || "";
}

/**
 * Syncs configuration with the central server so all devices (mobile & desktop) share the URL
 */
export async function syncServerConfig(): Promise<string> {
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data && data.scriptUrl) {
        inMemoryScriptUrl = data.scriptUrl.trim();
        if (typeof window !== "undefined") {
          localStorage.setItem(DEFAULT_SCRIPT_STORAGE_KEY, data.scriptUrl.trim());
        }
        return data.scriptUrl.trim();
      }
    }
  } catch (err) {
    // Silently continue if server not reachable
  }

  // If server has no URL, check if this device has one in localStorage and push to server
  const localUrl = getSavedScriptUrl();
  if (localUrl) {
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptUrl: localUrl }),
      });
    } catch {
      // Ignore
    }
  }
  return localUrl;
}

/**
 * Saves the Web App URL both locally and to the server configuration
 */
export async function saveScriptUrl(url: string): Promise<void> {
  const cleanUrl = url.trim();
  inMemoryScriptUrl = cleanUrl;
  if (typeof window !== "undefined") {
    localStorage.setItem(DEFAULT_SCRIPT_STORAGE_KEY, cleanUrl);
  }
  try {
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptUrl: cleanUrl }),
    });
  } catch (err) {
    console.warn("Could not sync script URL to server config:", err);
  }
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

export function clearSyncedRegistrationCache(): void {
  const unsyncedRecords = getStoredRegistrations().filter((record) => record.status !== "synced");
  saveStoredRegistrations(unsyncedRecords);
}

/**
 * Fetches registrations from the central server (aggregates all phones & machines)
 */
async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: { message?: string } | null = null;
  try {
    data = text ? JSON.parse(text) as { message?: string } : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    if (response.status === 404 && !data?.message) {
      throw new Error(
        "Coordinator login API was not found. Restart the local server or redeploy the latest app version on Vercel.",
      );
    }
    throw new Error(
      data?.message || `Coordinator request failed (HTTP ${response.status}). Check the server configuration and try again.`,
    );
  }
  if (!data) throw new Error("The coordinator server returned an invalid response.");
  return data as T;
}

export async function loginNationalCoordinator(pin: string): Promise<string> {
  const response = await fetch("/api/coordinator/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const data = await readApiResponse<{ token: string }>(response);
  return data.token;
}

export async function loginStateCoordinator(
  state: string,
  pin: string,
): Promise<{ token: string; state: string; mustChangePin: boolean }> {
  const response = await fetch("/api/state-coordinator/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, pin }),
  });
  return readApiResponse<{ token: string; state: string; mustChangePin: boolean }>(response);
}

export async function changeStateCoordinatorPin(
  token: string,
  currentPin: string,
  newPin: string,
): Promise<{ token: string; message: string }> {
  const response = await fetch("/api/state-coordinator/change-pin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPin, newPin }),
  });
  return readApiResponse<{ token: string; message: string }>(response);
}

export async function fetchServerRegistrations(token: string): Promise<RegistrationRecord[]> {
  const response = await fetch("/api/registrations", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" },
  });
  const data = await readApiResponse<{ records: RegistrationRecord[] }>(response);
  if (!Array.isArray(data.records)) throw new Error("The registry response was invalid.");
  return data.records;
}

export async function fetchStateCoordinatorRegistrations(
  token: string,
): Promise<RegistrationRecord[]> {
  const response = await fetch("/api/state-coordinator/registrations", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" },
  });
  const data = await readApiResponse<{ records: RegistrationRecord[] }>(response);
  if (!Array.isArray(data.records)) throw new Error("The state registry response was invalid.");
  return data.records;
}

/**
 * Saves an updated list of registrations to browser storage
 */
export function saveStoredRegistrations(records: RegistrationRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

/**
 * Submits a single registration.
 * The server queues the record centrally and reports success only after Google Sheets confirms the write.
 */
export async function submitRegistration(record: RegistrationRecord): Promise<{
  success: boolean;
  mode: 'supabase' | 'sheets' | 'local_queued' | 'unauthorized_401';
  message: string;
  isUnauthorized?: boolean;
  isDevUrl?: boolean;
}> {
  const existingRecords = getStoredRegistrations();
  let serverRes: Response;
  try {
    serverRes = await fetch("/api/submit-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...record,
      }),
    });
  } catch (serverErr) {
    const queuedRecord = { ...record, status: "local_saved" as const };
    saveStoredRegistrations([
      queuedRecord,
      ...existingRecords.filter((existing) => existing.status !== "synced"),
    ]);
    throw new Error(`Could not reach the registration server. The record is saved only on this device; please retry when online. ${serverErr instanceof Error ? serverErr.message : ""}`.trim());
  }

  const data = await serverRes.json().catch(() => null);
  if (!serverRes.ok || !data?.success) {
    const queuedRecord = {
      ...(data?.record || record),
      status: "local_saved" as const,
    };
    const filtered = existingRecords.filter((existing) =>
      existing.status !== "synced" && existing.id !== queuedRecord.id,
    );
    saveStoredRegistrations([queuedRecord, ...filtered]);
    throw new Error(data?.message || "The registration was not confirmed in Google Sheets. Please check the connection and retry.");
  }

  const savedRecord = data.record || { ...record, status: "synced" as const };
  saveStoredRegistrations(existingRecords.filter((existing) =>
    existing.status !== "synced" && existing.id !== savedRecord.id,
  ));

  return {
    success: true,
    mode: "sheets",
    isUnauthorized: data.isUnauthorized,
    isDevUrl: data.isDevUrl,
    message: data.message || "Registration submitted and synced live to Google Sheets!",
  };
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

  const timestamp = new Date().toISOString();

  // Map into RegistrationRecords including role and EXCO status
  const mappedRecords: RegistrationRecord[] = validRows.map((row, idx) => {
    const isExco = row.isExco ?? (
      Boolean(row.role && (
        row.role.includes("EXCO") ||
        row.role.includes("Coordinator") ||
        row.role.includes("Lead") ||
        row.role.includes("Secretary") ||
        row.role.includes("Leader")
      ))
    );
    const role = row.role?.trim() || (isExco ? "Ward Coordinators" : "General Member (Non-EXCO)");
    return {
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
      status: 'pending',
      isExco,
      excoLevel: isExco ? "Ward" : "None",
      role
    };
  });

  const existing = getStoredRegistrations();
  saveStoredRegistrations([...mappedRecords, ...existing]);

  let serverRes: Response;
  try {
    serverRes = await fetch("/api/submit-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        header,
        records: mappedRecords,
      }),
    });
  } catch (serverErr) {
    const queuedRecords = mappedRecords.map(record => ({ ...record, status: "local_saved" as const }));
    saveStoredRegistrations([...queuedRecords, ...existing.filter((record) => record.status !== "synced")]);
    throw new Error(`Could not reach the registration server. The batch is saved only on this device; please retry when online. ${serverErr instanceof Error ? serverErr.message : ""}`.trim());
  }

  const data = await serverRes.json().catch(() => null);
  if (!serverRes.ok || !data?.success) {
    const queuedRecords = mappedRecords.map(record => ({ ...record, status: "local_saved" as const }));
    saveStoredRegistrations([...queuedRecords, ...existing.filter((record) => record.status !== "synced")]);
    throw new Error(data?.message || "The batch was not confirmed in Google Sheets. Please check the connection and retry.");
  }

  saveStoredRegistrations(existing.filter((record) => record.status !== "synced"));
  return {
    success: true,
    count: validRows.length,
    message: data.message || `Successfully synchronized ${validRows.length} ward members to Google Sheet!`
  };
}

/**
 * Tests connection to the provided Google Apps Script Web App URL via central server
 */
export async function testConnection(url: string): Promise<{
  ok: boolean;
  message: string;
  isUnauthorized?: boolean;
  isDevUrl?: boolean;
  verifiedUrl?: string;
}> {
  if (!url) {
    return {
      ok: false,
      message: "Please enter your Google Apps Script Web App URL."
    };
  }

  if (url.includes("docs.google.com/spreadsheets/d/")) {
    return {
      ok: false,
      message: "Notice: You entered a Google Spreadsheet link. To enable automatic live sync, open that sheet > Extensions > Apps Script, paste the provided Code.gs, deploy as a Web app ('Who has access: Anyone'), and paste the Web App URL (starts with https://script.google.com/macros/s/...) here."
    };
  }

  if (!url.startsWith("https://script.google.com/macros/s/")) {
    return {
      ok: false,
      message: "Please enter a valid Google Apps Script Web App URL starting with https://script.google.com/macros/s/..."
    };
  }

  // 1. Test via central server probe
  try {
    const res = await fetch("/api/test-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptUrl: url }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ok: data.ok,
        message: data.message,
        isUnauthorized: data.isUnauthorized,
        isDevUrl: data.isDevUrl,
        verifiedUrl: data.verifiedUrl
      };
    }
  } catch (err) {
    console.warn("Server test endpoint unreachable:", err);
  }

  // 2. Client fallback probe
  try {
    await fetch(url, { method: "GET", mode: "no-cors" });
    return {
      ok: true,
      message: "Connection reached from browser. Note: ensure 'Who has access' is set to 'Anyone' for external devices."
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Could not reach endpoint: ${err?.message || "Check your URL and permissions ('Anyone')."}`
    };
  }
}

/**
 * Automatically initializes headers in a fresh Google Sheet and writes an optional sample test row
 */
export async function initFreshSheet(url: string, includeSample = true): Promise<{
  ok: boolean;
  message: string;
  isUnauthorized?: boolean;
}> {
  if (!url || !url.startsWith("https://script.google.com/macros/s/")) {
    return {
      ok: false,
      message: "Please enter a valid Google Apps Script Web App URL first."
    };
  }

  try {
    const res = await fetch("/api/init-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptUrl: url, includeSample }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ok: data.ok,
        message: data.message,
        isUnauthorized: data.isUnauthorized,
      };
    }
  } catch (err: any) {
    console.warn("Error calling /api/init-sheet:", err);
  }

  return {
    ok: false,
    message: "Failed to initialize sheet. Check network connection or Apps Script permissions."
  };
}

/**
 * Triggers batch synchronization of all pending records to Google Sheets
 */
export async function syncAllPendingToSheets(): Promise<{
  success: boolean;
  syncedCount?: number;
  message: string;
  isUnauthorized?: boolean;
}> {
  try {
    const res = await fetch("/api/sync-all", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error syncing to Google Sheets." };
  }
  return { success: false, message: "Server sync failed." };
}

/**
 * Pushes ALL records currently in the central registry to Google Sheets.
 * Ideal when connecting a brand-new Google Sheet to immediately backfill all existing data.
 */
export async function pushAllToGoogleSheets(): Promise<{
  success: boolean;
  count?: number;
  message: string;
  isUnauthorized?: boolean;
}> {
  try {
    const res = await fetch("/api/sync-all-to-sheets", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    const errData = await res.json().catch(() => null);
    return {
      success: false,
      message: errData?.message || "Failed pushing all records to Google Sheets."
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error communicating with server."
    };
  }
}

/**
 * Fetches all registered members directly from Google Sheets and merges them with the central registry
 */
export async function fetchFromGoogleSheets(optionalUrl?: string, authToken?: string): Promise<{
  success: boolean;
  count?: number;
  totalInRegistry?: number;
  records?: RegistrationRecord[];
  message: string;
  isUnauthorized?: boolean;
}> {
  try {
    const targetScriptUrl = (optionalUrl || getSavedScriptUrl() || "").trim();
    const res = await fetch("/api/fetch-from-sheets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ scriptUrl: targetScriptUrl })
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => null);
    return {
      success: false,
      message: errData?.message || "Failed fetching records from Google Sheet."
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error fetching records from Google Sheet."
    };
  }
}

/**
 * Exports all local registrations to downloadable CSV with EXCO and Role columns
 */
export function exportToCSV(records: RegistrationRecord[], filename = "TMW_Electoral_Ward_Registrations.csv"): void {
  if (records.length === 0) return;

  const headers = [
    "Reference ID",
    "State",
    "LGA",
    "Electoral Ward",
    "Full Name",
    "Membership Classification",
    "Executive Level",
    "Official Role / Designation",
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
    const isExcoVal = r.isExco ? "EXCO" : "Non-EXCO";
    const levelVal = r.excoLevel || (r.isExco ? "Ward" : "None");
    const roleVal = r.role || (r.isExco ? "Ward EXCO" : "General Member (Non-EXCO)");

    const row = [
      `"${r.referenceId}"`,
      `"${r.state.replace(/"/g, '""')}"`,
      `"${r.lga.replace(/"/g, '""')}"`,
      `"${r.ward.replace(/"/g, '""')}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${isExcoVal}"`,
      `"${levelVal}"`,
      `"${roleVal.replace(/"/g, '""')}"`,
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
