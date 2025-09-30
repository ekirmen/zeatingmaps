-- Script para crear las tablas y relaciones que faltan
-- Ejecuta este script en tu consola de Supabase SQL Editor

-- 1. Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    email text,
    full_name text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 2. Crear tabla eventos si no existe
CREATE TABLE IF NOT EXISTS public.eventos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    descripcion text,
    fecha_inicio timestamp with time zone,
    fecha_fin timestamp with time zone,
    imagen_url text,
    tenant_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT eventos_pkey PRIMARY KEY (id),
    CONSTRAINT eventos_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- 3. Crear tabla funciones si no existe
CREATE TABLE IF NOT EXISTS public.funciones (
    id integer NOT NULL,
    evento_id uuid,
    fecha_celebracion timestamp with time zone,
    sala text,
    plantilla jsonb,
    tenant_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT funciones_pkey PRIMARY KEY (id),
    CONSTRAINT funciones_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES eventos (id) ON DELETE CASCADE,
    CONSTRAINT funciones_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- 4. Agregar índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tenant_id ON public.eventos USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_funciones_evento_id ON public.funciones USING btree (evento_id);
CREATE INDEX IF NOT EXISTS idx_funciones_tenant_id ON public.funciones USING btree (tenant_id);

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funciones ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS básicas
CREATE POLICY profiles_select_policy ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert_policy ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY profiles_update_policy ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY eventos_select_policy ON public.eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY eventos_insert_policy ON public.eventos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY eventos_update_policy ON public.eventos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY funciones_select_policy ON public.funciones FOR SELECT TO authenticated USING (true);
CREATE POLICY funciones_insert_policy ON public.funciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY funciones_update_policy ON public.funciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 7. Verificar que las tablas se crearon correctamente
SELECT 
    'Verificación de tablas creadas' as test,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'eventos', 'funciones', 'payment_transactions')
ORDER BY table_name;
