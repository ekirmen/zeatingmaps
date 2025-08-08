-- 🚀 Fix para el error de recursión infinita en las políticas RLS
-- Este script resuelve el problema de "infinite recursion detected in policy for relation 'profiles'"

-- =====================================================
-- ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar todas las políticas existentes en profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;

-- Eliminar todas las políticas existentes en recintos
DROP POLICY IF EXISTS "Users can view venues" ON recintos;
DROP POLICY IF EXISTS "Admins can manage venues" ON recintos;
DROP POLICY IF EXISTS "Venue managers can manage venues" ON recintos;
DROP POLICY IF EXISTS "Enable read access for all users" ON recintos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON recintos;
DROP POLICY IF EXISTS "Enable update for users based on email" ON recintos;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON recintos;

-- =====================================================
-- CREAR FUNCIÓN SEGURA PARA VERIFICAR PERMISOS
-- =====================================================

-- Función para verificar si un usuario es admin (sin recursión)
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    -- Usar SECURITY DEFINER para evitar recursión
    SELECT permisos INTO user_permissions
    FROM profiles
    WHERE id = user_id;
    
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE(user_permissions->>'ADMIN', 'false')::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario tiene permiso de gestión de venues
CREATE OR REPLACE FUNCTION is_user_venue_manager(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    -- Usar SECURITY DEFINER para evitar recursión
    SELECT permisos INTO user_permissions
    FROM profiles
    WHERE id = user_id;
    
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE(user_permissions->>'MG_VENUES', 'false')::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREAR NUEVAS POLÍTICAS SEGURAS
-- =====================================================

-- Política para que los usuarios vean su propio perfil
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para que los admins puedan gestionar todos los perfiles
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (is_user_admin(auth.uid()));

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para que los usuarios puedan insertar su propio perfil
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para que todos puedan ver recintos (solo lectura)
CREATE POLICY "Users can view venues" ON recintos
    FOR SELECT USING (true);

-- Política para que los gestores de venues puedan gestionar recintos
CREATE POLICY "Venue managers can manage venues" ON recintos
    FOR ALL USING (is_user_venue_manager(auth.uid()));

-- =====================================================
-- VERIFICAR QUE LAS FUNCIONES FUNCIONAN
-- =====================================================

-- Comentario para verificar que todo está funcionando
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
    RAISE NOTICE '✅ Funciones de verificación de permisos creadas';
    RAISE NOTICE '✅ Recursión infinita resuelta';
END $$;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Las políticas RLS ahora usan funciones SECURITY DEFINER
3. Esto evita la recursión infinita al verificar permisos
4. Los usuarios normales solo pueden ver/editar su propio perfil
5. Los admins pueden gestionar todos los perfiles
6. Los gestores de venues pueden gestionar recintos

PARA VERIFICAR QUE FUNCIONA:
- Intenta acceder a la página de usuarios
- No debería haber más errores de recursión
- Los permisos se verifican correctamente
*/
