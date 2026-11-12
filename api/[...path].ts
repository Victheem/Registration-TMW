import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  CoordinatorConfigError,
  CoordinatorValidationError,
  changeStateCoordinatorPin,
  createCoordinatorToken,
  getBearerToken,
  verifyCoordinatorToken,
  verifyNationalCoordinatorPin,
  verifyStateCoordinatorPin,
} from "../server/coordinatorAuth.js";

const SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  process.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbxd2EXUybiObFJm2QtvWQDVXI_DOQxn_1i4hhCRGQXHq0qxK-UpBAHYsLVNbXvBNYU5-Q/exec";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

function getRecordState(record: unknown): string {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "";
  const fields = record as Record<string, unknown>;
  const stateField = Object.entries(fields).find(([key]) =>
    ["state", "statename"].includes(key.toLowerCase().replace(/[^a-z]/g, "")),
  )?.[1];
  return typeof stateField === "string" ? stateField : "";
}

function normalizeState(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+state$/, "");
  if (["fct", "abuja", "abuja fct", "federal capital territory"].includes(normalized)) {
    return "federal capital territory";
  }
  return normalized.replace(/[^a-z]/g, "");
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

  recordsRequest = fetchSheetRecords()
    .then((records) => {
      cachedRecords = { records, fetchedAt: Date.now() };
      return records;
    })
    .finally(() => {
      recordsRequest = null;
    });
  return recordsRequest;
}

async function fetchSheetRecords(): Promise<unknown[]> {
  let getError: unknown;
  try {
    const url = new URL(SCRIPT_URL);
    url.searchParams.set("action", "read_records");
    const data = await callSheet(undefined, url.toString());
    if (Array.isArray(data.records)) return data.records;
  } catch (error) {
    getError = error;
  }

  try {
    const data = await callSheet({ action: "fetch_records", type: "fetch_records" });
    if (Array.isArray(data.records)) return data.records;
    throw new Error("Google Sheets did not return a registration list.");
  } catch (postError) {
    const getMessage = getError instanceof Error ? getError.message : "The GET request returned no registration list.";
    const postMessage = postError instanceof Error ? postError.message : "The POST request failed.";
    throw new Error(`Could not read registrations from Google Sheets. GET: ${getMessage} POST: ${postMessage}`);
  }
}

