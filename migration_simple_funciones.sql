-- Migración simplificada para actualizar tabla funciones
-- Ejecutar en tu base de datos Supabase

-- Añadir campos básicos
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS zona_horaria text DEFAULT 'America/Mexico_City',
ADD COLUMN IF NOT EXISTS lit_sesion text,
ADD COLUMN IF NOT EXISTS utiliza_lit_sesion boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS apertura_puertas timestamp with time zone,
ADD COLUMN IF NOT EXISTS promotional_session_label text,
ADD COLUMN IF NOT EXISTS session_belongs_season_pass boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS id_abono_sala uuid[];

-- Añadir campos de streaming
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

-- Añadir campos de configuración
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS plantilla_entradas integer,
ADD COLUMN IF NOT EXISTS plantilla_cupos integer,
ADD COLUMN IF NOT EXISTS id_barcode_pool integer,
ADD COLUMN IF NOT EXISTS permite_pago_plazos boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS num_plazos_pago integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS permite_reserva boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS misma_fecha_canales boolean DEFAULT true;

-- Añadir campo de canales (JSON)
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS canales jsonb DEFAULT '{"boxOffice": {"activo": true, "inicio": "", "fin": ""}, "internet": {"activo": true, "inicio": "", "fin": ""}}';

-- Añadir campos de gestión
ALTER TABLE public.funciones 
ADD COLUMN IF NOT EXISTS cancellation_date_selected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS end_date_cancellation timestamp with time zone,
ADD COLUMN IF NOT EXISTS ticket_printing_release_date_selected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_printing_release_date integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS custom_printing_ticket_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS custom_ses1 text,
ADD COLUMN IF NOT EXISTS custom_ses2 text,
ADD COLUMN IF NOT EXISTS visible_en_boleteria boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS visible_en_store boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS recinto_id integer,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Renombrar campos para consistencia
ALTER TABLE public.funciones RENAME COLUMN evento TO evento_id;
ALTER TABLE public.funciones RENAME COLUMN sala TO sala_id;

-- Cambiar tipos de fecha para mejor compatibilidad
ALTER TABLE public.funciones ALTER COLUMN fecha_celebracion TYPE timestamp with time zone;
ALTER TABLE public.funciones ALTER COLUMN inicio_venta TYPE timestamp with time zone;
ALTER TABLE public.funciones ALTER COLUMN fin_venta TYPE timestamp with time zone;

-- Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_funciones_zona_horaria ON public.funciones(zona_horaria);
CREATE INDEX IF NOT EXISTS idx_funciones_streaming_mode ON public.funciones(streaming_mode);
CREATE INDEX IF NOT EXISTS idx_funciones_visible_en_boleteria ON public.funciones(visible_en_boleteria);
CREATE INDEX IF NOT EXISTS idx_funciones_visible_en_store ON public.funciones(visible_en_store);
CREATE INDEX IF NOT EXISTS idx_funciones_recinto_id ON public.funciones(recinto_id);
CREATE INDEX IF NOT EXISTS idx_funciones_canales_gin ON public.funciones USING GIN (canales);

-- Crear trigger para updated_at
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
