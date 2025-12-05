-- Migration: create audit_logs table and indexes
-- Run this on your Postgres DB (e.g., via psql or Supabase SQL editor)

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action character varying(255) NOT NULL,
  details jsonb NULL,
  metadata jsonb NULL,
  resource_id uuid NULL,
  resource_type character varying(100) NULL,
  severity character varying(20) NULL DEFAULT 'info',
  tenant_id uuid NULL,
  user_id uuid NULL,
  session_id character varying(255) NULL,
  ip_address character varying(45) NULL,
  user_agent text NULL,
  url text NULL,
  referrer text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT audit_logs_severity_check CHECK (
    (severity::text = ANY (ARRAY['info'::character varying,'warning'::character varying,'error'::character varying,'critical'::character varying]::text[]))
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs USING btree (action) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs USING btree (severity) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON public.audit_logs USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs USING btree (tenant_id, created_at DESC) TABLESPACE pg_default;

-- Enable RLS and provide suggested sample policies below (adjust to your JWT claim names)
-- WARNING: Review these policies before applying in production. Replace CLAIM_KEY with the actual JWT claim that carries tenant id, e.g. 'tenant_id' or 'tenant'.

-- Enable row level security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to insert audit logs (server or users with JWT)
-- This allows inserts when auth.uid() is present. If you prefer only server inserts, remove or restrict this.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'audit_logs' AND p.polname = 'audit_logs_insert_authenticated'
  ) THEN
    -- Allow authenticated users to INSERT audit logs for their tenant.
    -- The check requires a valid auth uid and that the provided tenant_id (if any)
    -- matches the tenant claim inside the user's JWT. Adjust the JWT claim
    -- name below if your tokens use a different key for tenant id.
    CREATE POLICY audit_logs_insert_authenticated
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND (
        tenant_id IS NULL
        OR tenant_id::text = current_setting('request.jwt.claims.tenant_id', true)
      )
    );
  END IF;
END$$;

-- Policy: allow users to select logs for their tenant
-- Replace 'request.jwt.claims.tenant_id' below with the claim that contains tenant id in your JWT.
-- If your JWT uses a different key, update the current_setting call accordingly.
-- Example: current_setting('request.jwt.claims.tenant_id', true)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'audit_logs' AND p.polname = 'audit_logs_select_tenant'
  ) THEN
    CREATE POLICY audit_logs_select_tenant
    ON public.audit_logs
    FOR SELECT
    USING (
      tenant_id IS NULL OR
      tenant_id::text = current_setting('request.jwt.claims.tenant_id', true)
    );
  END IF;
END$$;

-- Optional: allow inserts from serverless functions using service role (no RLS constraint)
-- Usually you will use the service_role key server-side and bypass RLS; if you want to allow server to insert with tenant mismatch, keep using the admin client.

-- End of migration
