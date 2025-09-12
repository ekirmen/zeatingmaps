-- =====================================================
-- 🧹 FASE 1: ELIMINAR TABLAS VACÍAS (0 filas)
-- =====================================================
-- Esta fase es SEGURA - solo elimina tablas sin datos
-- =====================================================

-- ⚠️  IMPORTANTE: HACER BACKUP ANTES DE EJECUTAR
-- ⚠️  Esta fase elimina 35+ tablas vacías

-- =====================================================
-- 🗑️ CRM y Marketing (no se usan)
-- =====================================================
DROP TABLE IF EXISTS crm_interactions CASCADE;
DROP TABLE IF EXISTS crm_notes CASCADE;
DROP TABLE IF EXISTS crm_opportunities CASCADE;
DROP TABLE IF EXISTS crm_tasks CASCADE;
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS campaign_widgets CASCADE;

-- =====================================================
-- 🗑️ Email y Notificaciones (no se usan)
-- =====================================================
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_template_assets CASCADE;
DROP TABLE IF EXISTS email_template_variables CASCADE;
DROP TABLE IF EXISTS push_notifications CASCADE;
DROP TABLE IF EXISTS push_notifications_config CASCADE;
DROP TABLE IF EXISTS saas_notifications CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- =====================================================
-- 🗑️ Productos y Plantillas (no se usan)
-- =====================================================
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS productos_eventos CASCADE;
DROP TABLE IF EXISTS plantillas_comisiones CASCADE;
DROP TABLE IF EXISTS plantillas_precios CASCADE;
DROP TABLE IF EXISTS plantillas_productos CASCADE;
DROP TABLE IF EXISTS custom_forms CASCADE;

-- =====================================================
-- 🗑️ Imágenes y Galería (no se usan)
-- =====================================================
DROP TABLE IF EXISTS imagenes CASCADE;
DROP TABLE IF EXISTS galeria CASCADE;
DROP TABLE IF EXISTS evento_imagenes CASCADE;
DROP TABLE IF EXISTS recinto_imagenes CASCADE;

-- =====================================================
-- 🗑️ Reservas y Carritos (no se usan)
-- =====================================================
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS saved_carts CASCADE;
DROP TABLE IF EXISTS abonos CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;

-- =====================================================
-- 🗑️ Configuraciones Avanzadas (no se usan)
-- =====================================================
DROP TABLE IF EXISTS event_theme_settings CASCADE;
DROP TABLE IF EXISTS seat_settings CASCADE;
DROP TABLE IF EXISTS tenant_theme_settings CASCADE;
DROP TABLE IF EXISTS webstudio_templates CASCADE;
DROP TABLE IF EXISTS webstudio_colors CASCADE;
DROP TABLE IF EXISTS webstudio_site_config CASCADE;
DROP TABLE IF EXISTS webstudio_widgets CASCADE;

-- =====================================================
-- 🗑️ Sistema y Métricas (no se usan)
-- =====================================================
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS plan_limits CASCADE;
DROP TABLE IF EXISTS printer_formats CASCADE;
DROP TABLE IF EXISTS report_templates CASCADE;
DROP TABLE IF EXISTS scheduled_report_executions CASCADE;
DROP TABLE IF EXISTS scheduled_reports CASCADE;

-- =====================================================
-- 🗑️ Soporte y Comunicación (no se usan)
-- =====================================================
DROP TABLE IF EXISTS support_responses CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS tenant_conversations CASCADE;
DROP TABLE IF EXISTS tenant_message_attachments CASCADE;
DROP TABLE IF EXISTS tenant_messages CASCADE;
DROP TABLE IF EXISTS tenant_notifications CASCADE;
DROP TABLE IF EXISTS tenant_email_config CASCADE;

-- =====================================================
-- 🗑️ Facturación y Pagos (no se usan)
-- =====================================================
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS billing_subscriptions CASCADE;
DROP TABLE IF EXISTS descuentos CASCADE;

-- =====================================================
-- 🗑️ Integraciones (no se usan)
-- =====================================================
DROP TABLE IF EXISTS facebook_pixels CASCADE;
DROP TABLE IF EXISTS mailchimp_configs CASCADE;

-- =====================================================
-- 🗑️ Backups y Logs (no se usan)
-- =====================================================
DROP TABLE IF EXISTS backups CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- =====================================================
-- ✅ VERIFICACIÓN FASE 1
-- =====================================================

-- Contar tablas restantes
SELECT COUNT(*) as tablas_restantes_fase1 FROM pg_tables WHERE schemaname = 'public';

-- Mostrar tablas restantes
SELECT tablename, n_tup_ins as filas_estimadas 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 📊 RESUMEN FASE 1
-- =====================================================
/*
TABLAS ELIMINADAS EN FASE 1: 35+ tablas vacías
- CRM y Marketing (6 tablas)
- Email y Notificaciones (7 tablas)
- Productos y Plantillas (6 tablas)
- Imágenes y Galería (4 tablas)
- Reservas y Carritos (5 tablas)
- Configuraciones Avanzadas (7 tablas)
- Sistema y Métricas (7 tablas)
- Soporte y Comunicación (7 tablas)
- Facturación y Pagos (3 tablas)
- Integraciones (2 tablas)
- Backups y Logs (2 tablas)

PRÓXIMO PASO: Ejecutar FASE 2 (tablas redundantes)
*/
