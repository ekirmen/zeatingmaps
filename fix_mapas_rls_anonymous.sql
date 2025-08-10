-- Script para agregar políticas RLS que permitan acceso anónimo a mapas
-- Mantiene la seguridad para operaciones de escritura

-- 1. Verificar el estado actual de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'mapas';

-- 2. Verificar políticas existentes
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
WHERE tablename = 'mapas';

-- 3. Agregar política para acceso anónimo de lectura
DO $$
BEGIN
    -- Verificar si la política ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mapas' 
        AND policyname = 'Enable anonymous read access to mapas'
    ) THEN
        -- Crear política para acceso anónimo de lectura
        CREATE POLICY "Enable anonymous read access to mapas" ON mapas
            FOR SELECT USING (true);
        
        RAISE NOTICE 'Política de acceso anónimo de lectura creada exitosamente';
    ELSE
        RAISE NOTICE 'La política de acceso anónimo de lectura ya existe';
    END IF;
END $$;

-- 4. Verificar que RLS esté habilitado
ALTER TABLE mapas ENABLE ROW LEVEL SECURITY;

-- 5. Verificar el estado final de las políticas
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
WHERE tablename = 'mapas'
ORDER BY policyname;

-- 6. Probar acceso anónimo (esto debería funcionar ahora)
-- Simular una consulta como usuario anónimo
SET ROLE anon;
SELECT COUNT(*) as total_mapas FROM mapas LIMIT 1;
RESET ROLE;

-- 7. Verificar que las políticas de escritura sigan funcionando para usuarios autenticados
-- (Esto se puede probar manualmente desde la aplicación)
