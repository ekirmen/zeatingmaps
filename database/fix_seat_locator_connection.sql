-- =====================================================
-- CONECTAR ASIENTOS CON LOCALIZADOR
-- =====================================================

-- Agregar columna locator a seat_locks si no existe
ALTER TABLE seat_locks ADD COLUMN IF NOT EXISTS locator VARCHAR(255);

-- Agregar columna user_id a seat_locks si no existe
ALTER TABLE seat_locks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Crear índice para locator en seat_locks
CREATE INDEX IF NOT EXISTS idx_seat_locks_locator ON seat_locks(locator);

-- Crear índice para user_id en seat_locks
CREATE INDEX IF NOT EXISTS idx_seat_locks_user_id ON seat_locks(user_id);

-- =====================================================
-- FUNCIÓN PARA CONECTAR ASIENTOS CON LOCALIZADOR
-- =====================================================

-- Función para conectar asientos bloqueados con transacciones de pago
CREATE OR REPLACE FUNCTION connect_seats_with_locator()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  seat_record RECORD;
  transaction_record RECORD;
BEGIN
  -- Para cada asiento bloqueado sin locator
  FOR seat_record IN 
    SELECT * FROM seat_locks 
    WHERE locator IS NULL 
    AND status = 'seleccionado'
    AND user_id IS NOT NULL
    ORDER BY created_at DESC
  LOOP
    -- Buscar la transacción de pago más reciente del mismo usuario y función
    SELECT * INTO transaction_record
    FROM payment_transactions 
    WHERE user_id = seat_record.user_id 
    AND funcion_id = seat_record.funcion_id
    AND locator IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Si encontramos una transacción, actualizar el asiento
    IF transaction_record.id IS NOT NULL THEN
      UPDATE seat_locks 
      SET locator = transaction_record.locator
      WHERE id = seat_record.id;
      
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA OBTENER ASIENTOS POR LOCALIZADOR
-- =====================================================

-- Función para obtener asientos de una transacción por locator
CREATE OR REPLACE FUNCTION get_seats_by_locator(locator_param VARCHAR(255))
RETURNS TABLE (
  seat_id VARCHAR(255),
  table_id VARCHAR(255),
  funcion_id INTEGER,
  status VARCHAR(50),
  locked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.seat_id,
    sl.table_id,
    sl.funcion_id,
    sl.status,
    sl.locked_at,
    sl.expires_at
  FROM seat_locks sl
  WHERE sl.locator = locator_param
  ORDER BY sl.created_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA OBTENER TRANSACCIÓN CON ASIENTOS
-- =====================================================

-- Función para obtener transacción con sus asientos
CREATE OR REPLACE FUNCTION get_transaction_with_seats(locator_param VARCHAR(255))
RETURNS JSON AS $$
DECLARE
  result JSON;
  transaction_data RECORD;
  seats_data JSON;
BEGIN
  -- Obtener datos de la transacción
  SELECT * INTO transaction_data
  FROM payment_transactions 
  WHERE locator = locator_param
  LIMIT 1;
  
  -- Obtener asientos como JSON
  SELECT json_agg(
    json_build_object(
      'seat_id', seat_id,
      'table_id', table_id,
      'funcion_id', funcion_id,
      'status', status,
      'locked_at', locked_at,
      'expires_at', expires_at
    )
  ) INTO seats_data
  FROM seat_locks 
  WHERE locator = locator_param;
  
  -- Construir resultado
  IF transaction_data.id IS NOT NULL THEN
    result := json_build_object(
      'transaction', json_build_object(
        'id', transaction_data.id,
        'order_id', transaction_data.order_id,
        'amount', transaction_data.amount,
        'currency', transaction_data.currency,
        'status', transaction_data.status,
        'payment_method', transaction_data.payment_method,
        'gateway_name', transaction_data.gateway_name,
        'created_at', transaction_data.created_at,
        'locator', transaction_data.locator
      ),
      'seats', COALESCE(seats_data, '[]'::json)
    );
  ELSE
    result := json_build_object(
      'transaction', null,
      'seats', '[]'::json
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EJECUTAR CONEXIÓN DE ASIENTOS
-- =====================================================

-- Conectar asientos existentes con sus transacciones
SELECT connect_seats_with_locator() as connected_seats;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Verificar asientos con locator
SELECT 
  seat_id,
  locator,
  status,
  user_id,
  created_at
FROM seat_locks 
WHERE locator IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Verificar transacciones con asientos
SELECT 
  pt.locator,
  pt.amount,
  pt.status,
  pt.created_at,
  COUNT(sl.seat_id) as seat_count
FROM payment_transactions pt
LEFT JOIN seat_locks sl ON pt.locator = sl.locator
GROUP BY pt.locator, pt.amount, pt.status, pt.created_at
ORDER BY pt.created_at DESC
LIMIT 10;
