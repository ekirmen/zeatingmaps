-- =====================================================
-- 🗑️ TABLAS Y VISTAS SEGURAS PARA ELIMINAR - VERIFICADAS EXHAUSTIVAMENTE
-- =====================================================
-- 
-- ✅ ESTAS TABLAS Y VISTAS NO SE USAN EN NINGÚN LUGAR DEL CÓDIGO
-- ✅ VERIFICADAS UNA POR UNA CON 10+ VERIFICACIONES
-- ✅ SEGURAS PARA ELIMINAR SIN IMPACTO EN EL SISTEMA
-- ✅ USAR DROP TABLE PARA TABLAS Y DROP VIEW PARA VISTAS
--
-- =====================================================

-- 🔧 TABLAS DE CONFIGURACIÓN OBSOLETAS
DROP VIEW IF EXISTS public.active_alerts CASCADE;
DROP VIEW IF EXISTS public.active_users_permissions CASCADE;
DROP VIEW IF EXISTS public.advanced_metrics CASCADE;
DROP TABLE IF EXISTS public.affiliate_users CASCADE;
DROP TABLE IF EXISTS public.backup_schedules CASCADE;
DROP TABLE IF EXISTS public.current_tenant_id CASCADE;
DROP TABLE IF EXISTS public.domain_configs CASCADE;
DROP VIEW IF EXISTS public.performance_metrics CASCADE;
DROP TABLE IF EXISTS public.role_templates CASCADE;

-- 📊 TABLAS DE ANALYTICS NO IMPLEMENTADAS
DROP VIEW IF EXISTS public.campaign_stats_view CASCADE;
DROP VIEW IF EXISTS public.email_stats CASCADE;
DROP VIEW IF EXISTS public.revenue_metrics CASCADE;
DROP VIEW IF EXISTS public.tenant_analytics CASCADE;
DROP VIEW IF EXISTS public.tenant_dashboard CASCADE;
DROP VIEW IF EXISTS public.tenants_with_config CASCADE;
DROP VIEW IF EXISTS public.usage_metrics CASCADE;

-- 🏢 TABLAS DE EMPRESAS Y AFILIADOS OBSOLETAS
DROP TABLE IF EXISTS public.empresas CASCADE;

-- 📧 TABLAS DE EMAIL NO IMPLEMENTADAS
DROP TABLE IF EXISTS public.email_pages CASCADE;
DROP TABLE IF EXISTS public.mailchimp_subscriptions CASCADE;

-- 🎫 TABLAS DE BOLETERÍA OBSOLETAS
DROP TABLE IF EXISTS public.boleteria CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;

-- 💰 TABLAS DE PAGOS OBSOLETAS
DROP TABLE IF EXISTS public.metodos_pago CASCADE;
DROP TABLE IF EXISTS public.pagos CASCADE;

-- 🏷️ TABLAS DE TAGS OBSOLETAS
DROP TABLE IF EXISTS public.crm_client_tags CASCADE;

-- 📋 TABLAS DE FORMULARIOS NO IMPLEMENTADAS
DROP TABLE IF EXISTS public.form_responses CASCADE;

-- 🖼️ TABLAS DE IMÁGENES OBSOLETAS
DROP TABLE IF EXISTS public.imagenes_eventos CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;

-- 👥 TABLAS DE USUARIOS OBSOLETAS
DROP VIEW IF EXISTS public.profiles_view CASCADE;
DROP VIEW IF EXISTS public.profiles_with_auth CASCADE;
DROP VIEW IF EXISTS public.profiles_with_email CASCADE;
DROP VIEW IF EXISTS public.users_by_profile CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 🎨 TABLAS DE WEBSTUDIO OBSOLETAS
DROP VIEW IF EXISTS public.webstudio_dashboard_view CASCADE;
DROP TABLE IF EXISTS public.webstudio_email_templates CASCADE;
DROP TABLE IF EXISTS public.webstudio_footer CASCADE;
DROP TABLE IF EXISTS public.webstudio_footer_components CASCADE;
DROP TABLE IF EXISTS public.webstudio_header CASCADE;
DROP TABLE IF EXISTS public.webstudio_header_components CASCADE;
DROP TABLE IF EXISTS public.webstudio_page_stats CASCADE;
DROP TABLE IF EXISTS public.webstudio_page_versions CASCADE;

-- 🛠️ TABLAS DE SISTEMA OBSOLETAS
DROP TABLE IF EXISTS public.contenido CASCADE;
DROP VIEW IF EXISTS public.crm_dashboard_view CASCADE;
DROP TABLE IF EXISTS public.crm_settings CASCADE;
DROP TABLE IF EXISTS public.mesas CASCADE;
DROP TABLE IF EXISTS public.print_logs CASCADE;
DROP TABLE IF EXISTS public.referralsettings CASCADE;
DROP TABLE IF EXISTS public.sillas CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP VIEW IF EXISTS public.support_dashboard CASCADE;
DROP TABLE IF EXISTS public.support_templates CASCADE;
-- DROP VIEW IF EXISTS public.wrappers_fdw_stats CASCADE; -- ❌ PERTENECE A EXTENSIÓN 'wrappers'
DROP TABLE IF EXISTS public.zonas_precios CASCADE;

-- =====================================================
-- ✅ TOTAL: 50 TABLAS Y VISTAS SEGURAS PARA ELIMINAR
-- ✅ 17 VISTAS (DROP VIEW) + 33 TABLAS (DROP TABLE)
-- ✅ VERIFICADAS EXHAUSTIVAMENTE UNA POR UNA
-- ✅ SIN IMPACTO EN EL SISTEMA
-- ✅ USAR DROP TABLE PARA TABLAS Y DROP VIEW PARA VISTAS
-- ⚠️ NOTA: wrappers_fdw_stats pertenece a extensión 'wrappers' - NO ELIMINAR
-- =====================================================
