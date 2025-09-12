-- =====================================================
-- 🗃️ CREAR TABLA DE ASIGNACIONES USUARIO-TENANT
-- =====================================================
-- 
-- ✅ Esta tabla permite asignar usuarios del sistema SaaS
-- ✅ a tenants específicos para gestión y soporte
-- ✅ Sistema de roles granular con control de acceso
--
-- =====================================================

-- Crear tabla de asignaciones usuario-tenant
CREATE TABLE IF NOT EXISTS public.user_tenant_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.profiles(id),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados
    UNIQUE(user_id, tenant_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_tenant_assignments_user_id 
    ON public.user_tenant_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_tenant_assignments_tenant_id 
    ON public.user_tenant_assignments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_user_tenant_assignments_active 
    ON public.user_tenant_assignments(is_active) WHERE is_active = true;

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_tenant_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
CREATE TRIGGER trigger_update_user_tenant_assignments_updated_at
    BEFORE UPDATE ON public.user_tenant_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tenant_assignments_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_tenant_assignments ENABLE ROW LEVEL SECURITY;

-- Política para usuarios del sistema (super_admin, admin_sistema, etc.)
CREATE POLICY "Sistema users can view all assignments" ON public.user_tenant_assignments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'admin_sistema', 'gerente_sistema', 'soporte_sistema', 'visualizador_sistema')
        )
    );

-- Política para usuarios del sistema pueden insertar
CREATE POLICY "Sistema users can insert assignments" ON public.user_tenant_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'admin_sistema', 'gerente_sistema')
        )
    );

-- Política para usuarios del sistema pueden actualizar
CREATE POLICY "Sistema users can update assignments" ON public.user_tenant_assignments
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'admin_sistema', 'gerente_sistema')
        )
    );

-- Política para usuarios del sistema pueden eliminar
CREATE POLICY "Sistema users can delete assignments" ON public.user_tenant_assignments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'admin_sistema')
        )
    );

-- Comentarios en la tabla
COMMENT ON TABLE public.user_tenant_assignments IS 'Asignaciones de usuarios del sistema SaaS a tenants específicos';
COMMENT ON COLUMN public.user_tenant_assignments.user_id IS 'ID del usuario del sistema';
COMMENT ON COLUMN public.user_tenant_assignments.tenant_id IS 'ID del tenant asignado';
COMMENT ON COLUMN public.user_tenant_assignments.assigned_at IS 'Fecha de asignación';
COMMENT ON COLUMN public.user_tenant_assignments.assigned_by IS 'Usuario que realizó la asignación';
COMMENT ON COLUMN public.user_tenant_assignments.permissions IS 'Permisos específicos para este tenant (JSON)';
COMMENT ON COLUMN public.user_tenant_assignments.is_active IS 'Si la asignación está activa';

-- =====================================================
-- ✅ RESULTADO:
-- ✅ Tabla creada para asignaciones usuario-tenant
-- ✅ Índices optimizados para consultas rápidas
-- ✅ RLS habilitado con políticas de seguridad
-- ✅ Triggers para auditoría automática
-- ✅ Sistema preparado para gestión granular
-- =====================================================
