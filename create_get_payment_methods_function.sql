-- Script para crear una función RPC que obtenga métodos de pago
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Crear función RPC para obtener métodos de pago activos
CREATE OR REPLACE FUNCTION get_active_payment_methods(target_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    method_id CHARACTER VARYING(50),
    name TEXT,
    description TEXT,
    enabled BOOLEAN,
    is_recommended BOOLEAN,
    processing_time TEXT,
    fee_structure JSONB,
    config JSONB,
    icon TEXT,
    tenant_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.method_id,
        pm.name,
        pm.description,
        pm.enabled,
        pm.is_recommended,
        pm.processing_time,
        pm.fee_structure,
        pm.config,
        pm.icon,
        pm.tenant_id,
        pm.created_at,
        pm.updated_at
    FROM public.payment_methods pm
    WHERE pm.enabled = true
      AND pm.tenant_id = target_tenant_id
    ORDER BY pm.is_recommended DESC, pm.name;
END;
$$;

-- 2. Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_active_payment_methods(UUID) TO authenticated;

-- 3. Probar la función
SELECT 'Prueba de la función RPC' as test,
       method_id,
       name,
       enabled,
       tenant_id,
       is_recommended
FROM get_active_payment_methods('9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid);
