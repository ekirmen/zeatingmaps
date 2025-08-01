# Configuración de Email y Base de Datos

## 📧 Configuración de Servicios de Email

### Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Email Service Configuration
REACT_APP_EMAIL_PROVIDER=sendgrid
REACT_APP_FROM_EMAIL=noreply@kreatickets.com
REACT_APP_FROM_NAME=Kreatickets

# SendGrid Configuration
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key_here

# Mailgun Configuration (alternative)
REACT_APP_MAILGUN_API_KEY=your_mailgun_api_key_here
REACT_APP_MAILGUN_DOMAIN=your_mailgun_domain_here

# SMTP Configuration (fallback)
REACT_APP_SMTP_HOST=smtp.gmail.com
REACT_APP_SMTP_PORT=587
REACT_APP_SMTP_SECURE=false
REACT_APP_SMTP_USER=your_smtp_user_here
REACT_APP_SMTP_PASS=your_smtp_password_here

# Application Configuration
REACT_APP_BASE_URL=https://kreatickets.com
REACT_APP_API_BASE_URL=https://api.kreatickets.com
```

## 🗄️ Configuración de Base de Datos

### 1. Ejecutar Scripts SQL

Ejecuta el archivo `sql/create_email_campaigns_tables.sql` en tu base de datos Supabase:

```sql
-- Ejecutar en Supabase SQL Editor
-- Copiar y pegar el contenido de create_email_campaigns_tables.sql
```

### 2. Verificar Tablas Creadas

Las siguientes tablas deben estar creadas:

- `email_campaigns` - Campañas de email
- `campaign_widgets` - Widgets de cada campaña
- `campaign_recipients` - Destinatarios de campañas
- `canales_venta` - Canales de venta
- `email_stats` - Estadísticas de emails

## 📧 Configuración de Proveedores de Email

### SendGrid (Recomendado)

1. Crear cuenta en [SendGrid](https://sendgrid.com)
2. Obtener API Key desde Dashboard
3. Configurar dominio verificado
4. Agregar variables de entorno:

```bash
REACT_APP_EMAIL_PROVIDER=sendgrid
REACT_APP_SENDGRID_API_KEY=SG.your_api_key_here
```

### Mailgun (Alternativa)

1. Crear cuenta en [Mailgun](https://mailgun.com)
2. Obtener API Key y Domain
3. Configurar variables:

```bash
REACT_APP_EMAIL_PROVIDER=mailgun
REACT_APP_MAILGUN_API_KEY=key-your_api_key_here
REACT_APP_MAILGUN_DOMAIN=your_domain.com
```

### Gmail SMTP (Para Testing)

Para usar Gmail SMTP para testing:

```bash
REACT_APP_EMAIL_PROVIDER=smtp
REACT_APP_SMTP_HOST=smtp.gmail.com
REACT_APP_SMTP_PORT=587
REACT_APP_SMTP_SECURE=false
REACT_APP_SMTP_USER=tu_email@gmail.com
REACT_APP_SMTP_PASS=tu_app_password
```

#### Configuración de Gmail:

1. **Habilitar 2FA** en tu cuenta de Google
2. **Generar App Password**:
   - Ve a [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Genera una contraseña para "Mail"
3. **Usar la App Password** como `REACT_APP_SMTP_PASS`

#### Notas importantes:
- No uses tu contraseña normal de Gmail
- La App Password es de 16 caracteres sin espacios
- Gmail tiene límites de envío: 500 emails/día para cuentas normales

## 🔧 API Endpoints Requeridos

### SendGrid Endpoint

Crear endpoint `/api/send-email/sendgrid`:

```javascript
// api/send-email/sendgrid.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text, from, fromName } = req.body;

    const msg = {
      to,
      from: fromName ? `${fromName} <${from}>` : from,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    await sgMail.send(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### Gmail SMTP Endpoint

Crear endpoint `/api/send-email/smtp`:

```javascript
// api/send-email/smtp.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text, from, smtpConfig } = req.body;

    // Configuración SMTP para Gmail
    const transporter = nodemailer.createTransporter({
      host: smtpConfig?.host || 'smtp.gmail.com',
      port: smtpConfig?.port || 587,
      secure: smtpConfig?.secure || false,
      auth: {
        user: smtpConfig?.auth?.user || process.env.REACT_APP_SMTP_USER,
        pass: smtpConfig?.auth?.pass || process.env.REACT_APP_SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('SMTP error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

## 🧪 Pruebas de Configuración

### 1. Probar Conexión de Email

```javascript
import emailService from '../services/emailService';

// Probar conexión
const testConnection = async () => {
  try {
    const result = await emailService.testConnection();
    console.log('Email connection test:', result ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('Email test failed:', error);
  }
};
```

### 2. Probar Base de Datos

```javascript
import { emailCampaignService } from '../services/emailCampaignService';

// Probar carga de campañas
const testDatabase = async () => {
  try {
    const campaigns = await emailCampaignService.getCampaigns();
    console.log('Database test:', campaigns.length, 'campaigns loaded');
  } catch (error) {
    console.error('Database test failed:', error);
  }
};
```

## 📊 Monitoreo y Logs

### Logs de Email

Los logs de email se guardan en:

- Console del navegador (desarrollo)
- Logs del servidor (producción)
- Base de datos `email_stats`

### Métricas Importantes

- Tasa de entrega
- Tasa de apertura
- Tasa de clics
- Tasa de rebote

## 🔒 Seguridad

### Variables de Entorno

- Nunca committear `.env` al repositorio
- Usar `.env.example` como plantilla
- Rotar API keys regularmente

### Validación de Email

- Validar formato de email
- Verificar dominio
- Implementar rate limiting

## 🚀 Despliegue

### Producción

1. Configurar variables de entorno en el servidor
2. Verificar dominio de email
3. Configurar DNS records
4. Probar envío de emails

### Desarrollo

1. Usar SendGrid sandbox mode
2. Configurar webhooks locales
3. Usar base de datos de desarrollo

## 📞 Soporte

Para problemas con:

- **SendGrid**: [SendGrid Support](https://support.sendgrid.com)
- **Mailgun**: [Mailgun Support](https://help.mailgun.com)
- **Supabase**: [Supabase Support](https://supabase.com/support)

## 🔄 Actualizaciones

### Versión 1.0.0
- ✅ Integración con Supabase
- ✅ Servicio de email configurable
- ✅ Widgets de email
- ✅ Preview en tiempo real
- ✅ Generador automático de botones

### Próximas Versiones
- 🔄 A/B Testing
- 🔄 Analytics avanzados
- 🔄 Plantillas predefinidas
- 🔄 Automatización de campañas 