# Configuración del Sistema de Envío de Tickets por Email

## Descripción

Este sistema permite enviar tickets por correo electrónico después de que se complete un pago en la boletería. Los tickets se envían automáticamente usando la configuración SMTP configurada en el sistema.

## Características

- ✅ Envío automático de tickets después del pago
- ✅ Plantillas HTML personalizables para los tickets
- ✅ Configuración SMTP configurable por empresa
- ✅ Registro de envíos en base de datos
- ✅ Manejo de errores y reintentos
- ✅ Soporte para múltiples asientos por ticket

## Configuración Requerida

### 1. Instalar Dependencias

```bash
cd api
npm install
```

### 2. Configurar Variables de Entorno

Asegúrate de tener configuradas las siguientes variables en tu archivo `.env`:

```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Crear Tabla de Logs de Email

Ejecuta el archivo SQL `create_email_logs_table.sql` en tu base de datos Supabase:

```sql
-- Ejecutar el contenido de create_email_logs_table.sql
```

### 4. Configurar Email SMTP

En el backoffice, ve a la sección de configuración de email y configura:

- **Host SMTP**: (ej: smtp.gmail.com)
- **Puerto**: (ej: 587 para TLS, 465 para SSL)
- **Usuario**: tu_email@gmail.com
- **Contraseña**: tu_contraseña_de_aplicación
- **Seguro**: true/false según tu proveedor
- **Nombre del remitente**: Nombre de tu empresa
- **Email del remitente**: tu_email@gmail.com
- **Email de respuesta**: email_para_respuestas@tuempresa.com

## Uso

### Envío Automático

El sistema envía automáticamente los tickets cuando:

1. Se completa un pago en la boletería
2. El usuario hace clic en "Enviar por Email"
3. Se proporciona un email válido

### Flujo de Trabajo

1. **Pago Completado**: El usuario completa el pago en la boletería
2. **Confirmación**: Se muestra la confirmación con opción de envío por email
3. **Envío**: El sistema genera el ticket HTML y lo envía por SMTP
4. **Registro**: Se registra el envío en la tabla `email_logs`
5. **Confirmación**: Se muestra mensaje de éxito o error

### Estructura del Ticket

El ticket incluye:

- **Información del Evento**: Nombre, fecha, hora, lugar
- **Detalles del Pago**: Localizador, precio total
- **Lista de Asientos**: Detalle de cada asiento comprado
- **Código QR**: Para validación en la entrada
- **Información de Contacto**: Datos de la empresa

## Personalización

### Plantilla HTML

Puedes personalizar la plantilla del ticket editando la función `generateTicketHTML` en:

```
api/payments/[locator]/email.js
```

### Estilos CSS

Los estilos están incluidos en el HTML del ticket y se pueden modificar para:

- Cambiar colores y fuentes
- Ajustar layout y espaciado
- Agregar logos o imágenes
- Personalizar el diseño responsive

### Configuración por Empresa

Cada empresa puede tener su propia configuración de email en la tabla `email_config`:

- Configuración SMTP personalizada
- Nombre y email del remitente
- Plantillas personalizadas (futuro)

## Monitoreo y Logs

### Tabla email_logs

La tabla registra:

- **payment_id**: ID del pago relacionado
- **recipient_email**: Email del destinatario
- **subject**: Asunto del email
- **status**: Estado del envío (sent, failed, pending)
- **sent_at**: Fecha y hora del envío
- **error_message**: Mensaje de error si falló
- **retry_count**: Número de intentos

### Consultas Útiles

```sql
-- Ver todos los envíos exitosos
SELECT * FROM email_logs WHERE status = 'sent';

-- Ver envíos fallidos
SELECT * FROM email_logs WHERE status = 'failed';

-- Estadísticas por día
SELECT 
  DATE(sent_at) as fecha,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as exitosos,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as fallidos
FROM email_logs 
GROUP BY DATE(sent_at)
ORDER BY fecha DESC;
```

## Solución de Problemas

### Errores Comunes

1. **Error de Autenticación SMTP**
   - Verificar usuario y contraseña
   - Usar contraseña de aplicación para Gmail
   - Verificar configuración de seguridad del proveedor

2. **Error de Conexión**
   - Verificar host y puerto SMTP
   - Comprobar firewall y configuración de red
   - Verificar si el puerto requiere SSL/TLS

3. **Email no se envía**
   - Revisar logs del servidor
   - Verificar configuración de email en backoffice
   - Comprobar que la tabla email_config tenga datos

### Logs del Servidor

Revisa la consola del servidor para ver:

- Configuración SMTP utilizada
- Errores de conexión
- Confirmación de envío exitoso
- Detalles de errores

## Seguridad

### Autenticación

- Solo usuarios autenticados pueden enviar tickets
- Se verifica el token JWT en cada request
- RLS (Row Level Security) habilitado en todas las tablas

### Validación

- Validación de email del destinatario
- Verificación de existencia del pago
- Comprobación de configuración SMTP activa

## Futuras Mejoras

- [ ] Plantillas personalizables por empresa
- [ ] Sistema de reintentos automáticos
- [ ] Notificaciones push para envíos fallidos
- [ ] Estadísticas y reportes de envío
- [ ] Integración con servicios de email transaccional
- [ ] Soporte para archivos adjuntos (PDF del ticket)

## Soporte

Para problemas o preguntas:

1. Revisar logs del servidor
2. Verificar configuración SMTP
3. Comprobar permisos de base de datos
4. Revisar variables de entorno

---

**Nota**: Este sistema está diseñado para funcionar con Supabase y requiere configuración SMTP válida para el envío real de emails.
