-- Tabla de Afiliados
CREATE TABLE IF NOT EXISTS public.afiliados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  comision_porcentaje DECIMAL(5,2) DEFAULT 0,
  link_afiliado TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  total_ventas INTEGER DEFAULT 0,
  total_comisiones DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT afiliados_tenant_link_unique UNIQUE (tenant_id, link_afiliado)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_afiliados_tenant_id ON public.afiliados(tenant_id);
CREATE INDEX IF NOT EXISTS idx_afiliados_link_afiliado ON public.afiliados(link_afiliado);
CREATE INDEX IF NOT EXISTS idx_afiliados_activo ON public.afiliados(activo);

-- RLS Policies
ALTER TABLE public.afiliados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view afiliados from their tenant"
  ON public.afiliados FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY "Users can insert afiliados for their tenant"
  ON public.afiliados FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY "Users can update afiliados from their tenant"
  ON public.afiliados FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

CREATE POLICY "Users can delete afiliados from their tenant"
  ON public.afiliados FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_afiliados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_afiliados_updated_at
  BEFORE UPDATE ON public.afiliados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_afiliados_updated_at();

-- Agregar columna afiliado_id a transacciones si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND column_name = 'afiliado_id'
  ) THEN
    ALTER TABLE public.payment_transactions 
    ADD COLUMN afiliado_id UUID REFERENCES public.afiliados(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_transactions_afiliado_id 
    ON public.payment_transactions(afiliado_id);
  END IF;
END $$;

-- Agregar columna comision_afiliado a transacciones si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND column_name = 'comision_afiliado'
  ) THEN
    ALTER TABLE public.payment_transactions 
    ADD COLUMN comision_afiliado DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

