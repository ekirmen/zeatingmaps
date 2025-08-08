-- 🚀 Setup Simple para Pruebas
-- Este script crea solo lo básico para probar la aplicación

-- =====================================================
-- CREAR TENANT DE PRUEBA
-- =====================================================

-- Insertar tenant de prueba para zeatingmaps
INSERT INTO tenants (
    id,
    company_name,
    subdomain,
    contact_email,
    plan_type,
    status,
    max_users,
    max_events,
    created_at,
    updated_at,
    settings,
    billing_info,
    primary_color,
    secondary_color
)
VALUES (
    gen_random_uuid(),
    'ZeatingMaps Test Company',
    'zeatingmaps',
    'admin@zeatingmaps.com',
    'premium',
    'active',
    50,
    200,
    NOW(),
    NOW(),
    '{}'::jsonb,
    '{}'::jsonb,
    '#1890ff',
    '#52c41a'
);

-- =====================================================
-- VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================

-- Verificar estructura de eventos
SELECT 
    'EVENTOS' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;

-- Verificar estructura de recintos
SELECT 
    'RECINTOS' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recintos' 
ORDER BY ordinal_position;

-- Verificar estructura de funciones (si existe)
SELECT 
    'FUNCIONES' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'funciones' 
ORDER BY ordinal_position;

-- =====================================================
-- CREAR RECINTO BÁSICO
-- =====================================================

-- Insertar recinto básico
INSERT INTO recintos (
    nombre,
    direccion,
    ciudad,
    estado,
    pais,
    capacidad
)
VALUES (
    'Estadio de Prueba',
    'Av. Principal 123',
    'Caracas',
    'Distrito Capital',
    'Venezuela',
    5000
);

-- =====================================================
-- CREAR EVENTO BÁSICO
-- =====================================================

-- Insertar evento básico con recinto
INSERT INTO eventos (
    id,
    nombre,
    slug,
    fecha_evento,
    activo,
    oculto,
    recinto,
    created_at
)
SELECT 
    gen_random_uuid(),
    'Evento de Prueba ZeatingMaps',
    'evento-prueba-zeatingmaps',
    NOW() + INTERVAL '30 days',
    true,
    false,
    r.id,
    NOW()
FROM recintos r
WHERE r.nombre = 'Estadio de Prueba'
LIMIT 1;

-- =====================================================
-- VERIFICAR DATOS CREADOS
-- =====================================================

-- Verificar tenant creado
SELECT 
    'TENANT' as tipo,
    id,
    company_name,
    subdomain,
    contact_email,
    status
FROM tenants 
WHERE subdomain = 'zeatingmaps';

-- Verificar recinto creado
SELECT 
    'RECINTO' as tipo,
    id,
    nombre,
    capacidad,
    ciudad
FROM recintos 
WHERE nombre = 'Estadio de Prueba';

-- Verificar evento creado
SELECT 
    'EVENTO' as tipo,
    id,
    nombre,
    slug,
    fecha_evento,
    activo,
    recinto
FROM eventos 
WHERE slug = 'evento-prueba-zeatingmaps';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará el tenant, recinto y evento básico
3. Verifica que puedas acceder a https://zeatingmaps-ekirmens-projects.vercel.app/store

PARA VERIFICAR QUE FUNCIONA:
- Ve a https://zeatingmaps-ekirmens-projects.vercel.app/store
- Deberías ver el evento de prueba
- Si hay errores, revisa la estructura de las tablas mostrada

DATOS DE PRUEBA CREADOS:
- Tenant: ZeatingMaps Test Company (subdomain: zeatingmaps)
- Recinto: Estadio de Prueba
- Evento: Evento de Prueba ZeatingMaps

PRÓXIMOS PASOS:
1. Si funciona, podemos agregar más datos
2. Si no funciona, revisar la estructura de las tablas
*/