async function callSheet(payload?: unknown, scriptUrl = SCRIPT_URL): Promise<Record<string, any>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(scriptUrl, payload === undefined
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
  const endpoint = pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");

  try {
    if (endpoint === "coordinator/login" && req.method === "POST") {
      const body = await readJsonBody(req);
      if (!verifyNationalCoordinatorPin(body.pin)) {
        sendJson(res, 401, { success: false, message: "Incorrect national coordinator PIN." });
        return;
      }
      sendJson(res, 200, {
        success: true,
        token: createCoordinatorToken({ role: "national" }),
      });
      return;
    }

    if (endpoint === "state-coordinator/login" && req.method === "POST") {
      const body = await readJsonBody(req);
      const session = await verifyStateCoordinatorPin(body.state, body.pin);
      if (!session) {
        sendJson(res, 401, { success: false, message: "The selected state or PIN is incorrect." });
        return;
      }
      sendJson(res, 200, {
        success: true,
        state: session.state,
        mustChangePin: session.mustChangePin,
        token: createCoordinatorToken({
          role: "state",
          state: session.state,
          ...(session.mustChangePin ? { mustChangePin: true } : {}),
        }),
      });
      return;
    }

    if (endpoint === "state-coordinator/change-pin" && req.method === "POST") {
      const claims = verifyCoordinatorToken(getBearerToken(req.headers.authorization));
      if (claims?.role !== "state") {
        sendJson(res, 401, { success: false, message: "State coordinator login is required." });
        return;
      }
      const body = await readJsonBody(req);
      const token = await changeStateCoordinatorPin(claims.state, body.currentPin, body.newPin);
      sendJson(res, 200, { success: true, token, message: "Your state PIN has been changed." });
      return;
    }

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
      const claims = verifyCoordinatorToken(getBearerToken(req.headers.authorization));
      if (claims?.role !== "national") {
        sendJson(res, 401, { success: false, message: "National coordinator login is required." });
        return;
      }
      const records = await getSheetRecords();
      sendJson(res, 200, { success: true, records, count: records.length, isCloud: true });
      return;
    }

    if (endpoint === "state-coordinator/registrations" && req.method === "GET") {
      const claims = verifyCoordinatorToken(getBearerToken(req.headers.authorization));
      if (claims?.role !== "state") {
        sendJson(res, 401, { success: false, message: "State coordinator login is required." });
        return;
      }
      if (claims.mustChangePin) {
        sendJson(res, 403, { success: false, message: "Change the default state PIN before viewing registrations." });
        return;
      }
      const records = await getSheetRecords();
      const stateKey = normalizeState(claims.state);
      const stateRecords = records.filter((record) =>
        record && typeof record === "object" &&
        normalizeState(getRecordState(record)) === stateKey,
      );
      sendJson(res, 200, {
        success: true,
        state: claims.state,
        records: stateRecords,
        count: stateRecords.length,
      });
      return;
    }

function normalizeSheetRecord(r: Record<string, any>) {
  const fullName = String(
    r.fullName ||
    r.full_name ||
    r["Full Name"] ||
    r["Full name"] ||
    r.names ||
    r.Names ||
    r.name ||
    "",
  ).trim();

  const refId = String(
    r.referenceId ||
    r.reference_id ||
    r["Reference ID"] ||
    r["Reference Id"] ||
    r.refId ||
    r.id ||
    "",
  ).trim();

  const phone = String(r.phone || r["Phone"] || r.phoneNumber || "").trim();
  const vin = String(r.vin || r["VIN"] || r.voterCard || "").trim();
  const state = String(r.state || r["State"] || "").trim();
  const lga = String(r.lga || r["LGA"] || "").trim();
  const ward = String(r.ward || r["Ward"] || "").trim();
  const pollingUnit = String(r.pollingUnit || r.polling_unit || r["Polling Unit"] || "").trim();
  const isExco = r.isExco !== undefined ? Boolean(r.isExco) : (r.is_exco !== undefined ? Boolean(r.is_exco) : false);
  const excoLevel = String(r.excoLevel || r.exco_level || (isExco ? "Ward" : "None")).trim();
  const role = String(r.role || r["Role"] || (isExco ? "Executive Official" : "General Member")).trim();
  const timestamp = r.timestamp || r.created_at || new Date().toISOString();
  const status = r.status || "synced";

  return {
    id: r.id || (refId ? `tmw-${refId.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "unknown"),
    referenceId: refId,
    fullName,
    phone,
    vin,
    state,
    lga,
    ward,
    pollingUnit,
    isExco,
    excoLevel,
    role,
    timestamp,
    status,
  };
}

async function getAllRegistryRecords(): Promise<Array<Record<string, any>>> {
  const recordsMap = new Map<string, any>();

  // 1. Check Supabase (if configured via env vars)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tmw_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const rec = normalizeSheetRecord(row);
          const key = (rec.referenceId || rec.id).toLowerCase();
          if (key) recordsMap.set(key, rec);
        }
      }
    } catch (sbErr) {
      console.warn("Vercel Supabase query notice:", sbErr);
    }
  }

  // 2. Check Google Sheets
  try {
    const sheetRecords = await getSheetRecords();
    if (Array.isArray(sheetRecords)) {
      for (const row of sheetRecords) {
        if (row && typeof row === "object") {
          const rec = normalizeSheetRecord(row as Record<string, any>);
          const key = (rec.referenceId || rec.id).toLowerCase();
          if (key && !recordsMap.has(key)) {
            recordsMap.set(key, rec);
          }
        }
      }
    }
  } catch (sheetErr) {
    console.warn("Vercel Google Sheets query notice:", sheetErr);
  }

  // 3. Fallback to bundled data if present
  if (recordsMap.size === 0) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const localFile = path.resolve(process.cwd(), "data", "registrations.json");
      if (fs.existsSync(localFile)) {
        const raw = fs.readFileSync(localFile, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            const rec = normalizeSheetRecord(item);
            const key = (rec.referenceId || rec.id).toLowerCase();
            if (key) recordsMap.set(key, rec);
          }
        }
      }
    } catch {}
  }

  return Array.from(recordsMap.values());
}

    // Flexible path detection for Vercel functions (handles both /api/id-card/search and /search)
    const isIdCardSearch =
      endpoint === "id-card/search" ||
      pathname.endsWith("id-card/search") ||
      (pathname.endsWith("/search") && !pathname.includes("coordinator")) ||
      endpoint === "search";

    const isIdCardVerify =
      endpoint.startsWith("id-card/verify") ||
      pathname.includes("/id-card/verify") ||
      endpoint.startsWith("verify");

    if (isIdCardSearch && req.method === "GET") {
      const url = new URL(req.url || "/", "http://localhost");
      const query = String(url.searchParams.get("query") || "").trim().toLowerCase();
      if (!query) {
        sendJson(res, 200, { success: true, count: 0, records: [] });
        return;
      }

      const records = await getAllRegistryRecords();
      const normalizedQuery = query.replace(/[^a-z0-9]/g, "");
      const queryTokens = query.split(/\s+/).filter(Boolean);
      const digitsQuery = query.replace(/\D/g, "");

      const matches = records.filter((r) => {
        const ref = String(r.referenceId || r.id || "").toLowerCase();
        const normalizedRef = ref.replace(/[^a-z0-9]/g, "");
        const name = String(r.fullName || "").toLowerCase();
        const phone = String(r.phone || "").replace(/[^0-9]/g, "");
        const vin = String(r.vin || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const tokenMatch = queryTokens.length > 0 && queryTokens.every((t) => name.includes(t));
        const phoneMatch = digitsQuery.length >= 4 && phone.includes(digitsQuery);
        const vinMatch = normalizedQuery.length >= 4 && vin.includes(normalizedQuery);

        return (
          ref.includes(query) ||
          normalizedRef.includes(normalizedQuery) ||
          name.includes(query) ||
          tokenMatch ||
          phoneMatch ||
          vinMatch
        );
      });

      const safeMatches = matches.slice(0, 25).map((r) => ({
        id: r.id || r.referenceId,
        referenceId: r.referenceId || r.id,
        fullName: r.fullName,
        state: r.state || "",
        lga: r.lga || "",
        ward: r.ward || "",
        pollingUnit: r.pollingUnit || "",
        vin: r.vin || "",
        phone: r.phone || "",
        isExco: Boolean(r.isExco),
        excoLevel: r.excoLevel || "None",
        role: r.role || (r.isExco ? "Executive Official" : "General Member"),
        timestamp: r.timestamp || new Date().toISOString(),
        status: r.status || "synced",
      }));

      sendJson(res, 200, { success: true, count: safeMatches.length, records: safeMatches });
      return;
    }

    if (isIdCardVerify && req.method === "GET") {
      const verifyIdPart = pathname.split("/verify/")[1] || pathname.split("/verify")[1] || "";
      const rawId = decodeURIComponent(verifyIdPart.replace(/^\/+/, "").trim()).toLowerCase();
      const normalizedTarget = rawId.replace(/[^a-z0-9]/g, "");
      const records = await getAllRegistryRecords();

      const found = records.find((r) => {
        const ref = String(r.referenceId || "").toLowerCase();
        const id = String(r.id || "").toLowerCase();
        const normalizedRef = ref.replace(/[^a-z0-9]/g, "");
        const normalizedId = id.replace(/[^a-z0-9]/g, "");

        return (
          ref === rawId ||
          id === rawId ||
          normalizedRef === normalizedTarget ||
          normalizedId === normalizedTarget
        );
      });

      if (!found) {
        sendJson(res, 404, {
          success: false,
          verified: false,
          message: "No registered member found matching this reference code.",
        });
        return;
      }

      sendJson(res, 200, {
        success: true,
        verified: true,
        member: {
          id: found.id || found.referenceId,
          referenceId: found.referenceId || found.id,
          fullName: found.fullName,
          state: found.state || "",
          lga: found.lga || "",
          ward: found.ward || "",
          pollingUnit: found.pollingUnit || "",
          vin: found.vin || "",
          phone: found.phone || "",
          isExco: Boolean(found.isExco),
          excoLevel: found.excoLevel || "None",
          role: found.role || (found.isExco ? "Executive Committee Officer" : "General Member"),
          timestamp: found.timestamp || new Date().toISOString(),
          status: found.status || "synced",
          verifiedAt: new Date().toISOString(),
        },
      });
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
      const claims = verifyCoordinatorToken(getBearerToken(req.headers.authorization));
      if (claims?.role !== "national") {
        sendJson(res, 401, { success: false, message: "National coordinator login is required." });
        return;
      }
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
    const status = error instanceof CoordinatorConfigError
      ? 503
      : error instanceof CoordinatorValidationError
        ? 400
        : 502;
    sendJson(res, status, { success: false, message });
  }
}
