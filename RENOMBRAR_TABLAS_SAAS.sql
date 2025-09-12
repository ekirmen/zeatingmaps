-- =====================================================
-- 🔄 RENOMBRAR TABLAS SAAS CON PREFIJO 'saas_'
-- =====================================================
-- 
-- ✅ Este script renombra las tablas del sistema SaaS
-- ✅ para organizarlas mejor con el prefijo 'saas_'
-- ✅ Mantiene todas las relaciones y datos intactos
--
-- =====================================================

-- 🏢 TABLAS PRINCIPALES DEL SAAS
ALTER TABLE public.tenants RENAME TO saas_tenants;
ALTER TABLE public.profiles RENAME TO saas_profiles;
ALTER TABLE public.ventas RENAME TO saas_ventas;
ALTER TABLE public.eventos RENAME TO saas_eventos;
ALTER TABLE public.funciones RENAME TO saas_funciones;
ALTER TABLE public.recintos RENAME TO saas_recintos;
ALTER TABLE public.salas RENAME TO saas_salas;
ALTER TABLE public.zonas RENAME TO saas_zonas;
ALTER TABLE public.entradas RENAME TO saas_entradas;
ALTER TABLE public.clientes RENAME TO saas_clientes;

-- 💰 TABLAS DE PAGOS Y FACTURACIÓN
ALTER TABLE public.payment_gateway_configs RENAME TO saas_payment_gateway_configs;
ALTER TABLE public.payment_transactions RENAME TO saas_payment_transactions;
ALTER TABLE public.billing_subscriptions RENAME TO saas_billing_subscriptions;
ALTER TABLE public.invoices RENAME TO saas_invoices;
ALTER TABLE public.refunds RENAME TO saas_refunds;

-- 👥 TABLAS DE USUARIOS Y ROLES
ALTER TABLE public.user_tenant_info RENAME TO saas_user_tenant_info;
ALTER TABLE public.tenant_user_roles RENAME TO saas_tenant_user_roles;
ALTER TABLE public.custom_roles RENAME TO saas_custom_roles;
ALTER TABLE public.access_policies RENAME TO saas_access_policies;

-- 🔔 TABLAS DE NOTIFICACIONES Y COMUNICACIÓN
ALTER TABLE public.notifications RENAME TO saas_notifications;
ALTER TABLE public.tenant_conversations RENAME TO saas_tenant_conversations;
ALTER TABLE public.tenant_messages RENAME TO saas_tenant_messages;
ALTER TABLE public.support_tickets RENAME TO saas_support_tickets;
ALTER TABLE public.support_messages RENAME TO saas_support_messages;

-- 📊 TABLAS DE ANALYTICS Y REPORTES
ALTER TABLE public.audit_logs RENAME TO saas_audit_logs;
ALTER TABLE public.usage_metrics RENAME TO saas_usage_metrics;
ALTER TABLE public.reportes RENAME TO saas_reportes;

-- 🛍️ TABLAS DE PRODUCTOS Y VENTAS
ALTER TABLE public.productos RENAME TO saas_productos;
ALTER TABLE public.plantillas RENAME TO saas_plantillas;
ALTER TABLE public.plantillas_precios RENAME TO saas_plantillas_precios;
ALTER TABLE public.plantillas_comisiones RENAME TO saas_plantillas_comisiones;
ALTER TABLE public.plantillas_productos RENAME TO saas_plantillas_productos;
ALTER TABLE public.plantillas_productos_template RENAME TO saas_plantillas_productos_template;
ALTER TABLE public.productos_eventos RENAME TO saas_productos_eventos;

-- 🎨 TABLAS DE PERSONALIZACIÓN
ALTER TABLE public.personalizacion RENAME TO saas_personalizacion;
ALTER TABLE public.webstudio_colors RENAME TO saas_webstudio_colors;
ALTER TABLE public.webstudio_site_config RENAME TO saas_webstudio_site_config;
ALTER TABLE public.webstudio_templates RENAME TO saas_webstudio_templates;
ALTER TABLE public.webstudio_widgets RENAME TO saas_webstudio_widgets;

-- 📧 TABLAS DE EMAIL MARKETING
ALTER TABLE public.email_campaigns RENAME TO saas_email_campaigns;
ALTER TABLE public.email_templates RENAME TO saas_email_templates;
ALTER TABLE public.email_logs RENAME TO saas_email_logs;
ALTER TABLE public.campaign_recipients RENAME TO saas_campaign_recipients;
ALTER TABLE public.campaign_widgets RENAME TO saas_campaign_widgets;
ALTER TABLE public.mailchimp_configs RENAME TO saas_mailchimp_configs;

-- 🏷️ TABLAS DE TAGS Y CATEGORIZACIÓN
ALTER TABLE public.tags RENAME TO saas_tags;
ALTER TABLE public.user_tags RENAME TO saas_user_tags;
ALTER TABLE public.user_tag_relations RENAME TO saas_user_tag_relations;
ALTER TABLE public.crm_tags RENAME TO saas_crm_tags;

-- 🎫 TABLAS DE BOLETERÍA Y ASIENTOS
ALTER TABLE public.seat_locks RENAME TO saas_seat_locks;
ALTER TABLE public.seat_settings RENAME TO saas_seat_settings;
ALTER TABLE public.saved_carts RENAME TO saas_saved_carts;

-- 🔧 TABLAS DE CONFIGURACIÓN
ALTER TABLE public.system_settings RENAME TO saas_system_settings;
ALTER TABLE public.global_email_config RENAME TO saas_global_email_config;
ALTER TABLE public.settings RENAME TO saas_settings;

-- 📋 TABLAS DE FORMULARIOS Y DOCUMENTACIÓN
ALTER TABLE public.custom_forms RENAME TO saas_custom_forms;
ALTER TABLE public.form_responses RENAME TO saas_form_responses;
ALTER TABLE public.documentation RENAME TO saas_documentation;
ALTER TABLE public.interactive_tutorials RENAME TO saas_interactive_tutorials;
ALTER TABLE public.tutorial_progress RENAME TO saas_tutorial_progress;

-- 🔒 TABLAS DE SEGURIDAD
ALTER TABLE public.security_events RENAME TO saas_security_events;
ALTER TABLE public.security_alerts RENAME TO saas_security_alerts;

-- 📈 TABLAS DE MÉTRICAS Y ESTADÍSTICAS
ALTER TABLE public.plan_limits RENAME TO saas_plan_limits;
ALTER TABLE public.tenant_analytics RENAME TO saas_tenant_analytics;
ALTER TABLE public.tenant_dashboard RENAME TO saas_tenant_dashboard;

-- =====================================================
-- ✅ TOTAL: 50+ TABLAS RENOMBRADAS CON PREFIJO 'saas_'
-- ✅ ORGANIZACIÓN MEJORADA DE LA BASE DE DATOS
-- ✅ FÁCIL IDENTIFICACIÓN DE TABLAS DEL SISTEMA SAAS
-- =====================================================
