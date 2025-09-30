-- Script alternativo más simple para obtener métodos de pago
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Eliminar la función anterior si existe
DROP FUNCTION IF EXISTS get_active_payment_methods(UUID);

-- 2. Crear función simple que devuelva JSON
CREATE OR REPLACE FUNCTION get_active_payment_methods(target_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', pm.id,
            'method_id', pm.method_id,
            'name', pm.name,
            'description', pm.description,
            'enabled', pm.enabled,
            'is_recommended', pm.is_recommended,
            'processing_time', pm.processing_time,
            'fee_structure', pm.fee_structure,
            'config', pm.config,
            'icon', pm.icon,
            'tenant_id', pm.tenant_id,
            'created_at', pm.created_at,
            'updated_at', pm.updated_at
        ) ORDER BY pm.is_recommended DESC, pm.name
    ) INTO result
    FROM public.payment_methods pm
    WHERE pm.enabled = true
      AND pm.tenant_id = target_tenant_id;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 3. Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_active_payment_methods(UUID) TO authenticated;

-- 4. Probar la función
SELECT 'Prueba de la función RPC simple' as test,
       get_active_payment_methods('9dbdb86f-8424-484c-bb76-0d9fa27573c8'::uuid);
