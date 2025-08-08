-- 🔧 Arreglar Políticas RLS para Funciones
-- Este script verifica y arregla las políticas RLS que están bloqueando la lectura

-- =====================================================
-- VERIFICAR POLÍTICAS RLS ACTUALES
-- =====================================================

-- Mostrar políticas actuales de funciones
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
WHERE tablename = 'funciones';

-- =====================================================
-- VERIFICAR FUNCIONES EXISTENTES
-- =====================================================

-- Mostrar todas las funciones del tenant
SELECT 
    'FUNCIONES EXISTENTES' as tipo,
    f.id,
    f.evento,
    f.tenant_id,
    f.fecha_celebracion,
    e.nombre as evento_nombre,
    s.nombre as sala_nombre
FROM funciones f
LEFT JOIN eventos e ON f.evento = e.id
LEFT JOIN salas s ON f.sala = s.id
WHERE f.tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc'
ORDER BY f.fecha_celebracion;

-- =====================================================
-- ELIMINAR POLÍTICAS RLS PROBLEMÁTICAS
-- =====================================================

-- Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can view funciones from their tenant" ON funciones;
DROP POLICY IF EXISTS "Users can insert funciones for their tenant" ON funciones;
DROP POLICY IF EXISTS "Users can update funciones from their tenant" ON funciones;
DROP POLICY IF EXISTS "Users can delete funciones from their tenant" ON funciones;

-- =====================================================
-- CREAR NUEVAS POLÍTICAS RLS CORRECTAS
-- =====================================================

-- Política para lectura (SELECT)
CREATE POLICY "Users can view funciones from their tenant" ON funciones
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles 
        WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants 
        WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
);

-- Política para inserción (INSERT)
CREATE POLICY "Users can insert funciones for their tenant" ON funciones
FOR INSERT WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM profiles 
        WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants 
        WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
);

-- Política para actualización (UPDATE)
CREATE POLICY "Users can update funciones from their tenant" ON funciones
FOR UPDATE USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles 
        WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants 
        WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
);

-- Política para eliminación (DELETE)
CREATE POLICY "Users can delete funciones from their tenant" ON funciones
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles 
        WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants 
        WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
);

-- =====================================================
-- VERIFICAR POLÍTICAS CREADAS
-- =====================================================

-- Mostrar políticas después de la creación
SELECT 
    'POLÍTICAS CREADAS' as tipo,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'funciones'
ORDER BY policyname;

-- =====================================================
-- PRUEBA DE LECTURA DIRECTA
-- =====================================================

-- Probar lectura directa de funciones
SELECT 
    'PRUEBA LECTURA' as tipo,
    COUNT(*) as total_funciones,
    COUNT(DISTINCT evento) as eventos_con_funciones
FROM funciones 
WHERE tenant_id = '2b86dc35-49ad-43ea-a50d-a14c55a327cc';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto arreglará las políticas RLS que están bloqueando la lectura
3. Después, prueba nuevamente en el store

RESULTADO ESPERADO:
- Las políticas RLS deberían permitir lectura de funciones
- El frontend debería poder ver las funciones
- El store debería mostrar las funciones disponibles
*/
