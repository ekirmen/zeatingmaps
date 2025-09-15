-- Create view for eventos with active functions
-- This view combines eventos and funciones tables to provide a unified view
-- Run this SQL in your Supabase SQL editor

CREATE OR REPLACE VIEW eventos_con_funciones_activas AS
SELECT 
    e.id,
    e.nombre,
    e.descripcion,
    e.created_at,
    e.activo,
    e.oculto,
    e.tenant_id,
    e.slug,
    e.tags,
    e.imagenes,
    e."estadoVenta",
    e."modoVenta",
    e.recinto_id,
    e.sala,
    COUNT(f.id) as funciones_count,
    MIN(f.fecha_celebracion) as primera_funcion,
    MAX(f.fecha_celebracion) as ultima_funcion,
    -- Use function dates as the event date range
    MIN(f.fecha_celebracion) as fecha_evento
FROM eventos e
LEFT JOIN funciones f ON e.id = f.evento_id AND f.activo = true
WHERE e.activo = true
GROUP BY e.id, e.nombre, e.descripcion, e.created_at, 
         e.activo, e.oculto, e.tenant_id, e.slug, e.tags, e.imagenes, e."estadoVenta", 
         e."modoVenta", e.recinto_id, e.sala;

-- Grant necessary permissions
GRANT SELECT ON eventos_con_funciones_activas TO authenticated;
GRANT SELECT ON eventos_con_funciones_activas TO anon;
