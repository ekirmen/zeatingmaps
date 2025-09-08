-- =====================================================
-- MIGRACIÓN: Solo funciones de utilidad para tenant
-- Fecha: 2025-01-07
-- Descripción: Crea solo las funciones de utilidad sin políticas RLS
-- =====================================================

-- =====================================================
-- FUNCIONES DE UTILIDAD ESPECÍFICAS
-- =====================================================

-- Función para obtener URL de imagen de evento específico
CREATE OR REPLACE FUNCTION get_tenant_event_image_url(
    p_event_id UUID,
    p_image_type TEXT DEFAULT 'banner'
)
RETURNS TEXT AS $$
DECLARE
    event_record RECORD;
    image_data JSONB;
    image_path TEXT;
    bucket_name TEXT := 'tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8';
    full_url TEXT;
BEGIN
    -- Obtener datos del evento
    SELECT e.id, e.nombre, e.tenant_id, e.imagenes
    INTO event_record
    FROM eventos e
    WHERE e.id = p_event_id
    AND e.tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::UUID;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Obtener imagen específica
    image_data := event_record.imagenes->p_image_type;
    
    IF image_data IS NULL OR image_data = 'null'::jsonb THEN
        -- Intentar con otros tipos de imagen
        image_data := COALESCE(
            event_record.imagenes->'portada',
            event_record.imagenes->'obraImagen',
            event_record.imagenes->'banner'
        );
    END IF;
    
    IF image_data IS NULL OR image_data = 'null'::jsonb THEN
        RETURN NULL;
    END IF;
    
    -- Construir URL
    IF image_data ? 'bucket' THEN
        bucket_name := image_data->>'bucket';
        image_path := image_data->>'url';
    ELSE
        image_path := event_record.id::TEXT || '/' || 
                     split_part(image_data->>'url', '/', -1);
    END IF;
    
    -- Construir URL completa
    full_url := current_setting('app.settings.supabase_url') || 
                '/storage/v1/object/public/' || 
                bucket_name || '/' || 
                image_path;
    
    RETURN full_url;
END;
$$ LANGUAGE plpgsql;

-- Función para subir imagen de evento específico
CREATE OR REPLACE FUNCTION upload_tenant_event_image(
    p_event_id UUID,
    p_image_type TEXT,
    p_file_name TEXT,
    p_file_data BYTEA
)
RETURNS TEXT AS $$
DECLARE
    event_record RECORD;
    bucket_name TEXT := 'tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8';
    file_path TEXT;
    full_url TEXT;
BEGIN
    -- Obtener datos del evento
    SELECT e.id, e.nombre, e.tenant_id
    INTO event_record
    FROM eventos e
    WHERE e.id = p_event_id
    AND e.tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::UUID;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento no encontrado o no pertenece al tenant: %', p_event_id;
    END IF;
    
    -- Construir ruta
    file_path := event_record.id::TEXT || '/' || p_file_name;
    
    -- Insertar archivo en storage
    INSERT INTO storage.objects (bucket_id, name, owner, path_tokens, metadata)
    VALUES (
        bucket_name,
        file_path,
        auth.uid(),
        ARRAY[event_record.id::TEXT, p_file_name],
        jsonb_build_object(
            'size', octet_length(p_file_data),
            'mimetype', 'image/jpeg',
            'uploaded_at', now(),
            'image_type', p_image_type
        )
    );
    
    -- Construir URL completa
    full_url := current_setting('app.settings.supabase_url') || 
                '/storage/v1/object/public/' || 
                bucket_name || '/' || 
                file_path;
    
    RETURN full_url;
END;
$$ LANGUAGE plpgsql;

