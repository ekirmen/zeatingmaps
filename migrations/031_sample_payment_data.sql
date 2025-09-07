-- Sample Data for Payments, Seat_Locks, and Payment_Transactions
-- This migration creates realistic sample data for testing

-- Insert sample payment gateways first
INSERT INTO public.payment_gateways (id, name, type, is_active, config, tenant_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Stripe', 'stripe', true, '{"api_key": "sk_test_...", "webhook_secret": "whsec_..."}', 
     (SELECT id FROM tenants LIMIT 1)),
    ('550e8400-e29b-41d4-a716-446655440002', 'PayPal', 'paypal', true, '{"client_id": "A...", "client_secret": "E..."}', 
     (SELECT id FROM tenants LIMIT 1)),
    ('550e8400-e29b-41d4-a716-446655440003', 'Pago Móvil', 'pago_movil', true, '{"phone": "+584121234567"}', 
     (SELECT id FROM tenants LIMIT 1)),
    ('550e8400-e29b-41d4-a716-446655440004', 'Transferencia', 'transferencia', true, '{"bank": "Banco de Venezuela", "account": "0102-1234-5678-9012"}', 
     (SELECT id FROM tenants LIMIT 1)),
    ('550e8400-e29b-41d4-a716-446655440005', 'Efectivo', 'efectivo', true, '{"location": "Taquilla principal"}', 
     (SELECT id FROM tenants LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Insert sample payments
INSERT INTO public.payments (
    id, usuario_id, processed_by, monto, fecha, event, funcion, locator, 
    payments, seats, status, referrer, "discountCode", "reservationDeadline",
    "user", user_id, tenant_id, payment_gateway_id
)
VALUES 
    -- Payment 1: Completed payment with multiple seats
    ('660e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM profiles LIMIT 1),
     (SELECT id FROM profiles LIMIT 1),
     150.00, 
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'ORDER-1757188217466-13JDY4E5F',
     '{"method": "stripe", "transaction_id": "pi_1234567890", "status": "succeeded"}',
     '[{"id": "silla_1755825682843_5", "row": "Mesa1", "seat": 5, "price": 75.00}, {"id": "silla_1755825682843_6", "row": "Mesa1", "seat": 6, "price": 75.00}]',
     'pagado',
     'https://sistema.veneventos.com/store',
     null,
     null,
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM tenants LIMIT 1),
     '550e8400-e29b-41d4-a716-446655440001'
    ),
    
    -- Payment 2: Reserved payment (expires in 24 hours)
    ('660e8400-e29b-41d4-a716-446655440002',
     (SELECT id FROM profiles LIMIT 1),
     null,
     100.00,
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'ORDER-1757188217467-24KDY5F6G',
     '{"method": "paypal", "transaction_id": "PAY-1234567890", "status": "pending"}',
     '[{"id": "silla_1755825693223_11", "row": "Mesa2", "seat": 11, "price": 100.00}]',
     'reservado',
     'https://sistema.veneventos.com/store',
     'DESCUENTO10',
     CURRENT_TIMESTAMP + INTERVAL '24 hours',
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM tenants LIMIT 1),
     '550e8400-e29b-41d4-a716-446655440002'
    ),
    
    -- Payment 3: Failed payment
    ('660e8400-e29b-41d4-a716-446655440003',
     (SELECT id FROM profiles LIMIT 1),
     null,
     50.00,
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'ORDER-1757188217468-35LEY6G7H',
     '{"method": "stripe", "transaction_id": "pi_0987654321", "status": "failed", "error": "insufficient_funds"}',
     '[{"id": "silla_1755825708784_17", "row": "FilaA", "seat": 17, "price": 50.00}]',
     'fallido',
     'https://sistema.veneventos.com/store',
     null,
     null,
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM tenants LIMIT 1),
     '550e8400-e29b-41d4-a716-446655440001'
    ),
    
    -- Payment 4: Cash payment
    ('660e8400-e29b-41d4-a716-446655440004',
     (SELECT id FROM profiles LIMIT 1),
     (SELECT id FROM profiles LIMIT 1),
     200.00,
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'ORDER-1757188217469-46MFZ7H8I',
     '{"method": "efectivo", "transaction_id": "CASH-001", "status": "completed"}',
     '[{"id": "silla_1755825693223_9", "row": "Mesa2", "seat": 9, "price": 100.00}, {"id": "silla_1755825693223_10", "row": "Mesa2", "seat": 10, "price": 100.00}]',
     'pagado',
     'https://sistema.veneventos.com/store',
     null,
     null,
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM tenants LIMIT 1),
     '550e8400-e29b-41d4-a716-446655440005'
    ),
    
    -- Payment 5: Mobile payment
    ('660e8400-e29b-41d4-a716-446655440005',
     (SELECT id FROM profiles LIMIT 1),
     null,
     75.00,
     CURRENT_TIMESTAMP - INTERVAL '15 minutes',
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'ORDER-1757188217470-57NGZ8I9J',
     '{"method": "pago_movil", "transaction_id": "PM-001", "status": "pending"}',
     '[{"id": "silla_1755825708784_19", "row": "FilaA", "seat": 19, "price": 75.00}]',
     'pendiente',
     'https://sistema.veneventos.com/store',
     null,
     null,
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM tenants LIMIT 1),
     '550e8400-e29b-41d4-a716-446655440003'
    )
