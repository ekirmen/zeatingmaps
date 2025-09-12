# 🧹 GUÍA DE LIMPIEZA MASIVA DE BASE DE DATOS

## 📋 **RESUMEN EJECUTIVO**

### **🎯 OBJETIVO:**
Eliminar 50+ tablas vacías y redundantes, reduciendo de 80+ tablas a ~25 tablas críticas (70% reducción).

### **✅ BENEFICIOS:**
- **Mejor rendimiento** - Menos tablas que consultar
- **Mantenimiento simplificado** - Solo tablas necesarias
- **Backup más rápido** - Menos datos que respaldar
- **Código más limpio** - Sin confusión de tablas

---

## 🚀 **PLAN DE EJECUCIÓN POR FASES**

### **📋 FASE 1: TABLAS VACÍAS (SEGURA)**
**Archivo:** `FASE1_ELIMINAR_TABLAS_VACIAS.sql`

**Elimina 35+ tablas con 0 filas:**
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

**✅ Esta fase es SEGURA - solo elimina tablas sin datos**

### **📋 FASE 2: TABLAS REDUNDANTES (CUIDADO)**
**Archivo:** `FASE2_ELIMINAR_TABLAS_REDUNDANTES.sql`

**Elimina 5+ tablas redundantes:**
- `profiles_backup` - Backup temporal
- `access_policies` - Redundante con RLS
- `custom_roles` - Redundante con `tenant_user_roles`
- `notifications` - No se usa
- `sales` - Vacía, `payments` tiene datos

**⚠️ Esta fase requiere CUIDADO - verificar antes de ejecutar**

### **📋 FASE 3: VERIFICACIÓN FINAL**
**Archivo:** `VERIFICACION_FINAL_LIMPIEZA.sql`

**Verifica que:**
- Las tablas críticas siguen existiendo
- No hay tablas huérfanas
- El sistema funciona correctamente

---

## 🎯 **TABLAS CRÍTICAS MANTENIDAS (25 tablas)**

### **🏗️ CORE DEL SISTEMA (8 tablas):**
- `profiles` - Usuarios principales
- `tenants` - Multi-tenancy
- `eventos` - Eventos principales
- `funciones` - Funciones de eventos
- `recintos` - Venues/recintos
- `salas` - Salas de recintos
- `mapas` - Mapas de asientos
- `zonas` - Zonas de asientos

### **💳 SISTEMA DE PAGOS (5 tablas):**
- `payments` - Pagos principales
- `payment_transactions` - Transacciones
- `payment_gateways` - Pasarelas de pago
- `payment_gateway_configs` - Configuraciones
- `comisiones_tasas` - Comisiones

### **🎫 SISTEMA DE ENTRADAS (4 tablas):**
- `entradas` - Entradas vendidas
- `seat_locks` - Bloqueos de asientos
- `reservas` - Reservas
- `reservations` - Reservaciones

### **👥 GESTIÓN DE USUARIOS (6 tablas):**
- `tenant_user_roles` - Roles por tenant
- `user_recinto_assignments` - Asignación recintos
- `user_tags` - Tags de usuarios
- `user_tenant_assignments` - Asignación tenants
- `user_tenant_info` - Info por tenant
- `user_activity_log` - Log de actividad

### **📧 SISTEMA DE EMAIL (3 tablas):**
- `email_templates` - Plantillas email
- `email_campaigns` - Campañas email
- `global_email_config` - Configuración global

### **⚙️ CONFIGURACIÓN (3 tablas):**
- `settings` - Configuraciones
- `ivas` - IVAs
- `tags` - Tags generales

---

## ⚠️ **INSTRUCCIONES DE SEGURIDAD**

### **🔒 ANTES DE EJECUTAR:**
1. **HACER BACKUP COMPLETO** de la base de datos
2. **Probar en ambiente de desarrollo** primero
3. **Verificar que no hay dependencias** en el código
4. **Ejecutar por fases** - no todo de una vez

### **📋 ORDEN DE EJECUCIÓN:**
1. **Ejecutar FASE 1** (tablas vacías) - SEGURA
2. **Probar funcionalidad** del sistema
3. **Ejecutar FASE 2** (tablas redundantes) - CUIDADO
4. **Probar funcionalidad** del sistema
5. **Ejecutar VERIFICACIÓN FINAL**
6. **Confirmar que todo funciona**

### **🚨 EN CASO DE ERROR:**
1. **Detener inmediatamente** la ejecución
2. **Restaurar desde backup** si es necesario
3. **Revisar dependencias** en el código
4. **Corregir y reintentar**

---

## 📊 **MÉTRICAS ESPERADAS**

### **📈 ANTES DE LIMPIEZA:**
- **80+ tablas** en la base de datos
- **Complejidad alta** - muchas tablas vacías
- **Mantenimiento difícil** - confusión de tablas
- **Backup lento** - muchas tablas innecesarias

### **📈 DESPUÉS DE LIMPIEZA:**
- **~25 tablas** críticas
- **70% reducción** en complejidad
- **Mantenimiento simplificado** - solo tablas necesarias
- **Backup más rápido** - menos datos que respaldar

---

## 🎯 **PRÓXIMOS PASOS**

### **✅ INMEDIATOS:**
1. Ejecutar FASE 1 (tablas vacías)
2. Probar funcionalidad del sistema
3. Ejecutar FASE 2 (tablas redundantes)
4. Verificación final

### **✅ A MEDIANO PLAZO:**
1. Monitorear rendimiento del sistema
2. Documentar cambios realizados
3. Capacitar al equipo sobre la nueva estructura
4. Implementar mejores prácticas de mantenimiento

---

## 📞 **SOPORTE**

Si encuentras algún problema durante la ejecución:
1. **Detener inmediatamente** la ejecución
2. **Revisar logs** de error
3. **Verificar dependencias** en el código
4. **Restaurar desde backup** si es necesario

**¡La limpieza de la base de datos te dará un sistema mucho más eficiente y fácil de mantener!** 🚀
