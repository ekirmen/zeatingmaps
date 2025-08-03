-- Script para insertar datos limpios (SOLO COLUMNAS BÁSICAS)
-- =====================================================

-- Insertar datos de configuración básica (SOLO key y value)
INSERT INTO settings (key, value) VALUES 
    ('site_name', 'Mi Sistema de Eventos'),
    ('site_description', 'Sistema de gestión de eventos y boletería'),
    ('default_currency', 'USD'),
    ('timezone', 'America/Mexico_City')
ON CONFLICT (key) DO NOTHING;

-- Insertar algunos productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, categoria, stock_disponible, activo) VALUES 
    ('Camiseta del Evento', 'Camiseta oficial del evento con diseño exclusivo', 25.00, 'Merchandising', 100, true),
    ('Poster Autografiado', 'Poster del evento autografiado por los artistas', 15.00, 'Merchandising', 50, true),
    ('Programa del Evento', 'Programa oficial con información detallada', 5.00, 'Información', 200, true),
    ('Pack VIP', 'Pack exclusivo con camiseta, poster y programa', 40.00, 'Pack', 25, true)
ON CONFLICT DO NOTHING;

-- Insertar algunas notificaciones de admin
INSERT INTO admin_notifications (title, message, type, read) VALUES 
    ('Sistema configurado', 'El sistema ha sido configurado correctamente', 'success', false),
    ('Productos disponibles', 'Se han agregado productos de ejemplo al sistema', 'info', false),
    ('Configuración completada', 'La configuración básica del sistema está lista', 'info', true)
ON CONFLICT DO NOTHING;

-- Mostrar resumen de datos insertados
SELECT 
    'DATOS INSERTADOS' as categoria,
    'settings' as tabla,
    COUNT(*) as registros
FROM settings
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'productos' as tabla,
    COUNT(*) as registros
FROM productos
UNION ALL
SELECT 
    'DATOS INSERTADOS' as categoria,
    'admin_notifications' as tabla,
    COUNT(*) as registros
FROM admin_notifications;

-- Verificar que las tablas críticas existen
SELECT 
    'TABLAS CRÍTICAS' as categoria,
    table_name,
    'EXISTE' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN (
    'admin_notifications',
    'payment_gateways',
    'settings',
    'productos',
    'plantillas_productos',
    'productos_eventos',
    'plantillas_productos_eventos'
)
ORDER BY table_name; 