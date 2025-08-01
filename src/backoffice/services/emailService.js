import { toast } from 'react-hot-toast';

// Email Service Configuration
const EMAIL_CONFIG = {
  // SendGrid Configuration
  sendgrid: {
    apiKey: process.env.REACT_APP_SENDGRID_API_KEY,
    fromEmail: process.env.REACT_APP_FROM_EMAIL || 'noreply@kreatickets.com',
    fromName: process.env.REACT_APP_FROM_NAME || 'Kreatickets'
  },
  
  // Mailgun Configuration (alternative)
  mailgun: {
    apiKey: process.env.REACT_APP_MAILGUN_API_KEY,
    domain: process.env.REACT_APP_MAILGUN_DOMAIN,
    fromEmail: process.env.REACT_APP_FROM_EMAIL || 'noreply@kreatickets.com'
  },
  
  // SMTP Configuration (fallback)
  smtp: {
    host: process.env.REACT_APP_SMTP_HOST,
    port: process.env.REACT_APP_SMTP_PORT,
    secure: process.env.REACT_APP_SMTP_SECURE === 'true',
    auth: {
      user: process.env.REACT_APP_SMTP_USER,
      pass: process.env.REACT_APP_SMTP_PASS
    }
  }
};

// Email Service Class
class EmailService {
  constructor() {
    this.provider = process.env.REACT_APP_EMAIL_PROVIDER || 'sendgrid';
    this.config = EMAIL_CONFIG[this.provider];
  }

