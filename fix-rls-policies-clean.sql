-- fix-rls-policies-clean.sql
-- Limpia y recrea todas las políticas RLS para resolver el error "app.tenant_id"

-- 1. Deshabilitar RLS temporalmente en todas las tablas
ALTER TABLE recintos DISABLE ROW LEVEL SECURITY;
ALTER TABLE salas DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE funciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes (limpieza completa)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON recintos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON recintos;
DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON recintos;
DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON recintos;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON salas;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON salas;
DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON salas;
DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON salas;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON eventos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON eventos;
DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON eventos;
DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON eventos;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON funciones;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON funciones;
DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON funciones;
DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON funciones;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON profiles;

-- 3. Verificar que no hay políticas residuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('recintos', 'salas', 'eventos', 'funciones', 'profiles');

-- 4. Habilitar RLS nuevamente
ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas SIMPLES y CORRECTAS
-- Política para recintos
CREATE POLICY "recintos_tenant_isolation" ON recintos
    FOR ALL USING (
        tenant_id = (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Política para salas
CREATE POLICY "salas_tenant_isolation" ON salas
    FOR ALL USING (
        recinto_id IN (
            SELECT id FROM recintos 
            WHERE tenant_id = (
                SELECT tenant_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Política para eventos
CREATE POLICY "eventos_tenant_isolation" ON eventos
    FOR ALL USING (
        recinto_id IN (
            SELECT id FROM recintos 
            WHERE tenant_id = (
                SELECT tenant_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Política para funciones
CREATE POLICY "funciones_tenant_isolation" ON funciones
    FOR ALL USING (
        evento_id IN (
            SELECT id FROM eventos 
            WHERE recinto_id IN (
                SELECT id FROM recintos 
                WHERE tenant_id = (
                    SELECT tenant_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )
        )
    );

-- Política para profiles (solo su propio perfil)
CREATE POLICY "profiles_own_data" ON profiles
    FOR ALL USING (id = auth.uid());

-- 6. Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('recintos', 'salas', 'eventos', 'funciones', 'profiles');

-- 7. Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('recintos', 'salas', 'eventos', 'funciones', 'profiles');
