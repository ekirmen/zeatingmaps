-- Script para arreglar la tabla tenants y agregar políticas RLS
-- Ejecutar en Supabase SQL Editor DESPUÉS de create_clean_tenant_policies_final.sql

-- 1. Verificar si la tabla tenants existe y tiene tenant_id
SELECT 
    table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ TIENE tenant_id'
        ELSE '❌ NO TIENE tenant_id'
    END as tenant_id_status
FROM (
    SELECT 'tenants' as table_name
) t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'tenant_id';

-- 2. Agregar tenant_id a la tabla tenants si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE tenants ADD COLUMN tenant_id UUID;
        CREATE INDEX idx_tenants_tenant_id ON tenants(tenant_id);
        RAISE NOTICE '✅ Agregada columna tenant_id a tabla tenants';
    ELSE
        RAISE NOTICE 'ℹ️ Tabla tenants ya tiene tenant_id';
    END IF;
END $$;

-- 3. Habilitar RLS en la tabla tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para la tabla tenants
-- Política para que los administradores puedan gestionar todos los tenants
CREATE POLICY "Admins can manage all tenants" ON tenants
FOR ALL USING (
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Política para que los usuarios puedan ver tenants públicos
CREATE POLICY "Users can view public tenants" ON tenants
FOR SELECT USING (
    status = 'active' OR status = 'public'
);

-- Política para que los usuarios puedan crear su propio tenant
CREATE POLICY "Users can create own tenant" ON tenants
FOR INSERT WITH CHECK (
    id = auth.uid() OR 
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Política para que los usuarios puedan actualizar su propio tenant
CREATE POLICY "Users can update own tenant" ON tenants
FOR UPDATE USING (
    id = auth.uid() OR 
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 5. Verificar políticas creadas para tenants
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tenants'
ORDER BY policyname;

-- 6. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'tenants';

-- 7. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Tabla tenants configurada correctamente';
    RAISE NOTICE '✅ Políticas RLS creadas para tenants';
    RAISE NOTICE '🔒 Administradores pueden gestionar todos los tenants';
    RAISE NOTICE '👥 Usuarios pueden crear/gestionar su propio tenant';
END $$;
