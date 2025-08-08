-- 🏗️ Crear Tablas de Plantillas de Precios
-- Este script crea las tablas necesarias para plantillas de precios

-- =====================================================
-- CREAR TABLA PLANTILLAS_PRECIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS plantillas_precios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREAR TABLA ZONAS_PRECIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS zonas_precios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plantilla_id UUID NOT NULL REFERENCES plantillas_precios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    color VARCHAR(7) DEFAULT '#4CAF50',
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGREGAR COLUMNA A EVENTOS
-- =====================================================

-- Agregar columna plantilla_precios_id a eventos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos' 
        AND column_name = 'plantilla_precios_id'
    ) THEN
        ALTER TABLE eventos ADD COLUMN plantilla_precios_id UUID REFERENCES plantillas_precios(id);
    END IF;
END $$;

-- =====================================================
-- CREAR ÍNDICES
-- =====================================================

-- Índices para plantillas_precios
CREATE INDEX IF NOT EXISTS idx_plantillas_precios_tenant_id ON plantillas_precios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_precios_activa ON plantillas_precios(activa);

-- Índices para zonas_precios
CREATE INDEX IF NOT EXISTS idx_zonas_precios_plantilla_id ON zonas_precios(plantilla_id);

-- Índice para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_plantilla_precios_id ON eventos(plantilla_precios_id);

-- =====================================================
-- HABILITAR RLS
-- =====================================================

-- Habilitar RLS en plantillas_precios
ALTER TABLE plantillas_precios ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en zonas_precios
ALTER TABLE zonas_precios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREAR POLÍTICAS RLS
-- =====================================================

-- Políticas para plantillas_precios
CREATE POLICY "Users can view plantillas from their tenant" ON plantillas_precios
FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

CREATE POLICY "Users can insert plantillas for their tenant" ON plantillas_precios
FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

CREATE POLICY "Users can update plantillas from their tenant" ON plantillas_precios
FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

CREATE POLICY "Users can delete plantillas from their tenant" ON plantillas_precios
FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION ALL
    SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
));

-- Políticas para zonas_precios
CREATE POLICY "Users can view zonas from their tenant" ON zonas_precios
FOR SELECT USING (plantilla_id IN (
    SELECT pp.id FROM plantillas_precios pp
    WHERE pp.tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
));

CREATE POLICY "Users can insert zonas for their tenant" ON zonas_precios
FOR INSERT WITH CHECK (plantilla_id IN (
    SELECT pp.id FROM plantillas_precios pp
    WHERE pp.tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
));

CREATE POLICY "Users can update zonas from their tenant" ON zonas_precios
FOR UPDATE USING (plantilla_id IN (
    SELECT pp.id FROM plantillas_precios pp
    WHERE pp.tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
));

CREATE POLICY "Users can delete zonas from their tenant" ON zonas_precios
FOR DELETE USING (plantilla_id IN (
    SELECT pp.id FROM plantillas_precios pp
    WHERE pp.tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
        UNION ALL
        SELECT id FROM tenants WHERE subdomain = current_setting('request.headers')::json->>'x-tenant-subdomain'
    )
));

-- =====================================================
-- VERIFICAR TABLAS CREADAS
-- =====================================================

-- Verificar que las tablas existen
SELECT 
    'TABLAS CREADAS' as tipo,
    table_name,
    column_count
FROM (
    SELECT 'plantillas_precios' as table_name, COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'plantillas_precios'
    UNION ALL
    SELECT 'zonas_precios' as table_name, COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'zonas_precios'
) t;

-- Verificar políticas RLS
SELECT 
    'POLÍTICAS RLS' as tipo,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('plantillas_precios', 'zonas_precios')
ORDER BY tablename, policyname;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
INSTRUCCIONES:
1. Ejecuta este script en el SQL Editor de Supabase
2. Esto creará las tablas necesarias para plantillas de precios
3. Después, ejecuta create_plantilla_precios.sql

RESULTADO ESPERADO:
- Tabla plantillas_precios creada
- Tabla zonas_precios creada
- Columna plantilla_precios_id agregada a eventos
- Políticas RLS configuradas
*/
