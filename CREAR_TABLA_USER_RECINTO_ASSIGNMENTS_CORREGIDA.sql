-- =====================================================
-- 🏢 CREAR TABLA DE ASIGNACIONES USUARIO-RECINTO (CORREGIDA)
-- =====================================================
-- 
-- ✅ Este script crea la tabla para asignar recintos a usuarios
-- ✅ CORREGIDO: recinto_id es INTEGER (no UUID)
-- ✅ Permite que los usuarios solo vean eventos de sus recintos asignados
-- ✅ Admin/Gerente pueden vender todos los eventos de sus recintos
-- ✅ Taquilla solo puede vender eventos de sus recintos asignados
--
-- =====================================================

-- Crear tabla de asignaciones usuario-recinto
CREATE TABLE IF NOT EXISTS public.user_recinto_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recinto_id INTEGER NOT NULL REFERENCES public.recintos(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados
    UNIQUE(user_id, recinto_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_recinto_assignments_user_id 
    ON public.user_recinto_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_recinto_assignments_recinto_id 
    ON public.user_recinto_assignments(recinto_id);

CREATE INDEX IF NOT EXISTS idx_user_recinto_assignments_assigned_by 
    ON public.user_recinto_assignments(assigned_by);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_recinto_assignments ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver sus propias asignaciones
CREATE POLICY "Users can view their own recinto assignments" ON public.user_recinto_assignments
    FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: Solo admin/gerente pueden crear asignaciones
CREATE POLICY "Admins can create recinto assignments" ON public.user_recinto_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'gerente', 'super_admin', 'admin_sistema')
        )
    );

-- Política RLS: Solo admin/gerente pueden actualizar asignaciones
CREATE POLICY "Admins can update recinto assignments" ON public.user_recinto_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'gerente', 'super_admin', 'admin_sistema')
        )
    );

-- Política RLS: Solo admin/gerente pueden eliminar asignaciones
CREATE POLICY "Admins can delete recinto assignments" ON public.user_recinto_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'gerente', 'super_admin', 'admin_sistema')
        )
    );

-- Función para asignar recintos automáticamente a admin/gerente
CREATE OR REPLACE FUNCTION assign_recintos_to_admin_gerente()
RETURNS TRIGGER AS $$
BEGIN
    -- Asignar todos los recintos a usuarios admin y gerente
    INSERT INTO public.user_recinto_assignments (user_id, recinto_id, assigned_by)
    SELECT 
        p.id as user_id,
        NEW.id as recinto_id,
        NEW.id as assigned_by
    FROM public.profiles p
    WHERE p.role IN ('admin', 'gerente', 'super_admin', 'admin_sistema')
    AND p.tenant_id = NEW.tenant_id
    ON CONFLICT (user_id, recinto_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asignar automáticamente recintos a admin/gerente
CREATE TRIGGER trigger_assign_recintos_to_admin_gerente
    AFTER INSERT ON public.recintos
    FOR EACH ROW
    EXECUTE FUNCTION assign_recintos_to_admin_gerente();

-- Función para obtener recintos asignados a un usuario
CREATE OR REPLACE FUNCTION get_user_recintos(user_uuid UUID)
RETURNS TABLE (
    recinto_id INTEGER,
    recinto_nombre TEXT,
    recinto_direccion TEXT,
    recinto_ciudad TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as recinto_id,
        r.nombre as recinto_nombre,
        r.direccion as recinto_direccion,
        r.ciudad as recinto_ciudad,
        ura.created_at as assigned_at
    FROM public.user_recinto_assignments ura
    JOIN public.recintos r ON r.id = ura.recinto_id
    WHERE ura.user_id = user_uuid
    ORDER BY r.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener eventos de recintos asignados a un usuario
CREATE OR REPLACE FUNCTION get_user_events(user_uuid UUID)
RETURNS TABLE (
    evento_id UUID,
    evento_nombre TEXT,
    evento_fecha TIMESTAMP WITH TIME ZONE,
    recinto_nombre TEXT,
    recinto_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as evento_id,
        e.nombre as evento_nombre,
        e.fecha_celebracion as evento_fecha,
        r.nombre as recinto_nombre,
        r.id as recinto_id
    FROM public.user_recinto_assignments ura
    JOIN public.recintos r ON r.id = ura.recinto_id
    JOIN public.eventos e ON e.recinto_id = r.id
    WHERE ura.user_id = user_uuid
    AND e.estado = 'activo'
    ORDER BY e.fecha_celebracion DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para mostrar asignaciones de recintos con información completa
CREATE OR REPLACE VIEW user_recinto_assignments_view AS
SELECT 
    ura.id,
    ura.user_id,
    ura.recinto_id,
    ura.assigned_by,
    ura.created_at,
    ura.updated_at,
    p.nombre as user_nombre,
    p.email as user_email,
    p.role as user_role,
    r.nombre as recinto_nombre,
    r.direccion as recinto_direccion,
    r.ciudad as recinto_ciudad,
    assigned_by_user.nombre as assigned_by_nombre
FROM public.user_recinto_assignments ura
JOIN public.profiles p ON p.id = ura.user_id
JOIN public.recintos r ON r.id = ura.recinto_id
LEFT JOIN public.profiles assigned_by_user ON assigned_by_user.id = ura.assigned_by;

-- Comentarios para documentación
COMMENT ON TABLE public.user_recinto_assignments IS 'Asignaciones de recintos a usuarios para control de acceso';
COMMENT ON COLUMN public.user_recinto_assignments.user_id IS 'ID del usuario al que se asigna el recinto';
COMMENT ON COLUMN public.user_recinto_assignments.recinto_id IS 'ID del recinto asignado (INTEGER)';
COMMENT ON COLUMN public.user_recinto_assignments.assigned_by IS 'ID del usuario que hizo la asignación';
COMMENT ON FUNCTION get_user_recintos(UUID) IS 'Obtiene los recintos asignados a un usuario';
COMMENT ON FUNCTION get_user_events(UUID) IS 'Obtiene los eventos de los recintos asignados a un usuario';

-- =====================================================
-- ✅ RESULTADO:
-- ✅ Tabla de asignaciones usuario-recinto creada
-- ✅ CORREGIDO: recinto_id es INTEGER (compatible con tabla recintos)
-- ✅ RLS habilitado para seguridad
-- ✅ Funciones de utilidad para obtener datos
-- ✅ Trigger para asignación automática a admin/gerente
-- ✅ Vista para consultas fáciles
-- ✅ Índices para mejor rendimiento
-- =====================================================
