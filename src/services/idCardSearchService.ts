/**
 * Comprehensive ID Card Search & Verification Service
 * Tinubu Movement Worldwide (TMW)
 * 
 * Provides resilient, multi-tiered search:
 * Tier 1: Local serverless API endpoint (/api/id-card/search)
 * Tier 2: Direct Google Apps Script Webhook with CORS & session caching (2,590+ live records)
 * Tier 3: Supabase client-side query (if configured)
 * Tier 4: LocalStorage cached registrations from current device
 */

import { RegistrationRecord, ExcoLevel } from "../types";

export const PUBLIC_APPS_SCRIPT_URL = 
  "https://script.google.com/macros/s/AKfycbxd2EXUybiObFJm2QtvWQDVXI_DOQxn_1i4hhCRGQXHq0qxK-UpBAHYsLVNbXvBNYU5-Q/exec";

// In-memory cache to make repeated searches instantaneous (0ms)
let cachedRecords: RegistrationRecord[] | null = null;
let isPreloading = false;

/**
 * Normalizes any raw record object from Google Sheets, Supabase, or local storage
 * into a strongly typed RegistrationRecord.
 */
export function normalizeRecord(raw: any): RegistrationRecord {
  const refId = String(raw.referenceId || raw.reference_id || raw.id || "").trim();
  const fullName = String(raw.fullName || raw.full_name || raw.names || "").trim();
  const phone = String(raw.phone || "").trim();
  const vin = String(raw.vin || "").trim();
  const state = String(raw.state || "").trim();
  const lga = String(raw.lga || "").trim();
  const ward = String(raw.ward || "").trim();
  const pollingUnit = String(raw.pollingUnit || raw.polling_unit || "").trim();
  const bankName = String(raw.bankName || raw.bank_name || raw.bank || "").trim();
  const accountNumber = String(raw.accountNumber || raw.account_number || raw.accountNo || "").trim();
  const isExco = Boolean(
    raw.isExco === true || 
    raw.is_exco === true || 
    String(raw.isExco || raw.is_exco || "").toUpperCase() === "EXCO"
  );
  const rawLevel = String(raw.excoLevel || raw.exco_level || "").trim().toLowerCase();
  let excoLevel: ExcoLevel = "None";
  if (rawLevel.includes("national")) excoLevel = "National";
  else if (rawLevel.includes("state")) excoLevel = "State";
  else if (rawLevel.includes("lga")) excoLevel = "LGA";
  else if (rawLevel.includes("ward") || isExco) excoLevel = "Ward";
  const role = String(raw.role || (isExco ? "Ward Coordinators" : "General Member (Non-EXCO)")).trim();
  const signature = String(raw.signature || "Verified Member").trim();
  const timestamp = String(raw.timestamp || raw.created_at || new Date().toISOString()).trim();

  return {
    id: raw.id || refId || `tmw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    referenceId: refId || `TMW-${Date.now().toString(36).toUpperCase()}`,
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
  };
}

/**
 * Fetches all live records directly from the Google Apps Script endpoint.
 * Caches in memory and sessionStorage to optimize bandwidth and speed.
 */
export async function fetchLiveSheetRecords(): Promise<RegistrationRecord[]> {
  if (cachedRecords && cachedRecords.length > 0) {
    return cachedRecords;
  }

  // Check sessionStorage
  try {
    const sessionSaved = sessionStorage.getItem("tmw_cached_sheet_records");
    if (sessionSaved) {
      const parsed = JSON.parse(sessionSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedRecords = parsed.map(normalizeRecord);
        return cachedRecords;
      }
    }
  } catch {}

  try {
    const res = await fetch(`${PUBLIC_APPS_SCRIPT_URL}?action=read_records`, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Google Apps Script responded with HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json && Array.isArray(json.records)) {
      const normalized = json.records.map(normalizeRecord);
      cachedRecords = normalized;

      try {
        sessionStorage.setItem("tmw_cached_sheet_records", JSON.stringify(normalized.slice(0, 3000)));
      } catch {}

      return normalized;
    }
  } catch (err) {
    console.warn("Direct Google Apps Script fetch warning:", err);
  }

  return cachedRecords || [];
}

/**
 * Filter an array of records against a search query
 */
export function filterRecordsByQuery(records: RegistrationRecord[], query: string): RegistrationRecord[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const queryTokens = cleanQuery.split(/\s+/).filter(t => t.length > 0);
  const cleanDigits = cleanQuery.replace(/\D/g, "");
  const cleanRefTerm = cleanQuery.replace(/[^a-z0-9]/g, "");

  return records.filter((rec) => {
    const name = rec.fullName.toLowerCase();
    const ref = rec.referenceId.toLowerCase();
    const cleanRef = ref.replace(/[^a-z0-9]/g, "");
    const phone = rec.phone.replace(/\D/g, "");
    const vin = rec.vin.toLowerCase();
    const state = rec.state.toLowerCase();
    const lga = rec.lga.toLowerCase();
    const ward = rec.ward.toLowerCase();

    // 1. Direct Reference ID match
    if (ref.includes(cleanQuery) || cleanRef.includes(cleanRefTerm)) {
      return true;
    }

    // 2. Tokenized Name match: all tokens must be present in full name
    // e.g. "Dogara Conscience" will match "Dogara Conscience Abwamyi"
    if (queryTokens.length > 0 && queryTokens.every(tok => name.includes(tok))) {
      return true;
    }

    // 3. Name contains query substring
    if (name.includes(cleanQuery)) {
      return true;
    }

    // 4. Phone match (by digits if at least 4 digits entered)
    if (cleanDigits.length >= 4 && phone.includes(cleanDigits)) {
      return true;
    }

    // 5. Voter card (VIN) match
    if (vin && vin.includes(cleanQuery)) {
      return true;
    }

    // 6. Ward/LGA/State specific match if query has multiple words
    if (queryTokens.length >= 2 && queryTokens.some(tok => ward.includes(tok) || lga.includes(tok) || state.includes(tok))) {
      if (queryTokens.some(tok => name.includes(tok))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Searches the registry across all available sources:
 * 1. Serverless API endpoint `/api/id-card/search`
 * 2. Direct Google Apps Script endpoint
 * 3. Client Supabase (if keys are present)
 * 4. LocalStorage recently registered members
 */
export async function searchMemberRegistry(query: string): Promise<{
  success: boolean;
  records: RegistrationRecord[];
  source?: string;
  message?: string;
}> {
  const term = query.trim();
  if (!term) {
    return { success: true, records: [] };
  }

  // Local storage recent submissions (instant check)
  const localRecent: RegistrationRecord[] = [];
  try {
    const local = JSON.parse(localStorage.getItem("tmw_local_members") || "[]");
    if (Array.isArray(local)) {
      localRecent.push(...local.map(normalizeRecord));
    }
  } catch {}

  // 1. Try serverless endpoint first
  try {
    const apiRes = await fetch(`/api/id-card/search?query=${encodeURIComponent(term)}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.success && Array.isArray(data.records) && data.records.length > 0) {
        return {
          success: true,
          records: data.records.map(normalizeRecord),
          source: "serverless_api"
        };
      }
    }
  } catch (apiErr) {
    console.info("Serverless search endpoint bypassed/unavailable, using direct live fallback.");
  }

  // 2. Direct fallback to Google Apps Script (2,590+ live members)
  try {
    const liveRecords = await fetchLiveSheetRecords();
    if (liveRecords.length > 0) {
      // Merge with local recent
      const allPool = [...localRecent, ...liveRecords];
      // Deduplicate by referenceId
      const seen = new Set<string>();
      const uniquePool: RegistrationRecord[] = [];
      for (const r of allPool) {
        const key = r.referenceId.toUpperCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniquePool.push(r);
        }
      }

      const matches = filterRecordsByQuery(uniquePool, term);
      if (matches.length > 0) {
        return {
          success: true,
          records: matches.slice(0, 30),
          source: "google_apps_script_live"
        };
      }
    }
  } catch (sheetErr) {
    console.warn("Direct Google Sheet search warning:", sheetErr);
  }

  // 3. Direct client Supabase fallback
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data: sbData, error: sbError } = await sb
        .from("tmw_registrations")
        .select("*")
        .or(`reference_id.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%,vin.ilike.%${term}%`)
        .limit(30);

      if (!sbError && Array.isArray(sbData) && sbData.length > 0) {
        return {
          success: true,
          records: sbData.map(normalizeRecord),
          source: "supabase_client"
        };
      }
    } catch {}
  }

  // 4. Local storage match only
  if (localRecent.length > 0) {
    const localMatches = filterRecordsByQuery(localRecent, term);
    if (localMatches.length > 0) {
      return {
        success: true,
        records: localMatches,
        source: "local_cache"
      };
    }
  }

  return {
    success: true,
    records: [],
    message: `No registered member found matching "${term}".`
  };
}

