-- Script para insertar SOLO transacciones y notificaciones
-- =====================================================

-- Insertar datos de prueba en payment_transactions (solo columnas básicas)
INSERT INTO payment_transactions (
    id,
    amount,
    currency,
    status,
    created_at,
    updated_at
) VALUES 
    -- Transacciones completadas recientes
    ('550e8400-e29b-41d4-a716-446655440007', 150.00, 'USD', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    ('550e8400-e29b-41d4-a716-446655440008', 75.50, 'USD', 'completed', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
    ('550e8400-e29b-41d4-a716-446655440009', 200.00, 'USD', 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
    ('550e8400-e29b-41d4-a716-446655440010', 120.00, 'USD', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('550e8400-e29b-41d4-a716-446655440011', 45.00, 'USD', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    
    -- Transacciones de esta semana
    ('550e8400-e29b-41d4-a716-446655440012', 180.00, 'USD', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('550e8400-e29b-41d4-a716-446655440013', 90.00, 'USD', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
    ('550e8400-e29b-41d4-a716-446655440014', 300.00, 'USD', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    
    -- Transacciones de este mes
    ('550e8400-e29b-41d4-a716-446655440015', 150.00, 'USD', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('550e8400-e29b-41d4-a716-446655440016', 75.00, 'USD', 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
    ('550e8400-e29b-41d4-a716-446655440017', 240.00, 'USD', 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
    ('550e8400-e29b-41d4-a716-446655440018', 120.00, 'USD', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
    
    -- Transacciones pendientes
    ('550e8400-e29b-41d4-a716-446655440019', 85.00, 'USD', 'pending', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
    ('550e8400-e29b-41d4-a716-446655440020', 60.00, 'USD', 'pending', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
    
    -- Transacciones fallidas
    ('550e8400-e29b-41d4-a716-446655440021', 100.00, 'USD', 'failed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    ('550e8400-e29b-41d4-a716-446655440022', 45.00, 'USD', 'failed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Insertar algunas notificaciones de admin
INSERT INTO admin_notifications (title, message, type, read) VALUES 
    ('Nueva venta realizada', 'Se ha vendido 1 ticket para "Concierto de Rock"', 'success', false),
    ('Pago pendiente', 'Hay 2 transacciones pendientes de confirmación', 'warning', false),
    ('Stock bajo', 'El producto "Camiseta del Evento" tiene stock bajo', 'info', false),
    ('Evento próximo', 'El evento "Teatro Clásico" comienza en 2 horas', 'info', true)
ON CONFLICT DO NOTHING;

-- Mostrar resumen de datos insertados
SELECT 
    'payment_transactions' as tabla,
    COUNT(*) as registros,
    'Transacciones de pago' as descripcion
FROM payment_transactions
UNION ALL
SELECT 
    'admin_notifications' as tabla,
    COUNT(*) as registros,
    'Notificaciones de admin' as descripcion
FROM admin_notifications;

-- Mostrar estadísticas de transacciones
SELECT 
    status,
    COUNT(*) as cantidad,
    ROUND(SUM(amount), 2) as total_amount,
    ROUND(AVG(amount), 2) as promedio_amount
FROM payment_transactions 
GROUP BY status
ORDER BY cantidad DESC; 