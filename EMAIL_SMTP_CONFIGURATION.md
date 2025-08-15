# Configuración SMTP para Envío de Tickets

## Configuración para Gmail

### 1. Habilitar Autenticación de 2 Factores
1. Ve a tu cuenta de Google
2. Seguridad → Verificación en 2 pasos → Activar
3. Configurar método de verificación (SMS, app, etc.)

### 2. Generar Contraseña de Aplicación
1. Seguridad → Contraseñas de aplicación
2. Seleccionar "Correo" o "Otra (nombre personalizado)"
3. Copiar la contraseña generada (16 caracteres)

### 3. Configuración en el Sistema
```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "tu_email@gmail.com",
  "smtp_password": "tu_contraseña_de_aplicacion",
  "from_name": "Tu Empresa",
  "from_email": "tu_email@gmail.com",
  "reply_to_email": "soporte@tuempresa.com"
}
```

## Configuración para Outlook/Hotmail

### 1. Configuración SMTP
```json
{
  "smtp_host": "smtp-mail.outlook.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "tu_email@outlook.com",
  "smtp_password": "tu_contraseña_normal",
  "from_name": "Tu Empresa",
  "from_email": "tu_email@outlook.com",
  "reply_to_email": "soporte@tuempresa.com"
}
```

## Configuración para Yahoo

### 1. Generar Contraseña de Aplicación
1. Cuenta → Seguridad de la cuenta
2. Generar contraseña de aplicación
3. Seleccionar "Otra aplicación" y dar nombre

### 2. Configuración SMTP
```json
{
  "smtp_host": "smtp.mail.yahoo.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "tu_email@yahoo.com",
  "smtp_password": "tu_contraseña_de_aplicacion",
  "from_name": "Tu Empresa",
  "from_email": "tu_email@yahoo.com",
  "reply_to_email": "soporte@tuempresa.com"
}
```

## Configuración para Proveedores de Hosting

### 1. cPanel/WHM
```json
{
  "smtp_host": "mail.tudominio.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "noreply@tudominio.com",
  "smtp_password": "tu_contraseña",
  "from_name": "Tu Empresa",
  "from_email": "noreply@tudominio.com",
  "reply_to_email": "soporte@tudominio.com"
}
```

### 2. Plesk
```json
{
  "smtp_host": "localhost",
  "smtp_port": "25",
  "smtp_secure": "false",
  "smtp_user": "noreply@tudominio.com",
  "smtp_password": "tu_contraseña",
  "from_name": "Tu Empresa",
  "from_email": "noreply@tudominio.com",
  "reply_to_email": "soporte@tudominio.com"
}
```

## Configuración para Servicios de Email Transaccional

### 1. SendGrid
```json
{
  "smtp_host": "smtp.sendgrid.net",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "apikey",
  "smtp_password": "tu_api_key_de_sendgrid",
  "from_name": "Tu Empresa",
  "from_email": "noreply@tudominio.com",
  "reply_to_email": "soporte@tuempresa.com"
}
```

### 2. Mailgun
```json
{
  "smtp_host": "smtp.mailgun.org",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "postmaster@tu_dominio.mailgun.org",
  "smtp_password": "tu_password_de_mailgun",
  "from_name": "Tu Empresa",
  "from_email": "noreply@tudominio.com",
  "reply_to_email": "soporte@tuempresa.com"
}
```

### 3. Amazon SES
```json
{
  "smtp_host": "email-smtp.us-east-1.amazonaws.com",
  "smtp_port": "587",
  "smtp_secure": "false",
  "smtp_user": "tu_smtp_username",
  "smtp_password": "tu_smtp_password",
  "from_name": "Tu Empresa",
  "from_email": "noreply@tudominio.com",
  "reply_to_email": "soporte@tuempresa.com"
}
```

## Configuración de Seguridad

### 1. Puertos Seguros
- **587**: TLS (recomendado)
- **465**: SSL
- **25**: Sin encriptación (no recomendado)

### 2. Configuración TLS
```json
{
  "smtp_secure": "true",  // Para puerto 465
  "smtp_secure": "false"  // Para puerto 587 (usa STARTTLS)
}
```

### 3. Verificación de Certificados
El sistema está configurado para ser tolerante con certificados SSL:
```javascript
tls: {
  rejectUnauthorized: false
}
```

## Pruebas de Configuración

### 1. Test de Conexión
El sistema verifica automáticamente la conexión SMTP antes de enviar:
```javascript
await transporter.verify();
```

### 2. Test de Envío
Puedes probar la configuración desde el backoffice:
1. Ir a configuración de email
2. Hacer clic en "Probar configuración"
3. Enviar email de prueba

### 3. Logs de Verificación
Revisa la consola del servidor para ver:
- Configuración SMTP utilizada
- Resultado de verificación de conexión
- Confirmación de envío exitoso

## Solución de Problemas Comunes

### 1. Error de Autenticación
```
Error: Invalid login
```
**Solución:**
- Verificar usuario y contraseña
- Usar contraseña de aplicación para Gmail
- Verificar que la cuenta no esté bloqueada

### 2. Error de Conexión
```
Error: Connection timeout
```
**Solución:**
- Verificar host y puerto SMTP
- Comprobar firewall del servidor
- Verificar configuración de red

### 3. Error de Certificado SSL
```
Error: self signed certificate
```
**Solución:**
- El sistema ya maneja esto automáticamente
- Verificar que el puerto sea correcto
- Usar puerto 587 en lugar de 465

### 4. Email no llega al destinatario
**Verificar:**
- Carpeta de spam
- Configuración de DNS (SPF, DKIM)
- Límites de envío del proveedor
- Lista blanca de IPs

## Recomendaciones

### 1. Para Producción
- Usar servicios de email transaccional (SendGrid, Mailgun)
- Configurar DNS records (SPF, DKIM, DMARC)
- Monitorear tasas de entrega

### 2. Para Desarrollo
- Gmail con contraseña de aplicación
- Configuración SMTP local
- Logs detallados habilitados

### 3. Seguridad
- Nunca usar contraseñas de cuenta principal
- Rotar contraseñas regularmente
- Usar autenticación de 2 factores
- Monitorear accesos sospechosos

## Límites y Restricciones

### 1. Gmail
- 500 emails por día (cuenta gratuita)
- 2000 emails por día (cuenta de trabajo)
- Tamaño máximo: 25MB

### 2. Outlook
- 300 emails por día
- Tamaño máximo: 35MB

### 3. Yahoo
- 500 emails por día
- Tamaño máximo: 25MB

### 4. SendGrid
- 100 emails por día (gratuito)
- Sin límite (planes pagos)
- Tamaño máximo: 30MB

---

**Nota**: Para uso en producción, se recomienda usar servicios de email transaccional como SendGrid o Mailgun, ya que ofrecen mejor entrega y monitoreo que los proveedores de email personales.
