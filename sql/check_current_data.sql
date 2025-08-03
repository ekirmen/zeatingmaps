-- Script para verificar el estado actual de los datos
-- =====================================================

-- Verificar tablas existentes y sus registros
SELECT 
    schemaname,
    tablename,
    n_tup_ins as registros_insertados,
    n_tup_upd as registros_actualizados,
    n_tup_del as registros_eliminados
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar registros en tablas principales
SELECT 
    'eventos' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos
FROM eventos
UNION ALL
SELECT 
    'payment_transactions' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas
FROM payment_transactions
UNION ALL
SELECT 
    'productos' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN activo = true THEN 1 END) as activos
FROM productos
UNION ALL
SELECT 
    'payment_gateways' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN active = true THEN 1 END) as activos
FROM payment_gateways
UNION ALL
SELECT 
    'admin_notifications' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN read = false THEN 1 END) as no_leidas
FROM admin_notifications;

-- Verificar transacciones por estado
SELECT 
    status,
    COUNT(*) as cantidad,
    ROUND(SUM(amount), 2) as total_amount,
    ROUND(AVG(amount), 2) as promedio_amount,
    MIN(created_at) as primera_transaccion,
    MAX(created_at) as ultima_transaccion
FROM payment_transactions 
GROUP BY status
ORDER BY cantidad DESC;

-- Verificar transacciones por gateway
SELECT 
    pg.name as gateway_name,
    COUNT(pt.id) as transacciones,
    ROUND(SUM(pt.amount), 2) as total_amount,
    ROUND(AVG(pt.amount), 2) as promedio_amount
FROM payment_transactions pt
LEFT JOIN payment_gateways pg ON pt.payment_gateway_id = pg.id
GROUP BY pg.name, pg.id
ORDER BY transacciones DESC;

-- Verificar transacciones por evento
SELECT 
    e.nombre as evento_nombre,
    COUNT(pt.id) as transacciones,
    ROUND(SUM(pt.amount), 2) as total_amount,
    ROUND(AVG(pt.amount), 2) as promedio_amount
FROM payment_transactions pt
LEFT JOIN eventos e ON pt.evento_id = e.id
GROUP BY e.nombre, e.id
ORDER BY transacciones DESC;

-- Verificar productos por categoría
SELECT 
    categoria,
    COUNT(*) as cantidad_productos,
    ROUND(AVG(precio), 2) as precio_promedio,
    SUM(stock_disponible) as stock_total
FROM productos
WHERE activo = true
GROUP BY categoria
ORDER BY cantidad_productos DESC;

-- Verificar relaciones productos-eventos
SELECT 
    e.nombre as evento,
    p.nombre as producto,
    pe.precio_especial,
    pe.stock_disponible,
    pe.activo
FROM productos_eventos pe
JOIN productos p ON pe.producto_id = p.id
JOIN eventos e ON pe.evento_id = e.id
ORDER BY e.nombre, p.nombre;

-- Verificar notificaciones recientes
SELECT 
    title,
    message,
    type,
    read,
    created_at
FROM admin_notifications
ORDER BY created_at DESC
LIMIT 10;

-- Resumen general
SELECT 
    'RESUMEN GENERAL' as seccion,
    'Total de transacciones: ' || (SELECT COUNT(*) FROM payment_transactions) as info
UNION ALL
SELECT 
    'RESUMEN GENERAL',
    'Transacciones completadas: ' || (SELECT COUNT(*) FROM payment_transactions WHERE status = 'completed')
UNION ALL
SELECT 
    'RESUMEN GENERAL',
    'Total ingresos: $' || (SELECT ROUND(SUM(amount), 2) FROM payment_transactions WHERE status = 'completed')
UNION ALL
SELECT 
    'RESUMEN GENERAL',
    'Productos activos: ' || (SELECT COUNT(*) FROM productos WHERE activo = true)
UNION ALL
SELECT 
    'RESUMEN GENERAL',
    'Eventos activos: ' || (SELECT COUNT(*) FROM eventos WHERE estado = 'activo'); 