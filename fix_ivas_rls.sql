-- Script para diagnosticar y corregir políticas RLS en la tabla ivas
-- Error: "new row violates row-level security policy for table 'ivas'"

-- 1. Verificar estructura de la tabla ivas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ivas' 
ORDER BY ordinal_position;

-- 2. Verificar si existe la columna tenant_id
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ivas' AND column_name = 'tenant_id'
    ) as tiene_tenant_id;

-- 3. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ivas';

-- 4. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'ivas';

-- 5. Verificar datos existentes en ivas
SELECT 
    id,
    nombre,
    porcentaje,
    tenant_id,
    created_at,
    updated_at
FROM ivas 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Verificar configuración actual del tenant
SELECT 
    current_setting('app.tenant_id', true) as tenant_id_actual,
    current_user as usuario_actual,
    current_database() as base_datos_actual;

-- 7. Crear políticas RLS si no existen (EJECUTAR SOLO SI ES NECESARIO)
-- NOTA: Descomenta y ejecuta estas líneas solo si no hay políticas o están mal configuradas

/*
-- Habilitar RLS si no está habilitado
ALTER TABLE ivas ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (lectura)
CREATE POLICY "ivas_select_policy" ON ivas
    FOR SELECT
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Política para INSERT (inserción)
CREATE POLICY "ivas_insert_policy" ON ivas
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Política para UPDATE (actualización)
CREATE POLICY "ivas_update_policy" ON ivas
    FOR UPDATE
    USING (tenant_id = current_setting('app.tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Política para DELETE (eliminación)
CREATE POLICY "ivas_delete_policy" ON ivas
    FOR DELETE
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
*/

-- 8. Alternativa: Política más permisiva para desarrollo (EJECUTAR SOLO SI ES NECESARIO)
-- NOTA: Esta política es menos segura, usar solo para desarrollo

/*
-- Política que permite todas las operaciones si hay tenant_id
CREATE POLICY "ivas_all_operations_policy" ON ivas
    FOR ALL
    USING (tenant_id IS NOT NULL)
    WITH CHECK (tenant_id IS NOT NULL);
*/

-- 9. Verificar que las políticas se crearon correctamente
SELECT 
    'Políticas RLS para ivas:' as info,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%tenant_id%' THEN '✅ Incluye tenant_id'
        ELSE '❌ NO incluye tenant_id'
    END as incluye_tenant_id,
    qual as condicion
FROM pg_policies 
WHERE tablename = 'ivas';

-- 10. Verificar permisos del usuario actual
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'ivas' 
    AND grantee = current_user;

-- 11. Solución temporal: Deshabilitar RLS temporalmente (SOLO PARA DESARROLLO)
-- NOTA: Esto elimina la seguridad, usar solo para debugging

/*
-- Deshabilitar RLS temporalmente
ALTER TABLE ivas DISABLE ROW LEVEL SECURITY;

-- Después de corregir las políticas, volver a habilitar:
-- ALTER TABLE ivas ENABLE ROW LEVEL SECURITY;
*/

-- 12. Verificar que la función current_setting funciona
SELECT 
    'Configuración actual:' as info,
    current_setting('app.tenant_id', true) as tenant_id_actual,
    CASE 
        WHEN current_setting('app.tenant_id', true) IS NOT NULL 
        THEN '✅ Configurado'
        ELSE '❌ NO configurado'
    END as estado_tenant;
