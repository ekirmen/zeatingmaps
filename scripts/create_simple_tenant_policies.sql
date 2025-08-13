-- Script simplificado para crear políticas RLS de tenant
-- Ejecutar en Supabase SQL Editor DESPUÉS de cleanup_duplicate_policies.sql

-- 1. Políticas para profiles (mantener la existente de admin y agregar tenant)
-- La política "Admins can manage all profiles" ya existe, no la tocamos

-- Política para usuarios ver perfiles de su tenant
CREATE POLICY "Users can view own tenant profiles" ON profiles
FOR SELECT USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Política para usuarios insertar en su tenant
CREATE POLICY "Users can insert own tenant profiles" ON profiles
FOR INSERT WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Política para usuarios actualizar en su tenant
CREATE POLICY "Users can update own tenant profiles" ON profiles
FOR UPDATE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Política para usuarios eliminar en su tenant
CREATE POLICY "Users can delete own tenant profiles" ON profiles
FOR DELETE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- 2. Políticas para recintos
CREATE POLICY "Users can view own tenant recintos" ON recintos
FOR SELECT USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own tenant recintos" ON recintos
FOR INSERT WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own tenant recintos" ON recintos
FOR UPDATE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own tenant recintos" ON recintos
FOR DELETE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- 3. Políticas para eventos
CREATE POLICY "Users can view own tenant eventos" ON eventos
FOR SELECT USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own tenant eventos" ON eventos
FOR INSERT WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own tenant eventos" ON eventos
FOR UPDATE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own tenant eventos" ON eventos
FOR DELETE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- 4. Políticas para productos
CREATE POLICY "Users can view own tenant productos" ON productos
FOR SELECT USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own tenant productos" ON productos
FOR INSERT WITH CHECK (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own tenant productos" ON productos
FOR UPDATE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own tenant productos" ON productos
FOR DELETE USING (
    tenant_id = (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
    )
);

-- 5. Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
