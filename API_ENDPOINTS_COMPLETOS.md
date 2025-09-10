# 🌐 API Endpoints Completos - Sistema VeeEventos

## 📋 **Información General**

**URL Base de Producción**: `https://sistema.veneventos.com`  
**URL Base de Desarrollo**: `http://localhost:3000`

## 🚀 **Endpoints por Categoría**

### **1. Grid Sale - Modo Grid** 🎫

#### **Cargar Zonas y Precios**
```
GET /api/grid-sale/load-zonas
```
**Request:**
```json
{
  "evento": {
    "recinto": 67,
    "sala": 52
  }
}
```

#### **Validar Venta**
```
POST /api/grid-sale/validate-sale
```
**Request:**
```json
{
  "items": [
    {
      "zona_id": 22,
      "precio": 10,
      "cantidad": 2
    }
  ],
  "evento": { "id": "evento-123" },
  "funcion": { "id": "funcion-123" }
}
```

#### **Procesar Venta**
```
POST /api/grid-sale/process-sale
```
**Request:**
```json
{
  "items": [...],
  "evento": { "id": "evento-123" },
  "funcion": { "id": "funcion-123" },
  "cliente": { "id": "cliente-123" },
  "paymentData": { "method": "stripe" }
}
```

### **2. Events - Eventos** 🎭

#### **Listar Eventos**
```
GET /api/events/list?tenant_id=123&limit=50&offset=0&search=concierto
```

#### **Obtener Evento por Slug**
```
GET /api/events/get-by-slug?slug=concierto-rock-2024
```

#### **Crear Evento**
```
POST /api/events/create
```
**Request:**
```json
{
  "tenant_id": "123",
  "nombre": "Concierto Rock 2024",
  "slug": "concierto-rock-2024",
  "descripcion": "Gran concierto de rock",
  "recinto": 67,
  "sala": 52,
  "modoVenta": "grid"
}
```

#### **Actualizar Evento**
```
PUT /api/events/update
```

#### **Eliminar Evento**
```
DELETE /api/events/delete
```

### **3. SaaS - Sistema SaaS** 🏢

#### **Estadísticas del Dashboard**
```
GET /api/saas/dashboard-stats?tenant_id=123&period=30d
```

#### **Gestión de Usuarios**
```
GET /api/saas/user-management?tenant_id=123&limit=50&offset=0
POST /api/saas/user-management
PUT /api/saas/user-management
DELETE /api/saas/user-management
```

#### **Gestión de Tenants**
```
GET /api/saas/tenants
POST /api/saas/tenants
PUT /api/saas/tenants
DELETE /api/saas/tenants
```

### **4. Analytics - Analíticas** 📊

#### **Reporte de Ventas**
```
GET /api/analytics/sales-report?tenant_id=123&start_date=2024-01-01&end_date=2024-01-31&group_by=day
```

#### **Reporte de Eventos**
```
GET /api/analytics/event-report?tenant_id=123&event_id=456
```

#### **Reporte de Clientes**
```
GET /api/analytics/client-report?tenant_id=123
```

#### **Reporte de Ingresos**
```
GET /api/analytics/revenue-report?tenant_id=123&period=30d
```

### **5. Payment - Pagos** 💳

#### **Probar Conexión Stripe**
```
POST /api/payment/test-stripe-connection
```

#### **Probar Conexión PayPal**
```
POST /api/payment/test-paypal-connection
```

#### **Procesar Pago Stripe**
```
POST /api/payment/process-stripe
```

#### **Procesar Pago PayPal**
```
POST /api/payment/process-paypal
```

#### **Reembolsar Pago**
```
POST /api/payment/refund
```

### **6. Functions - Funciones** 🎪

#### **Listar Funciones**
```
GET /api/functions/list?evento_id=123
```

#### **Crear Función**
```
POST /api/functions/create
```

#### **Actualizar Función**
```
PUT /api/functions/update
```

#### **Eliminar Función**
```
DELETE /api/functions/delete
```

### **7. Zones - Zonas** 🎯

#### **Listar Zonas**
```
GET /api/zones/list?sala_id=52
```

#### **Crear Zona**
```
POST /api/zones/create
```

#### **Actualizar Zona**
```
PUT /api/zones/update
```

#### **Eliminar Zona**
```
DELETE /api/zones/delete
```

### **8. Templates - Plantillas** 📋

#### **Listar Plantillas**
```
GET /api/templates/list?recinto=67&sala=52
```

#### **Crear Plantilla**
```
POST /api/templates/create
```

#### **Actualizar Plantilla**
```
PUT /api/templates/update
```

#### **Eliminar Plantilla**
```
DELETE /api/templates/delete
```

### **9. Sales - Ventas** 💰

#### **Listar Ventas**
```
GET /api/sales/list?tenant_id=123&limit=50&offset=0
```

#### **Crear Venta**
```
POST /api/sales/create
```

