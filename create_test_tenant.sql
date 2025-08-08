-- 🚀 Crear Tenant de Prueba para zeatingmaps
-- Este script crea un tenant de prueba para el subdominio zeatingmaps

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
)
ON CONFLICT (subdomain) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    plan_type = EXCLUDED.plan_type,
    status = EXCLUDED.status,
    max_users = EXCLUDED.max_users,
    max_events = EXCLUDED.max_events,
    updated_at = NOW();

-- =====================================================
-- CREAR EVENTO DE PRUEBA
-- =====================================================

-- Insertar evento de prueba
INSERT INTO eventos (
    id,
    nombre,
    slug,
    fecha_evento,
    activo,
    oculto,
    tenant_id,
    created_at
)
SELECT 
    gen_random_uuid(),
    'Evento de Prueba ZeatingMaps',
    'evento-prueba-zeatingmaps',
    NOW() + INTERVAL '30 days',
    true,
    false,
    t.id,
    NOW()
FROM tenants t
WHERE t.subdomain = 'zeatingmaps'
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- CREAR RECINTO DE PRUEBA
-- =====================================================

-- Insertar recinto de prueba
INSERT INTO recintos (
    id,
    nombre,
    direccion,
    ciudad,
    estado,
    pais,
    capacidad,
    tenant_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Estadio de Prueba ZeatingMaps',
    'Av. Principal 123',
    'Caracas',
    'Distrito Capital',
    'Venezuela',
    5000,
    t.id,
    NOW(),
    NOW()
FROM tenants t
WHERE t.subdomain = 'zeatingmaps'
ON CONFLICT DO NOTHING;

-- =====================================================
-- CREAR SALA DE PRUEBA
-- =====================================================

-- Insertar sala de prueba
INSERT INTO salas (
    id,
    nombre,
    capacidad,
    recinto_id,
    tenant_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Sala Principal',
    2000,
    r.id,
    t.id,
    NOW(),
    NOW()
FROM tenants t
JOIN recintos r ON r.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps'
ON CONFLICT DO NOTHING;

-- =====================================================
-- CREAR FUNCIÓN DE PRUEBA
-- =====================================================

-- Insertar función de prueba
INSERT INTO funciones (
    id,
    nombre,
    fecha,
    hora,
    evento_id,
    sala_id,
    tenant_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Función Principal',
    NOW() + INTERVAL '30 days',
    '20:00:00',
    e.id,
    s.id,
    t.id,
    NOW(),
    NOW()
FROM tenants t
JOIN eventos e ON e.tenant_id = t.id
JOIN salas s ON s.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps'
  AND e.slug = 'evento-prueba-zeatingmaps'
  AND s.nombre = 'Sala Principal'
ON CONFLICT DO NOTHING;

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

-- Verificar evento creado
SELECT 
    'EVENTO' as tipo,
    e.id,
    e.nombre,
    e.slug,
    e.fecha_evento,
    e.activo
FROM eventos e
JOIN tenants t ON e.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- Verificar recinto creado
SELECT 
    'RECINTO' as tipo,
    r.id,
    r.nombre,
    r.capacidad,
    r.ciudad
FROM recintos r
JOIN tenants t ON r.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- Verificar sala creada
SELECT 
    'SALA' as tipo,
    s.id,
    s.nombre,
    s.capacidad,
    r.nombre as recinto
FROM salas s
JOIN recintos r ON s.recinto_id = r.id
JOIN tenants t ON s.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- Verificar función creada
SELECT 
    'FUNCIÓN' as tipo,
    f.id,
    f.nombre,
    f.fecha,
    f.hora,
    e.nombre as evento,
    s.nombre as sala
FROM funciones f
JOIN eventos e ON f.evento_id = e.id
JOIN salas s ON f.sala_id = s.id
JOIN tenants t ON f.tenant_id = t.id
WHERE t.subdomain = 'zeatingmaps';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará un tenant de prueba para el subdominio 'zeatingmaps'
3. También creará un evento, recinto, sala y función de prueba
4. Verifica que puedas acceder a https://zeatingmaps-ekirmens-projects.vercel.app/store

PARA VERIFICAR QUE FUNCIONA:
- Ve a https://zeatingmaps-ekirmens-projects.vercel.app/store
- Deberías ver el evento de prueba
- Deberías poder acceder a las funciones

DATOS DE PRUEBA CREADOS:
- Tenant: ZeatingMaps Test Company (subdomain: zeatingmaps)
- Evento: Evento de Prueba ZeatingMaps
- Recinto: Estadio de Prueba ZeatingMaps
- Sala: Sala Principal
- Función: Función Principal (30 días en el futuro)
*/
