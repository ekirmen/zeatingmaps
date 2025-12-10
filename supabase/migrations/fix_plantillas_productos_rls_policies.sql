-- Fix RLS policies for plantillas_productos
-- El problema es que la política WITH CHECK verifica tenant_id antes de que el trigger lo asigne
-- Necesitamos modificar las políticas para que funcionen correctamente con el trigger

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view plantillas_productos from their tenant" ON public.plantillas_productos;
DROP POLICY IF EXISTS "Users can insert plantillas_productos in their tenant" ON public.plantillas_productos;
DROP POLICY IF EXISTS "Users can update plantillas_productos in their tenant" ON public.plantillas_productos;
DROP POLICY IF EXISTS "Users can delete plantillas_productos in their tenant" ON public.plantillas_productos;

-- Política RLS: SELECT - Los usuarios pueden ver productos de su tenant
CREATE POLICY "Users can view plantillas_productos from their tenant"
  ON public.plantillas_productos
  FOR SELECT
  USING (
    -- Verificar si el usuario tiene acceso al tenant del producto
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
    OR
    -- Verificar si el usuario es el creador o tiene acceso al evento
    evento_id IN (
      SELECT e.id
      FROM public.eventos e
      INNER JOIN public.user_tenants ut ON e.tenant_id = ut.tenant_id
      WHERE ut.user_id = auth.uid()
    )
  );

-- Política RLS: INSERT - Los usuarios pueden insertar productos
-- IMPORTANTE: WITH CHECK se ejecuta DESPUÉS del trigger BEFORE INSERT
-- Por lo tanto, el trigger ya habrá asignado el tenant_id cuando la política lo verifique
CREATE POLICY "Users can insert plantillas_productos in their tenant"
  ON public.plantillas_productos
  FOR INSERT
  WITH CHECK (
    -- Verificar que el tenant_id (asignado por el trigger o el cliente) pertenece al usuario
    -- Opción 1: Verificar contra user_tenants
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
    OR
    -- Opción 2: Verificar contra profiles (fallback si user_tenants no existe)
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
        AND tenant_id IS NOT NULL
    )
    OR
    -- Opción 3: Si el tenant_id aún es NULL, verificar por evento_id
    (
      tenant_id IS NULL
      AND evento_id IS NOT NULL
      AND evento_id IN (
        SELECT e.id
        FROM public.eventos e
        WHERE e.tenant_id IN (
          SELECT tenant_id 
          FROM public.user_tenants 
          WHERE user_id = auth.uid()
        )
        OR e.tenant_id IN (
          SELECT tenant_id
          FROM public.profiles
          WHERE id = auth.uid()
            AND tenant_id IS NOT NULL
        )
      )
    )
  );

-- Política RLS: UPDATE - Los usuarios pueden actualizar productos de su tenant
CREATE POLICY "Users can update plantillas_productos in their tenant"
  ON public.plantillas_productos
  FOR UPDATE
  USING (
    -- Verificar que el producto pertenece al tenant del usuario
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Verificar que después de la actualización, el producto sigue perteneciendo al tenant del usuario
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Política RLS: DELETE - Los usuarios pueden eliminar productos de su tenant
CREATE POLICY "Users can delete plantillas_productos in their tenant"
  ON public.plantillas_productos
  FOR DELETE
  USING (
    -- Verificar que el producto pertenece al tenant del usuario
    tenant_id IN (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Mejorar el trigger para asegurar que siempre asigne tenant_id
CREATE OR REPLACE FUNCTION assign_plantillas_productos_to_tenant()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  -- Si no hay tenant_id, intentar obtenerlo del evento
  IF NEW.tenant_id IS NULL AND NEW.evento_id IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.eventos
    WHERE id = NEW.evento_id;
  END IF;
  
  -- Si aún no hay tenant_id, intentar obtenerlo del usuario actual
  IF NEW.tenant_id IS NULL THEN
    -- Primero intentar desde user_tenants
    SELECT tenant_id INTO user_tenant_id
    FROM public.user_tenants
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Si no se encuentra en user_tenants, intentar desde profiles
    IF user_tenant_id IS NULL THEN
      SELECT tenant_id INTO user_tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
        AND tenant_id IS NOT NULL
      LIMIT 1;
    END IF;
    
    -- Asignar el tenant_id si se encontró
    IF user_tenant_id IS NOT NULL THEN
      NEW.tenant_id = user_tenant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

