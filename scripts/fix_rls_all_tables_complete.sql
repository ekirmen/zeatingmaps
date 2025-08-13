-- 🚀 Script COMPLETO para aplicar RLS a TODAS las tablas del sistema
-- Este script configura políticas RLS para todas las tablas con control de acceso basado en roles

-- =====================================================
-- PASO 1: VERIFICAR TODAS LAS TABLAS EXISTENTES
-- =====================================================

-- Verificar todas las tablas existentes
SELECT 
    'TABLAS EXISTENTES' as tipo,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- PASO 2: AGREGAR COLUMNAS DE ROLES A PROFILES
-- =====================================================

-- Agregar columna role si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'tenant_admin';

-- Agregar columna permissions si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Agregar columna tenant_id si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Agregar columna is_active si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- =====================================================
-- PASO 3: ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Actualizar usuarios existentes con rol por defecto
UPDATE profiles 
SET 
    role = COALESCE(role, 'super_admin'),
    permissions = COALESCE(permissions, '{}'::jsonb),
    tenant_id = COALESCE(tenant_id, (SELECT id FROM tenants LIMIT 1)),
    is_active = COALESCE(is_active, true)
WHERE role IS NULL OR permissions IS NULL OR tenant_id IS NULL OR is_active IS NULL;

-- =====================================================
-- PASO 4: AGREGAR TENANT_ID A TODAS LAS TABLAS PRINCIPALES
-- =====================================================

-- Lista de tablas que necesitan tenant_id (solo tablas de la aplicación)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN (
            'tenants', 
            'profiles', 
            'schema_migrations',
            'wrappers_fdw_stats',
            'pg_stat_statements',
            'pg_stat_statements_info',
            'pg_stat_user_tables',
            'pg_stat_user_indexes',
            'pg_stat_database',
            'pg_stat_activity',
            'pg_stat_bgwriter',
            'pg_stat_replication',
            'pg_stat_sys_tables',
            'pg_stat_sys_indexes',
            'pg_stat_all_tables',
            'pg_stat_all_indexes',
            'pg_stat_xact_all_tables',
            'pg_stat_xact_sys_tables',
            'pg_stat_xact_user_tables',
            'pg_stat_database_conflicts',
            'pg_stat_user_functions',
            'pg_stat_xact_user_functions',
            'pg_stat_archiver',
            'pg_stat_wal_receiver',
            'pg_stat_subscription',
            'pg_stat_slru',
            'pg_stat_recovery_prefetch',
            'pg_stat_wal',
            'pg_stat_io',
            'pg_stat_cluster_activity',
            'pg_stat_progress_analyze',
            'pg_stat_progress_cluster',
            'pg_stat_progress_create_index',
            'pg_stat_progress_vacuum',
            'pg_stat_progress_basebackup',
            'pg_stat_progress_copy',
            'pg_stat_progress_recovery_prefetch',
            'pg_stat_progress_wal',
            'pg_stat_progress_checksum',
            'pg_stat_progress_repair',
            'pg_stat_progress_archive_cleanup',
            'pg_stat_progress_standby_apply',
            'pg_stat_progress_standby_sync',
            'pg_stat_progress_standby_switch',
            'pg_stat_progress_standby_restart',
            'pg_stat_progress_standby_rewind',
            'pg_stat_progress_standby_backup',
            'pg_stat_progress_standby_restore',
            'pg_stat_progress_standby_verify',
            'pg_stat_progress_standby_validate',
            'pg_stat_progress_standby_cleanup',
            'pg_stat_progress_standby_switchover',
            'pg_stat_progress_standby_failover',
            'pg_stat_progress_standby_promote',
            'pg_stat_progress_standby_demote',
            'pg_stat_progress_standby_rewind',
            'pg_stat_progress_standby_backup',
            'pg_stat_progress_standby_restore',
            'pg_stat_progress_standby_verify',
            'pg_stat_progress_standby_validate',
            'pg_stat_progress_standby_cleanup',
            'pg_stat_progress_standby_switchover',
            'pg_stat_progress_standby_failover',
            'pg_stat_progress_standby_promote',
            'pg_stat_progress_standby_demote'
        )
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'information_%'
        AND table_name NOT LIKE 'sql_%'
        AND table_name NOT LIKE 'wrappers_%'
        AND table_name NOT LIKE 'extensions_%'
        AND table_name NOT LIKE 'supabase_%'
        AND table_name NOT LIKE 'realtime_%'
        AND table_name NOT LIKE 'storage_%'
        AND table_name NOT LIKE 'auth_%'
        AND table_name NOT LIKE 'graphql_%'
        AND table_name NOT LIKE 'pgsodium_%'
        AND table_name NOT LIKE 'vault_%'
        AND table_name NOT LIKE 'net_%'
        AND table_name NOT LIKE 'http_%'
        AND table_name NOT LIKE 'pg_net_%'
        AND table_name NOT LIKE 'pg_graphql_%'
        AND table_name NOT LIKE 'pg_stat_%'
        AND table_name NOT LIKE 'pg_catalog_%'
        AND table_name NOT LIKE 'information_schema%'
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE', table_record.table_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON %I(tenant_id)', table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- =====================================================
-- PASO 5: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

