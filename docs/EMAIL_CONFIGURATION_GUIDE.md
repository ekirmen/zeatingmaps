# 📧 Guía de Configuración de Correo para Empresas

## **Descripción General**

Este sistema permite a cada empresa configurar su propio servidor SMTP para enviar correos con tickets desde la boletería. Cada empresa tiene su configuración independiente y segura.

## **🚀 Características Principales**

- ✅ **Configuración por empresa** - Cada empresa tiene su propia configuración SMTP
- ✅ **Múltiples proveedores** - Soporte para Gmail, Outlook, Yahoo y servidores personalizados
- ✅ **Envío de tickets** - Correos automáticos con tickets en formato HTML profesional
- ✅ **Validación automática** - Verificación de configuración antes del envío
- ✅ **Pruebas de conexión** - Test de configuración antes de usar en producción
- ✅ **Seguridad** - Contraseñas encriptadas y políticas RLS

## **📋 Requisitos Previos**

### **Para Gmail:**
1. Habilitar verificación en dos pasos
2. Generar contraseña de aplicación
3. Usar `smtp.gmail.com` puerto 587

### **Para Outlook/Hotmail:**
1. Habilitar autenticación de dos factores
2. Generar contraseña de aplicación
3. Usar `smtp-mail.outlook.com` puerto 587

### **Para Yahoo:**
1. Habilitar verificación en dos pasos
2. Generar contraseña de aplicación
3. Usar `smtp.mail.yahoo.com` puerto 587

### **Para servidores personalizados:**
1. Verificar host y puerto con el proveedor
2. Confirmar si requiere SSL/TLS
3. Verificar que el puerto esté abierto

## **🔧 Instalación y Configuración**

### **1. Crear la tabla de configuración**

Ejecuta el archivo SQL:
```sql
-- Ejecutar: src/api/email-config/create-email-config-table.sql
```

### **2. Configurar el correo de la empresa**

1. Ve a **Backoffice > Configuración de Correo**
2. Selecciona tu proveedor de correo
3. Completa los campos requeridos:
   - **Host SMTP**: Servidor del proveedor
   - **Puerto**: Puerto SMTP (generalmente 587)
   - **Usuario**: Tu email
   - **Contraseña**: Contraseña o contraseña de aplicación
   - **Email del remitente**: Desde dónde se enviarán los correos
   - **Nombre del remitente**: Nombre que verá el cliente

### **3. Probar la configuración**

1. Haz clic en **"Probar Configuración"**
2. Verifica que el correo de prueba llegue correctamente
3. Si hay errores, revisa la configuración

## **📧 Uso del Sistema de Envío**

### **Desde la Boletería:**

1. **Selecciona los tickets** que quieres enviar
2. **Haz clic en "Enviar por Correo"**
3. **Ingresa el email** del destinatario
4. **Opcional**: Escribe un mensaje personalizado
5. **Elige el formato**:
   - Un correo con todos los tickets
   - Un correo por cada ticket
6. **Envía** el correo

### **Formato de los Correos:**

Los tickets se envían en formato HTML profesional que incluye:
- Logo y branding de la empresa
- Información completa del evento
- Detalles del ticket (asiento, zona, precio)
- Código QR para validación
- Información de contacto y soporte

## **🔒 Seguridad y Privacidad**

### **Políticas RLS:**
- Cada empresa solo ve su propia configuración
- Las contraseñas se almacenan encriptadas
- Acceso restringido por tenant_id

### **Validaciones:**
- Formato de email válido
- Puertos en rango válido
- Campos requeridos completos
- Prueba de conexión antes de guardar

## **📱 Integración con la Aplicación**

### **Componentes Principales:**

1. **`EmailConfigPanel`** - Panel de configuración
2. **`SendTicketEmail`** - Modal para enviar tickets
3. **`EmailConfigService`** - Servicio de configuración
4. **`TicketEmailService`** - Servicio de envío

### **Flujo de Trabajo:**

```
Usuario → Configura Correo → Prueba Conexión → Guarda Configuración
    ↓
Vende Tickets → Selecciona Enviar por Correo → Sistema Usa Configuración → Envía Correo
```

## **🚨 Solución de Problemas**

### **Error: "No hay configuración de correo"**
- Ve a Configuración de Correo
- Completa todos los campos requeridos
- Guarda la configuración

### **Error: "Error de autenticación"**
- Verifica usuario y contraseña
- Para Gmail/Outlook: Usa contraseña de aplicación
- Verifica que la verificación en dos pasos esté habilitada

### **Error: "No se puede conectar al servidor"**
- Verifica el host SMTP
- Confirma que el puerto esté abierto
- Verifica la configuración SSL/TLS

### **Los correos no llegan:**
- Revisa la carpeta de spam
- Verifica la configuración del remitente
- Confirma que el servidor SMTP esté funcionando

## **📊 Monitoreo y Logs**

### **Logs del Sistema:**
- Envíos exitosos
- Errores de configuración
- Fallos de conexión
- Estadísticas de envío

### **Métricas Disponibles:**
- Total de correos enviados
- Tasa de éxito
- Tiempo de envío promedio
- Errores por tipo

## **🔮 Funcionalidades Futuras**

- **Plantillas personalizables** de correo
- **Programación de envíos** automáticos
- **Integración con servicios** de email marketing
- **Análisis de apertura** y clics
- **Sistema de reintentos** automáticos
- **Notificaciones push** de estado de envío

## **📞 Soporte Técnico**

### **Para problemas de configuración:**
1. Revisa esta guía
2. Verifica la documentación del proveedor de correo
3. Contacta al soporte técnico

### **Para problemas del sistema:**
- Revisa los logs del servidor
- Verifica la conectividad de red
- Confirma que la base de datos esté funcionando

---

**Nota**: Esta configuración es específica para cada empresa y no afecta a otras empresas en el sistema multi-tenant.
