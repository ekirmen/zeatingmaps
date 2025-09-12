-- =====================================================
-- 🗑️ MIGRACIÓN CORREGIDA: ELIMINAR TABLA VENTAS REDUNDANTE
-- =====================================================
-- 
-- ✅ Este script elimina la tabla 'ventas' que está vacía
-- ✅ y mantiene 'sales' como tabla principal de ventas
-- ✅ (ya que 'sales' ya existe en la base de datos)
--
-- =====================================================

-- PASO 1: Eliminar tabla 'ventas' redundante (está vacía)
DROP TABLE IF EXISTS public.ventas CASCADE;

-- PASO 2: Eliminar otras tablas redundantes identificadas
DROP TABLE IF EXISTS public.empresas CASCADE; -- Duplicado de tenants
DROP TABLE IF EXISTS public.affiliate_users CASCADE; -- Duplicado de profiles
DROP TABLE IF EXISTS public.affiliateusers CASCADE; -- Duplicado de profiles

-- =====================================================
-- ✅ RESULTADO:
-- ✅ -1 tabla redundante (ventas)
-- ✅ -3 tablas duplicadas (empresas, affiliate_users, affiliateusers)
-- ✅ Mantiene 'sales' como tabla principal de ventas
-- ✅ Base de datos más limpia y eficiente
-- =====================================================
