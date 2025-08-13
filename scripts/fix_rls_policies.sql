-- Script para arreglar políticas RLS con problemas de tipos
-- Ejecutar en Supabase SQL Editor DESPUÉS de verificar con check_missing_tenant_id.sql

-- 1. Función helper para obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Intentar obtener tenant_id del JWT
    RETURN (auth.jwt() ->> 'tenant_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        -- Si falla, intentar obtener del perfil del usuario
        RETURN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función helper para verificar si el usuario tiene acceso al tenant
CREATE OR REPLACE FUNCTION user_has_tenant_access(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Usuario autenticado puede acceder a su propio tenant
    RETURN get_current_user_tenant_id() = tenant_uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Arreglar política para recintos (ejemplo)
-- Primero eliminar política existente si existe
DROP POLICY IF EXISTS "Users can view own tenant recintos" ON recintos;

-- Crear nueva política con tipos correctos
CREATE POLICY "Users can view own tenant recintos" ON recintos
FOR SELECT USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can insert own tenant recintos" ON recintos
FOR INSERT WITH CHECK (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can update own tenant recintos" ON recintos
FOR UPDATE USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can delete own tenant recintos" ON recintos
FOR DELETE USING (
    user_has_tenant_access(tenant_id)
);

-- 4. Arreglar política para eventos
DROP POLICY IF EXISTS "Users can view own tenant eventos" ON eventos;

CREATE POLICY "Users can view own tenant eventos" ON eventos
FOR SELECT USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can insert own tenant eventos" ON eventos
FOR INSERT WITH CHECK (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can update own tenant eventos" ON eventos
FOR UPDATE USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can delete own tenant eventos" ON eventos
FOR DELETE USING (
    user_has_tenant_access(tenant_id)
);

-- 5. Arreglar política para perfiles
DROP POLICY IF EXISTS "Users can view own tenant profiles" ON profiles;

CREATE POLICY "Users can view own tenant profiles" ON profiles
FOR SELECT USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can insert own tenant profiles" ON profiles
FOR INSERT WITH CHECK (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can update own tenant profiles" ON profiles
FOR UPDATE USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can delete own tenant profiles" ON profiles
FOR DELETE USING (
    user_has_tenant_access(tenant_id)
);

-- 6. Arreglar política para productos
DROP POLICY IF EXISTS "Users can view own tenant productos" ON productos;

CREATE POLICY "Users can view own tenant productos" ON productos
FOR SELECT USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can insert own tenant productos" ON productos
FOR INSERT WITH CHECK (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can update own tenant productos" ON productos
FOR UPDATE USING (
    user_has_tenant_access(tenant_id)
);

CREATE POLICY "Users can delete own tenant productos" ON productos
FOR DELETE USING (
    user_has_tenant_access(tenant_id)
);

-- 7. Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('recintos', 'eventos', 'profiles', 'productos')
ORDER BY tablename, policyname;
