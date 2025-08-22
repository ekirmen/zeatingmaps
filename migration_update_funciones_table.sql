-- Migración para actualizar la tabla funciones con campos avanzados
-- Ejecutar en orden secuencial

-- 1. Añadir nuevos campos básicos
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS zona_horaria text DEFAULT 'America/Mexico_City',
ADD COLUMN IF NOT EXISTS lit_sesion text,
ADD COLUMN IF NOT EXISTS utiliza_lit_sesion boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS apertura_puertas timestamp with time zone,
ADD COLUMN IF NOT EXISTS promotional_session_label text,
ADD COLUMN IF NOT EXISTS session_belongs_season_pass boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS id_abono_sala uuid[];

-- 2. Añadir campos de streaming
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS streaming_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS overwrite_streaming_setup boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS streaming_type text DEFAULT 'ENETRES',
ADD COLUMN IF NOT EXISTS streaming_url text,
ADD COLUMN IF NOT EXISTS streaming_id text,
ADD COLUMN IF NOT EXISTS streaming_password text,
ADD COLUMN IF NOT EXISTS streaming_only_one_session_by_ticket boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS streaming_show_url boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS streaming_transmission_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS streaming_transmission_stop timestamp with time zone;

-- 3. Añadir campos de plantillas y configuración
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS plantilla_entradas integer,
ADD COLUMN IF NOT EXISTS plantilla_cupos integer,
ADD COLUMN IF NOT EXISTS id_barcode_pool integer;

-- 4. Añadir campos de opciones de venta
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS permite_pago_plazos boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS num_plazos_pago integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS permite_reserva boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS misma_fecha_canales boolean DEFAULT true;

-- 5. Añadir campos de canales de venta
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS canales jsonb DEFAULT '{"boxOffice": {"activo": true, "inicio": "", "fin": ""}, "internet": {"activo": true, "inicio": "", "fin": ""}}';

-- 6. Añadir campos de cancelación e impresión
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS cancellation_date_selected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS end_date_cancellation timestamp with time zone,
ADD COLUMN IF NOT EXISTS ticket_printing_release_date_selected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_printing_release_date integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS custom_printing_ticket_date timestamp with time zone;

-- 7. Añadir campos personalizados
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS custom_ses1 text,
ADD COLUMN IF NOT EXISTS custom_ses2 text;

-- 8. Añadir campos de visibilidad
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS visible_en_boleteria boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS visible_en_store boolean DEFAULT true;

-- 9. Añadir campos de auditoría y organización
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS recinto_id integer,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 10. Renombrar campos existentes para consistencia
ALTER TABLE public.funciones 
RENAME COLUMN evento TO evento_id;

ALTER TABLE public.funciones 
RENAME COLUMN sala TO sala_id;

ALTER TABLE public.funciones 
RENAME COLUMN plantilla TO plantilla_entradas;

-- 11. Cambiar tipos de datos para mejor compatibilidad
ALTER TABLE public.funciones 
ALTER COLUMN fecha_celebracion TYPE timestamp with time zone,
ALTER COLUMN inicio_venta TYPE timestamp with time zone,
ALTER COLUMN fin_venta TYPE timestamp with time zone;

-- 12. Añadir constraints para nuevos campos
ALTER TABLE public.funciones 
ADD CONSTRAINT IF NOT EXISTS funciones_plantilla_entradas_fkey 
FOREIGN KEY (plantilla_entradas) REFERENCES plantillas(id) ON DELETE SET NULL;

ALTER TABLE public.funciones 
ADD CONSTRAINT IF NOT EXISTS funciones_plantilla_cupos_fkey 
FOREIGN KEY (plantilla_cupos) REFERENCES plantillas_cupos(id) ON DELETE SET NULL;

ALTER TABLE public.funciones 
ADD CONSTRAINT IF NOT EXISTS funciones_recinto_id_fkey 
FOREIGN KEY (recinto_id) REFERENCES recintos(id) ON DELETE CASCADE;

-- 13. Crear índices para nuevos campos
CREATE INDEX IF NOT EXISTS idx_funciones_zona_horaria ON public.funciones(zona_horaria);
CREATE INDEX IF NOT EXISTS idx_funciones_streaming_mode ON public.funciones(streaming_mode);
CREATE INDEX IF NOT EXISTS idx_funciones_permite_pago_plazos ON public.funciones(permite_pago_plazos);
CREATE INDEX IF NOT EXISTS idx_funciones_permite_reserva ON public.funciones(permite_reserva);
CREATE INDEX IF NOT EXISTS idx_funciones_visible_en_boleteria ON public.funciones(visible_en_boleteria);
CREATE INDEX IF NOT EXISTS idx_funciones_visible_en_store ON public.funciones(visible_en_store);
CREATE INDEX IF NOT EXISTS idx_funciones_recinto_id ON public.funciones(recinto_id);

-- 14. Crear índice para búsquedas en canales JSON
CREATE INDEX IF NOT EXISTS idx_funciones_canales_gin ON public.funciones USING GIN (canales);

-- 15. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_funciones_updated_at ON public.funciones;
CREATE TRIGGER update_funciones_updated_at 
    BEFORE UPDATE ON public.funciones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 16. Comentarios para documentar la tabla
COMMENT ON TABLE public.funciones IS 'Tabla de funciones/eventos con soporte completo para streaming, canales de venta y configuraciones avanzadas';
COMMENT ON COLUMN public.funciones.canales IS 'JSON con configuración de canales de venta (boxOffice, internet)';
COMMENT ON COLUMN public.funciones.streaming_type IS 'Tipo de plataforma de streaming (ENETRES, FACEBOOK, YOUTUBE, etc.)';
COMMENT ON COLUMN public.funciones.zona_horaria IS 'Zona horaria de la función (America/Mexico_City, etc.)';
COMMENT ON COLUMN public.funciones.tiempo_caducidad_reservas IS 'Minutos antes/después de la función para liberar reservas';

-- 17. Verificar que la migración se ejecutó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'funciones' 
AND table_schema = 'public'
ORDER BY ordinal_position;
