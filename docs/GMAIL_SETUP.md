# Configuración de Gmail SMTP para Testing

## 🎯 Propósito

Esta configuración permite usar Gmail SMTP para testing de emails mientras mantenemos SendGrid como proveedor principal para producción.

## 📧 Configuración de Gmail

### 1. Habilitar 2FA en Google

1. Ve a [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification
3. Activa la verificación en dos pasos

### 2. Generar App Password

1. Ve a [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Selecciona "Mail" como aplicación
4. Copia la contraseña generada (16 caracteres)

### 3. Variables de Entorno

Crea o actualiza tu archivo `.env`:

```bash
# Email Provider para Testing
REACT_APP_EMAIL_PROVIDER=smtp

# Gmail SMTP Configuration
REACT_APP_SMTP_HOST=smtp.gmail.com
REACT_APP_SMTP_PORT=587
REACT_APP_SMTP_SECURE=false
REACT_APP_SMTP_USER=tu_email@gmail.com
REACT_APP_SMTP_PASS=tu_app_password_16_caracteres

# Email Configuration
REACT_APP_FROM_EMAIL=tu_email@gmail.com
REACT_APP_FROM_NAME=Kreatickets Testing
```

## 🔧 Instalación de Dependencias

```bash
npm install nodemailer
```

## 🧪 Probar Configuración

### 1. Usar EmailTestPanel

El componente `EmailTestPanel` incluye una función de prueba específica para Gmail:

```javascript
import EmailTestPanel from '../components/EmailTestPanel';

// En tu componente
<EmailTestPanel />
```

### 2. Probar Manualmente

```javascript
import emailService from '../services/emailService';

const testGmail = async () => {
  try {
    const result = await emailService.sendEmail(
      'test@example.com',
      'Test Gmail SMTP',
      '<h1>Test Email</h1><p>Este es un email de prueba desde Gmail SMTP.</p>'
    );
    console.log('Email enviado:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## ⚠️ Límites de Gmail

### Límites Diarios
- **Cuentas normales**: 500 emails/día
- **Cuentas de Google Workspace**: 2000 emails/día
- **Cuentas de Google Apps**: 2000 emails/día

### Límites por Minuto
- **Cuentas normales**: 20 emails/minuto
- **Cuentas de Google Workspace**: 100 emails/minuto

## 🔍 Troubleshooting

### Error: "Invalid login"

**Solución:**
- Verifica que estés usando la App Password, no tu contraseña normal
- Asegúrate de que 2FA esté habilitado
- Regenera la App Password si es necesario

### Error: "Less secure app access"

**Solución:**
- Gmail ya no permite "less secure apps"
- Debes usar App Password con 2FA habilitado

### Error: "Connection timeout"

**Solución:**
- Verifica tu conexión a internet
- Asegúrate de que el puerto 587 no esté bloqueado
- Intenta con puerto 465 (SSL) si 587 no funciona

### Error: "Authentication failed"

**Solución:**
- Verifica que el email y App Password sean correctos
- Asegúrate de que no haya espacios extra en la App Password
- Regenera la App Password

## 📊 Monitoreo

### Logs de Gmail

Los emails enviados aparecerán en:
- **Enviados**: Gmail → Sent folder
- **Logs**: Console del navegador (desarrollo)
- **Base de datos**: Tabla `email_stats`

### Métricas Importantes

- **Tasa de entrega**: Gmail tiene alta tasa de entrega
- **Tiempo de envío**: 1-5 segundos por email
- **Spam score**: Bajo riesgo de spam

## 🔄 Cambiar entre Proveedores

### Para Testing (Gmail)
```bash
REACT_APP_EMAIL_PROVIDER=smtp
```

### Para Producción (SendGrid)
```bash
REACT_APP_EMAIL_PROVIDER=sendgrid
```

## 🚀 Configuración Avanzada

### Rate Limiting

El servicio incluye rate limiting automático:

```javascript
// En emailService.js
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms entre emails
```

### Retry Logic

Para emails fallidos:

```javascript
// En emailCampaignService.js
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    await sendEmail();
    break;
  } catch (error) {
    if (attempt === maxRetries) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
  }
}
```

## 📝 Ejemplo de Uso Completo

```javascript
import { emailCampaignService } from '../services/emailCampaignService';

const sendTestCampaign = async () => {
  try {
    // Crear campaña de prueba
    const campaign = await emailCampaignService.createCampaign({
      nombre: 'Test Campaign',
      tipo: 'newsletter',
      configuracion: {}
    });

    // Agregar widgets
    await emailCampaignService.saveCampaignWidgets(campaign.id, [
      {
        type: 'Título',
        config: { texto: 'Test Email Campaign' }
      },
      {
        type: 'Paragraph',
        config: { texto: 'Este es un email de prueba usando Gmail SMTP.' }
      }
    ]);

    // Enviar a destinatarios de prueba
    const recipients = [
      { email: 'test1@example.com', nombre: 'Test User 1' },
      { email: 'test2@example.com', nombre: 'Test User 2' }
    ];

    const results = await emailCampaignService.sendCampaign(campaign.id, recipients);
    console.log('Resultados:', results);

  } catch (error) {
    console.error('Error:', error);
  }
};
```

## ✅ Checklist de Configuración

- [ ] 2FA habilitado en Google
- [ ] App Password generada
- [ ] Variables de entorno configuradas
- [ ] Nodemailer instalado
- [ ] Endpoint SMTP creado
- [ ] Prueba de conexión exitosa
- [ ] Test de envío de email exitoso

## 🆘 Soporte

Para problemas específicos de Gmail:
- [Gmail Help](https://support.google.com/mail/)
- [Google Account Security](https://myaccount.google.com/security)
- [App Passwords Guide](https://support.google.com/accounts/answer/185833) 