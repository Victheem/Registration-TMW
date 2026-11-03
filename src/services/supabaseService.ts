/**
 * Supabase Cloud Database Integration & SQL Migration Definitions
 * Tinubu Movement Worldwide (TMW) Electoral Ward Registration Form
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { RegistrationRecord } from "../types";

export const SUPABASE_STORAGE_CONFIG_KEY = "tmw_supabase_config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected?: boolean;
}

/**
 * Production-ready PostgreSQL SQL script for Supabase SQL Editor.
 * Copy and run in Supabase > SQL Editor > New query.
 */
export const SUPABASE_SQL_MIGRATION = `-- ============================================================================
-- TINUBU MOVEMENT WORLDWIDE (TMW) - NATIONAL REGISTRY DATABASE
-- SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TMW REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS tmw_registrations (
    id TEXT PRIMARY KEY,
    reference_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vin TEXT,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    ward TEXT NOT NULL,
    polling_unit TEXT,
    bank_name TEXT,
    account_number TEXT,
    signature TEXT,
    is_exco BOOLEAN NOT NULL DEFAULT FALSE,
    exco_level TEXT NOT NULL DEFAULT 'None' 
        CHECK (exco_level IN ('National', 'State', 'LGA', 'Ward', 'None')),
    role TEXT NOT NULL DEFAULT 'General Member (Non-EXCO)',
    batch_id TEXT,
    batch_row_number INTEGER,
    coordinator_name TEXT,
    status TEXT NOT NULL DEFAULT 'registered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tmw_phone ON tmw_registrations (phone);
CREATE INDEX IF NOT EXISTS idx_tmw_vin ON tmw_registrations (vin);
CREATE INDEX IF NOT EXISTS idx_tmw_location ON tmw_registrations (state, lga, ward);
CREATE INDEX IF NOT EXISTS idx_tmw_role ON tmw_registrations (is_exco, role);
CREATE INDEX IF NOT EXISTS idx_tmw_created_at ON tmw_registrations (created_at DESC);

-- 4. AUTO-UPDATING TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION update_tmw_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tmw_registrations_updated_at ON tmw_registrations;
CREATE TRIGGER trigger_tmw_registrations_updated_at
    BEFORE UPDATE ON tmw_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_tmw_timestamp();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable Row Level Security
ALTER TABLE tmw_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public & coordinators to insert new member registrations
DROP POLICY IF EXISTS "Allow public and coordinator inserts" ON tmw_registrations;
CREATE POLICY "Allow public and coordinator inserts"
    ON tmw_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow reading records across all registered devices & slip lookups
DROP POLICY IF EXISTS "Allow reading registrations" ON tmw_registrations;
CREATE POLICY "Allow reading registrations"
    ON tmw_registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow updates (e.g. verifying records)
DROP POLICY IF EXISTS "Allow updating registrations" ON tmw_registrations;
CREATE POLICY "Allow updating registrations"
    ON tmw_registrations
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow deletion by coordinators
DROP POLICY IF EXISTS "Allow deleting registrations" ON tmw_registrations;
CREATE POLICY "Allow deleting registrations"
    ON tmw_registrations
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 6. WARD SUMMARY ANALYTICS VIEW
CREATE OR REPLACE VIEW tmw_ward_summary AS
SELECT 
    state,
    lga,
    ward,
    COUNT(*) AS total_registered,
    COUNT(*) FILTER (WHERE is_exco = true) AS total_exco,
    COUNT(*) FILTER (WHERE is_exco = false) AS total_non_exco,
    COUNT(*) FILTER (WHERE vin IS NOT NULL AND length(trim(vin)) > 0) AS with_pvc_vin,
    MAX(created_at) AS last_registration_at
FROM tmw_registrations
GROUP BY state, lga, ward
ORDER BY state, lga, ward;

-- 7. ENABLE REALTIME SYNC (SUPABASE REALTIME PUBLICATION)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tmw_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tmw_registrations;
  END IF;
END $$;
`;

let clientInstance: SupabaseClient | null = null;

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read local Supabase config:", err);
  }
  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || "",
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "",
  };
}

export function saveSupabaseConfig(cfg: SupabaseConfig): void {
  try {
    localStorage.setItem(SUPABASE_STORAGE_CONFIG_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.warn("Could not save local Supabase config:", err);
  }
  clientInstance = null; // reset client instance
}

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const cfg = getSavedSupabaseConfig();
  if (cfg.url && cfg.anonKey) {
    try {
      clientInstance = createClient(cfg.url, cfg.anonKey);
      return clientInstance;
    } catch (err) {
      console.warn("Failed initializing Supabase client:", err);
    }
  }
  return null;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (!url || !url.trim() || !anonKey || !anonKey.trim()) {
      return { ok: false, message: "Please provide both Supabase Project URL and Anon/Service Key." };
    }
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith("https://")) {
      return { ok: false, message: "Supabase Project URL must start with https:// (e.g. https://your-project.supabase.co)" };
    }

    const testClient = createClient(cleanUrl, cleanKey);
    // Test by querying 1 row from tmw_registrations or inspecting schema
    const { data, error } = await testClient
      .from("tmw_registrations")
      .select("id")
      .limit(1);

    if (error) {
      if (error.message.includes("relation \"tmw_registrations\" does not exist") || error.code === "42P01") {
        return {
          ok: false,
          message: "Connected to Supabase, but the table 'tmw_registrations' has not been created yet! Please copy and run the SQL migration script in your Supabase SQL Editor.",
        };
      }
      return { ok: false, message: `Supabase error: ${error.message}` };
    }

    return {
      ok: true,
      message: "Success! Supabase PostgreSQL connection verified and table 'tmw_registrations' is ready.",
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Failed to reach Supabase. Check your network or URL." };
  }
}