  // Enviar email usando SendGrid
  async sendWithSendGrid(to, subject, html, text = null) {
    try {
      const response = await fetch('/api/send-email/sendgrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          text,
          from: this.config.fromEmail,
          fromName: this.config.fromName
        })
      });

      if (!response.ok) {
        throw new Error(`SendGrid error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }

  // Enviar email usando Mailgun
  async sendWithMailgun(to, subject, html, text = null) {
    try {
      const response = await fetch('/api/send-email/mailgun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          text,
          from: this.config.fromEmail
        })
      });

      if (!response.ok) {
        throw new Error(`Mailgun error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Mailgun error:', error);
      throw error;
    }
  }

  // Enviar email usando SMTP
  async sendWithSMTP(to, subject, html, text = null) {
    try {
      const response = await fetch('/api/send-email/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''),
          from: this.config.fromEmail,
          smtpConfig: {
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: {
              user: this.config.auth.user,
              pass: this.config.auth.pass
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`SMTP error: ${errorData.error || response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SMTP error:', error);
      throw error;
    }
  }

  // Método principal para enviar emails
  async sendEmail(to, subject, html, text = null) {
    try {
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(to, subject, html, text);
        case 'mailgun':
          return await this.sendWithMailgun(to, subject, html, text);
        case 'smtp':
          return await this.sendWithSMTP(to, subject, html, text);
        default:
          throw new Error(`Email provider not supported: ${this.provider}`);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  // Enviar campaña de email
  async sendCampaign(recipients, campaign, emailHtml) {
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const recipient of recipients) {
      try {
        // Personalizar HTML para cada destinatario
        const personalizedHtml = this.personalizeEmail(emailHtml, recipient);
        
        // Enviar email
        await this.sendEmail(
          recipient.email,
          campaign.nombre,
          personalizedHtml
        );
        
        results.sent++;
        
        // Simular delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: error.message
        });
      }
    }

    return results;
  }

  // Personalizar email con datos del destinatario
  personalizeEmail(html, recipient) {
    return html
      .replace(/\{\{nombre\}\}/g, recipient.nombre || 'Usuario')
      .replace(/\{\{email\}\}/g, recipient.email)
      .replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString('es-ES'))
      .replace(/\{\{unsubscribe_url\}\}/g, this.getUnsubscribeUrl(recipient.email))
      .replace(/\{\{tracking_url\}\}/g, this.getTrackingUrl(recipient.email));
  }

  // Generar URL de cancelación de suscripción
  getUnsubscribeUrl(email) {
    const baseUrl = process.env.REACT_APP_BASE_URL || 'https://kreatickets.com';
    return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  }

  // Generar URL de tracking
  getTrackingUrl(email) {
    const baseUrl = process.env.REACT_APP_BASE_URL || 'https://kreatickets.com';
    return `${baseUrl}/track?email=${encodeURIComponent(email)}`;
  }

  // Generar plantilla de email
  generateEmailTemplate(campaign, widgets) {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${campaign.nombre}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px; 
            background-color: #007bff;
            color: white;
          }
          .content { 
            padding: 20px; 
          }
          .widget { 
            margin-bottom: 20px; 
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            background-color: #f8f9fa;
            border-top: 1px solid #dee2e6;
            font-size: 12px; 
            color: #666; 
          }
          .tracking-pixel {
            width: 1px;
            height: 1px;
            opacity: 0;
          }
          @media only screen and (max-width: 600px) {
            .container {
              width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${campaign.nombre}</h1>
          </div>
          
          <div class="content">
            ${this.renderWidgetsHtml(widgets)}
          </div>
          
          <div class="footer">
            <p>© 2024 Kreatickets. Todos los derechos reservados.</p>
            <p><a href="{{unsubscribe_url}}" style="color: #666;">Cancelar suscripción</a></p>
          </div>
        </div>
        
        <!-- Tracking pixel -->
        <img src="{{tracking_url}}" class="tracking-pixel" alt="" />
      </body>
      </html>
    `;

    return template;
  }

  // Renderizar widgets en HTML
  renderWidgetsHtml(widgets) {
    if (!widgets || widgets.length === 0) {
      return '<p>No hay contenido configurado para esta campaña.</p>';
    }

    return widgets.map(widget => {
      const config = widget.configuracion || {};
      
      switch (widget.tipo) {
        case 'Título':
          return `<div class="widget"><h2 style="text-align: center; color: #333;">${config.texto || 'Título'}</h2></div>`;

        case 'Subtítulo':
          return `<div class="widget"><h3 style="text-align: center; color: #666;">${config.texto || 'Subtítulo'}</h3></div>`;

        case 'Paragraph':
          return `<div class="widget"><p>${config.texto || 'Contenido del párrafo...'}</p></div>`;

        case 'Banner':
          return `
            <div class="widget">
              ${config.imagen ? `<img src="${config.imagen}" alt="Banner" style="max-width: 100%; height: auto; border-radius: 8px;">` : ''}
              ${config.texto ? `<p style="text-align: center; margin-top: 8px;">${config.texto}</p>` : ''}
            </div>
          `;

        case 'Botón':
          const buttonText = config.textButton || 'Hacer clic';
          const buttonUrl = this.getButtonUrl(config);
          return `
            <div class="widget" style="text-align: center;">
              <a href="${buttonUrl}" class="button" style="margin-top: ${config.margin_top || 10}px; margin-bottom: ${config.margin_bottom || 10}px;">
                ${buttonText}
              </a>
            </div>
          `;

        case 'Información del evento':
          return `
            <div class="widget" style="background-color: #f8f9fa; padding: 16px; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">Información del Evento</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">ID del evento: ${config.eventoId || 'No especificado'}</p>
            </div>
          `;

        case 'Código HTML':
          return `<div class="widget">${config.html || '<div>Contenido HTML personalizado</div>'}</div>`;

        default:
          return `<div class="widget"><p>Widget no reconocido: ${widget.tipo}</p></div>`;
      }
    }).join('');
  }

  // Obtener URL del botón
  getButtonUrl(config) {
    if (config.urlButton) return config.urlButton;

    // Construir URL basada en evento y canal
    if (config.eventId && config.channelId) {
      const baseUrl = this.getChannelUrl(config.channelId);
      return `${baseUrl}evento/${config.eventId}`;
    }

    return '#';
  }

  // Obtener URL del canal
  getChannelUrl(channelId) {
    const channels = {
      '8': 'https://kreatickets.pagatusboletos.com/tickets/',
      '2': 'https://ventas.kreatickets.com/venta/',
      '999': 'https://ventas.kreatickets.com/test/'
    };
    return channels[channelId] || 'https://ventas.kreatickets.com/venta/';
  }

  // Validar configuración de email
  validateConfig() {
    if (!this.config) {
      throw new Error(`Email provider configuration not found: ${this.provider}`);
    }

    switch (this.provider) {
      case 'sendgrid':
        if (!this.config.apiKey) {
          throw new Error('SendGrid API key not configured');
        }
        break;
      case 'mailgun':
        if (!this.config.apiKey || !this.config.domain) {
          throw new Error('Mailgun API key or domain not configured');
        }
        break;
      case 'smtp':
        if (!this.config.host || !this.config.auth?.user || !this.config.auth?.pass) {
          throw new Error('SMTP configuration incomplete');
        }
        break;
    }
  }

  // Probar conexión de email
  async testConnection() {
    try {
      this.validateConfig();
      
      // Enviar email de prueba
      await this.sendEmail(
        'test@example.com',
        'Test Email',
        '<h1>Test Email</h1><p>This is a test email to verify the configuration.</p>'
      );
      
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio de email
const emailService = new EmailService();

export default emailService; 