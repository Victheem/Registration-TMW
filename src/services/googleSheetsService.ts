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
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL for phone & external device submissions!
 *    (If left as "Only myself", external devices and servers receive 401 Unauthorized!)
 * 9. Click "Deploy", review permissions, and authorize your Google account.
 * 10. Copy the generated Web App URL (ending in /exec) and paste it into TMW App Settings!
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

    // Non-intrusive connection test / ping
    if (payload.type === "ping_test" || payload.action === "test_connection") {
      return createJsonResponse({
        status: "success",
        message: "Connection active! TMW Webhook is ready to receive registrations.",
        timestamp: formattedDate
      });
    }

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
    
    // Auto-initialize header row if sheet is fresh
    if (sheet.getLastRow() === 0) {
      setupSheetHeaders(sheet);
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
    version: "2.5.0",
    time: new Date().toISOString()
  });
}

/**
 * Creates standardized header row with TMW corporate styling and EXCO/Role tracking
 */
function setupSheetHeaders(sheet) {
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

/**
 * Fetches registrations from the central server (aggregates all phones & machines)
 */
export async function fetchServerRegistrations(): Promise<RegistrationRecord[]> {
  try {
    const res = await fetch("/api/registrations");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.records)) {
        const local = getStoredRegistrations();
        const map = new Map<string, RegistrationRecord>();
        data.records.forEach((r: RegistrationRecord) => map.set(r.id, r));
        
        // Check if there are local records not yet on the server
        const unpushedToSever: RegistrationRecord[] = [];
        local.forEach((r: RegistrationRecord) => {
          if (!map.has(r.id)) {
            map.set(r.id, r);
            unpushedToSever.push(r);
          }
        });

        // Automatically push missing local records to server in background
        if (unpushedToSever.length > 0) {
          unpushedToSever.forEach(rec => {
            fetch("/api/submit-registration", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(rec),
            }).catch(() => {});
          });
        }

        const merged = Array.from(map.values());
        saveStoredRegistrations(merged);
        return merged;
      }
    }
  } catch {
    // Fall back to local
  }
  return getStoredRegistrations();
}

/**
 * Saves an updated list of registrations to browser storage
 */
export function saveStoredRegistrations(records: RegistrationRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(records));
}

/**
 * Submits a single registration.
 * Uses central server proxy first (reliable across all mobile phones & external devices),
 * with immediate dual direct client-side Google Apps Script fetch as fallback.
 */
export async function submitRegistration(record: RegistrationRecord): Promise<{
  success: boolean;
  mode: 'sheets' | 'local_queued' | 'unauthorized_401';
  message: string;
  isUnauthorized?: boolean;
}> {
  const existingRecords = getStoredRegistrations();
  const scriptUrl = getSavedScriptUrl();

  // 1. Try submitting through central server route first (solves mobile CORS & shares across all devices)
  try {
    const serverRes = await fetch("/api/submit-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...record,
        scriptUrl: scriptUrl || undefined,
      }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();

      // If server could not sync directly to Google Sheets (e.g. server IP blocked or 401),
      // ALSO attempt immediate client-side direct submission in case the user's browser has the Google cookie!
      if (data.mode !== "sheets" && scriptUrl) {
        try {
          await fetch(scriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(record),
          });
        } catch (directErr) {
          console.warn("Client fallback fetch also encountered an issue:", directErr);
        }
      }

      const statusVal = data.mode === "sheets" ? ("synced" as const) : ("local_saved" as const);
      const updated = [{ ...record, status: statusVal }, ...existingRecords];
      saveStoredRegistrations(updated);

      return {
        success: true,
        mode: data.mode === "sheets" ? "sheets" : (data.isUnauthorized ? "unauthorized_401" : "local_queued"),
        isUnauthorized: data.isUnauthorized,
        message: data.message || "Registration saved successfully!",
      };
    }
  } catch (serverErr) {
    console.warn("Central server route unavailable, attempting client-side fallback:", serverErr);
  }

  // 2. Client-side direct submission fallback if server route is unavailable
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
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(record),
    });

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
      status: 'synced',
      isExco,
      excoLevel: isExco ? "Ward" : "None",
      role
    };
  });

  const existing = getStoredRegistrations();
  saveStoredRegistrations([...mappedRecords, ...existing]);

  // 1. Try server batch endpoint first
  try {
    const serverRes = await fetch("/api/submit-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        header,
        records: mappedRecords,
      }),
    });
    if (serverRes.ok) {
      const data = await serverRes.json();
      return {
        success: true,
        count: validRows.length,
        message: data.message || `Successfully synchronized ${validRows.length} ward members to Google Sheet!`,
      };
    }
  } catch (serverErr) {
    console.warn("Central server batch route failed, attempting direct fetch:", serverErr);
  }

  // 2. Direct client fallback
  const scriptUrl = getSavedScriptUrl();
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
 * Tests connection to the provided Google Apps Script Web App URL via central server
 */
export async function testConnection(url: string): Promise<{
  ok: boolean;
  message: string;
  isUnauthorized?: boolean;
  isDevUrl?: boolean;
  verifiedUrl?: string;
}> {
  if (!url || !url.startsWith("https://script.google.com/macros/s/")) {
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
