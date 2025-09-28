-- Fix the RLS policy for the funciones table
-- The error was due to incorrect type casting

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "funciones_tenant_access" ON funciones;

-- Create the correct RLS policy with proper type casting
CREATE POLICY "funciones_tenant_access" ON funciones
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Alternative policy if the above doesn't work (for cases where tenant_id is stored differently)
-- CREATE POLICY "funciones_tenant_access" ON funciones
--   FOR ALL USING (
--     tenant_id::text = (auth.jwt() ->> 'tenant_id')
--   );

-- Enable RLS on the table
ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy for authenticated users to access their own tenant's data
CREATE POLICY "funciones_authenticated_access" ON funciones
  FOR ALL TO authenticated
  USING (true);

-- Optional: Create a policy for service role (if needed for admin operations)
CREATE POLICY "funciones_service_role_access" ON funciones
  FOR ALL TO service_role
  USING (true);