-- Función para listar imágenes de un evento
CREATE OR REPLACE FUNCTION list_tenant_event_images(
    p_event_id UUID
)
RETURNS TABLE(
    image_type TEXT,
    image_name TEXT,
    image_url TEXT,
    image_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    event_record RECORD;
    bucket_name TEXT := 'tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8';
    object_record RECORD;
BEGIN
    -- Verificar que el evento existe y pertenece al tenant
    SELECT e.id, e.nombre, e.tenant_id
    INTO event_record
    FROM eventos e
    WHERE e.id = p_event_id
    AND e.tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::UUID;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento no encontrado o no pertenece al tenant: %', p_event_id;
    END IF;
    
    -- Listar objetos en el bucket para este evento
    FOR object_record IN 
        SELECT 
            o.name,
            o.metadata,
            o.created_at
        FROM storage.objects o
        WHERE o.bucket_id = bucket_name
        AND o.name LIKE event_record.id::TEXT || '/%'
        AND o.name != event_record.id::TEXT || '/.gitkeep'
    LOOP
        -- Extraer información de la imagen
        image_type := COALESCE(
            object_record.metadata->>'image_type',
            'unknown'
        );
        image_name := split_part(object_record.name, '/', -1);
        image_url := current_setting('app.settings.supabase_url') || 
                    '/storage/v1/object/public/' || 
                    bucket_name || '/' || 
                    object_record.name;
        image_size := COALESCE(
            (object_record.metadata->>'size')::BIGINT,
            0
        );
        uploaded_at := object_record.created_at;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar imagen de evento
CREATE OR REPLACE FUNCTION delete_tenant_event_image(
    p_event_id UUID,
    p_image_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    event_record RECORD;
    bucket_name TEXT := 'tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8';
    file_path TEXT;
    deleted_count INTEGER;
BEGIN
    -- Verificar que el evento existe y pertenece al tenant
    SELECT e.id, e.nombre, e.tenant_id
    INTO event_record
    FROM eventos e
    WHERE e.id = p_event_id
    AND e.tenant_id = '9dbdb86f-8424-484c-bb76-0d9fa27573c8'::UUID;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento no encontrado o no pertenece al tenant: %', p_event_id;
    END IF;
    
    -- Construir ruta del archivo
    file_path := event_record.id::TEXT || '/' || p_image_name;
    
    -- Eliminar archivo
    DELETE FROM storage.objects 
    WHERE bucket_id = bucket_name 
    AND name = file_path;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN DE FUNCIONES
-- =====================================================

-- Verificar funciones creadas
SELECT 
    'Funciones creadas para tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8' as status,
    COUNT(*) as total_functions,
    STRING_AGG(proname, ', ') as function_names
FROM pg_proc 
WHERE proname LIKE '%tenant%'
AND proname LIKE '%event%';

-- Verificar bucket específico
SELECT 
    'Bucket tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8' as status,
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE name = 'tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- Verificar objetos en el bucket
SELECT 
    'Objetos en bucket tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8' as status,
    COUNT(*) as total_objects,
    STRING_AGG(name, ', ') as object_names
FROM storage.objects 
WHERE bucket_id = 'tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8';

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION get_tenant_event_image_url(UUID, TEXT) IS 
'Obtiene la URL completa de una imagen de evento del tenant específico';

COMMENT ON FUNCTION upload_tenant_event_image(UUID, TEXT, TEXT, BYTEA) IS 
'Sube una imagen de evento al bucket del tenant específico';

COMMENT ON FUNCTION list_tenant_event_images(UUID) IS 
'Lista todas las imágenes de un evento del tenant específico';

COMMENT ON FUNCTION delete_tenant_event_image(UUID, TEXT) IS 
'Elimina una imagen específica de un evento del tenant específico';

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Funciones de utilidad para tenant-9dbdb86f-8424-484c-bb76-0d9fa27573c8 creadas exitosamente!';
    RAISE NOTICE '🛠️ Funciones disponibles:';
    RAISE NOTICE '   - get_tenant_event_image_url(event_id, image_type)';
    RAISE NOTICE '   - upload_tenant_event_image(event_id, image_type, file_name, file_data)';
    RAISE NOTICE '   - list_tenant_event_images(event_id)';
    RAISE NOTICE '   - delete_tenant_event_image(event_id, image_name)';
    RAISE NOTICE '📊 Verifica las funciones en las consultas anteriores';
    RAISE NOTICE '🔒 Recuerda crear las políticas RLS desde el dashboard de Supabase';
END $$;
