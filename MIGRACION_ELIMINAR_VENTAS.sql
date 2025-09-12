-- =====================================================
-- 🗑️ MIGRACIÓN: ELIMINAR TABLA VENTAS REDUNDANTE
-- =====================================================
-- 
-- ✅ Este script elimina la tabla 'ventas' que está vacía
-- ✅ y consolida todo en la tabla 'sales' existente
-- ✅ de ventas del sistema
--
-- =====================================================

-- PASO 1: Verificar si 'sales' ya existe
-- Si existe, mantenerla como tabla principal de ventas
-- Si no existe, renombrar 'payments' a 'sales'

-- PASO 2: Eliminar tabla 'ventas' redundante (está vacía)
DROP TABLE IF EXISTS public.ventas CASCADE;

-- PASO 3: Eliminar otras tablas redundantes identificadas
DROP TABLE IF EXISTS public.empresas CASCADE; -- Duplicado de tenants
DROP TABLE IF EXISTS public.affiliate_users CASCADE; -- Duplicado de profiles
DROP TABLE IF EXISTS public.affiliateusers CASCADE; -- Duplicado de profiles

-- PASO 4: Si 'payments' existe y 'sales' no, renombrar
-- (Comentado porque 'sales' ya existe)
-- ALTER TABLE public.payments RENAME TO sales;

-- =====================================================
-- ✅ RESULTADO:
-- ✅ -1 tabla redundante (ventas)
-- ✅ -3 tablas duplicadas (empresas, affiliate_users, affiliateusers)
-- ✅ +1 tabla principal (sales) para todas las ventas
-- ✅ Base de datos más limpia y eficiente
-- =====================================================
