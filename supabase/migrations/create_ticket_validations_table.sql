-- Tabla para registrar validaciones de tickets (escaneos de códigos QR)
CREATE TABLE IF NOT EXISTS public.ticket_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  seat_id TEXT NOT NULL,
  locator VARCHAR(255) NOT NULL,
  funcion_id INTEGER,
  evento_id UUID,
  tenant_id UUID,
  user_id UUID,
  
  -- Información de validación
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  validated_by UUID, -- Usuario que escaneó (si es un operador)
  validation_status VARCHAR(50) NOT NULL DEFAULT 'valid', -- valid, invalid, duplicate, expired
  validation_method VARCHAR(50) DEFAULT 'qr_scan', -- qr_scan, manual, etc.
  
  -- Información de escaneo
  scanner_device_id TEXT, -- ID del dispositivo escáner
  scanner_location TEXT, -- Ubicación física del escáner
  scanner_user_id UUID, -- Usuario que operó el escáner
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT ticket_validations_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_validations_payment_id_fkey FOREIGN KEY (payment_id) 
    REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  CONSTRAINT ticket_validations_funcion_id_fkey FOREIGN KEY (funcion_id) 
    REFERENCES public.funciones(id) ON DELETE SET NULL,
  CONSTRAINT ticket_validations_evento_id_fkey FOREIGN KEY (evento_id) 
    REFERENCES public.eventos(id) ON DELETE SET NULL,
  CONSTRAINT ticket_validations_tenant_id_fkey FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT ticket_validations_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT ticket_validations_validated_by_fkey FOREIGN KEY (validated_by) 
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT ticket_validations_scanner_user_id_fkey FOREIGN KEY (scanner_user_id) 
    REFERENCES public.profiles(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_ticket_validations_payment_id 
  ON public.ticket_validations USING btree (payment_id);

CREATE INDEX IF NOT EXISTS idx_ticket_validations_seat_id 
  ON public.ticket_validations USING btree (seat_id);

CREATE INDEX IF NOT EXISTS idx_ticket_validations_locator 
  ON public.ticket_validations USING btree (locator);

CREATE INDEX IF NOT EXISTS idx_ticket_validations_funcion_id 
  ON public.ticket_validations USING btree (funcion_id);

CREATE INDEX IF NOT EXISTS idx_ticket_validations_validated_at 
  ON public.ticket_validations USING btree (validated_at);

CREATE INDEX IF NOT EXISTS idx_ticket_validations_status 
  ON public.ticket_validations USING btree (validation_status);

CREATE INDEX IF NOT EXISTS idx_ticket_validations_payment_seat 
  ON public.ticket_validations USING btree (payment_id, seat_id);

-- Índice único para evitar validaciones duplicadas del mismo asiento
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_validations_unique_seat 
  ON public.ticket_validations (payment_id, seat_id) 
  WHERE validation_status = 'valid';

-- Tabla para registrar descargas de tickets
CREATE TABLE IF NOT EXISTS public.ticket_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  locator VARCHAR(255) NOT NULL,
  user_id UUID,
  tenant_id UUID,
  
  -- Información de descarga
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  download_method VARCHAR(50) DEFAULT 'pdf_download', -- pdf_download, email, etc.
  user_agent TEXT,
  ip_address INET,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT ticket_downloads_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_downloads_payment_id_fkey FOREIGN KEY (payment_id) 
    REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  CONSTRAINT ticket_downloads_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT ticket_downloads_tenant_id_fkey FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_ticket_downloads_payment_id 
  ON public.ticket_downloads USING btree (payment_id);

CREATE INDEX IF NOT EXISTS idx_ticket_downloads_locator 
  ON public.ticket_downloads USING btree (locator);

CREATE INDEX IF NOT EXISTS idx_ticket_downloads_downloaded_at 
  ON public.ticket_downloads USING btree (downloaded_at);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION tg_set_ticket_validations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ticket_validations_set_updated_at
  BEFORE UPDATE ON public.ticket_validations
  FOR EACH ROW
  EXECUTE FUNCTION tg_set_ticket_validations_updated_at();

-- RLS Policies
ALTER TABLE public.ticket_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_downloads ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver sus propias validaciones
CREATE POLICY "Users can view their own ticket validations"
  ON public.ticket_validations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los administradores puedan ver todas las validaciones
CREATE POLICY "Admins can view all ticket validations"
  ON public.ticket_validations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para que los operadores puedan crear validaciones
CREATE POLICY "Operators can create ticket validations"
  ON public.ticket_validations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'operator')
    )
  );

-- Política para que los usuarios puedan ver sus propias descargas
CREATE POLICY "Users can view their own ticket downloads"
  ON public.ticket_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los administradores puedan ver todas las descargas
CREATE POLICY "Admins can view all ticket downloads"
  ON public.ticket_downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Política para que cualquier usuario autenticado pueda registrar sus propias descargas
CREATE POLICY "Users can create their own ticket downloads"
  ON public.ticket_downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

