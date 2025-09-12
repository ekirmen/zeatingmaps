-- =====================================================
-- 🔧 CORREGIR PROBLEMAS DE TENANT_ID
-- =====================================================
-- Script para corregir los tenant_id faltantes en varias tablas
-- =====================================================

-- =====================================================
-- 📋 ANÁLISIS DE PROBLEMAS IDENTIFICADOS
-- =====================================================

/*
PROBLEMAS ENCONTRADOS:

1. comisiones_tasas - NO tiene tenant_id (debería tenerlo)
2. payment_transactions - evento_id es NULL (debería tenerlo)
3. plantillas - tenant_id es NULL (debería tenerlo)
4. plantillas_productos_template - tenant_id es NULL (debería tenerlo)
5. settings - tenant_id es NULL (configuraciones globales)
6. system_alerts - tenant_id es NULL (alertas del sistema)

SOLUCIONES:
- Agregar tenant_id a comisiones_tasas
- Corregir código para asignar tenant_id automáticamente
- Asignar tenant_id existente a registros sin tenant_id
*/

-- =====================================================
-- 🔧 FASE 1: AGREGAR TENANT_ID A COMISIONES_TASAS
-- =====================================================

-- Agregar columna tenant_id a comisiones_tasas
ALTER TABLE public.comisiones_tasas 
ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Agregar índice para tenant_id
CREATE INDEX IF NOT EXISTS idx_comisiones_tasas_tenant_id 
ON public.comisiones_tasas USING btree (tenant_id);

-- Agregar foreign key constraint
ALTER TABLE public.comisiones_tasas 
ADD CONSTRAINT comisiones_tasas_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE;

-- =====================================================
-- 🔧 FASE 2: ASIGNAR TENANT_ID EXISTENTE A REGISTROS SIN TENANT_ID
-- =====================================================

-- Obtener el primer tenant_id disponible
DO $$
DECLARE
    default_tenant_id uuid;
BEGIN
    -- Obtener el primer tenant_id
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        -- Asignar tenant_id a comisiones_tasas
        UPDATE public.comisiones_tasas 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        -- Asignar tenant_id a plantillas
        UPDATE public.plantillas 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        -- Asignar tenant_id a plantillas_productos_template
        UPDATE public.plantillas_productos_template 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        -- Asignar tenant_id a settings (configuraciones globales)
        UPDATE public.settings 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        -- Asignar tenant_id a system_alerts
        UPDATE public.system_alerts 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Tenant ID % asignado a registros sin tenant_id', default_tenant_id;
    ELSE
        RAISE NOTICE 'No se encontraron tenants disponibles';
    END IF;
END $$;

-- =====================================================
-- 🔧 FASE 3: CORREGIR EVENTO_ID EN PAYMENT_TRANSACTIONS
-- =====================================================

-- Agregar columna evento_id si no existe
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS evento_id integer;

-- Agregar índice para evento_id
CREATE INDEX IF NOT EXISTS idx_payment_transactions_evento_id 
ON public.payment_transactions USING btree (evento_id);

-- Agregar foreign key constraint
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_evento_id_fkey 
FOREIGN KEY (evento_id) REFERENCES eventos (id) ON DELETE SET NULL;

-- =====================================================
-- ✅ VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todos los registros tienen tenant_id
SELECT 
    'VERIFICACIÓN TENANT_ID' as categoria,
    tablename,
    COUNT(*) as total_registros,
    COUNT(tenant_id) as con_tenant_id,
    COUNT(*) - COUNT(tenant_id) as sin_tenant_id
FROM (
    SELECT 'comisiones_tasas' as tablename, tenant_id FROM comisiones_tasas
    UNION ALL
    SELECT 'plantillas' as tablename, tenant_id FROM plantillas
    UNION ALL
    SELECT 'plantillas_productos_template' as tablename, tenant_id FROM plantillas_productos_template
    UNION ALL
    SELECT 'settings' as tablename, tenant_id FROM settings
    UNION ALL
    SELECT 'system_alerts' as tablename, tenant_id FROM system_alerts
) t
GROUP BY tablename
ORDER BY tablename;

-- Verificar payment_transactions con evento_id
SELECT 
    'PAYMENT_TRANSACTIONS' as categoria,
    COUNT(*) as total_registros,
    COUNT(evento_id) as con_evento_id,
    COUNT(*) - COUNT(evento_id) as sin_evento_id
FROM payment_transactions;

-- =====================================================
-- 📊 RESUMEN DE CORRECCIONES
-- =====================================================

/*
✅ CORRECCIONES APLICADAS:

1. comisiones_tasas:
   - Agregada columna tenant_id
   - Agregado índice y foreign key
   - Asignado tenant_id a registros existentes

2. plantillas:
   - Asignado tenant_id a registros existentes

3. plantillas_productos_template:
   - Asignado tenant_id a registros existentes

4. settings:
   - Asignado tenant_id a registros existentes

5. system_alerts:
   - Asignado tenant_id a registros existentes

6. payment_transactions:
   - Agregada columna evento_id
   - Agregado índice y foreign key

PRÓXIMO PASO: Actualizar el código para asignar tenant_id automáticamente
*/