ON CONFLICT (id) DO NOTHING;

-- First, ensure seat_locks table has all necessary columns
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'user_id') THEN
        ALTER TABLE public.seat_locks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add tenant_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.seat_locks ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'status') THEN
        ALTER TABLE public.seat_locks ADD COLUMN status VARCHAR(50) DEFAULT 'available';
    END IF;
    
    -- Add locator column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'locator') THEN
        ALTER TABLE public.seat_locks ADD COLUMN locator VARCHAR(255);
    END IF;
    
    -- Add locked_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'locked_at') THEN
        ALTER TABLE public.seat_locks ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'expires_at') THEN
        ALTER TABLE public.seat_locks ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Remove NOT NULL constraint from expires_at if it exists (sold seats don't expire)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'seat_locks' AND column_name = 'expires_at' AND is_nullable = 'NO') THEN
        ALTER TABLE public.seat_locks ALTER COLUMN expires_at DROP NOT NULL;
    END IF;
    
    -- Remove NOT NULL constraint from session_id if it exists (available seats don't have sessions)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'seat_locks' AND column_name = 'session_id' AND is_nullable = 'NO') THEN
        ALTER TABLE public.seat_locks ALTER COLUMN session_id DROP NOT NULL;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'created_at') THEN
        ALTER TABLE public.seat_locks ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seat_locks' AND column_name = 'updated_at') THEN
        ALTER TABLE public.seat_locks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Insert sample seat_locks with different statuses using real seat IDs from the map
INSERT INTO public.seat_locks (
    id, funcion_id, seat_id, session_id, user_id, status, locator, 
    locked_at, expires_at, tenant_id, created_at, updated_at
)
VALUES 
    -- Selected by current user (status: 'selected') - Mesa 1 sillas 1 y 2
    ('770e8400-e29b-41d4-a716-446655440001',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_1',
     'session_current_user_123',
     (SELECT id FROM auth.users LIMIT 1),
     'selected',
     'TEMP-SELECT-001',
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '15 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440002',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_2',
     'session_current_user_123',
     (SELECT id FROM auth.users LIMIT 1),
     'selected',
     'TEMP-SELECT-002',
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '15 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    -- Selected by other users (status: 'blocked') - Mesa 1 sillas 3 y 4
    ('770e8400-e29b-41d4-a716-446655440003',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_3',
     'session_other_user_456',
     (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
     'blocked',
     'TEMP-BLOCK-001',
     CURRENT_TIMESTAMP - INTERVAL '5 minutes',
     CURRENT_TIMESTAMP + INTERVAL '10 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '5 minutes',
     CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    ),
    
    ('770e8400-e29b-41d4-a716-446655440004',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_4',
     'session_other_user_789',
     (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 2),
     'blocked',
     'TEMP-BLOCK-002',
     CURRENT_TIMESTAMP - INTERVAL '3 minutes',
     CURRENT_TIMESTAMP + INTERVAL '12 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '3 minutes',
     CURRENT_TIMESTAMP - INTERVAL '3 minutes'
    ),
    
    -- Sold seats (status: 'sold') - Mesa 1 sillas 5 y 6
    ('770e8400-e29b-41d4-a716-446655440005',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_5',
     'session_sold_user_001',
     (SELECT id FROM auth.users LIMIT 1),
     'sold',
     'ORDER-1757188217466-13JDY4E5F',
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     CURRENT_TIMESTAMP - INTERVAL '2 hours'
    ),
    
    ('770e8400-e29b-41d4-a716-446655440006',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_6',
     'session_sold_user_001',
     (SELECT id FROM auth.users LIMIT 1),
     'sold',
     'ORDER-1757188217466-13JDY4E5F',
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     CURRENT_TIMESTAMP - INTERVAL '2 hours'
    ),
    
    -- Sold seats (status: 'sold') - Mesa 2 sillas 9 y 10
    ('770e8400-e29b-41d4-a716-446655440007',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_9',
     'session_sold_user_002',
     (SELECT id FROM auth.users LIMIT 1),
     'sold',
     'ORDER-1757188217469-46MFZ7H8I',
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     CURRENT_TIMESTAMP - INTERVAL '3 hours'
    ),
    
    ('770e8400-e29b-41d4-a716-446655440008',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_10',
     'session_sold_user_002',
     (SELECT id FROM auth.users LIMIT 1),
     'sold',
     'ORDER-1757188217469-46MFZ7H8I',
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     CURRENT_TIMESTAMP - INTERVAL '3 hours'
    ),
    
    -- Reserved seats (status: 'reserved') - Mesa 2 sillas 11 y 12
    ('770e8400-e29b-41d4-a716-446655440009',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_11',
     'session_reserved_user_003',
     (SELECT id FROM auth.users LIMIT 1),
     'reserved',
     'ORDER-1757188217467-24KDY5F6G',
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     CURRENT_TIMESTAMP + INTERVAL '23 hours',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ),
    
    ('770e8400-e29b-41d4-a716-446655440010',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_12',
     'session_reserved_user_004',
     (SELECT id FROM auth.users LIMIT 1),
     'reserved',
     'ORDER-1757188217470-57NGZ8I9J',
     CURRENT_TIMESTAMP - INTERVAL '15 minutes',
     CURRENT_TIMESTAMP + INTERVAL '23 hours 45 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '15 minutes',
     CURRENT_TIMESTAMP - INTERVAL '15 minutes'
    ),
    
    -- Blocked seats (status: 'blocked') - Mesa 2 sillas 13 y 14
    ('770e8400-e29b-41d4-a716-446655440011',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_13',
     'session_blocked_user_005',
     (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 3),
     'blocked',
     'TEMP-BLOCK-003',
     CURRENT_TIMESTAMP - INTERVAL '2 minutes',
     CURRENT_TIMESTAMP + INTERVAL '13 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '2 minutes',
     CURRENT_TIMESTAMP - INTERVAL '2 minutes'
    ),
    
    ('770e8400-e29b-41d4-a716-446655440012',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_14',
     'session_blocked_user_006',
     (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 4),
     'blocked',
     'TEMP-BLOCK-004',
     CURRENT_TIMESTAMP - INTERVAL '1 minute',
     CURRENT_TIMESTAMP + INTERVAL '14 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '1 minute',
     CURRENT_TIMESTAMP - INTERVAL '1 minute'
    ),
    
    -- Sold seats (status: 'sold') - Fila A sillas 17 y 18
    ('770e8400-e29b-41d4-a716-446655440013',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_17',
     'session_sold_user_007',
     (SELECT id FROM auth.users LIMIT 1),
     'sold',
     'ORDER-1757188217471-68OHZ9J0K',
     CURRENT_TIMESTAMP - INTERVAL '45 minutes',
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '45 minutes',
     CURRENT_TIMESTAMP - INTERVAL '45 minutes'
    ),
    
    ('770e8400-e29b-41d4-a716-446655440014',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_18',
     'session_sold_user_007',
     (SELECT id FROM auth.users LIMIT 1),
     'sold',
     'ORDER-1757188217471-68OHZ9J0K',
     CURRENT_TIMESTAMP - INTERVAL '45 minutes',
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '45 minutes',
     CURRENT_TIMESTAMP - INTERVAL '45 minutes'
    ),
    
    -- Reserved seats (status: 'reserved') - Fila A sillas 19 y 20
    ('770e8400-e29b-41d4-a716-446655440015',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_19',
     'session_reserved_user_008',
     (SELECT id FROM auth.users LIMIT 1),
     'reserved',
     'ORDER-1757188217472-79PIZ0K1L',
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     CURRENT_TIMESTAMP + INTERVAL '23 hours 30 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     CURRENT_TIMESTAMP - INTERVAL '30 minutes'
    ),
    
    ('770e8400-e29b-41d4-a716-446655440016',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_20',
     'session_reserved_user_008',
     (SELECT id FROM auth.users LIMIT 1),
     'reserved',
     'ORDER-1757188217472-79PIZ0K1L',
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     CURRENT_TIMESTAMP + INTERVAL '23 hours 30 minutes',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     CURRENT_TIMESTAMP - INTERVAL '30 minutes'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample payment_transactions
INSERT INTO public.payment_transactions (
    id, order_id, gateway_id, amount, currency, status, gateway_transaction_id, 
    gateway_response, created_at, updated_at, locator, tenant_id, user_id, 
    evento_id, funcion_id, payment_method, gateway_name
)
VALUES 
    -- Transaction 1: Successful Stripe payment
    ('880e8400-e29b-41d4-a716-446655440001',
     'ORDER-1757188217466-13JDY4E5F',
     '550e8400-e29b-41d4-a716-446655440001',
     150.00,
     'USD',
     'completed',
     'pi_1234567890',
     '{"id": "pi_1234567890", "status": "succeeded", "amount": 15000, "currency": "usd"}',
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     CURRENT_TIMESTAMP - INTERVAL '2 hours',
     'ORDER-1757188217466-13JDY4E5F',
     (SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'stripe',
     'Stripe'
    ),
    
    -- Transaction 2: Pending PayPal payment
    ('880e8400-e29b-41d4-a716-446655440002',
     'ORDER-1757188217467-24KDY5F6G',
     '550e8400-e29b-41d4-a716-446655440002',
     100.00,
     'USD',
     'pending',
     'PAY-1234567890',
     '{"id": "PAY-1234567890", "status": "pending", "amount": 10000, "currency": "usd"}',
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     CURRENT_TIMESTAMP - INTERVAL '1 hour',
     'ORDER-1757188217467-24KDY5F6G',
     (SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'paypal',
     'PayPal'
    ),
    
    -- Transaction 3: Failed Stripe payment
    ('880e8400-e29b-41d4-a716-446655440003',
     'ORDER-1757188217468-35LEY6G7H',
     '550e8400-e29b-41d4-a716-446655440001',
     50.00,
     'USD',
     'failed',
     'pi_0987654321',
     '{"id": "pi_0987654321", "status": "failed", "error": {"code": "insufficient_funds", "message": "Your card has insufficient funds."}}',
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     CURRENT_TIMESTAMP - INTERVAL '30 minutes',
     'ORDER-1757188217468-35LEY6G7H',
     (SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'stripe',
     'Stripe'
    ),
    
    -- Transaction 4: Completed cash payment
    ('880e8400-e29b-41d4-a716-446655440004',
     'ORDER-1757188217469-46MFZ7H8I',
     '550e8400-e29b-41d4-a716-446655440005',
     200.00,
     'USD',
     'completed',
     'CASH-001',
     '{"method": "efectivo", "transaction_id": "CASH-001", "status": "completed", "amount": 20000, "currency": "usd"}',
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     CURRENT_TIMESTAMP - INTERVAL '3 hours',
     'ORDER-1757188217469-46MFZ7H8I',
     (SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'efectivo',
     'Efectivo'
    ),
    
    -- Transaction 5: Pending mobile payment
    ('880e8400-e29b-41d4-a716-446655440005',
     'ORDER-1757188217470-57NGZ8I9J',
     '550e8400-e29b-41d4-a716-446655440003',
     75.00,
     'USD',
     'pending',
     'PM-001',
     '{"method": "pago_movil", "transaction_id": "PM-001", "status": "pending", "amount": 7500, "currency": "usd"}',
     CURRENT_TIMESTAMP - INTERVAL '15 minutes',
     CURRENT_TIMESTAMP - INTERVAL '15 minutes',
     'ORDER-1757188217470-57NGZ8I9J',
     (SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'pago_movil',
     'Pago Móvil'
    ),
    
    -- Transaction 6: Transfer payment
    ('880e8400-e29b-41d4-a716-446655440006',
     'ORDER-1757188217471-68OHZ9J0K',
     '550e8400-e29b-41d4-a716-446655440004',
     120.00,
     'USD',
     'completed',
     'TRANSFER-001',
     '{"method": "transferencia", "transaction_id": "TRANSFER-001", "status": "completed", "amount": 12000, "currency": "usd"}',
     CURRENT_TIMESTAMP - INTERVAL '45 minutes',
     CURRENT_TIMESTAMP - INTERVAL '45 minutes',
     'ORDER-1757188217471-68OHZ9J0K',
     (SELECT id FROM tenants LIMIT 1),
     (SELECT id FROM auth.users LIMIT 1),
     (SELECT id FROM eventos LIMIT 1),
     (SELECT id FROM funciones LIMIT 1),
     'transferencia',
     'Transferencia'
    )
ON CONFLICT (id) DO NOTHING;

-- Create some additional seat locks for different scenarios using real seat IDs
-- (Columns already ensured to exist from previous section)
INSERT INTO public.seat_locks (
    id, funcion_id, seat_id, session_id, user_id, status, locator, 
    locked_at, expires_at, tenant_id, created_at, updated_at
)
VALUES 
    -- Available seats (these will show as available in the UI)
    -- Mesa 1 sillas 7 y 8 (available)
    ('770e8400-e29b-41d4-a716-446655440017',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_7',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440018',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825682843_8',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    -- Mesa 2 sillas 15 y 16 (available)
    ('770e8400-e29b-41d4-a716-446655440019',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_15',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440020',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825693223_16',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    -- Fila A sillas 21, 22, 23 (available)
    ('770e8400-e29b-41d4-a716-446655440021',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_21',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440022',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_22',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440023',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_23',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    -- Fila A sillas 24, 25, 26 (available)
    ('770e8400-e29b-41d4-a716-446655440024',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_24',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440025',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_25',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440026',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825708784_26',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    -- Fila A superior sillas 27, 28, 29 (available)
    ('770e8400-e29b-41d4-a716-446655440027',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723768_27',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440028',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723768_28',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440029',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_29',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    -- Fila A superior sillas 30, 31, 32 (available)
    ('770e8400-e29b-41d4-a716-446655440030',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_30',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440031',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_31',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440032',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_32',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    -- Fila A superior sillas 33, 34, 35, 36 (available)
    ('770e8400-e29b-41d4-a716-446655440033',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_33',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440034',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_34',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440035',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_35',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    ),
    
    ('770e8400-e29b-41d4-a716-446655440036',
     (SELECT id FROM funciones LIMIT 1),
     'silla_1755825723769_36',
     'session_available_seats',
     null,
     'available',
     null,
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP + INTERVAL '100 years',
     (SELECT id FROM tenants LIMIT 1),
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

-- Add a comment explaining the data
COMMENT ON TABLE public.payments IS 'Sample payments with different statuses: pagado, reservado, fallido, pendiente';
COMMENT ON TABLE public.seat_locks IS 'Sample seat locks with statuses: available, selected, blocked, sold, reserved';
COMMENT ON TABLE public.payment_transactions IS 'Sample payment transactions linked to payments and gateways';
