-- Script FINAL para crear políticas RLS limpias y simples
-- Ejecutar en Supabase SQL Editor INMEDIATAMENTE DESPUÉS de cleanup_all_policies_final.sql

-- 1. Política básica para profiles (usuarios pueden ver/editar su propio perfil)
CREATE POLICY "Users can manage own profile" ON profiles
FOR ALL USING (id = auth.uid());

-- 2. Política para recintos (usuarios solo ven recintos de su tenant)
CREATE POLICY "Users can view own tenant recintos" ON recintos
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant recintos" ON recintos
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 3. Política para eventos (usuarios solo ven eventos de su tenant)
CREATE POLICY "Users can view own tenant eventos" ON eventos
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant eventos" ON eventos
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 4. Política para productos (usuarios solo ven productos de su tenant)
CREATE POLICY "Users can view own tenant productos" ON productos
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant productos" ON productos
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 5. Política para funciones (usuarios solo ven funciones de su tenant)
CREATE POLICY "Users can view own tenant funciones" ON funciones
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant funciones" ON funciones
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 6. Política para salas (usuarios solo ven salas de su tenant)
CREATE POLICY "Users can view own tenant salas" ON salas
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant salas" ON salas
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 7. Política para mapas (usuarios solo ven mapas de su tenant)
CREATE POLICY "Users can view own tenant mapas" ON mapas
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant mapas" ON mapas
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 8. Política para zonas (usuarios solo ven zonas de su tenant)
CREATE POLICY "Users can view own tenant zonas" ON zonas
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant zonas" ON zonas
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 9. Política para plantillas de precios
CREATE POLICY "Users can view own tenant plantillas_precios" ON plantillas_precios
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant plantillas_precios" ON plantillas_precios
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 10. Política para plantillas de productos
CREATE POLICY "Users can view own tenant plantillas_productos" ON plantillas_productos
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant plantillas_productos" ON plantillas_productos
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 11. Política para ventas
CREATE POLICY "Users can view own tenant ventas" ON ventas
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant ventas" ON ventas
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 12. Política para abonos
CREATE POLICY "Users can view own tenant abonos" ON abonos
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant abonos" ON abonos
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 13. Política para payments
CREATE POLICY "Users can view own tenant payments" ON payments
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can manage own tenant payments" ON payments
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- 14. Verificar políticas creadas
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

-- 15. Contar total de políticas creadas
SELECT 
    COUNT(*) as total_policies_creadas,
    COUNT(DISTINCT tablename) as tablas_con_politicas
FROM pg_policies
WHERE schemaname = 'public';

-- 16. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Políticas RLS limpias creadas exitosamente';
    RAISE NOTICE '✅ Sistema de multi-tenancy configurado correctamente';
    RAISE NOTICE '🔒 Cada usuario solo puede acceder a datos de su tenant';
    RAISE NOTICE '📊 Verifica que no hay más errores uuid = text';
END $$;
