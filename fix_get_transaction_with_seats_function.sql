-- =====================================================
-- CORREGIR FUNCIÓN get_transaction_with_seats
-- =====================================================

-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS get_transaction_with_seats(text);

-- Crear la función corregida
CREATE OR REPLACE FUNCTION get_transaction_with_seats(transaction_locator text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    transaction_record record;
    seats_data jsonb;
BEGIN
    -- Obtener la transacción
    SELECT * INTO transaction_record
    FROM payment_transactions
    WHERE locator = transaction_locator
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Obtener los asientos bloqueados asociados
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', sl.id,
                'seat_id', sl.seat_id,
                'table_id', sl.table_id,
                'funcion_id', sl.funcion_id,
                'locked_at', sl.locked_at,
                'expires_at', sl.expires_at,
                'status', sl.status,
                'lock_type', sl.lock_type,
                'created_at', sl.created_at,
                'tenant_id', sl.tenant_id,
                'locator', sl.locator,
                'user_id', sl.user_id,
                'updated_at', sl.updated_at,
                'zona_id', sl.zona_id,
                'session_id', sl.session_id
            )
        ),
        '[]'::jsonb
    ) INTO seats_data
    FROM seat_locks sl
    WHERE sl.locator = transaction_locator;

    -- Construir el resultado como JSONB
    result := jsonb_build_object(
        'transaction', jsonb_build_object(
            'id', transaction_record.id,
            'order_id', transaction_record.order_id,
            'gateway_id', transaction_record.payment_gateway_id,
            'amount', transaction_record.amount,
            'currency', transaction_record.currency,
            'status', transaction_record.status,
            'gateway_transaction_id', transaction_record.gateway_transaction_id,
            'gateway_response', transaction_record.gateway_response,
            'created_at', transaction_record.created_at,
            'updated_at', transaction_record.updated_at,
            'user_id', transaction_record.user_id,
            'evento_id', transaction_record.evento_id,
            'tenant_id', transaction_record.tenant_id,
            'locator', transaction_record.locator,
            'funcion_id', transaction_record.funcion_id,
            'payment_method', transaction_record.payment_method,
            'gateway_name', transaction_record.gateway_name,
            'seats', transaction_record.seats,
            'monto', transaction_record.amount,
            'usuario_id', transaction_record.usuario_id,
            'event', transaction_record.event,
            'funcion', transaction_record.funcion,
            'processed_by', transaction_record.processed_by,
            'payment_gateway_id', transaction_record.payment_gateway_id,
            'fecha', transaction_record.created_at,
            'payments', transaction_record.payments,
            'referrer', transaction_record.referrer,
            'discountCode', transaction_record."discountCode",
            'reservationDeadline', transaction_record."reservationDeadline",
            'user_data', CASE 
                WHEN transaction_record.user_id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', transaction_record.user_id,
                        'email', (SELECT email FROM auth.users WHERE id = transaction_record.user_id),
                        'created_at', (SELECT created_at FROM auth.users WHERE id = transaction_record.user_id)
                    )
                ELSE NULL
            END
        ),
        'seats', seats_data
    );

    RETURN result;
END;
$$;

-- Verificar que la función se creó correctamente
SELECT 
    'get_transaction_with_seats' as funcion,
    'Función corregida exitosamente' as estado;
