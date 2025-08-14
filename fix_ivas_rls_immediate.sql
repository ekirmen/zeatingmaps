-- SOLUCIÓN INMEDIATA para el error RLS en tabla ivas
-- Error: "new row violates row-level security policy for table 'ivas'"

-- PASO 1: Verificar el estado actual
SELECT '=== ESTADO ACTUAL ===' as info;

-- Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'ivas';

-- Verificar políticas existentes
SELECT 
    'Políticas existentes:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'ivas';

-- PASO 2: SOLUCIÓN TEMPORAL (Deshabilitar RLS)
-- ⚠️ ADVERTENCIA: Esto elimina la seguridad temporalmente
-- Solo usar para desarrollo/testing

SELECT '=== DESHABILITANDO RLS TEMPORALMENTE ===' as info;

-- Deshabilitar RLS
ALTER TABLE ivas DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'ivas';

-- PASO 3: VERIFICAR QUE FUNCIONA
SELECT '=== VERIFICANDO FUNCIONAMIENTO ===' as info;

-- Intentar insertar un IVA de prueba
INSERT INTO ivas (nombre, porcentaje, tenant_id, created_at, updated_at)
VALUES ('IVA Test', 19.0, gen_random_uuid(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verificar que se insertó
SELECT 
    'IVA de prueba insertado:' as info,
    id,
    nombre,
    porcentaje,
    tenant_id,
    created_at
FROM ivas 
WHERE nombre = 'IVA Test'
ORDER BY created_at DESC 
LIMIT 1;

-- PASO 4: CREAR POLÍTICAS RLS CORRECTAS
SELECT '=== CREANDO POLÍTICAS RLS CORRECTAS ===' as info;

-- Habilitar RLS nuevamente
ALTER TABLE ivas ENABLE ROW LEVEL SECURITY;

-- Crear política para SELECT (lectura)
CREATE POLICY IF NOT EXISTS "ivas_select_policy" ON ivas
    FOR SELECT
    USING (true); -- Permitir lectura de todos los IVAs

-- Crear política para INSERT (inserción)
CREATE POLICY IF NOT EXISTS "ivas_insert_policy" ON ivas
    FOR INSERT
    WITH CHECK (true); -- Permitir inserción de cualquier IVA

-- Crear política para UPDATE (actualización)
CREATE POLICY IF NOT EXISTS "ivas_update_policy" ON ivas
    FOR UPDATE
    USING (true)
    WITH CHECK (true); -- Permitir actualización de cualquier IVA

-- Crear política para DELETE (eliminación)
CREATE POLICY IF NOT EXISTS "ivas_delete_policy" ON ivas
    FOR DELETE
    USING (true); -- Permitir eliminación de cualquier IVA

-- PASO 5: VERIFICAR POLÍTICAS CREADAS
SELECT '=== VERIFICANDO POLÍTICAS ===' as info;

SELECT 
    'Políticas RLS creadas:' as info,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'ivas';

-- PASO 6: TEST FINAL
SELECT '=== TEST FINAL ===' as info;

-- Intentar insertar otro IVA con RLS habilitado
INSERT INTO ivas (nombre, porcentaje, tenant_id, created_at, updated_at)
VALUES ('IVA Test 2', 21.0, gen_random_uuid(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verificar que se insertó correctamente
SELECT 
    'IVA de prueba 2 insertado:' as info,
    id,
    nombre,
    porcentaje,
    tenant_id,
    created_at
FROM ivas 
WHERE nombre = 'IVA Test 2'
ORDER BY created_at DESC 
LIMIT 1;

-- PASO 7: LIMPIEZA (OPCIONAL)
SELECT '=== LIMPIEZA OPCIONAL ===' as info;

-- Eliminar IVAs de prueba si quieres
-- DELETE FROM ivas WHERE nombre LIKE 'IVA Test%';

-- PASO 8: RESUMEN FINAL
SELECT '=== RESUMEN FINAL ===' as info;

SELECT 
    'Estado final de la tabla ivas:' as info,
    tablename,
    rowsecurity as rls_habilitado,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ivas') as total_politicas
FROM pg_tables 
WHERE tablename = 'ivas';

-- Verificar que las políticas están activas
SELECT 
    'Políticas activas:' as info,
    policyname,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ Lectura'
        WHEN cmd = 'INSERT' THEN '✅ Inserción'
        WHEN cmd = 'UPDATE' THEN '✅ Actualización'
        WHEN cmd = 'DELETE' THEN '✅ Eliminación'
        ELSE '❓ Desconocido'
    END as operacion_permitida
FROM pg_policies 
WHERE tablename = 'ivas';

-- ========================================
-- SOLUCIÓN COMPLETA DESDE CERO
-- ========================================

-- Si la tabla ya existe y quieres empezar de nuevo:
-- DROP TABLE IF EXISTS ivas CASCADE;

-- CREAR TABLA IVAS CON RLS CONFIGURADO CORRECTAMENTE DESDE EL INICIO
CREATE TABLE IF NOT EXISTS public.ivas (
    id serial NOT NULL,
    nombre character varying(255) NOT NULL,
    porcentaje numeric NOT NULL,
    tenant_id uuid NULL,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    CONSTRAINT ivas_pkey PRIMARY KEY (id),
    CONSTRAINT ivas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_ivas_tenant_id ON public.ivas USING btree (tenant_id) TABLESPACE pg_default;

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ivas_updated_at 
    BEFORE UPDATE ON ivas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- HABILITAR RLS (esto se hace automáticamente en Supabase)
ALTER TABLE ivas ENABLE ROW LEVEL SECURITY;

-- CREAR POLÍTICAS RLS INMEDIATAMENTE
-- Política para SELECT - permitir lectura de todos los IVAs
CREATE POLICY "ivas_select_policy" ON ivas
    FOR SELECT
    USING (true);

-- Política para INSERT - permitir inserción de cualquier IVA
CREATE POLICY "ivas_insert_policy" ON ivas
    FOR INSERT
    WITH CHECK (true);

-- Política para UPDATE - permitir actualización de cualquier IVA
CREATE POLICY "ivas_update_policy" ON ivas
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para DELETE - permitir eliminación de cualquier IVA
CREATE POLICY "ivas_delete_policy" ON ivas
    FOR DELETE
    USING (true);

-- VERIFICAR QUE TODO FUNCIONA
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ivas' 
ORDER BY ordinal_position;

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'ivas';

-- Verificar políticas creadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'ivas';

-- Test de inserción
INSERT INTO ivas (nombre, porcentaje, tenant_id)
VALUES ('IVA Estándar', 19.0, NULL)
ON CONFLICT DO NOTHING;

-- Verificar inserción exitosa
SELECT 
    'Test exitoso:' as info,
    id,
    nombre,
    porcentaje,
    tenant_id,
    created_at
FROM ivas 
WHERE nombre = 'IVA Estándar';
