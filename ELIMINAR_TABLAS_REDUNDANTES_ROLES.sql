-- =====================================================
-- 🗑️ ELIMINAR TABLAS REDUNDANTES - ROLES Y USUARIOS
-- =====================================================
-- 
-- ✅ Este script elimina tablas redundantes identificadas
-- ✅ en el sistema de roles, usuarios y tags
-- ✅ para simplificar la base de datos
--
-- =====================================================

-- 👥 ELIMINAR TABLAS DE ROLES REDUNDANTES
DROP TABLE IF EXISTS public.user_roles CASCADE; -- Redundante con tenant_user_roles

-- 🏷️ ELIMINAR TABLAS DE TAGS REDUNDANTES
DROP TABLE IF EXISTS public.user_tag_relations CASCADE; -- Redundante con user_tags
DROP TABLE IF EXISTS public.crm_tags CASCADE; -- Consolidar con tags

-- 👤 ELIMINAR TABLAS DE USUARIOS REDUNDANTES
DROP TABLE IF EXISTS public.user_tenants CASCADE; -- Redundante con user_tenant_info
DROP TABLE IF EXISTS public.user_tenants_overview CASCADE; -- Vista redundante
DROP TABLE IF EXISTS public.user_favorites CASCADE; -- No se usa realmente

-- 🏢 ELIMINAR TABLAS CRM REDUNDANTES
DROP TABLE IF EXISTS public.crm_clients CASCADE; -- Duplicado de clientes

-- =====================================================
-- ✅ RESULTADO:
-- ✅ -6 tablas redundantes eliminadas
-- ✅ Sistema de roles simplificado
-- ✅ Sistema de tags consolidado
-- ✅ Sistema de usuarios optimizado
-- ✅ Base de datos más limpia y eficiente
-- =====================================================
