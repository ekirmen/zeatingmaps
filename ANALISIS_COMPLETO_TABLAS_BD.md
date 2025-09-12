# 🔍 ANÁLISIS COMPLETO DE TODAS LAS TABLAS DE LA BASE DE DATOS

## 📊 **CLASIFICACIÓN POR IMPORTANCIA:**

### **✅ TABLAS CRÍTICAS (MANTENER - 25 tablas):**

#### **🎯 CORE DEL SISTEMA:**
- `profiles` - Usuarios principales (4 filas, 392 kB)
- `tenants` - Multi-tenancy (3 filas, 208 kB)
- `eventos` - Eventos principales (1 fila, 176 kB)
- `funciones` - Funciones de eventos (1 fila, 392 kB)
- `recintos` - Venues/recintos (2 filas, 80 kB)
- `salas` - Salas de recintos (1 fila, 56 kB)
- `mapas` - Mapas de asientos (1 fila, 5856 kB)
- `zonas` - Zonas de asientos (2 filas, 64 kB)

#### **💳 SISTEMA DE PAGOS:**
- `payments` - Pagos principales (2 filas, 160 kB)
- `payment_transactions` - Transacciones (7 filas, 208 kB)
- `payment_gateways` - Pasarelas de pago (15 filas, 80 kB)
- `payment_gateway_configs` - Configuraciones (3 filas, 96 kB)
- `comisiones_tasas` - Comisiones (8 filas, 80 kB)

#### **🎫 SISTEMA DE ENTRADAS:**
- `entradas` - Entradas vendidas (2 filas, 48 kB)
- `seat_locks` - Bloqueos de asientos (17 filas, 248 kB)
- `reservas` - Reservas (0 filas, 56 kB)
- `reservations` - Reservaciones (0 filas, 72 kB)

#### **👥 GESTIÓN DE USUARIOS:**
- `tenant_user_roles` - Roles por tenant (6 filas, 40 kB)
- `user_recinto_assignments` - Asignación recintos (0 filas, 40 kB)
- `user_tags` - Tags de usuarios (6 filas, 64 kB)
- `user_tenant_assignments` - Asignación tenants (0 filas, 48 kB)
- `user_tenant_info` - Info por tenant (6 filas, 40 kB)
- `user_activity_log` - Log de actividad (0 filas, 48 kB)

#### **📧 SISTEMA DE EMAIL:**
- `email_templates` - Plantillas email (7 filas, 112 kB)
- `email_campaigns` - Campañas email (1 fila, 96 kB)
- `global_email_config` - Configuración global (0 filas, 16 kB)

#### **⚙️ CONFIGURACIÓN:**
- `settings` - Configuraciones (10 filas, 64 kB)
- `ivas` - IVAs (4 filas, 48 kB)
- `tags` - Tags generales (7 filas, 96 kB)

---

### **❌ TABLAS VACÍAS/REDUNDANTES (ELIMINAR - 35+ tablas):**