/**
 * Verifies a single member by Reference ID or ID code (for QR code scan)
 */
export async function verifyMemberCredential(referenceId: string): Promise<{
  success: boolean;
  member: RegistrationRecord | null;
  message?: string;
}> {
  const cleanRef = referenceId.trim();
  if (!cleanRef) {
    return { success: false, member: null, message: "Invalid reference ID" };
  }

  // 1. Try backend verify endpoint
  try {
    const res = await fetch(`/api/id-card/verify/${encodeURIComponent(cleanRef)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.member) {
        return {
          success: true,
          member: normalizeRecord(data.member)
        };
      }
    }
  } catch {}

  // 2. Direct fallback to Google Apps Script live records
  try {
    const records = await fetchLiveSheetRecords();
    const cleanTarget = cleanRef.toLowerCase().replace(/[^a-z0-9]/g, "");

    const found = records.find((r) => {
      const ref = r.referenceId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const id = String(r.id).toLowerCase().replace(/[^a-z0-9]/g, "");
      return ref === cleanTarget || id === cleanTarget || ref.includes(cleanTarget);
    });

    if (found) {
      return {
        success: true,
        member: found
      };
    }
  } catch {}

  // 3. Check local storage
  try {
    const local = JSON.parse(localStorage.getItem("tmw_local_members") || "[]");
    if (Array.isArray(local)) {
      const cleanTarget = cleanRef.toLowerCase().replace(/[^a-z0-9]/g, "");
      const found = local.find((r: any) => {
        const ref = String(r.referenceId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return ref === cleanTarget || ref.includes(cleanTarget);
      });
      if (found) {
        return {
          success: true,
          member: normalizeRecord(found)
        };
      }
    }
  } catch {}

  return {
    success: false,
    member: null,
    message: `No bona fide member found for reference: ${referenceId}`
  };
}
