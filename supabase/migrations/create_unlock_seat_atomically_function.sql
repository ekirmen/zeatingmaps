-- =====================================================
-- CREAR FUNCIÓN RPC unlock_seat_atomically
-- Desbloquea un asiento de forma atómica
-- =====================================================

-- Eliminar todas las versiones de la función si existen (para poder recrearla)
-- Primero, eliminar todas las sobrecargas posibles
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Eliminar todas las funciones con este nombre sin importar los argumentos
  FOR r IN 
    SELECT 
      p.oid::regprocedure AS func
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'unlock_seat_atomically'
      AND n.nspname = 'public'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func || ' CASCADE';
  END LOOP;
END $$;

-- Crear la función unlock_seat_atomically
CREATE OR REPLACE FUNCTION public.unlock_seat_atomically(
  p_seat_id TEXT,
  p_funcion_id INTEGER,
  p_session_id TEXT
)
RETURNS TABLE (
  id UUID,
  seat_id TEXT,
  funcion_id INTEGER,
  session_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_session_id UUID;
  v_existing_lock RECORD;
BEGIN
  -- Validar que session_id no sea NULL o vacío
  IF p_session_id IS NULL OR p_session_id = '' OR trim(p_session_id) = '' THEN
    RAISE EXCEPTION 'session_id no puede ser NULL o vacío' 
      USING ERRCODE = 'P0004';
  END IF;

  -- Convertir session_id de TEXT a UUID con validación estricta
  DECLARE
    cleaned_session_id TEXT;
  BEGIN
    -- Limpiar el valor: eliminar espacios y caracteres invisibles
    cleaned_session_id := trim(regexp_replace(p_session_id, '[[:space:]]+', '', 'g'));
    
    -- Intentar convertir a UUID
    v_session_id := cleaned_session_id::UUID;
    
    -- Validar que el UUID no sea todo ceros (NULL UUID)
    IF v_session_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
      RAISE EXCEPTION 'session_id no puede ser un UUID nulo (todo ceros)' 
        USING ERRCODE = 'P0005';
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'session_id debe ser un UUID válido. Valor recibido: %', p_session_id 
      USING ERRCODE = 'P0006';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al convertir session_id a UUID: %', SQLERRM 
      USING ERRCODE = 'P0007';
  END;
  
  -- Obtener tenant_id del contexto
  v_tenant_id := current_setting('app.tenant_id', true)::UUID;
  
  -- Si no hay tenant_id en el contexto, intentar obtenerlo de alguna tabla relacionada
  IF v_tenant_id IS NULL THEN
    SELECT f.tenant_id INTO v_tenant_id
    FROM public.funciones f
    WHERE f.id = p_funcion_id
    LIMIT 1;
  END IF;
  
  -- Si aún no hay tenant_id, usar un valor por defecto
  IF v_tenant_id IS NULL THEN
    v_tenant_id := '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::UUID;
  END IF;
  
  -- Buscar el lock activo
  SELECT sl.* INTO v_existing_lock
  FROM public.seat_locks sl
  WHERE sl.seat_id = p_seat_id
    AND sl.funcion_id = p_funcion_id
    AND sl.tenant_id = v_tenant_id
    AND sl.session_id = v_session_id
    AND sl.expires_at > NOW()
    AND sl.status NOT IN ('liberado', 'expirado', 'pagado', 'vendido')
  ORDER BY sl.locked_at DESC
  LIMIT 1;
  
  -- Si no existe el lock o no es del usuario actual
  IF v_existing_lock IS NULL THEN
    RAISE EXCEPTION 'No puedes desbloquear un asiento que no seleccionaste' 
      USING ERRCODE = 'P0002';
  END IF;
  
  -- Si el asiento ya está pagado
  IF v_existing_lock.status IN ('pagado', 'vendido') THEN
    RAISE EXCEPTION 'No se puede desbloquear un asiento ya pagado' 
      USING ERRCODE = 'P0003';
  END IF;
  
  -- Actualizar el status a 'liberado'
  UPDATE public.seat_locks sl
  SET 
    status = 'liberado',
    expires_at = NOW(),
    updated_at = NOW()
  WHERE sl.id = v_existing_lock.id;
  
  -- Retornar el lock actualizado
  RETURN QUERY SELECT 
    v_existing_lock.id,
    v_existing_lock.seat_id,
    v_existing_lock.funcion_id,
    v_existing_lock.session_id,
    'liberado'::TEXT;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.unlock_seat_atomically(
  p_seat_id TEXT,
  p_funcion_id INTEGER,
  p_session_id TEXT
) TO authenticated, anon;

-- Comentario para documentación
COMMENT ON FUNCTION public.unlock_seat_atomically IS 
  'Desbloquea un asiento de forma atómica. 
   Solo permite desbloquear asientos que fueron bloqueados por el mismo usuario/sesión.
   No permite desbloquear asientos ya pagados.';

