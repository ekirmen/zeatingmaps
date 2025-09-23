-- Script para crear/arreglar políticas RLS en seat_locks
-- Ejecutar en Supabase SQL Editor

-- 1. Habilitar RLS en seat_locks si no está habilitado
ALTER TABLE seat_locks ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes si las hay (para recrearlas)
DROP POLICY IF EXISTS "seat_locks_select_policy" ON seat_locks;
DROP POLICY IF EXISTS "seat_locks_insert_policy" ON seat_locks;
DROP POLICY IF EXISTS "seat_locks_update_policy" ON seat_locks;
DROP POLICY IF EXISTS "seat_locks_delete_policy" ON seat_locks;

-- 3. Crear políticas RLS para seat_locks

-- Política para SELECT: Permitir leer todos los locks de la función
CREATE POLICY "seat_locks_select_policy" ON seat_locks
    FOR SELECT
    USING (true);

-- Política para INSERT: Permitir insertar locks para cualquier usuario
CREATE POLICY "seat_locks_insert_policy" ON seat_locks
    FOR INSERT
    WITH CHECK (true);

-- Política para UPDATE: Permitir actualizar locks (para cambios de estado)
CREATE POLICY "seat_locks_update_policy" ON seat_locks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para DELETE: Permitir eliminar locks (para liberar asientos)
CREATE POLICY "seat_locks_delete_policy" ON seat_locks
    FOR DELETE
    USING (true);

-- 4. Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'seat_locks'
ORDER BY policyname;

-- 5. Verificar permisos
SELECT 
    has_table_privilege('anon', 'seat_locks', 'SELECT') as anon_can_select,
    has_table_privilege('anon', 'seat_locks', 'INSERT') as anon_can_insert,
    has_table_privilege('anon', 'seat_locks', 'UPDATE') as anon_can_update,
    has_table_privilege('anon', 'seat_locks', 'DELETE') as anon_can_delete,
    has_table_privilege('authenticated', 'seat_locks', 'SELECT') as auth_can_select,
    has_table_privilege('authenticated', 'seat_locks', 'INSERT') as auth_can_insert,
    has_table_privilege('authenticated', 'seat_locks', 'UPDATE') as auth_can_update,
    has_table_privilege('authenticated', 'seat_locks', 'DELETE') as auth_can_delete;
