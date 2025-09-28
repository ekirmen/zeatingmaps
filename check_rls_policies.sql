-- Script para verificar y arreglar las políticas RLS de la tabla mapas
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Verificar las políticas RLS actuales en mapas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'mapas';

-- 2. Verificar si RLS está habilitado en mapas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'mapas';

-- 3. Probar acceso directo al mapa sin RLS (como superusuario)
SELECT 
    'Acceso directo' as test,
    id,
    sala_id,
    nombre,
    estado,
    tenant_id
FROM public.mapas 
WHERE sala_id = 52;

-- 4. Verificar el tenant_id del usuario actual
SELECT 
    'Usuario actual' as test,
    auth.uid() as user_id,
    auth.jwt() ->> 'tenant_id' as tenant_id_from_jwt;

-- 5. Crear una política RLS más permisiva para mapas
DROP POLICY IF EXISTS "mapas_tenant_access" ON public.mapas;
DROP POLICY IF EXISTS "mapas_authenticated_access" ON public.mapas;

-- Política para usuarios autenticados
CREATE POLICY "mapas_authenticated_access" ON public.mapas
    FOR ALL TO authenticated
    USING (true);

-- Política para acceso anónimo (si es necesario)
CREATE POLICY "mapas_anonymous_access" ON public.mapas
    FOR SELECT TO anon
    USING (true);

-- 6. Verificar que las políticas se crearon
SELECT 
    'Políticas creadas' as test,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'mapas';

-- 7. Probar acceso después de crear las políticas
SELECT 
    'Prueba después de políticas' as test,
    COUNT(*) as total_mapas,
    COUNT(CASE WHEN sala_id = 52 THEN 1 END) as mapas_sala_52
FROM public.mapas;
