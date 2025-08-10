-- Script para verificar y corregir problemas con la tabla mapas
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear tabla mapas si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mapas') THEN
        RAISE NOTICE 'Creando tabla mapas...';
        
        CREATE TABLE mapas (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
            nombre VARCHAR(255) NOT NULL,
            contenido JSONB DEFAULT '[]'::jsonb,
            estado VARCHAR(50) DEFAULT 'activo',
            tenant_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_mapas_sala_id ON mapas(sala_id);
        CREATE INDEX IF NOT EXISTS idx_mapas_tenant_id ON mapas(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_mapas_estado ON mapas(estado);
        
        RAISE NOTICE 'Tabla mapas creada exitosamente';
    ELSE
        RAISE NOTICE 'La tabla mapas ya existe';
    END IF;
END $$;

-- Crear función para updated_at (fuera del bloque DO)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at (fuera del bloque DO)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_mapas_updated_at') THEN
        CREATE TRIGGER update_mapas_updated_at
            BEFORE UPDATE ON mapas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_mapas_updated_at creado';
    ELSE
        RAISE NOTICE 'El trigger update_mapas_updated_at ya existe';
    END IF;
END $$;

-- 2. Verificar si existe la columna tenant_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'mapas' AND column_name = 'tenant_id') THEN
        RAISE NOTICE 'Agregando columna tenant_id a la tabla mapas...';
        ALTER TABLE mapas ADD COLUMN tenant_id UUID;
        RAISE NOTICE 'Columna tenant_id agregada';
    ELSE
        RAISE NOTICE 'La columna tenant_id ya existe';
    END IF;
END $$;

-- 3. Verificar políticas RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'mapas') THEN
        RAISE NOTICE 'No hay políticas RLS para la tabla mapas. Creando políticas básicas...';
        
        -- Habilitar RLS
        ALTER TABLE mapas ENABLE ROW LEVEL SECURITY;
        
        -- Política para usuarios autenticados (leer)
        CREATE POLICY "Enable read access for authenticated users" ON mapas
            FOR SELECT USING (auth.role() = 'authenticated');
        
        -- Política para usuarios autenticados (insertar)
        CREATE POLICY "Enable insert access for authenticated users" ON mapas
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        -- Política para usuarios autenticados (actualizar)
        CREATE POLICY "Enable update access for authenticated users" ON mapas
            FOR UPDATE USING (auth.role() = 'authenticated');
        
        -- Política para usuarios autenticados (eliminar)
        CREATE POLICY "Enable delete access for authenticated users" ON mapas
            FOR DELETE USING (auth.role() = 'authenticated');
            
        RAISE NOTICE 'Políticas RLS creadas exitosamente';
    ELSE
        RAISE NOTICE 'Las políticas RLS ya existen';
    END IF;
END $$;

-- 4. Verificar si hay datos en la tabla mapas
SELECT 
    COUNT(*) as total_mapas,
    COUNT(DISTINCT sala_id) as salas_con_mapa,
    COUNT(DISTINCT tenant_id) as tenants_con_mapa
FROM mapas;

-- 5. Verificar salas sin mapa
SELECT 
    s.id as sala_id,
    s.nombre as sala_nombre,
    s.tenant_id as sala_tenant_id,
    CASE WHEN m.id IS NULL THEN 'Sin mapa' ELSE 'Con mapa' END as estado_mapa
FROM salas s
LEFT JOIN mapas m ON s.id = m.sala_id
WHERE m.id IS NULL
ORDER BY s.nombre;

-- 6. Crear mapa de ejemplo para una sala si no existe
-- (Descomenta y modifica según necesites)
/*
INSERT INTO mapas (sala_id, contenido, tenant_id)
SELECT 
    s.id,
    '[]'::jsonb,
    s.tenant_id
FROM salas s
LEFT JOIN mapas m ON s.id = m.sala_id
WHERE m.id IS NULL
LIMIT 1;
*/

-- 7. Verificar permisos del usuario actual
SELECT 
    current_user as usuario_actual,
    session_user as usuario_sesion,
    current_database() as base_datos,
    current_schema() as esquema_actual;

-- 8. Verificar roles y permisos
SELECT 
    rolname as nombre_rol,
    rolsuper as es_superusuario,
    rolinherit as hereda_roles,
    rolcreaterole as puede_crear_roles,
    rolcreatedb as puede_crear_bd,
    rolcanlogin as puede_hacer_login
FROM pg_roles
WHERE rolname IN (current_user, 'authenticated', 'anon');

-- 9. Verificar configuración de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'mapas';
