import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");
const DEFAULT_GOOGLE_APPS_SCRIPT_URL =
  process.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbxd2EXUybiObFJm2QtvWQDVXI_DOQxn_1i4hhCRGQXHq0qxK-UpBAHYsLVNbXvBNYU5-Q/exec";

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerConfig {
  scriptUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

function loadConfig(): ServerConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const savedConfig = JSON.parse(raw);
      return {
        ...savedConfig,
        scriptUrl: typeof savedConfig.scriptUrl === "string"
          ? savedConfig.scriptUrl
          : DEFAULT_GOOGLE_APPS_SCRIPT_URL,
      };
    }
  } catch (err) {
    console.error("Error loading server config:", err);
  }
  return {
    scriptUrl: DEFAULT_GOOGLE_APPS_SCRIPT_URL,
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  };
}

function saveConfig(config: ServerConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving server config:", err);
  }
}

function loadRegistrations(): any[] {
  try {
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      const raw = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error loading registrations:", err);
  }
  return [];
}

function saveRegistrations(records: any[]): void {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving registrations:", err);
  }
}

function getSupabaseClient(): SupabaseClient | null {
  const cfg = loadConfig();
  const url = cfg.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = cfg.supabaseKey || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (url && key && url.startsWith("https://")) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.warn("Failed creating server Supabase client:", e);
    }
  }
  return null;
}

function recordToSupabaseRow(rec: any) {
  return {
    id: rec.id,
    reference_id: rec.referenceId,
    full_name: rec.fullName || rec.names || "",
    phone: rec.phone || "",
    vin: rec.vin || "",
    state: rec.state || "",
    lga: rec.lga || "",
    ward: rec.ward || "",
    polling_unit: rec.pollingUnit || "",
    bank_name: rec.bankName || rec.bank || "",
    account_number: rec.accountNumber || rec.accountNo || "",
    signature: rec.signature || rec.sign || "",
    is_exco: Boolean(rec.isExco),
    exco_level: rec.excoLevel || (rec.isExco ? "Ward" : "None"),
    role: rec.role || (rec.isExco ? "Ward Coordinators" : "General Member (Non-EXCO)"),
    batch_id: rec.batchId || null,
    batch_row_number: rec.batchRowNumber || rec.sn || null,
    coordinator_name: rec.coordinatorName || null,
    status: "registered",
  };
}

function supabaseRowToRecord(row: any) {
  return {
    id: row.id,
    referenceId: row.reference_id,
    fullName: row.full_name,
    phone: row.phone,
    vin: row.vin,
    state: row.state,
    lga: row.lga,
    ward: row.ward,
    pollingUnit: row.polling_unit,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    signature: row.signature,
    isExco: Boolean(row.is_exco),
    excoLevel: row.exco_level,
    role: row.role,
    batchId: row.batch_id,
    batchRowNumber: row.batch_row_number,
    coordinatorName: row.coordinator_name,
    timestamp: row.created_at,
    status: "synced",
  };
}

interface ForwardResult {
  success: boolean;
  httpStatus?: number;
  error?: string;
  isUnauthorized?: boolean;
  isNotFound?: boolean;
  isDevUrl?: boolean;
}

async function forwardToGoogleSheets(scriptUrl: string, payload: any): Promise<ForwardResult> {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, error: "No Google Apps Script URL provided." };
  }

  const targetUrl = scriptUrl.trim();

  // /dev URLs are developer test URLs and require developer cookies; Google rejects external devices & servers
  if (targetUrl.endsWith("/dev")) {
    return {
      success: false,
      isUnauthorized: true,
      isDevUrl: true,
      error: "Google Apps Script /dev URLs block external devices and server sync. Please create a Web App Deployment (Deploy > New deployment > Web app > Who has access: Anyone) to get a live /exec URL.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      return {
        success: false,
        httpStatus: 401,
        isUnauthorized: true,
        error: "Google Apps Script rejected with 401 Unauthorized. Access must be set to 'Anyone' in deployment settings.",
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        httpStatus: 404,
        isNotFound: true,
        error: "Google Apps Script Web App URL returned 404 Not Found. Please check your deployment URL.",
      };
    }

    const text = await res.text();

    // Check if redirected to Google sign-in page (happens when "Who has access" is set to "Only myself" or /dev URL)
    if (
      text.includes("accounts.google.com") ||
      text.includes("ServiceLogin") ||
      text.includes("<title>Google Accounts</title>") ||
      text.includes("Sorry, unable to open the file at present") ||
      text.includes("Page not found")
    ) {
      return {
        success: false,
        httpStatus: res.status,
        isUnauthorized: true,
        error: "Google redirected to login screen or file error. Apps Script deployment 'Who has access' must be set to 'Anyone'.",
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        success: false,
        httpStatus: res.status,
        error: "Google Apps Script returned an unreadable response. Confirm the deployed Web App is working.",
      };
    }

    if (parsed?.status === "error") {
      return {
        success: false,
        httpStatus: res.status,
        error: parsed.message || "Google Apps Script rejected the registration.",
      };
    }

    if (res.ok && parsed?.status === "success") {
      return { success: true, httpStatus: res.status };
    }

    return {
      success: false,
      httpStatus: res.status,
      error: parsed?.message || `Google Apps Script returned an unexpected response (HTTP ${res.status}).`,
    };
  } catch (err: any) {
    console.warn(`Failed forwarding to Google Apps Script (${targetUrl}):`, err?.message);
    return {
      success: false,
      error: err?.name === "AbortError" ? "Google Apps Script request timed out after 6 seconds." : (err?.message || "Connection failed."),
    };
  }
}

