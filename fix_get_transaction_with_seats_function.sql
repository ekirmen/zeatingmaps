-- =====================================================
-- CORREGIR FUNCIÓN get_transaction_with_seats
-- =====================================================

-- Eliminar posibles versiones anteriores
DROP FUNCTION IF EXISTS public.get_transaction_with_seats(text);
DROP FUNCTION IF EXISTS public.get_transaction_with_seats(text, text);

-- Crear la función corregida con compatibilidad de parámetros
CREATE OR REPLACE FUNCTION public.get_transaction_with_seats(
    locator_param text DEFAULT NULL,
    transaction_locator text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_locator text := COALESCE(NULLIF(transaction_locator, ''), NULLIF(locator_param, ''));
    result jsonb;
    transaction_record record;
    seats_data jsonb;
BEGIN
    IF v_locator IS NULL THEN
        RETURN NULL;
    END IF;

    -- Obtener la transacción más reciente asociada al locator (o order_id como respaldo)
    SELECT pt.*, u.email AS user_email, u.created_at AS user_created_at
    INTO transaction_record
    FROM payment_transactions pt
    LEFT JOIN auth.users u ON u.id = pt.user_id
    WHERE pt.locator = v_locator OR pt.order_id = v_locator
    ORDER BY pt.created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Obtener los asientos bloqueados asociados al locator
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
                'zona_nombre', sl.zona_nombre,
                'precio', sl.precio,
                'session_id', sl.session_id,
                'metadata', sl.metadata
            )
            ORDER BY sl.created_at
        ),
        '[]'::jsonb
    ) INTO seats_data
    FROM seat_locks sl
    WHERE sl.locator = v_locator;

    -- Construir el resultado como JSONB
    result := jsonb_build_object(
        'transaction', jsonb_build_object(
            'id', transaction_record.id,
            'order_id', transaction_record.order_id,
            'gateway_id', transaction_record.gateway_id,
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
            'monto', COALESCE(transaction_record.monto, transaction_record.amount),
            'usuario_id', transaction_record.usuario_id,
            'event', transaction_record.event,
            'funcion', transaction_record.funcion,
            'processed_by', transaction_record.processed_by,
            'payment_gateway_id', transaction_record.payment_gateway_id,
            'fecha', COALESCE(transaction_record.fecha, transaction_record.created_at),
            'payments', transaction_record.payments,
            'referrer', transaction_record.referrer,
            'discountCode', transaction_record."discountCode",
            'reservationDeadline', transaction_record."reservationDeadline",
            'user', transaction_record."user",
            'user_data', CASE
                WHEN transaction_record.user_id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', transaction_record.user_id,
                        'email', transaction_record.user_email,
                        'created_at', transaction_record.user_created_at
                    )
                ELSE NULL
            END
        ),
        'seats', seats_data
    );

    RETURN result;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.get_transaction_with_seats(text, text) TO anon, authenticated, service_role;

-- Verificar que la función se creó correctamente
SELECT
    'get_transaction_with_seats' as funcion,
    'Función corregida exitosamente' as estado;