#### **🗑️ TABLAS VACÍAS (0 filas):**
- `abonos` - Sin datos
- `admin_notifications` - Sin datos
- `backups` - Sin datos
- `billing_subscriptions` - Sin datos
- `campaign_recipients` - Sin datos
- `campaign_widgets` - Sin datos
- `crm_interactions` - Sin datos
- `crm_notes` - Sin datos
- `crm_opportunities` - Sin datos
- `crm_tasks` - Sin datos
- `custom_forms` - Sin datos
- `descuentos` - Sin datos
- `email_logs` - Sin datos
- `email_template_assets` - Sin datos
- `email_template_variables` - Sin datos
- `event_theme_settings` - Sin datos
- `evento_imagenes` - Sin datos
- `facebook_pixels` - Sin datos
- `galeria` - Sin datos
- `imagenes` - Sin datos
- `invoices` - Sin datos
- `mailchimp_configs` - Sin datos
- `notifications` - Sin datos (29 filas pero no se usa)
- `plantillas_comisiones` - Sin datos
- `plantillas_precios` - Sin datos
- `plantillas_productos` - Sin datos
- `productos` - Sin datos
- `productos_eventos` - Sin datos
- `push_notifications` - Sin datos
- `push_notifications_config` - Sin datos
- `recinto_imagenes` - Sin datos
- `refunds` - Sin datos
- `reservas` - Sin datos
- `reservations` - Sin datos
- `saas_notifications` - Sin datos
- `sales` - Sin datos
- `saved_carts` - Sin datos
- `seat_settings` - Sin datos
- `support_responses` - Sin datos
- `support_tickets` - Sin datos
- `system_metrics` - Sin datos
- `system_settings` - Sin datos
- `tenant_conversations` - Sin datos
- `tenant_email_config` - Sin datos
- `tenant_message_attachments` - Sin datos
- `tenant_messages` - Sin datos
- `tenant_notifications` - Sin datos
- `webstudio_templates` - Sin datos

#### **🗑️ TABLAS REDUNDANTES:**
- `profiles_backup` - Backup temporal
- `access_policies` - Redundante con RLS
- `audit_logs` - Solo 1 fila, no crítico
- `custom_roles` - Redundante con tenant_user_roles
- `plan_limits` - No se usa
- `printer_formats` - No se usa
- `report_templates` - No se usa
- `scheduled_report_executions` - No se usa
- `scheduled_reports` - No se usa
- `tenant_theme_settings` - No se usa
- `webstudio_colors` - No se usa
- `webstudio_site_config` - No se usa
- `webstudio_widgets` - No se usa

---

## 🎯 **PLAN DE LIMPIEZA RECOMENDADO:**

### **FASE 1: ELIMINAR TABLAS VACÍAS (35+ tablas)**
```sql
-- Tablas con 0 filas que no se usan
DROP TABLE IF EXISTS abonos CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS backups CASCADE;
-- ... (lista completa en script)
```

### **FASE 2: ELIMINAR TABLAS REDUNDANTES (15+ tablas)**
```sql
-- Tablas redundantes o no usadas
DROP TABLE IF EXISTS profiles_backup CASCADE;
DROP TABLE IF EXISTS access_policies CASCADE;
DROP TABLE IF EXISTS custom_roles CASCADE;
-- ... (lista completa en script)
```

### **FASE 3: VERIFICAR FUNCIONALIDAD**
- Probar sistema completo
- Verificar que no hay errores
- Confirmar que todas las funciones críticas funcionan

---

## 📊 **BENEFICIOS ESPERADOS:**

### **✅ REDUCCIÓN MASIVA:**
- **De 80+ tablas a ~25 tablas** (70% reducción)
- **Eliminación de 50+ tablas vacías/redundantes**
- **Base de datos 3-4x más simple**

### **✅ MEJORAS:**
- **Rendimiento mejorado** - Menos tablas que consultar
- **Mantenimiento simplificado** - Solo tablas necesarias
- **Código más limpio** - Sin confusión de tablas
- **Backup más rápido** - Menos datos que respaldar

### **✅ TABLAS FINALES (25 críticas):**
- Core del sistema (8 tablas)
- Sistema de pagos (5 tablas)
- Sistema de entradas (4 tablas)
- Gestión de usuarios (6 tablas)
- Sistema de email (3 tablas)
- Configuración (3 tablas)

---

## ⚠️ **CONSIDERACIONES:**

1. **Backup completo** antes de eliminar
2. **Verificar dependencias** en el código
3. **Probar funcionalidad** después de cada fase
4. **Eliminar gradualmente** por fases
5. **Documentar cambios** realizados

---

## 🚀 **RECOMENDACIÓN:**

**SÍ, elimina las 50+ tablas vacías/redundantes.** Tu base de datos se simplificará enormemente y será mucho más eficiente.

**¿Quieres que creemos un script de limpieza por fases?**