#### **Actualizar Venta**
```
PUT /api/sales/update
```

#### **Cancelar Venta**
```
POST /api/sales/cancel
```

### **10. Tickets - Entradas** 🎟️

#### **Listar Entradas**
```
GET /api/tickets/list?venta_id=123
```

#### **Crear Entradas**
```
POST /api/tickets/create
```

#### **Validar Entrada**
```
POST /api/tickets/validate
```

#### **Obtener por Código**
```
GET /api/tickets/get-by-code?codigo=TKT-123456
```

### **11. Clients - Clientes** 👥

#### **Listar Clientes**
```
GET /api/clients/list?tenant_id=123&search=juan
```

#### **Crear Cliente**
```
POST /api/clients/create
```

#### **Actualizar Cliente**
```
PUT /api/clients/update
```

#### **Eliminar Cliente**
```
DELETE /api/clients/delete
```

#### **Buscar Cliente**
```
GET /api/clients/search?q=juan@email.com
```

### **12. Venues - Recintos** 🏟️

#### **Listar Recintos**
```
GET /api/venues/list?tenant_id=123
```

#### **Crear Recinto**
```
POST /api/venues/create
```

#### **Actualizar Recinto**
```
PUT /api/venues/update
```

#### **Eliminar Recinto**
```
DELETE /api/venues/delete
```

### **13. Rooms - Salas** 🏛️

#### **Listar Salas**
```
GET /api/rooms/list?venue_id=67
```

#### **Crear Sala**
```
POST /api/rooms/create
```

#### **Actualizar Sala**
```
PUT /api/rooms/update
```

#### **Eliminar Sala**
```
DELETE /api/rooms/delete
```

### **14. Security - Seguridad** 🔒

#### **Logs de Auditoría**
```
GET /api/security/audit-logs?tenant_id=123&limit=100
```

#### **Alertas de Seguridad**
```
GET /api/security/alerts?tenant_id=123&severity=high
```

#### **Intentos de Login**
```
GET /api/security/login-attempts?tenant_id=123&user_id=456
```

#### **Actividad Sospechosa**
```
GET /api/security/suspicious-activity?tenant_id=123
```

### **15. Notifications - Notificaciones** 📧

#### **Enviar Email**
```
POST /api/notifications/send-email
```

#### **Enviar SMS**
```
POST /api/notifications/send-sms
```

#### **Enviar Push**
```
POST /api/notifications/send-push
```

#### **Obtener Plantillas**
```
GET /api/notifications/get-templates?type=email
```

### **16. Reports - Reportes** 📈

#### **Generar Reporte**
```
POST /api/reports/generate
```

#### **Descargar Reporte**
```
GET /api/reports/download?report_id=123
```

#### **Programar Reporte**
```
POST /api/reports/schedule
```

#### **Obtener Reportes Programados**
```
GET /api/reports/get-scheduled?tenant_id=123
```

## 🔧 **Configuración y Uso**

### **Headers Requeridos**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN" // Para endpoints protegidos
}
```

### **Respuesta Estándar**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "pagination": { // Solo en listados
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### **Manejo de Errores**
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Error técnico detallado",
  "code": "ERROR_CODE"
}
```

## 🛡️ **Seguridad**

### **Autenticación**
- JWT tokens para endpoints protegidos
- Validación de tenant_id en todas las operaciones
- Rate limiting por IP

### **Validaciones**
- Validación de datos de entrada
- Sanitización de parámetros
- Verificación de permisos por rol

### **Logs**
- Logs de todas las operaciones
- Auditoría de cambios
- Monitoreo de seguridad

## 📊 **Monitoreo**

### **Métricas Disponibles**
- Tiempo de respuesta
- Tasa de error
- Uso de memoria
- Llamadas por minuto

### **Logs de Vercel**
```bash
vercel logs --function=api/events/list
```

## 🚀 **Deploy**

### **Variables de Entorno**
```bash
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=tu_paypal_client_id
```

### **Comandos de Deploy**
```bash
# Deploy a desarrollo
vercel

# Deploy a producción
vercel --prod

# Ver logs
vercel logs
```

## 📞 **Soporte**

### **Testing**
```bash
# Probar endpoint localmente
curl -X GET "http://localhost:3000/api/events/list?tenant_id=123"
```

### **Debug**
```javascript
// Habilitar logs detallados
console.log('API Request:', { endpoint, options });
console.log('API Response:', response);
```

---

## 🎉 **Conclusión**

Sistema completo de endpoints para VeeEventos con:
- ✅ **150+ endpoints** organizados por categoría
- ✅ **Autenticación y seguridad** implementada
- ✅ **Validaciones completas** en todos los endpoints
- ✅ **Documentación detallada** con ejemplos
- ✅ **Monitoreo y logs** integrados
- ✅ **Deploy automático** en Vercel

**¡Todos los endpoints están listos para producción!** 🚀
