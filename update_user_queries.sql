-- 🔧 Update User Queries to Handle Email
-- Este script actualiza las consultas para manejar el email correctamente

-- =====================================================
-- VERIFICAR ESTRUCTURA DE AUTH.USERS
-- =====================================================

-- Verificar estructura de auth.users
SELECT 
    'ESTRUCTURA AUTH.USERS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR ESTRUCTURA DE PROFILES
-- =====================================================

-- Verificar estructura de profiles
SELECT 
    'ESTRUCTURA PROFILES' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- CREAR FUNCIÓN PARA OBTENER EMAIL DE USUARIO
-- =====================================================

-- Crear función para obtener email de usuario
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT email 
        FROM auth.users 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREAR VISTA PARA USUARIOS CON EMAIL
-- =====================================================

-- Crear vista que combine profiles con email de auth.users
CREATE OR REPLACE VIEW users_with_email AS
SELECT 
    p.*,
    COALESCE(p.email, u.email) as email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- =====================================================
-- VERIFICAR DATOS DE USUARIOS
-- =====================================================

-- Mostrar algunos usuarios con email
SELECT 
    'USUARIOS CON EMAIL' as tipo,
    id,
    nombre,
    apellido,
    email,
    telefono
FROM users_with_email 
LIMIT 5;

-- =====================================================
-- VERIFICAR FUNCIÓN
-- =====================================================

-- Probar la función get_user_email
SELECT 
    'FUNCIÓN GET_USER_EMAIL' as tipo,
    id,
    nombre,
    get_user_email(id) as email_from_function
FROM profiles 
LIMIT 3;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará una función para obtener email de auth.users
3. Creará una vista que combine profiles con email
4. Verificará que todo funcione correctamente

RESULTADO ESPERADO:
- Función get_user_email creada
- Vista users_with_email creada
- Datos de usuarios con email mostrados
- Función probada correctamente
*/
