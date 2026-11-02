import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig(): { scriptUrl: string } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error loading server config:", err);
  }
  return { scriptUrl: process.env.VITE_GOOGLE_APPS_SCRIPT_URL || "" };
}

function saveConfig(config: { scriptUrl: string }): void {
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

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {}

    if (res.ok || res.status === 200 || res.status === 302 || (parsed && parsed.status === "success")) {
      return { success: true, httpStatus: res.status };
    }

    return {
      success: false,
      httpStatus: res.status,
      error: parsed?.message || text.substring(0, 200) || `Received status ${res.status}`,
    };
  } catch (err: any) {
    console.warn(`Failed forwarding to Google Apps Script (${targetUrl}):`, err?.message);
    return {
      success: false,
      error: err?.name === "AbortError" ? "Google Apps Script request timed out after 6 seconds." : (err?.message || "Connection failed."),
    };
  }
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

  app.get("/api/registrations", (req, res) => {
    const records = loadRegistrations();
    res.json({
      success: true,
      records,
      count: records.length,
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

      // 1. CRITICAL: SAVE TO CENTRAL DATABASE IMMEDIATELY!
      // This guarantees that Device B, mobile phones, and all coordinators instantly see this registration
      // without being blocked if Google Apps Script is slow, times out, or returns 401.
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

      // 2. FORWARD TO GOOGLE APPS SCRIPT IF CONFIGURED
      let forwardResult: ForwardResult = { success: false };
      if (effectiveScriptUrl && !isDevUrl) {
        forwardResult = await forwardToGoogleSheets(effectiveScriptUrl, enhancedRecord);
      } else if (isDevUrl) {
        forwardResult = {
          success: false,
          isDevUrl: true,
          isUnauthorized: true,
          error: "Developer test URL (/dev) detected. Google blocks external devices from submitting to /dev URLs."
        };
      }

      if (forwardResult.success) {
        // Mark as synced in central server storage
        enhancedRecord.status = "synced";
        const currentRecords = loadRegistrations();
        const reUpdated = currentRecords.map((r) => r.id === enhancedRecord.id ? { ...r, status: "synced" } : r);
        saveRegistrations(reUpdated);

        res.json({
          success: true,
          mode: "sheets",
          message: "Registration submitted and synced live to Google Sheets!",
          record: enhancedRecord,
        });
        return;
      }

      if (isDevUrl) {
        res.json({
          success: true,
          mode: "unauthorized_401",
          isUnauthorized: true,
          isDevUrl: true,
          message: "Saved to Central Registry! ⚠️ Notice: Your Google Sheet URL ends in /dev. Create a live deployment (/exec) with 'Who has access: Anyone' to auto-sync to Sheets.",
          record: enhancedRecord,
        });
        return;
      }

      if (forwardResult.isUnauthorized) {
        res.json({
          success: true,
          mode: "unauthorized_401",
          isUnauthorized: true,
          message: "Saved to Central Registry! ⚠️ Note: Google Sheet sync blocked (Set Apps Script deployment access to 'Anyone').",
          record: enhancedRecord,
        });
        return;
      }

      res.json({
        success: true,
        mode: effectiveScriptUrl ? "queued" : "server_saved",
        message: effectiveScriptUrl 
          ? "Registration saved to Central Database! (Queued for Google Sheets sync)."
          : "Registration saved to Central Database! Connect your Google Sheet in Settings to auto-sync.",
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

      // 2. FORWARD TO GOOGLE APPS SCRIPT
      let forwardResult: ForwardResult = { success: false };
      if (config.scriptUrl && !isDevUrl) {
        forwardResult = await forwardToGoogleSheets(config.scriptUrl, { header, records: newRecords });
      }

      if (forwardResult.success) {
        const reUpdated = loadRegistrations().map((r) => {
          if (newRecords.some((nr: any) => nr.id === r.id)) {
            return { ...r, status: "synced" };
          }
          return r;
        });
        saveRegistrations(reUpdated);

        res.json({
          success: true,
          count: newRecords.length,
          mode: "sheets",
          message: `Successfully saved ${newRecords.length} members and synced live to Google Sheets!`,
        });
        return;
      }

      res.json({
        success: true,
        count: newRecords.length,
        mode: forwardResult.isUnauthorized ? "unauthorized_401" : "server_saved",
        isUnauthorized: forwardResult.isUnauthorized || isDevUrl,
        isDevUrl,
        message: `Saved ${newRecords.length} members to Central Registry!${
          isDevUrl
            ? " ⚠️ Notice: Google Sheet URL is a /dev URL. Deploy as Web App (/exec) with 'Who has access: Anyone' to sync."
            : (forwardResult.isUnauthorized ? " ⚠️ Note: Google Sheet returned 401 (Set 'Who has access' to 'Anyone')." : "")
        }`,
      });
    } catch (err: any) {
      console.error("Error submitting batch sheet:", err);
      res.status(500).json({ success: false, message: err?.message || "Internal server error" });
    }
  });

  // Sync all pending/unsynced records to Google Sheets
  app.post("/api/sync-all", async (req, res) => {
    try {
      const config = loadConfig();
      if (!config.scriptUrl) {
        res.status(400).json({ success: false, message: "No Google Sheet URL connected. Please connect in Settings." });
        return;
      }

      const records = loadRegistrations();
      const pending = records.filter(r => r.status !== "synced");

      if (pending.length === 0) {
        res.json({ success: true, syncedCount: 0, message: "All records are already synced to Google Sheets!" });
        return;
      }

      // Forward pending as batch
      const forwardResult = await forwardToGoogleSheets(config.scriptUrl, {
        type: "batch_sync",
        records: pending,
      });

      if (forwardResult.success) {
        const updated = records.map(r => ({ ...r, status: "synced" as const }));
        saveRegistrations(updated);
        res.json({
          success: true,
          syncedCount: pending.length,
          message: `Successfully synchronized ${pending.length} pending records to Google Sheets!`
        });
        return;
      }

      res.json({
        success: false,
        isUnauthorized: forwardResult.isUnauthorized,
        message: forwardResult.isUnauthorized 
          ? "Sync blocked by Google (401 Unauthorized). Set Apps Script deployment access to 'Anyone'."
          : (forwardResult.error || "Failed syncing to Google Sheets.")
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Server error syncing records." });
    }
  });

  app.delete("/api/registrations/:id", (req, res) => {
    const { id } = req.params;
    const existing = loadRegistrations();
    const updated = existing.filter((r) => r.id !== id);
    saveRegistrations(updated);
    res.json({ success: true, message: "Record deleted." });
  });

  app.delete("/api/registrations", (req, res) => {
    saveRegistrations([]);
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
