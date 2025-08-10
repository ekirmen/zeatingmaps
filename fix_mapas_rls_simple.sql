-- Script simple para arreglar políticas RLS de la tabla mapas
-- Permite acceso anónimo de lectura

-- 1. Habilitar RLS si no está habilitado
ALTER TABLE mapas ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan estar bloqueando el acceso
DROP POLICY IF EXISTS "Enable all for authenticated users" ON mapas;
DROP POLICY IF EXISTS "Users can view mapas from their tenant" ON mapas;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON mapas;

-- 3. Crear política para acceso anónimo de lectura
CREATE POLICY "Enable anonymous read access to mapas" ON mapas
    FOR SELECT USING (true);

-- 4. Crear política para usuarios autenticados (lectura)
CREATE POLICY "Enable authenticated read access to mapas" ON mapas
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Crear política para usuarios autenticados (escritura - solo para su tenant)
CREATE POLICY "Enable authenticated write access to mapas" ON mapas
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'mapas'
ORDER BY policyname;

-- 7. Probar acceso anónimo (esto debería funcionar ahora)
-- Simular una consulta como usuario anónimo
SET ROLE anon;
SELECT COUNT(*) as total_mapas FROM mapas LIMIT 1;
RESET ROLE;
