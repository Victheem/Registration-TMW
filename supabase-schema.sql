-- ============================================================================
-- TINUBU MOVEMENT WORLDWIDE (TMW) - SUPABASE SQL SCHEMA
-- Table: tmw_registrations
-- Run this script in the Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Create the registrations table matching the app's data model
CREATE TABLE IF NOT EXISTS public.tmw_registrations (
    id TEXT PRIMARY KEY,
    reference_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    vin TEXT,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    ward TEXT NOT NULL,
    polling_unit TEXT,
    bank_name TEXT,
    account_number TEXT,
    signature TEXT,
    is_exco BOOLEAN DEFAULT FALSE NOT NULL,
    exco_level TEXT DEFAULT 'None',
    role TEXT DEFAULT 'General Member (Non-EXCO)',
    batch_id TEXT,
    batch_row_number INTEGER,
    coordinator_name TEXT,
    status TEXT DEFAULT 'registered' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance Indexes for Fast ID Card Search, State Filtering, and QR Verification
CREATE INDEX IF NOT EXISTS idx_tmw_reference_id 
    ON public.tmw_registrations (reference_id);

CREATE INDEX IF NOT EXISTS idx_tmw_full_name_lower 
    ON public.tmw_registrations (lower(full_name));

CREATE INDEX IF NOT EXISTS idx_tmw_state_lga_ward 
    ON public.tmw_registrations (lower(state), lower(lga), lower(ward));

CREATE INDEX IF NOT EXISTS idx_tmw_phone 
    ON public.tmw_registrations (phone);

CREATE INDEX IF NOT EXISTS idx_tmw_vin 
    ON public.tmw_registrations (vin);

CREATE INDEX IF NOT EXISTS idx_tmw_created_at 
    ON public.tmw_registrations (created_at DESC);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tmw_updated_at ON public.tmw_registrations;
CREATE TRIGGER set_tmw_updated_at
    BEFORE UPDATE ON public.tmw_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tmw_registrations ENABLE ROW LEVEL SECURITY;

-- Policy A: Allow public read access (Required for member ID card search and QR scan verification)
DROP POLICY IF EXISTS "Allow public read access for verification and ID lookup" ON public.tmw_registrations;
CREATE POLICY "Allow public read access for verification and ID lookup"
    ON public.tmw_registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy B: Allow public insert of registration records
DROP POLICY IF EXISTS "Allow public insert of registrations" ON public.tmw_registrations;
CREATE POLICY "Allow public insert of registrations"
    ON public.tmw_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy C: Allow update access for syncing and coordinator updates
DROP POLICY IF EXISTS "Allow public update of registrations" ON public.tmw_registrations;
CREATE POLICY "Allow public update of registrations"
    ON public.tmw_registrations
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policy D: Allow full access for service_role
DROP POLICY IF EXISTS "Allow service role full access" ON public.tmw_registrations;
CREATE POLICY "Allow service role full access"
    ON public.tmw_registrations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
