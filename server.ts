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

async function forwardToGoogleSheets(scriptUrl: string, payload: any): Promise<boolean> {
  if (!scriptUrl || !scriptUrl.trim()) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(scriptUrl.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status === 200 || res.status === 302;
  } catch (err) {
    console.warn("Failed forwarding to Google Apps Script:", err);
    return false;
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
      message: sanitizedUrl 
        ? "Google Apps Script endpoint saved across all devices!" 
        : "Google Apps Script endpoint cleared."
    });
  });

  app.get("/api/registrations", (req, res) => {
    const records = loadRegistrations();
    res.json({
      success: true,
      records,
      count: records.length,
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
      const existing = loadRegistrations();
      
      // Prevent duplicates by ID if submitted again
      const filtered = existing.filter((r) => r.id !== record.id);
      const isExco = Boolean(record.isExco);
      const role = record.role || (isExco ? "EXCO Member" : "General Member (Non-EXCO)");

      const enhancedRecord = {
        ...record,
        isExco,
        role,
        status: config.scriptUrl ? "synced" : "server_saved",
        savedAt: new Date().toISOString(),
      };

      const updated = [enhancedRecord, ...filtered];
      saveRegistrations(updated);

      // Forward to Google Apps Script in background/sync
      let sheetsSuccess = false;
      if (config.scriptUrl) {
        sheetsSuccess = await forwardToGoogleSheets(config.scriptUrl, enhancedRecord);
      }

      res.json({
        success: true,
        mode: sheetsSuccess ? "sheets" : (config.scriptUrl ? "queued" : "server_saved"),
        message: sheetsSuccess 
          ? "Registration submitted and synced to Google Sheets!" 
          : "Registration saved centrally. Coordinator will sync to spreadsheet.",
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

      const newRecords = records.map((r: any) => ({
        ...r,
        state: r.state || header?.state || "",
        lga: r.lga || header?.lga || "",
        ward: r.ward || header?.ward || "",
        status: config.scriptUrl ? "synced" : "server_saved",
        savedAt: new Date().toISOString(),
      }));

      const combined = [...newRecords, ...existing];
      saveRegistrations(combined);

      let sheetsSuccess = false;
      if (config.scriptUrl) {
        sheetsSuccess = await forwardToGoogleSheets(config.scriptUrl, { header, records });
      }

      res.json({
        success: true,
        count: newRecords.length,
        mode: sheetsSuccess ? "sheets" : "server_saved",
        message: `Successfully saved ${newRecords.length} members centrally${sheetsSuccess ? " and synced to Google Sheets" : ""}!`,
      });
    } catch (err: any) {
      console.error("Error submitting batch sheet:", err);
      res.status(500).json({ success: false, message: err?.message || "Internal server error" });
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