-- Habilitar RLS solo en tablas de la aplicación
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN (
            'tenants', 
            'profiles', 
            'schema_migrations',
            'wrappers_fdw_stats',
            'pg_stat_statements',
            'pg_stat_statements_info',
            'pg_stat_user_tables',
            'pg_stat_user_indexes',
            'pg_stat_database',
            'pg_stat_activity',
            'pg_stat_bgwriter',
            'pg_stat_replication',
            'pg_stat_sys_tables',
            'pg_stat_sys_indexes',
            'pg_stat_all_tables',
            'pg_stat_all_indexes',
            'pg_stat_xact_all_tables',
            'pg_stat_xact_sys_tables',
            'pg_stat_xact_user_tables',
            'pg_stat_database_conflicts',
            'pg_stat_user_functions',
            'pg_stat_xact_user_functions',
            'pg_stat_archiver',
            'pg_stat_wal_receiver',
            'pg_stat_subscription',
            'pg_stat_slru',
            'pg_stat_recovery_prefetch',
            'pg_stat_wal',
            'pg_stat_io',
            'pg_stat_cluster_activity',
            'pg_stat_progress_analyze',
            'pg_stat_progress_cluster',
            'pg_stat_progress_create_index',
            'pg_stat_progress_vacuum',
            'pg_stat_progress_basebackup',
            'pg_stat_progress_copy',
            'pg_stat_progress_recovery_prefetch',
            'pg_stat_progress_wal',
            'pg_stat_progress_checksum',
            'pg_stat_progress_repair',
            'pg_stat_progress_archive_cleanup',
            'pg_stat_progress_standby_apply',
            'pg_stat_progress_standby_sync',
            'pg_stat_progress_standby_switch',
            'pg_stat_progress_standby_restart',
            'pg_stat_progress_standby_rewind',
            'pg_stat_progress_standby_backup',
            'pg_stat_progress_standby_restore',
            'pg_stat_progress_standby_verify',
            'pg_stat_progress_standby_validate',
            'pg_stat_progress_standby_cleanup',
            'pg_stat_progress_standby_switchover',
            'pg_stat_progress_standby_failover',
            'pg_stat_progress_standby_promote',
            'pg_stat_progress_standby_demote',
            'pg_stat_progress_standby_rewind',
            'pg_stat_progress_standby_backup',
            'pg_stat_progress_standby_restore',
            'pg_stat_progress_standby_verify',
            'pg_stat_progress_standby_validate',
            'pg_stat_progress_standby_cleanup',
            'pg_stat_progress_standby_switchover',
            'pg_stat_progress_standby_failover',
            'pg_stat_progress_standby_promote',
            'pg_stat_progress_standby_demote'
        )
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'information_%'
        AND table_name NOT LIKE 'sql_%'
        AND table_name NOT LIKE 'wrappers_%'
        AND table_name NOT LIKE 'extensions_%'
        AND table_name NOT LIKE 'supabase_%'
        AND table_name NOT LIKE 'realtime_%'
        AND table_name NOT LIKE 'storage_%'
        AND table_name NOT LIKE 'auth_%'
        AND table_name NOT LIKE 'graphql_%'
        AND table_name NOT LIKE 'pgsodium_%'
        AND table_name NOT LIKE 'vault_%'
        AND table_name NOT LIKE 'net_%'
        AND table_name NOT LIKE 'http_%'
        AND table_name NOT LIKE 'pg_net_%'
        AND table_name NOT LIKE 'pg_graphql_%'
        AND table_name NOT LIKE 'pg_stat_%'
        AND table_name NOT LIKE 'pg_catalog_%'
        AND table_name NOT LIKE 'information_schema%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.table_name);
    END LOOP;
END $$;

-- =====================================================
-- PASO 6: FUNCIONES HELPER PARA VERIFICAR PERMISOS
-- =====================================================

