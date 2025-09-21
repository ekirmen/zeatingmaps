-- =====================================================
-- ESQUEMA BÁSICO PARA PAGOS Y BLOQUEO DE ASIENTOS
-- Incluye tablas, índices, RLS y triggers de updated_at
-- =====================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Función y trigger para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- TABLA: payment_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id varchar(255),
  gateway_id uuid,
  amount numeric(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  status varchar(50) NOT NULL DEFAULT 'pending',
  gateway_transaction_id varchar(255),
  gateway_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid,
  evento_id uuid,
  tenant_id uuid,
  locator varchar(255),
  funcion_id integer,
  payment_method varchar(100),
  gateway_name varchar(100),
  seats jsonb,
  monto numeric(10,2),
  usuario_id uuid,
  event uuid,
  funcion integer,
  processed_by uuid,
  payment_gateway_id uuid,
  fecha timestamptz,
  payments jsonb,
  referrer varchar(255),
  "discountCode" varchar(50),
  "reservationDeadline" timestamptz,
  "user" jsonb
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_payment_transactions_locator
  ON public.payment_transactions(locator);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
  ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant_id
  ON public.payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_funcion_id
  ON public.payment_transactions(funcion_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_evento_id
  ON public.payment_transactions(evento_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
  ON public.payment_transactions(status);

-- Trigger updated_at
DROP TRIGGER IF EXISTS tr_payment_transactions_set_updated_at ON public.payment_transactions;
CREATE TRIGGER tr_payment_transactions_set_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helpers de RLS (ajusta nombres de tabla/campos si difieren)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_role text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO profile_role
  FROM public.profiles
  WHERE id = (SELECT auth.uid());

  RETURN profile_role IN ('SUPER_ADMIN','super_admin','TENANT_ADMIN','tenant_admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid());

  RETURN v_tenant_id;
END;
$$;

-- Políticas RLS para payment_transactions
DROP POLICY IF EXISTS payment_transactions_authenticated_select ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_insert ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_update ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_authenticated_delete ON public.payment_transactions;

CREATE POLICY payment_transactions_authenticated_select ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
    OR public.is_tenant_admin()
  );

CREATE POLICY payment_transactions_authenticated_insert ON public.payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id())
    AND (user_id = auth.uid() OR public.is_tenant_admin())
  );

CREATE POLICY payment_transactions_authenticated_update ON public.payment_transactions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
    OR public.is_tenant_admin()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
    OR public.is_tenant_admin()
  );

CREATE POLICY payment_transactions_authenticated_delete ON public.payment_transactions
  FOR DELETE TO authenticated
  USING (public.is_tenant_admin());

-- =====================================================
-- TABLA: seat_locks
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seat_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id text NOT NULL,
  table_id text,
  funcion_id integer NOT NULL,
  locked_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  status text DEFAULT 'locked',
  lock_type text DEFAULT 'seat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tenant_id uuid,
  locator varchar(255),
  user_id uuid,
  session_id text,
  zona_id text,
  zona_nombre text,
  precio numeric(10,2),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_seat_locks_seat_id
  ON public.seat_locks(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_funcion_id
  ON public.seat_locks(funcion_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_locator
  ON public.seat_locks(locator);
CREATE INDEX IF NOT EXISTS idx_seat_locks_session_id
  ON public.seat_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_status
  ON public.seat_locks(status);

-- Trigger updated_at
DROP TRIGGER IF EXISTS tr_seat_locks_set_updated_at ON public.seat_locks;
CREATE TRIGGER tr_seat_locks_set_updated_at
BEFORE UPDATE ON public.seat_locks
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS
ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seat_locks_public_select ON public.seat_locks;
DROP POLICY IF EXISTS seat_locks_public_insert ON public.seat_locks;
DROP POLICY IF EXISTS seat_locks_public_update ON public.seat_locks;
DROP POLICY IF EXISTS seat_locks_public_delete ON public.seat_locks;
DROP POLICY IF EXISTS seat_locks_authenticated_select ON public.seat_locks;
DROP POLICY IF EXISTS seat_locks_authenticated_update ON public.seat_locks;
DROP POLICY IF EXISTS seat_locks_authenticated_delete ON public.seat_locks;

-- Permitir a la tienda (anon) ver/crear/actualizar sus locks vía session_id
CREATE POLICY seat_locks_public_select ON public.seat_locks
  FOR SELECT TO anon
  USING (true);

CREATE POLICY seat_locks_public_insert ON public.seat_locks
  FOR INSERT TO anon
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY seat_locks_public_update ON public.seat_locks
  FOR UPDATE TO anon
  USING (session_id IS NOT NULL)
  WITH CHECK (session_id IS NOT NULL);

-- Usuarios autenticados (por user_id o tenant) y admins
CREATE POLICY seat_locks_authenticated_select ON public.seat_locks
  FOR SELECT TO authenticated
  USING (
    session_id IS NOT NULL
    OR user_id = auth.uid()
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
    OR public.is_tenant_admin()
  );

CREATE POLICY seat_locks_authenticated_update ON public.seat_locks
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR session_id IS NOT NULL
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
    OR public.is_tenant_admin()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR session_id IS NOT NULL
    OR (tenant_id IS NOT NULL AND tenant_id = public.get_user_tenant_id())
    OR public.is_tenant_admin()
  );

CREATE POLICY seat_locks_authenticated_delete ON public.seat_locks
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_tenant_admin()
  );

-- =====================================================
-- NOTAS
-- - Si tu tabla de perfiles no es public.profiles o el campo rol/tenant difiere,
--   ajusta las funciones is_tenant_admin() y get_user_tenant_id().
-- - Valora un TTL para seat_locks (e.g., job que borre/expire por expires_at).
-- =====================================================
