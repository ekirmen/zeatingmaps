-- =====================================================
-- CREAR FUNCIÓN RPC lock_seat_atomically
-- Bloquea un asiento de forma atómica, previniendo condiciones de carrera
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
    WHERE p.proname = 'lock_seat_atomically'
      AND n.nspname = 'public'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func || ' CASCADE';
  END LOOP;
END $$;

-- Crear la función lock_seat_atomically
CREATE OR REPLACE FUNCTION public.lock_seat_atomically(
  p_seat_id TEXT,
  p_funcion_id INTEGER,
  p_session_id TEXT,
  p_status TEXT DEFAULT 'seleccionado'
)
RETURNS TABLE (
  id UUID,
  seat_id TEXT,
  funcion_id INTEGER,
  session_id UUID,
  locked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT,
  lock_type TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_session_id UUID;
  v_existing_lock RECORD;
  v_locator TEXT;
  v_expires_at TIMESTAMPTZ;
  v_lock_id UUID;
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
  -- Obtener tenant_id del contexto (si está disponible)
  -- Si no está disponible, intentar obtenerlo de la función o usar un valor por defecto
  v_tenant_id := current_setting('app.tenant_id', true)::UUID;
  
  -- Si no hay tenant_id en el contexto, intentar obtenerlo de alguna tabla relacionada
  IF v_tenant_id IS NULL THEN
    SELECT f.tenant_id INTO v_tenant_id
    FROM public.funciones f
    WHERE f.id = p_funcion_id
    LIMIT 1;
  END IF;
  
  -- Si aún no hay tenant_id, usar un valor por defecto (ajusta según tu necesidad)
  IF v_tenant_id IS NULL THEN
    -- Puedes comentar esta línea y hacer que la función falle si prefieres
    -- O usar un tenant_id específico de tu sistema
    v_tenant_id := '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::UUID;
  END IF;
  
  -- Generar locator temporal (8 caracteres alfanuméricos)
  v_locator := upper(
    substring(
      md5(random()::text || clock_timestamp()::text)
      from 1 for 8
    )
  );
  
  -- Calcular expires_at (15 minutos desde ahora)
  v_expires_at := NOW() + INTERVAL '15 minutes';
  
  -- Buscar si ya existe un lock para este asiento y función
  SELECT sl.* INTO v_existing_lock
  FROM public.seat_locks sl
  WHERE sl.seat_id = p_seat_id
    AND sl.funcion_id = p_funcion_id
    AND sl.tenant_id = v_tenant_id
    AND sl.expires_at > NOW()
    AND sl.status NOT IN ('liberado', 'expirado')
  ORDER BY sl.locked_at DESC
  LIMIT 1;
  
  -- Si existe un lock activo
  IF v_existing_lock IS NOT NULL THEN
    -- Si es del mismo usuario/sesión, actualizar el timestamp
    IF v_existing_lock.session_id = v_session_id THEN
      UPDATE public.seat_locks sl
      SET 
        locked_at = NOW(),
        expires_at = v_expires_at,
        status = p_status,
        updated_at = NOW()
      WHERE sl.id = v_existing_lock.id
      RETURNING sl.* INTO v_existing_lock;
      
      -- Retornar el lock actualizado
      RETURN QUERY SELECT 
        v_existing_lock.id,
        v_existing_lock.seat_id,
        v_existing_lock.funcion_id,
        v_existing_lock.session_id,
        v_existing_lock.locked_at,
        v_existing_lock.expires_at,
        v_existing_lock.status,
        v_existing_lock.lock_type,
        v_existing_lock.tenant_id,
        v_existing_lock.created_at,
        v_existing_lock.updated_at;
      RETURN;
    ELSE
      -- Es de otro usuario, lanzar error
      RAISE EXCEPTION 'Asiento ya está seleccionado por otro usuario' 
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  
  -- No existe lock activo, crear uno nuevo
  INSERT INTO public.seat_locks (
    seat_id,
    funcion_id,
    session_id,
    locked_at,
    expires_at,
    status,
    lock_type,
    tenant_id,
    locator,
    created_at,
    updated_at
  )
  VALUES (
    p_seat_id,
    p_funcion_id,
    v_session_id,
    NOW(),
    v_expires_at,
    p_status,
    'seat',
    v_tenant_id,
    v_locator,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_existing_lock;
  
  -- Retornar el lock creado
  RETURN QUERY SELECT 
    v_existing_lock.id,
    v_existing_lock.seat_id,
    v_existing_lock.funcion_id,
    v_existing_lock.session_id,
    v_existing_lock.locked_at,
    v_existing_lock.expires_at,
    v_existing_lock.status,
    v_existing_lock.lock_type,
    v_existing_lock.tenant_id,
    v_existing_lock.created_at,
    v_existing_lock.updated_at;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.lock_seat_atomically(
  p_seat_id TEXT,
  p_funcion_id INTEGER,
  p_session_id TEXT,
  p_status TEXT
) TO authenticated, anon;

-- Comentario para documentación
COMMENT ON FUNCTION public.lock_seat_atomically IS 
  'Bloquea un asiento de forma atómica, previniendo condiciones de carrera. 
   Si el asiento ya está bloqueado por otro usuario, lanza error.
   Si está bloqueado por el mismo usuario, actualiza el timestamp.
   Si no está bloqueado, crea un nuevo lock.';