interface FetchSheetResult {
  success: boolean;
  records: any[];
  error?: string;
  isUnauthorized?: boolean;
}

let lastSheetRefreshAt = 0;
let lastSheetRefreshUrl = "";
let sheetRefreshInFlight: Promise<void> | null = null;

function refreshRegistrationsFromGoogleSheet(scriptUrl: string): void {
  if (scriptUrl !== lastSheetRefreshUrl) {
    lastSheetRefreshUrl = scriptUrl;
    lastSheetRefreshAt = 0;
  }

  if (!scriptUrl || Date.now() - lastSheetRefreshAt < 30_000 || sheetRefreshInFlight) {
    return;
  }

  lastSheetRefreshAt = Date.now();
  sheetRefreshInFlight = (async () => {
    const result = await fetchRecordsFromGoogleSheets(scriptUrl);
    if (!result.success) {
      console.warn("Could not refresh registry from Google Sheets:", result.error);
      return;
    }

    const recordsByReference = new Map<string, any>();
    for (const record of loadRegistrations()) {
      const key = String(record.referenceId || record.id || "").trim().toUpperCase();
      if (key) recordsByReference.set(key, record);
    }

    for (const record of result.records) {
      const key = String(record.referenceId || record.id || "").trim().toUpperCase();
      if (!key) continue;
      const existing = recordsByReference.get(key) || {};
      recordsByReference.set(key, { ...existing, ...record, status: "synced" });
    }

    const merged = Array.from(recordsByReference.values());
    merged.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    saveRegistrations(merged);
  })()
    .catch((err) => {
      console.error("Error refreshing registry from Google Sheets:", err);
    })
    .finally(() => {
      sheetRefreshInFlight = null;
    });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseGoogleSheetCsv(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  
  const findIdx = (keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const nameIdx = findIdx(["fullname", "membername", "name", "names"]);
  const phoneIdx = findIdx(["phone", "phonenumber", "telephone", "mobile"]);
  const refIdx = findIdx(["referenceid", "refid", "sn", "serialnumber"]);
  const stateIdx = findIdx(["state"]);
  const lgaIdx = findIdx(["lga", "localgovt", "localgovernment"]);
  const wardIdx = findIdx(["ward", "electoralward"]);
  const isExcoIdx = findIdx(["exco", "membership", "classification"]);
  const levelIdx = findIdx(["level", "excolevel"]);
  const roleIdx = findIdx(["role", "designation", "position"]);
  const vinIdx = findIdx(["vin", "votercard"]);
  const puIdx = findIdx(["polling", "unit", "pu"]);
  const bankIdx = findIdx(["bank", "bankname"]);
  const acctIdx = findIdx(["account", "accountnumber", "accountno"]);
  const signIdx = findIdx(["signature", "sign"]);
  const dateIdx = findIdx(["timestamp", "date", "time"]);

  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const rawName = (nameIdx >= 0 ? cols[nameIdx] : cols[5]) || "";
    const rawPhone = (phoneIdx >= 0 ? cols[phoneIdx] : cols[9]) || "";
    const rawRef = (refIdx >= 0 ? cols[refIdx] : cols[1]) || "";

    const fullName = rawName.replace(/^'/, "").trim();
    const phone = rawPhone.replace(/^'/, "").trim();
    const refId = rawRef.replace(/^'/, "").trim();

    // Skip empty or blank lines
    if (!fullName && !phone && !refId) continue;

    const state = (stateIdx >= 0 ? cols[stateIdx] : cols[2]) || "";
    const lga = (lgaIdx >= 0 ? cols[lgaIdx] : cols[3]) || "";
    const ward = (wardIdx >= 0 ? cols[wardIdx] : cols[4]) || "";
    const classification = (isExcoIdx >= 0 ? cols[isExcoIdx] : cols[6]) || "";
    const isExco = classification.toUpperCase().includes("EXCO") && !classification.toUpperCase().includes("NON");
    const excoLevel = (levelIdx >= 0 ? cols[levelIdx] : cols[7]) || (isExco ? "Ward" : "None");
    const role = (roleIdx >= 0 ? cols[roleIdx] : cols[8]) || (isExco ? "Ward Coordinators" : "General Member (Non-EXCO)");
    const vin = ((vinIdx >= 0 ? cols[vinIdx] : cols[10]) || "").replace(/^'/, "").trim();
    const pollingUnit = (puIdx >= 0 ? cols[puIdx] : cols[11]) || "";
    const bankName = (bankIdx >= 0 ? cols[bankIdx] : cols[12]) || "";
    const accountNumber = ((acctIdx >= 0 ? cols[acctIdx] : cols[13]) || "").replace(/^'/, "").trim();
    const signature = (signIdx >= 0 ? cols[signIdx] : cols[14]) || "Verified";
    const timestamp = (dateIdx >= 0 ? cols[dateIdx] : cols[0]) || new Date().toISOString();

    const id = refId ? `tmw-${refId.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : `sheet-row-${i + 1}`;

    records.push({
      id,
      referenceId: refId || `TMW-ROW-${i + 1}`,
      fullName,
      phone,
      vin,
      state,
      lga,
      ward,
      pollingUnit,
      bankName,
      accountNumber,
      signature,
      isExco,
      excoLevel,
      role,
      timestamp,
      status: "synced"
    });
  }

  return records;
}

async function fetchRecordsFromGoogleSheetCsv(sheetUrl: string): Promise<FetchSheetResult> {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    return { success: false, records: [], error: "Invalid Google Sheets URL format. URL should contain '/spreadsheets/d/...'" };
  }
  const spreadsheetId = match[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(csvUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        records: [],
        isUnauthorized: true,
        error: "Google Sheet access denied. In your Google Sheet, click 'Share' and set General access to 'Anyone with the link (Viewer)'."
      };
    }

    const text = await res.text();
    if (text.includes("accounts.google.com") || text.includes("ServiceLogin") || text.includes("<html")) {
      return {
        success: false,
        records: [],
        isUnauthorized: true,
        error: "Google Sheet is restricted. Open your sheet, click 'Share' in the top-right corner, and change General access to 'Anyone with the link can view'."
      };
    }

    const parsedRecords = parseGoogleSheetCsv(text);
    return {
      success: true,
      records: parsedRecords,
    };
  } catch (err: any) {
    return {
      success: false,
      records: [],
      error: `Could not export CSV from Google Sheet: ${err?.message || "Check link and network"}`
    };
  }
}

async function fetchRecordsFromGoogleSheets(scriptUrl: string): Promise<FetchSheetResult> {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, records: [], error: "No Google Apps Script or Google Sheets URL provided." };
  }

  const targetUrl = scriptUrl.trim();

  // If user pasted a direct Google Spreadsheet document URL
  if (targetUrl.includes("docs.google.com/spreadsheets/d/")) {
    return await fetchRecordsFromGoogleSheetCsv(targetUrl);
  }

  if (targetUrl.endsWith("/dev")) {
    return {
      success: false,
      records: [],
      error: "Google Apps Script /dev URLs block external requests. Deploy as Web app with 'Who has access: Anyone' to get an /exec URL."
    };
  }

  // Attempt 1: GET request with action=read_records (Apps Script webhooks respond most cleanly to GET)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const getUrl = targetUrl.includes("?") ? `${targetUrl}&action=read_records` : `${targetUrl}?action=read_records`;
    const getRes = await fetch(getUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (getRes.status === 401) {
      return { success: false, records: [], isUnauthorized: true, error: "401 Unauthorized" };
    }

    const getText = await getRes.text();
    if (getText.includes("accounts.google.com") || getText.includes("ServiceLogin")) {
      return {
        success: false,
        records: [],
        isUnauthorized: true,
        error: "Google Apps Script redirected to sign-in. In Apps Script, click Deploy > Manage deployments > Edit > Who has access: Anyone."
      };
    }

    try {
      const parsed = JSON.parse(getText);
      if (parsed && Array.isArray(parsed.records)) {
        return { success: true, records: parsed.records };
      } else if (parsed && parsed.status === "active" && !parsed.records) {
        return {
          success: false,
          records: [],
          error: `Connected Apps Script (v${parsed.version || "3.0"}) needs updating to enable two-way record reading. In Database Settings, click 'Copy Code.gs', open your Google Sheet > Extensions > Apps Script, paste the updated code, and deploy a new version.`
        };
      }
    } catch {}
  } catch (getErr: any) {
    console.warn("GET read_records attempt failed, trying POST fallback:", getErr?.message);
  }

  // Attempt 2: POST request with { action: "fetch_records" }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const postRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "fetch_records", type: "fetch_records" }),
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (postRes.status === 401) {
      return { success: false, records: [], isUnauthorized: true, error: "401 Unauthorized" };
    }

    const postText = await postRes.text();
    if (!postText.includes("accounts.google.com") && !postText.includes("ServiceLogin")) {
      try {
        const parsed = JSON.parse(postText);
        if (parsed && Array.isArray(parsed.records)) {
          return { success: true, records: parsed.records };
        } else if (parsed && parsed.status === "active" && !parsed.records) {
          return {
            success: false,
            records: [],
            error: `Connected Apps Script needs updating. In Database Settings, click 'Copy Code.gs', open Extensions > Apps Script in your sheet, replace Code.gs, and deploy a new version.`
          };
        }
      } catch {}
    }
  } catch (postErr) {
    console.warn("POST fetch_records failed:", postErr);
  }

  return { 
    success: false, 
    records: [], 
    error: "No records returned from Google Sheet. Make sure your Apps Script Web App has the latest Code.gs deployed with 'Who has access: Anyone'." 
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API Routes
  app.get("/api/config", (req, res) => {
    const config = loadConfig();
    res.json({
      success: true,
      scriptUrl: config.scriptUrl || "",
      isDevUrl: Boolean(config.scriptUrl && config.scriptUrl.trim().endsWith("/dev")),
      isConfigured: Boolean(config.scriptUrl && config.scriptUrl.trim()),
    });
  });

  app.post("/api/config", (req, res) => {
    const { scriptUrl } = req.body || {};
    const sanitizedUrl = typeof scriptUrl === "string" ? scriptUrl.trim() : "";
    saveConfig({ scriptUrl: sanitizedUrl });
    res.json({
      success: true,
      scriptUrl: sanitizedUrl,
      isDevUrl: sanitizedUrl.endsWith("/dev"),
      message: sanitizedUrl 
        ? "Google Apps Script endpoint saved across all devices!" 
        : "Google Apps Script endpoint cleared."
    });
  });

  // Test Google Sheet connection endpoint with comprehensive diagnosis
  app.post("/api/test-sheets", async (req, res) => {
    try {
      const { scriptUrl } = req.body || {};
      const config = loadConfig();
      const urlToTest = (typeof scriptUrl === "string" && scriptUrl.trim()) ? scriptUrl.trim() : config.scriptUrl;

      if (!urlToTest) {
        res.status(400).json({
          success: false,
          ok: false,
          message: "No Google Apps Script URL provided or configured."
        });
        return;
      }

      if (!urlToTest.startsWith("https://script.google.com/macros/s/")) {
        res.status(400).json({
          success: false,
          ok: false,
          message: "Invalid URL. Google Apps Script URLs must start with https://script.google.com/macros/s/..."
        });
        return;
      }

      const isDevUrl = urlToTest.endsWith("/dev");
      if (isDevUrl) {
        res.json({
          success: false,
          ok: false,
          isDevUrl: true,
          message: "⚠️ Developer Test URL detected (/dev). Google /dev URLs block external devices, phones, and background servers. In Google Apps Script: Click Deploy ➔ New deployment ➔ Select type: Web app ➔ Who has access: Anyone ➔ Deploy, then copy the live /exec URL."
        });
        return;
      }

      // Ping test payload that will NOT write a row to the user's sheet
      const pingPayload = {
        type: "ping_test",
        action: "test_connection",
        testTimestamp: new Date().toISOString()
      };

      const result = await forwardToGoogleSheets(urlToTest, pingPayload);

      if (result.success) {
        saveConfig({ scriptUrl: urlToTest });
        res.json({
          success: true,
          ok: true,
          isDevUrl: false,
          verifiedUrl: urlToTest,
          message: "Success! Google Sheet connected and accepting live registrations across all devices."
        });
        return;
      }

      if (result.isUnauthorized || result.httpStatus === 401) {
        res.json({
          success: false,
          ok: false,
          isUnauthorized: true,
          isDevUrl: false,
          message: "Google returned 401 Unauthorized! In Google Apps Script, click Deploy > Manage deployments > Edit (pencil icon) > change 'Who has access' to 'Anyone' (NOT 'Only myself') > Deploy."
        });
        return;
      }

      res.json({
        success: false,
        ok: false,
        isDevUrl: false,
        message: result.error || "Unable to reach Google Apps Script Web App. Please check your deployment settings."
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        ok: false,
        message: err?.message || "Internal error testing Google Sheets connection."
      });
    }
  });

  // Initialize a brand-new, fresh Google Sheet with headers and optional sample row
  app.post("/api/init-sheet", async (req, res) => {
    try {
      const { scriptUrl, includeSample } = req.body || {};
      const config = loadConfig();
      const targetUrl = (typeof scriptUrl === "string" && scriptUrl.trim()) ? scriptUrl.trim() : config.scriptUrl;

      if (!targetUrl || !targetUrl.startsWith("https://script.google.com/macros/s/")) {
        res.status(400).json({
          success: false,
          ok: false,
          message: "Please enter a valid Google Apps Script Web App URL first."
        });
        return;
      }

      if (targetUrl.endsWith("/dev")) {
        res.json({
          success: false,
          ok: false,
          isDevUrl: true,
          message: "⚠️ Google Apps Script /dev URLs block external devices. Please click Deploy ➔ New deployment ➔ Web app ➔ Who has access: Anyone, then copy the live /exec URL."
        });
        return;
      }

      const initPayload = {
        action: "init_fresh_sheet",
        type: "init_fresh_sheet",
        includeSampleRow: Boolean(includeSample),
        state: "Lagos",
        lga: "Ikeja",
        ward: "Ward 01 (Alausa)",
        fullName: "TMW Verification & Setup Test Row",
        timestamp: new Date().toISOString()
      };

      const result = await forwardToGoogleSheets(targetUrl, initPayload);

      if (result.success) {
        saveConfig({ scriptUrl: targetUrl });
        res.json({
          success: true,
          ok: true,
          verifiedUrl: targetUrl,
          message: "✅ Fresh Google Sheet initialized with official TMW headers!" + (includeSample ? " Sample test row added." : "")
        });
        return;
      }

      if (result.isUnauthorized || result.httpStatus === 401) {
        res.json({
          success: false,
          ok: false,
          isUnauthorized: true,
          message: "Google returned 401 Unauthorized! In Apps Script, click Deploy > Manage deployments > Edit > set 'Who has access' to 'Anyone' > Deploy."
        });
        return;
      }

      res.json({
        success: false,
        ok: false,
        message: result.error || "Failed to initialize sheet headers. Check deployment settings."
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        ok: false,
        message: err?.message || "Internal server error initializing fresh Google Sheet."
      });
    }
  });

  // Supabase Cloud Configuration Endpoints
  app.get("/api/supabase-config", (req, res) => {
    const config = loadConfig();
    res.json({
      success: true,
      supabaseUrl: config.supabaseUrl || "",
      isConfigured: Boolean(config.supabaseUrl && config.supabaseKey),
    });
  });

  app.post("/api/supabase-config", (req, res) => {
    const { supabaseUrl, supabaseKey } = req.body || {};
    const config = loadConfig();
    if (typeof supabaseUrl === "string") {
      config.supabaseUrl = supabaseUrl.trim();
    }
    if (typeof supabaseKey === "string" && supabaseKey.trim()) {
      config.supabaseKey = supabaseKey.trim();
    }
    saveConfig(config);
    res.json({
      success: true,
      isConfigured: Boolean(config.supabaseUrl && config.supabaseKey),
      message: "Supabase configuration updated successfully across all devices!",
    });
  });

  app.get("/api/registrations", async (req, res) => {
    const config = loadConfig();
    refreshRegistrationsFromGoogleSheet(config.scriptUrl || "");
    const localRecords = loadRegistrations();
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("tmw_registrations")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          const cloudRecords = data.map(supabaseRowToRecord);
          // Merge cloud records with local cache
          const idMap = new Map<string, any>();
          cloudRecords.forEach((r) => idMap.set(r.id, r));
          localRecords.forEach((r) => {
            if (!idMap.has(r.id)) {
              idMap.set(r.id, r);
            }
          });
          const merged = Array.from(idMap.values());
          saveRegistrations(merged);
          return res.json({
            success: true,
            records: merged,
            count: merged.length,
            isCloud: true,
            serverTime: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn("Could not query Supabase in /api/registrations:", err);
      }
    }

    res.json({
      success: true,
      records: localRecords,
      count: localRecords.length,
      isCloud: false,
      serverTime: new Date().toISOString()
    });
  });

  app.post("/api/submit-registration", async (req, res) => {
    try {
      const record = req.body;
      if (!record || (!record.fullName && !record.phone && !record.vin)) {
        res.status(400).json({ success: false, message: "Invalid registration record." });
        return;
      }

      const config = loadConfig();
      // If client sent a scriptUrl and server does not have one, save it
      if (record.scriptUrl && typeof record.scriptUrl === "string" && !config.scriptUrl) {
        config.scriptUrl = record.scriptUrl.trim();
        saveConfig(config);
      }

      const effectiveScriptUrl = config.scriptUrl || (record.scriptUrl?.trim() || "");
      const isDevUrl = effectiveScriptUrl.endsWith("/dev");

      const existing = loadRegistrations();
      
      // Prevent duplicates by ID if submitted again
      const filtered = existing.filter((r) => r.id !== record.id);
      const isExco = Boolean(record.isExco);
      const role = record.role || (isExco ? "EXCO Member" : "General Member (Non-EXCO)");

      // Queue centrally before forwarding so a failed Sheet write can be retried.
      const enhancedRecord = {
        ...record,
        isExco,
        role,
        status: "local_saved" as const,
        savedAt: new Date().toISOString(),
      };

      // Strip temporary scriptUrl from saved record
      delete enhancedRecord.scriptUrl;

      // Save to server disk right now
      const updated = [enhancedRecord, ...filtered];
      saveRegistrations(updated);

      // 2. SAVE TO SUPABASE CLOUD DATABASE IF CONFIGURED
      const supabase = getSupabaseClient();
      let isSupabaseSaved = false;
      if (supabase) {
        try {
          const row = recordToSupabaseRow(enhancedRecord);
          const { error: sError } = await supabase
            .from("tmw_registrations")
            .upsert(row, { onConflict: "reference_id" });
          if (!sError) {
            isSupabaseSaved = true;
          } else {
            console.warn("Supabase upsert warning:", sError.message);
          }
        } catch (sErr: any) {
          console.warn("Supabase exception during submit-registration:", sErr?.message);
        }
      }

      // 3. FORWARD TO GOOGLE APPS SCRIPT IF CONFIGURED
      let isGoogleSheetSaved = false;
      let forwardResult: ForwardResult = { success: false };
      if (effectiveScriptUrl && !isDevUrl) {
        forwardResult = await forwardToGoogleSheets(effectiveScriptUrl, enhancedRecord);
        isGoogleSheetSaved = Boolean(forwardResult.success);
      } else if (isDevUrl) {
        forwardResult = {
          success: false,
          isDevUrl: true,
          isUnauthorized: true,
          error: "Developer test URL (/dev) detected. Google blocks external devices from submitting to /dev URLs."
        };
      }

      if (!isGoogleSheetSaved) {
        const failureMessage = forwardResult.error
          ? `Registration was queued locally, but was not written to Google Sheets: ${forwardResult.error}`
          : "Registration was queued locally, but was not written to Google Sheets. Check the connection and try again.";
        res.status(502).json({
          success: false,
          isUnauthorized: forwardResult.isUnauthorized,
          isDevUrl,
          savedTo: {
            local: true,
            supabase: isSupabaseSaved,
            googleSheet: false,
          },
          message: failureMessage,
          record: { ...enhancedRecord, status: "local_saved" },
        });
        return;
      }

      if (isGoogleSheetSaved) {
        enhancedRecord.status = "synced";
        const currentRecords = loadRegistrations();
        const reUpdated = currentRecords.map((r) => r.id === enhancedRecord.id ? { ...r, status: "synced" } : r);
        saveRegistrations(reUpdated);
      }

      const mode = isSupabaseSaved ? "dual_sync" : "sheets";
      const message = isSupabaseSaved
        ? "✅ Registration saved simultaneously to BOTH Supabase Cloud & Google Sheet!"
        : "✅ Registration submitted and synced live to Google Sheets!";

      res.json({
        success: true,
        mode,
        isUnauthorized: forwardResult.isUnauthorized,
        isDevUrl,
        savedTo: {
          local: true,
          supabase: isSupabaseSaved,
          googleSheet: isGoogleSheetSaved
        },
        message,
        record: enhancedRecord,
      });
    } catch (err: any) {
      console.error("Error submitting registration:", err);
      res.status(500).json({ success: false, message: err?.message || "Internal server error" });
    }
  });

  app.post("/api/submit-batch", async (req, res) => {
    try {
      const { header, records } = req.body || {};
      if (!Array.isArray(records) || records.length === 0) {
        res.status(400).json({ success: false, message: "No member records provided." });
        return;
      }

      const config = loadConfig();
      const existing = loadRegistrations();
      const isDevUrl = Boolean(config.scriptUrl && config.scriptUrl.trim().endsWith("/dev"));

      // 1. PERSIST BATCH TO CENTRAL DATABASE IMMEDIATELY
      const newRecords = records.map((r: any) => ({
        ...r,
        state: r.state || header?.state || "",
        lga: r.lga || header?.lga || "",
        ward: r.ward || header?.ward || "",
        status: "local_saved" as const,
        savedAt: new Date().toISOString(),
      }));

      // Combine and save immediately so all devices can see them in Registry
      const combined = [...newRecords, ...existing];
      saveRegistrations(combined);

      // 2. PERSIST BATCH TO SUPABASE IF CONFIGURED
      const supabase = getSupabaseClient();
      let isSupabaseSaved = false;
      if (supabase) {
        try {
          const rows = newRecords.map(recordToSupabaseRow);
          const { error: sError } = await supabase
            .from("tmw_registrations")
            .upsert(rows, { onConflict: "reference_id" });
          if (!sError) {
            isSupabaseSaved = true;
          } else {
            console.warn("Supabase batch upsert warning:", sError.message);
          }
        } catch (sErr: any) {
          console.warn("Supabase exception during batch submit:", sErr?.message);
        }
      }

      // 3. FORWARD TO GOOGLE APPS SCRIPT
      let isGoogleSheetSaved = false;
      let forwardResult: ForwardResult = { success: false };
      if (config.scriptUrl && !isDevUrl) {
        forwardResult = await forwardToGoogleSheets(config.scriptUrl, { header, records: newRecords });
        isGoogleSheetSaved = Boolean(forwardResult.success);
      }

      if (!isGoogleSheetSaved) {
        const failureMessage = forwardResult.error
          ? `Members were queued locally, but were not written to Google Sheets: ${forwardResult.error}`
          : "Members were queued locally, but were not written to Google Sheets. Check the connection and try again.";
        res.status(502).json({
          success: false,
          count: newRecords.length,
          mode: forwardResult.isUnauthorized ? "unauthorized_401" : "queued",
          savedTo: {
            local: true,
            supabase: isSupabaseSaved,
            googleSheet: false,
          },
          isUnauthorized: forwardResult.isUnauthorized || isDevUrl,
          isDevUrl,
          message: failureMessage,
        });
        return;
      }

      if (isGoogleSheetSaved) {
        const reUpdated = loadRegistrations().map((r) => {
          if (newRecords.some((nr: any) => nr.id === r.id)) {
            return { ...r, status: "synced" };
          }
          return r;
        });
        saveRegistrations(reUpdated);
      }

      const batchMode = isSupabaseSaved ? "dual_sync" : "sheets";
      const batchMsg = isSupabaseSaved
        ? `✅ Successfully saved ${newRecords.length} members to BOTH Supabase Cloud & Google Sheet!`
        : `Successfully saved ${newRecords.length} members to Google Sheet!`;

      res.json({
        success: true,
        count: newRecords.length,
        mode: batchMode,
        savedTo: {
          local: true,
          supabase: isSupabaseSaved,
          googleSheet: isGoogleSheetSaved
        },
        isUnauthorized: forwardResult.isUnauthorized || isDevUrl,
        isDevUrl,
        message: batchMsg,
      });
    } catch (err: any) {
      console.error("Error submitting batch sheet:", err);
      res.status(500).json({ success: false, message: err?.message || "Internal server error" });
    }
  });

  // Sync all pending/unsynced records to BOTH Google Sheets and Supabase
  app.post("/api/sync-all", async (req, res) => {
    try {
      const config = loadConfig();
      const records = loadRegistrations();
      const pending = records.filter(r => r.status !== "synced");

      if (pending.length === 0) {
        res.json({ success: true, syncedCount: 0, message: "All records are already synchronized to cloud database & sheets!" });
        return;
      }

      let supabaseSynced = false;
      let sheetsSynced = false;
      let sheetsError = "";
      let sheetsUnauthorized = false;

      // 1. Sync pending records to Supabase Cloud Database
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const rows = pending.map(recordToSupabaseRow);
          const { error: sError } = await supabase
            .from("tmw_registrations")
            .upsert(rows, { onConflict: "reference_id" });
          if (!sError) {
            supabaseSynced = true;
          } else {
            console.warn("Supabase sync-all warning:", sError.message);
          }
        } catch (sErr: any) {
          console.warn("Supabase exception in sync-all:", sErr?.message);
        }
      }

      // 2. Sync pending records to Google Sheets
      if (config.scriptUrl && !config.scriptUrl.endsWith("/dev")) {
        const forwardResult = await forwardToGoogleSheets(config.scriptUrl, {
          type: "batch_sync",
          records: pending,
        });
        if (forwardResult.success) {
          sheetsSynced = true;
        } else {
          sheetsError = forwardResult.error || "";
          sheetsUnauthorized = Boolean(forwardResult.isUnauthorized);
        }
      }

      if (supabaseSynced || sheetsSynced) {
        const updated = records.map(r => ({ ...r, status: "synced" as const }));
        saveRegistrations(updated);

        let msg = "";
        if (supabaseSynced && sheetsSynced) {
          msg = `✅ Successfully synchronized ${pending.length} pending records to BOTH Supabase Cloud & Google Sheet!`;
        } else if (supabaseSynced) {
          msg = `Synchronized ${pending.length} records to Supabase Cloud!` + (sheetsError ? ` (Google Sheet: ${sheetsError})` : "");
        } else {
          msg = `Synchronized ${pending.length} records to Google Sheet!`;
        }

        res.json({
          success: true,
          syncedCount: pending.length,
          savedTo: {
            supabase: supabaseSynced,
            googleSheet: sheetsSynced,
          },
          isUnauthorized: sheetsUnauthorized,
          message: msg,
        });
        return;
      }

      res.json({
        success: false,
        isUnauthorized: sheetsUnauthorized,
        message: sheetsUnauthorized 
          ? "Sync blocked by Google (401 Unauthorized). Set Apps Script deployment access to 'Anyone'."
          : (sheetsError || "Neither Supabase nor Google Sheets is connected or reachable.")
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Server error syncing records." });
    }
  });

  // Push ALL records in the registry to Google Sheets (useful when starting a fresh Google Sheet)
  app.post("/api/sync-all-to-sheets", async (req, res) => {
    try {
      const config = loadConfig();
      const records = loadRegistrations();

      if (records.length === 0) {
        res.json({ success: true, count: 0, message: "No records in registry to push to Google Sheet." });
        return;
      }

      if (!config.scriptUrl || config.scriptUrl.endsWith("/dev")) {
        res.status(400).json({
          success: false,
          isDevUrl: Boolean(config.scriptUrl?.endsWith("/dev")),
          message: "Please configure a live Google Apps Script Web App URL (/exec) in Database Settings first."
        });
        return;
      }

      const forwardResult = await forwardToGoogleSheets(config.scriptUrl, {
        type: "batch_sync",
        records: records,
      });

      if (forwardResult.success) {
        const updated = records.map(r => ({ ...r, status: "synced" as const }));
        saveRegistrations(updated);
        res.json({
          success: true,
          count: records.length,
          message: `✅ Successfully populated your fresh Google Sheet with all ${records.length} registered members!`
        });
        return;
      }

      res.json({
        success: false,
        isUnauthorized: forwardResult.isUnauthorized,
        message: forwardResult.isUnauthorized
          ? "Sync blocked by Google (401 Unauthorized). In Apps Script, set 'Who has access' to 'Anyone'."
          : (forwardResult.error || "Failed populating Google Sheet.")
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Error populating Google Sheet." });
    }
  });

  // Fetch and import all records directly from Google Sheets into the registry
  app.post("/api/fetch-from-sheets", async (req, res) => {
    try {
      const config = loadConfig();
      const targetScriptUrl = (req.body?.scriptUrl || config.scriptUrl || "").trim();

      if (!targetScriptUrl) {
        res.status(400).json({
          success: false,
          message: "Please configure your Google Sheet or Google Apps Script Web App URL first."
        });
        return;
      }

      if (targetScriptUrl.endsWith("/dev")) {
        res.status(400).json({
          success: false,
          isDevUrl: true,
          message: "Developer test URL (/dev) detected. In Apps Script, click Deploy > New deployment > Web app with 'Who has access: Anyone' to get an /exec URL."
        });
        return;
      }

      // Persist URL to server config so all connected devices immediately inherit it
      if (req.body?.scriptUrl && req.body.scriptUrl !== config.scriptUrl) {
        saveConfig({ ...config, scriptUrl: req.body.scriptUrl });
      }

      const result = await fetchRecordsFromGoogleSheets(targetScriptUrl);

      if (result.isUnauthorized) {
        res.json({
          success: false,
          isUnauthorized: true,
          message: "Google returned 401 Unauthorized. Set Apps Script deployment 'Who has access' to 'Anyone' or set Google Sheet sharing to 'Anyone with the link can view'."
        });
        return;
      }

      if (result.success && Array.isArray(result.records)) {
        const fetchedRecords = result.records;
        const currentLocal = loadRegistrations();

        // Merge fetched records with current registry by referenceId or id
        const map = new Map<string, any>();
        currentLocal.forEach((r) => {
          const key = (r.referenceId || r.id || "").trim().toUpperCase();
          if (key) map.set(key, r);
        });

        fetchedRecords.forEach((r) => {
          const key = (r.referenceId || r.id || "").trim().toUpperCase();
          if (key) {
            const existing = map.get(key) || {};
            map.set(key, { ...existing, ...r, status: "synced" as const });
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        saveRegistrations(merged);

        // Also upsert to Supabase if configured so both databases remain 100% in sync
        const supabase = getSupabaseClient();
        if (supabase && fetchedRecords.length > 0) {
          try {
            const rows = fetchedRecords.map(recordToSupabaseRow);
            await supabase.from("tmw_registrations").upsert(rows, { onConflict: "reference_id" });
          } catch (sErr) {
            console.warn("Supabase upsert from sheet records warning:", sErr);
          }
        }

        const msg = fetchedRecords.length === 0
          ? "✅ Connection verified! Google Sheet is connected and ready, with 0 member rows recorded so far."
          : `✅ Successfully fetched and merged ${fetchedRecords.length} records directly from Google Sheet! (Total: ${merged.length})`;

        res.json({
          success: true,
          count: fetchedRecords.length,
          totalInRegistry: merged.length,
          records: merged,
          message: msg
        });
        return;
      }

      res.json({
        success: false,
        message: result.error || "Unable to read records from Google Sheet."
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Error fetching records from Google Sheet." });
    }
  });

  app.delete("/api/registrations/:id", async (req, res) => {
    const { id } = req.params;
    const existing = loadRegistrations();
    const updated = existing.filter((r) => r.id !== id);
    saveRegistrations(updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("tmw_registrations").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete warning:", err);
      }
    }

    res.json({ success: true, message: "Record deleted." });
  });

  app.delete("/api/registrations", async (req, res) => {
    saveRegistrations([]);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("tmw_registrations").delete().neq("id", "none");
      } catch (err) {
        console.warn("Supabase clear warning:", err);
      }
    }
    res.json({ success: true, message: "All records cleared." });
  });

  // Mount Vite or static server
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TMW Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
