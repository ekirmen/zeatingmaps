-- Crear tabla plantillas_productos
CREATE TABLE IF NOT EXISTS public.plantillas_productos (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  nombre CHARACTER VARYING(255) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  precio_base NUMERIC(10, 2) DEFAULT 0,
  categoria CHARACTER VARYING(100),
  activo BOOLEAN DEFAULT true,
  evento_id UUID,
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT plantillas_productos_pkey PRIMARY KEY (id),
  CONSTRAINT plantillas_productos_evento_id_fkey FOREIGN KEY (evento_id) 
    REFERENCES public.eventos(id) ON DELETE CASCADE,
  CONSTRAINT plantillas_productos_tenant_id_fkey FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Índices
CREATE INDEX IF NOT EXISTS idx_plantillas_productos_evento_id 
  ON public.plantillas_productos USING btree (evento_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_plantillas_productos_tenant_id 
  ON public.plantillas_productos USING btree (tenant_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_plantillas_productos_activo 
  ON public.plantillas_productos USING btree (activo) 
  TABLESPACE pg_default
  WHERE activo = true;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_plantillas_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plantillas_productos_updated_at
  BEFORE UPDATE ON public.plantillas_productos
  FOR EACH ROW
  EXECUTE FUNCTION update_plantillas_productos_updated_at();

-- Trigger para asignar tenant_id automáticamente (si no se proporciona)
CREATE OR REPLACE FUNCTION assign_plantillas_productos_to_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no hay tenant_id, intentar obtenerlo del evento
  IF NEW.tenant_id IS NULL AND NEW.evento_id IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.eventos
    WHERE id = NEW.evento_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_plantillas_productos_to_tenant
  BEFORE INSERT ON public.plantillas_productos
  FOR EACH ROW
  EXECUTE FUNCTION assign_plantillas_productos_to_tenant();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.plantillas_productos ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver sus propios productos (basado en tenant_id)
CREATE POLICY "Users can view plantillas_productos from their tenant"
  ON public.plantillas_productos
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
    OR tenant_id IN (
      SELECT id 
      FROM public.tenants 
      WHERE id IN (
        SELECT tenant_id 
        FROM public.user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Política RLS: Los usuarios pueden insertar productos en su tenant
CREATE POLICY "Users can insert plantillas_productos in their tenant"
  ON public.plantillas_productos
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
    OR tenant_id IN (
      SELECT id 
      FROM public.tenants 
      WHERE id IN (
        SELECT tenant_id 
        FROM public.user_tenants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Política RLS: Los usuarios pueden actualizar productos de su tenant
CREATE POLICY "Users can update plantillas_productos in their tenant"
  ON public.plantillas_productos
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Política RLS: Los usuarios pueden eliminar productos de su tenant
CREATE POLICY "Users can delete plantillas_productos in their tenant"
  ON public.plantillas_productos
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Comentarios en la tabla y columnas
COMMENT ON TABLE public.plantillas_productos IS 'Plantillas de productos para eventos';
COMMENT ON COLUMN public.plantillas_productos.nombre IS 'Nombre del producto';
COMMENT ON COLUMN public.plantillas_productos.descripcion IS 'Descripción del producto';
COMMENT ON COLUMN public.plantillas_productos.imagen_url IS 'URL de la imagen del producto';
COMMENT ON COLUMN public.plantillas_productos.precio_base IS 'Precio base del producto';
COMMENT ON COLUMN public.plantillas_productos.categoria IS 'Categoría del producto (merchandising, alimentos, servicios, otros)';
COMMENT ON COLUMN public.plantillas_productos.activo IS 'Indica si el producto está activo';
COMMENT ON COLUMN public.plantillas_productos.evento_id IS 'ID del evento al que pertenece el producto';
COMMENT ON COLUMN public.plantillas_productos.tenant_id IS 'ID del tenant (empresa) al que pertenece el producto';

