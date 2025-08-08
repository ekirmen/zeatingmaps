-- 🏗️ Crear Tabla Mapas
-- Este script crea la tabla mapas para configurar asientos

-- =====================================================
-- CREAR TABLA MAPAS
-- =====================================================

CREATE TABLE IF NOT EXISTS mapas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    configuracion JSONB NOT NULL DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREAR ÍNDICES
-- =====================================================

-- Índices para mapas
CREATE INDEX IF NOT EXISTS idx_mapas_sala_id ON mapas(sala_id);
CREATE INDEX IF NOT EXISTS idx_mapas_tenant_id ON mapas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mapas_activo ON mapas(activo);

-- =====================================================
-- HABILITAR RLS
-- =====================================================

-- Habilitar RLS en mapas
ALTER TABLE mapas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREAR POLÍTICAS RLS
-- =====================================================

-- Políticas para mapas
CREATE POLICY "Users can view mapas from their tenant" ON mapas
FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

CREATE POLICY "Users can insert mapas for their tenant" ON mapas
FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

CREATE POLICY "Users can update mapas from their tenant" ON mapas
FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

CREATE POLICY "Users can delete mapas from their tenant" ON mapas
FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

-- =====================================================
-- VERIFICAR TABLA CREADA
-- =====================================================

-- Verificar que la tabla existe
SELECT 
    'TABLA MAPAS CREADA' as tipo,
    table_name,
    column_count
FROM (
    SELECT 'mapas' as table_name, COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'mapas'
) t;

-- Verificar políticas RLS
SELECT 
    'POLÍTICAS RLS MAPAS' as tipo,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'mapas'
ORDER BY policyname;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará la tabla mapas necesaria
3. Después, ejecuta verify_and_fix_plantilla.sql

RESULTADO ESPERADO:
- Tabla mapas creada
- Políticas RLS configuradas
- Listo para crear mapas de asientos
*/
