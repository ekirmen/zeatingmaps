-- =====================================================
-- CREAR TABLA NOTIFICATIONS
-- =====================================================

-- 1. CREAR LA TABLA NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    tenant_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    data jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. CREAR ÍNDICES PARA LA TABLA NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id 
ON public.notifications USING btree (tenant_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_notifications_status 
ON public.notifications USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON public.notifications USING btree (created_at) TABLESPACE pg_default;

-- 3. CREAR TRIGGER PARA UPDATED_AT (SOLO SI NO EXISTE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_notifications_updated_at'
          AND tgrelid = 'public.notifications'::regclass
    ) THEN
        EXECUTE '
            CREATE TRIGGER update_notifications_updated_at
                BEFORE UPDATE ON public.notifications
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ';
    END IF;
END;
$$;

-- 4. CONFIGURAR RLS PARA LA TABLA NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para usuarios autenticados: pueden leer sus propias notificaciones
DROP POLICY IF EXISTS notifications_authenticated_read ON notifications;
CREATE POLICY notifications_authenticated_read ON notifications
    FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- Política para usuarios autenticados: pueden insertar notificaciones
DROP POLICY IF EXISTS notifications_authenticated_insert ON notifications;
CREATE POLICY notifications_authenticated_insert ON notifications
    FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

-- Política para usuarios autenticados: pueden actualizar sus notificaciones
DROP POLICY IF EXISTS notifications_authenticated_update ON notifications;
CREATE POLICY notifications_authenticated_update ON notifications
    FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Política para tenant admin: acceso completo a notificaciones del tenant
DROP POLICY IF EXISTS notifications_tenant_admin_all ON notifications;
CREATE POLICY notifications_tenant_admin_all ON notifications
    FOR ALL TO authenticated USING (is_tenant_admin() AND tenant_id = get_user_tenant_id()) WITH CHECK (is_tenant_admin() AND tenant_id = get_user_tenant_id());

-- 5. INSERTAR NOTIFICACIÓN DE PRUEBA (OPCIONAL)
INSERT INTO notifications (user_id, tenant_id, title, message, type, status)
VALUES (
    (SELECT auth.uid()), 
    (SELECT id FROM tenants LIMIT 1), 
    'Pago Exitoso', 
    'Tu pago ha sido procesado correctamente', 
    'success', 
    'sent'
) ON CONFLICT DO NOTHING;

-- 6. VERIFICAR QUE LA TABLA SE CREÓ CORRECTAMENTE
SELECT 
    'notifications' as tabla,
    COUNT(*) as registros,
    'Tabla creada exitosamente' as estado
FROM notifications;