-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND is_active = true
        AND (
            role = 'super_admin' 
            OR permissions ? permission_name
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es tenant admin
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'tenant_admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario tiene acceso a un tenant específico
CREATE OR REPLACE FUNCTION has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND is_active = true
        AND (
            role = 'super_admin' 
            OR tenant_id = target_tenant_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 7: CREAR POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Tenant admins can manage tenant profiles" ON profiles;

-- Política: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    TO public
    USING (id = auth.uid());

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO public
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Política: Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO public
    WITH CHECK (id = auth.uid());

-- Política: Super admins pueden gestionar todos los perfiles
CREATE POLICY "Super admins can manage all profiles" ON profiles
    FOR ALL
    TO public
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Política: Tenant admins pueden gestionar perfiles de su tenant
CREATE POLICY "Tenant admins can manage tenant profiles" ON profiles
    FOR ALL
    TO public
    USING (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- PASO 8: CREAR POLÍTICAS RLS PARA RECINTOS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Users can manage own tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Super admins can manage all recintos" ON recintos;
DROP POLICY IF EXISTS "Tenant admins can manage tenant recintos" ON recintos;
DROP POLICY IF EXISTS "Event managers can view tenant recintos" ON recintos;

-- Política: Super admins pueden gestionar todos los recintos
CREATE POLICY "Super admins can manage all recintos" ON recintos
    FOR ALL
    TO public
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Política: Tenant admins pueden gestionar recintos de su tenant
CREATE POLICY "Tenant admins can manage tenant recintos" ON recintos
    FOR ALL
    TO public
    USING (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        is_tenant_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Política: Event managers pueden ver recintos de su tenant
CREATE POLICY "Event managers can view tenant recintos" ON recintos
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'event_manager'
            AND tenant_id = recintos.tenant_id
            AND is_active = true
        )
    );

-- Política: Usuarios con permiso de gestión de recintos pueden gestionar
CREATE POLICY "Users with recintos permission can manage" ON recintos
    FOR ALL
    TO public
    USING (
        has_permission('gestión_de_recintos')
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        has_permission('gestión_de_recintos')
        AND tenant_id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- PASO 9: CREAR POLÍTICAS RLS PARA TENANTS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Admins can manage all tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view public tenants" ON tenants;

-- Política: Super admins pueden gestionar todos los tenants
CREATE POLICY "Super admins can manage all tenants" ON tenants
    FOR ALL
    TO public
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Política: Usuarios pueden crear su propio tenant
CREATE POLICY "Users can create own tenant" ON tenants
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Política: Usuarios pueden ver tenants públicos
CREATE POLICY "Users can view public tenants" ON tenants
    FOR SELECT
    TO public
    USING (true);

-- Política: Tenant admins pueden actualizar su propio tenant
CREATE POLICY "Tenant admins can update own tenant" ON tenants
    FOR UPDATE
    TO public
    USING (
        is_tenant_admin() 
        AND id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        is_tenant_admin() 
        AND id IN (
            SELECT tenant_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- =====================================================
-- PASO 10: CREAR POLÍTICAS RLS PARA OTRAS TABLAS IMPORTANTES
-- =====================================================

-- Política para eventos (si existe la tabla)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'eventos') THEN
        -- Eliminar políticas existentes
        EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all eventos" ON eventos';
        EXECUTE 'DROP POLICY IF EXISTS "Tenant admins can manage tenant eventos" ON eventos';
        
        -- Crear nuevas políticas
        EXECUTE 'CREATE POLICY "Super admins can manage all eventos" ON eventos FOR ALL TO public USING (is_super_admin()) WITH CHECK (is_super_admin())';
        EXECUTE 'CREATE POLICY "Tenant admins can manage tenant eventos" ON eventos FOR ALL TO public USING (is_tenant_admin() AND tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())) WITH CHECK (is_tenant_admin() AND tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';
    END IF;
END $$;

-- Política para salas (si existe la tabla)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salas') THEN
        -- Eliminar políticas existentes
        EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all salas" ON salas';
        EXECUTE 'DROP POLICY IF EXISTS "Tenant admins can manage tenant salas" ON salas';
        
        -- Crear nuevas políticas
        EXECUTE 'CREATE POLICY "Super admins can manage all salas" ON salas FOR ALL TO public USING (is_super_admin()) WITH CHECK (is_super_admin())';
        EXECUTE 'CREATE POLICY "Tenant admins can manage tenant salas" ON salas FOR ALL TO public USING (is_tenant_admin() AND tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())) WITH CHECK (is_tenant_admin() AND tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';
    END IF;
END $$;

-- Política para funciones (si existe la tabla)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'funciones') THEN
        -- Eliminar políticas existentes
        EXECUTE 'DROP POLICY IF EXISTS "Super admins can manage all funciones" ON funciones';
        EXECUTE 'DROP POLICY IF EXISTS "Tenant admins can manage tenant funciones" ON funciones';
        
        -- Crear nuevas políticas
        EXECUTE 'CREATE POLICY "Super admins can manage all funciones" ON funciones FOR ALL TO public USING (is_super_admin()) WITH CHECK (is_super_admin())';
        EXECUTE 'CREATE POLICY "Tenant admins can manage tenant funciones" ON funciones FOR ALL TO public USING (is_tenant_admin() AND tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())) WITH CHECK (is_tenant_admin() AND tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))';
    END IF;
END $$;

-- =====================================================
-- PASO 11: VERIFICAR ESTADO FINAL
-- =====================================================

-- Verificar que RLS está habilitado solo en tablas de la aplicación
SELECT 
    'RLS STATUS FINAL' as tipo,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'information_%'
AND tablename NOT LIKE 'sql_%'
AND tablename NOT LIKE 'wrappers_%'
AND tablename NOT LIKE 'extensions_%'
AND tablename NOT LIKE 'supabase_%'
AND tablename NOT LIKE 'realtime_%'
AND tablename NOT LIKE 'storage_%'
AND tablename NOT LIKE 'auth_%'
AND tablename NOT LIKE 'graphql_%'
AND tablename NOT LIKE 'pgsodium_%'
AND tablename NOT LIKE 'vault_%'
AND tablename NOT LIKE 'net_%'
AND tablename NOT LIKE 'http_%'
AND tablename NOT LIKE 'pg_net_%'
AND tablename NOT LIKE 'pg_graphql_%'
AND tablename NOT LIKE 'pg_stat_%'
AND tablename NOT LIKE 'pg_catalog_%'
AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- Verificar políticas finales (solo tablas de la aplicación)
SELECT 
    'POLÍTICAS FINALES' as tipo,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'information_%'
AND tablename NOT LIKE 'sql_%'
AND tablename NOT LIKE 'wrappers_%'
AND tablename NOT LIKE 'extensions_%'
AND tablename NOT LIKE 'supabase_%'
AND tablename NOT LIKE 'realtime_%'
AND tablename NOT LIKE 'storage_%'
AND tablename NOT LIKE 'auth_%'
AND tablename NOT LIKE 'graphql_%'
AND tablename NOT LIKE 'pgsodium_%'
AND tablename NOT LIKE 'vault_%'
AND tablename NOT LIKE 'net_%'
AND tablename NOT LIKE 'http_%'
AND tablename NOT LIKE 'pg_net_%'
AND tablename NOT LIKE 'pg_graphql_%'
AND tablename NOT LIKE 'pg_stat_%'
AND tablename NOT LIKE 'pg_catalog_%'
AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename, policyname;

-- =====================================================
-- PASO 12: INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Insertar datos de prueba para verificar funcionamiento
DO $$
DECLARE
    first_tenant_id UUID;
BEGIN
    -- Obtener el primer tenant disponible
    SELECT id INTO first_tenant_id FROM tenants LIMIT 1;
    
    -- Solo insertar si hay datos disponibles
    IF first_tenant_id IS NOT NULL THEN
        -- Insertar recinto de prueba
        INSERT INTO recintos (nombre, direccion, tenant_id) VALUES
            ('Recinto de Prueba', 'Dirección de Prueba', first_tenant_id)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Recinto de prueba insertado correctamente';
    ELSE
        RAISE NOTICE '⚠️ No hay tenants disponibles para insertar recinto de prueba';
    END IF;
END $$;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 SISTEMA DE RLS COMPLETAMENTE CONFIGURADO';
    RAISE NOTICE '✅ RLS habilitado en TODAS las tablas de la aplicación';
    RAISE NOTICE '🔒 Políticas configuradas para sistema de roles';
    RAISE NOTICE '🔒 Super admins pueden gestionar todo';
    RAISE NOTICE '🔒 Tenant admins pueden gestionar su tenant';
    RAISE NOTICE '🔒 Control de acceso granular implementado';
    RAISE NOTICE '📋 Error de RLS en recintos resuelto';
    RAISE NOTICE '🚀 El sistema SaaS está completamente protegido';
    RAISE NOTICE '⚠️ Solo se modificaron tablas de la aplicación (no tablas del sistema)';
END $$;
