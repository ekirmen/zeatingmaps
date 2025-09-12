# 🔄 ACTUALIZAR REFERENCIAS DE TABLAS SAAS

## 📋 **TABLAS RENOMBRADAS**

### **🏢 Tablas Principales:**
- `tenants` → `saas_tenants`
- `profiles` → `saas_profiles`
- `ventas` → `saas_ventas`
- `eventos` → `saas_eventos`
- `funciones` → `saas_funciones`
- `recintos` → `saas_recintos`
- `salas` → `saas_salas`
- `zonas` → `saas_zonas`
- `entradas` → `saas_entradas`
- `clientes` → `saas_clientes`

### **💰 Tablas de Pagos:**
- `payment_gateway_configs` → `saas_payment_gateway_configs`
- `payment_transactions` → `saas_payment_transactions`
- `billing_subscriptions` → `saas_billing_subscriptions`
- `invoices` → `saas_invoices`
- `refunds` → `saas_refunds`

### **👥 Tablas de Usuarios:**
- `user_tenant_info` → `saas_user_tenant_info`
- `tenant_user_roles` → `saas_tenant_user_roles`
- `custom_roles` → `saas_custom_roles`
- `access_policies` → `saas_access_policies`

### **🔔 Tablas de Comunicación:**
- `notifications` → `saas_notifications`
- `tenant_conversations` → `saas_tenant_conversations`
- `tenant_messages` → `saas_tenant_messages`
- `support_tickets` → `saas_support_tickets`
- `support_messages` → `saas_support_messages`

### **📊 Tablas de Analytics:**
- `audit_logs` → `saas_audit_logs`
- `usage_metrics` → `saas_usage_metrics`
- `reportes` → `saas_reportes`

### **🛍️ Tablas de Productos:**
- `productos` → `saas_productos`
- `plantillas` → `saas_plantillas`
- `plantillas_precios` → `saas_plantillas_precios`
- `plantillas_comisiones` → `saas_plantillas_comisiones`
- `plantillas_productos` → `saas_plantillas_productos`
- `plantillas_productos_template` → `saas_plantillas_productos_template`
- `productos_eventos` → `saas_productos_eventos`

### **🎨 Tablas de Personalización:**
- `personalizacion` → `saas_personalizacion`
- `webstudio_colors` → `saas_webstudio_colors`
- `webstudio_site_config` → `saas_webstudio_site_config`
- `webstudio_templates` → `saas_webstudio_templates`
- `webstudio_widgets` → `saas_webstudio_widgets`

### **📧 Tablas de Email:**
- `email_campaigns` → `saas_email_campaigns`
- `email_templates` → `saas_email_templates`
- `email_logs` → `saas_email_logs`
- `campaign_recipients` → `saas_campaign_recipients`
- `campaign_widgets` → `saas_campaign_widgets`
- `mailchimp_configs` → `saas_mailchimp_configs`

### **🏷️ Tablas de Tags:**
- `tags` → `saas_tags`
- `user_tags` → `saas_user_tags`
- `user_tag_relations` → `saas_user_tag_relations`
- `crm_tags` → `saas_crm_tags`

### **🎫 Tablas de Boletería:**
- `seat_locks` → `saas_seat_locks`
- `seat_settings` → `saas_seat_settings`
- `saved_carts` → `saas_saved_carts`

### **🔧 Tablas de Configuración:**
- `system_settings` → `saas_system_settings`
- `global_email_config` → `saas_global_email_config`
- `settings` → `saas_settings`

### **📋 Tablas de Formularios:**
- `custom_forms` → `saas_custom_forms`
- `form_responses` → `saas_form_responses`
- `documentation` → `saas_documentation`
- `interactive_tutorials` → `saas_interactive_tutorials`
- `tutorial_progress` → `saas_tutorial_progress`

### **🔒 Tablas de Seguridad:**
- `security_events` → `saas_security_events`
- `security_alerts` → `saas_security_alerts`

### **📈 Tablas de Métricas:**
- `plan_limits` → `saas_plan_limits`
- `tenant_analytics` → `saas_tenant_analytics`
- `tenant_dashboard` → `saas_tenant_dashboard`

## 🔧 **ARCHIVOS A ACTUALIZAR**

### **1. Servicios SaaS:**
- `src/saas/services/analyticsService.js`
- `src/saas/services/auditService.js`
- `src/saas/services/billingService.js`
- `src/saas/services/notificationService.js`
- `src/saas/services/supportService.js`
- `src/saas/services/accessControlService.js`
- `src/saas/services/paymentGatewayService.js`

### **2. Componentes SaaS:**
- `src/saas/components/UserManagement.jsx`
- `src/saas/components/UserManagementSimple.jsx`
- `src/saas/components/SaaSMessaging.jsx`
- `src/saas/components/TenantMessaging.jsx`
- `src/saas/components/DocumentationCenter.jsx`
- `src/saas/components/InteractiveTutorials.jsx`
- `src/saas/components/SecurityMonitoring.jsx`

### **3. APIs:**
- `pages/api/analytics/sales-report.js`
- `pages/api/saas/dashboard-stats.js`
- `pages/api/grid-sale/process-sale.js`

### **4. Páginas del Backoffice:**
- `src/backoffice/pages/Reports.js`
- `src/backoffice/pages/SaasDashboard.jsx`
- `src/backoffice/pages/TenantDetail.jsx`

## ⚠️ **IMPORTANTE**

1. **Ejecutar primero** el script SQL `RENOMBRAR_TABLAS_SAAS.sql`
2. **Luego actualizar** todas las referencias en el código
3. **Probar** que todo funcione correctamente
4. **Hacer backup** antes de ejecutar los cambios

## 🚀 **COMANDO PARA BUSCAR Y REEMPLAZAR**

```bash
# Buscar todas las referencias a las tablas
grep -r "\.from(['\"]tenants['\"]" src/
grep -r "\.from(['\"]profiles['\"]" src/
grep -r "\.from(['\"]ventas['\"]" src/
grep -r "\.from(['\"]eventos['\"]" src/
grep -r "\.from(['\"]funciones['\"]" src/
grep -r "\.from(['\"]recintos['\"]" src/
grep -r "\.from(['\"]salas['\"]" src/
grep -r "\.from(['\"]zonas['\"]" src/
grep -r "\.from(['\"]entradas['\"]" src/
grep -r "\.from(['\"]clientes['\"]" src/
```
