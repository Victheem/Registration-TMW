import type { IncomingMessage, ServerResponse } from "node:http";

const SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  process.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbxd2EXUybiObFJm2QtvWQDVXI_DOQxn_1i4hhCRGQXHq0qxK-UpBAHYsLVNbXvBNYU5-Q/exec";

type ApiRequest = IncomingMessage & {
  body?: unknown;
};

let cachedRecords: { records: unknown[]; fetchedAt: number } | null = null;
let recordsRequest: Promise<unknown[]> | null = null;

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

async function readJsonBody(req: ApiRequest): Promise<Record<string, any>> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, any>;
  }
  if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Request body must be a JSON object.");
    }
    return parsed as Record<string, any>;
  }

  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > 15 * 1024 * 1024) {
      throw new Error("Request body exceeds the 15 MB limit.");
    }
    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) return {};
  const parsed: unknown = JSON.parse(rawBody);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  return parsed as Record<string, any>;
}

async function getSheetRecords(forceRefresh = false): Promise<unknown[]> {
  if (!forceRefresh && cachedRecords && Date.now() - cachedRecords.fetchedAt < 15_000) {
    return cachedRecords.records;
  }
  if (recordsRequest) return recordsRequest;

  recordsRequest = callSheet()
    .then((data) => {
      const records = Array.isArray(data.records) ? data.records : [];
      cachedRecords = { records, fetchedAt: Date.now() };
      return records;
    })
    .finally(() => {
      recordsRequest = null;
    });
  return recordsRequest;
}

async function callSheet(payload?: unknown): Promise<Record<string, any>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(SCRIPT_URL, payload === undefined
      ? { method: "GET", redirect: "follow", signal: controller.signal }
      : {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          redirect: "follow",
          signal: controller.signal,
        });
    const text = await response.text();
    let data: Record<string, any>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Google Sheets returned an unreadable response. Check the Apps Script deployment.");
    }

    if (!response.ok || data.status === "error") {
      throw new Error(data.message || `Google Sheets returned HTTP ${response.status}.`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  const endpoint = pathname.replace(/^\/api\/?/, "");

  try {
    if (endpoint === "config" && req.method === "GET") {
      sendJson(res, 200, {
        success: true,
        scriptUrl: SCRIPT_URL,
        isDevUrl: SCRIPT_URL.endsWith("/dev"),
        isConfigured: true,
      });
      return;
    }

    if (endpoint === "config" && req.method === "POST") {
      const body = await readJsonBody(req);
      if (body.scriptUrl && body.scriptUrl !== SCRIPT_URL) {
        sendJson(res, 400, {
          success: false,
          message: "Update GOOGLE_APPS_SCRIPT_URL in the Vercel project environment variables to change the connected sheet.",
        });
        return;
      }
      sendJson(res, 200, { success: true, scriptUrl: SCRIPT_URL, isConfigured: true });
      return;
    }

    if (endpoint === "registrations" && req.method === "GET") {
      const records = await getSheetRecords();
      sendJson(res, 200, { success: true, records, count: records.length, isCloud: true });
      return;
    }

    if (endpoint === "submit-registration" && req.method === "POST") {
      const record = await readJsonBody(req);
      if (!record.fullName && !record.phone && !record.vin) {
        sendJson(res, 400, { success: false, message: "Invalid registration record." });
        return;
      }
      const data = await callSheet(record);
      cachedRecords = null;
      sendJson(res, 200, {
        success: true,
        mode: "sheets",
        savedTo: { googleSheet: true },
        message: data.message || "Registration submitted and synced live to Google Sheets!",
        record: { ...record, status: "synced" },
      });
      return;
    }

    if (endpoint === "submit-batch" && req.method === "POST") {
      const body = await readJsonBody(req);
      if (!Array.isArray(body.records) || body.records.length === 0) {
        sendJson(res, 400, { success: false, message: "No member records provided." });
        return;
      }
      const data = await callSheet({ header: body.header, records: body.records });
      cachedRecords = null;
      sendJson(res, 200, {
        success: true,
        count: body.records.length,
        mode: "sheets",
        savedTo: { googleSheet: true },
        message: data.message || `Successfully saved ${body.records.length} members to Google Sheets!`,
      });
      return;
    }

    if (endpoint === "test-sheets" && req.method === "POST") {
      const data = await callSheet({ type: "ping_test", action: "test_connection" });
      sendJson(res, 200, { success: true, ok: true, verifiedUrl: SCRIPT_URL, message: data.message });
      return;
    }

    if (endpoint === "fetch-from-sheets" && req.method === "POST") {
      const records = await getSheetRecords(true);
      sendJson(res, 200, {
        success: true,
        count: records.length,
        totalInRegistry: records.length,
        records,
        message: `Fetched ${records.length} records from Google Sheets.`,
      });
      return;
    }

    sendJson(res, 404, { success: false, message: "API endpoint not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Google Sheets request failed.";
    console.error(`Vercel API error (${endpoint}):`, message);
    sendJson(res, 502, { success: false, message });
  }
}
