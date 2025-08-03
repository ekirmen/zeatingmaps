-- Script para insertar datos de prueba en payment_transactions
-- =====================================================

-- Primero, asegurarnos de que tenemos algunos eventos
INSERT INTO eventos (id, nombre, descripcion, fecha_inicio, fecha_fin, estado) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Concierto de Rock', 'Gran concierto de rock en vivo', '2024-12-15 20:00:00', '2024-12-15 23:00:00', 'activo'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Teatro Clásico', 'Obra de teatro clásica', '2024-12-20 19:00:00', '2024-12-20 22:00:00', 'activo'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Festival de Jazz', 'Festival de jazz al aire libre', '2024-12-25 18:00:00', '2024-12-25 23:00:00', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Insertar payment gateways si no existen
INSERT INTO payment_gateways (id, name, type, config, active) VALUES 
    ('550e8400-e29b-41d4-a716-446655440004', 'Stripe', 'stripe', '{"api_key": "test_key"}', true),
    ('550e8400-e29b-41d4-a716-446655440005', 'PayPal', 'paypal', '{"client_id": "test_id"}', true),
    ('550e8400-e29b-41d4-a716-446655440006', 'Mercado Pago', 'mercadopago', '{"access_token": "test_token"}', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar datos de prueba en payment_transactions
INSERT INTO payment_transactions (
    id,
    amount,
    currency,
    status,
    payment_gateway_id,
    evento_id,
    user_id,
    transaction_data,
    created_at,
    updated_at
) VALUES 
    -- Transacciones completadas recientes
    ('550e8400-e29b-41d4-a716-446655440007', 150.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"ticket_count": 2, "seats": ["A1", "A2"]}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    
    ('550e8400-e29b-41d4-a716-446655440008', 75.50, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', NULL, '{"ticket_count": 1, "seats": ["B5"]}', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
    
    ('550e8400-e29b-41d4-a716-446655440009', 200.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', NULL, '{"ticket_count": 4, "seats": ["C1", "C2", "C3", "C4"]}', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
    
    ('550e8400-e29b-41d4-a716-446655440010', 120.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"ticket_count": 3, "seats": ["D1", "D2", "D3"]}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    
    ('550e8400-e29b-41d4-a716-446655440011', 45.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', NULL, '{"ticket_count": 1, "seats": ["E7"]}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    
    -- Transacciones de esta semana
    ('550e8400-e29b-41d4-a716-446655440012', 180.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', NULL, '{"ticket_count": 2, "seats": ["F1", "F2"]}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    
    ('550e8400-e29b-41d4-a716-446655440013', 90.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"ticket_count": 2, "seats": ["G3", "G4"]}', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
    
    ('550e8400-e29b-41d4-a716-446655440014', 300.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', NULL, '{"ticket_count": 6, "seats": ["H1", "H2", "H3", "H4", "H5", "H6"]}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    
    -- Transacciones de este mes
    ('550e8400-e29b-41d4-a716-446655440015', 150.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', NULL, '{"ticket_count": 3, "seats": ["I1", "I2", "I3"]}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    
    ('550e8400-e29b-41d4-a716-446655440016', 75.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"ticket_count": 1, "seats": ["J8"]}', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
    
    ('550e8400-e29b-41d4-a716-446655440017', 240.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', NULL, '{"ticket_count": 4, "seats": ["K1", "K2", "K3", "K4"]}', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
    
    ('550e8400-e29b-41d4-a716-446655440018', 120.00, 'USD', 'completed', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', NULL, '{"ticket_count": 2, "seats": ["L5", "L6"]}', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
    
    -- Transacciones pendientes
    ('550e8400-e29b-41d4-a716-446655440019', 85.00, 'USD', 'pending', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"ticket_count": 2, "seats": ["M1", "M2"]}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
    
    ('550e8400-e29b-41d4-a716-446655440020', 60.00, 'USD', 'pending', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', NULL, '{"ticket_count": 1, "seats": ["N3"]}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
    
    -- Transacciones fallidas
    ('550e8400-e29b-41d4-a716-446655440021', 100.00, 'USD', 'failed', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', NULL, '{"ticket_count": 2, "seats": ["O1", "O2"], "error": "Insufficient funds"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    
    ('550e8400-e29b-41d4-a716-446655440022', 45.00, 'USD', 'failed', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NULL, '{"ticket_count": 1, "seats": ["P7"], "error": "Card declined"}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Insertar algunos productos de prueba si no existen
INSERT INTO productos (id, nombre, descripcion, precio, categoria, stock_disponible, activo) VALUES 
    ('550e8400-e29b-41d4-a716-446655440023', 'Camiseta del Evento', 'Camiseta oficial del evento con diseño exclusivo', 25.00, 'Merchandising', 100, true),
    ('550e8400-e29b-41d4-a716-446655440024', 'Poster Autografiado', 'Poster del evento autografiado por los artistas', 15.00, 'Merchandising', 50, true),
    ('550e8400-e29b-41d4-a716-446655440025', 'Programa del Evento', 'Programa oficial con información detallada', 5.00, 'Información', 200, true),
    ('550e8400-e29b-41d4-a716-446655440026', 'Pack VIP', 'Pack exclusivo con camiseta, poster y programa', 40.00, 'Pack', 25, true)
ON CONFLICT (id) DO NOTHING;

-- Insertar relaciones productos-eventos
INSERT INTO productos_eventos (producto_id, evento_id, precio_especial, stock_disponible, activo) VALUES 
    ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001', 30.00, 50, true),
    ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440001', 20.00, 25, true),
    ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 7.00, 100, true),
    ('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 50.00, 10, true)
ON CONFLICT (producto_id, evento_id) DO NOTHING;

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
    'productos' as tabla,
    COUNT(*) as registros,
    'Productos disponibles' as descripcion
FROM productos
UNION ALL
SELECT 
    'productos_eventos' as tabla,
    COUNT(*) as registros,
    'Relaciones productos-eventos' as descripcion
FROM productos_eventos
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
    SUM(amount) as total_amount,
    AVG(amount) as promedio_amount
FROM payment_transactions 
GROUP BY status
ORDER BY cantidad DESC; 