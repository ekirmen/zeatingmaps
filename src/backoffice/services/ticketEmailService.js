import { supabase } from '../../supabaseClient';
import { EmailConfigService } from './emailConfigService';

export class TicketEmailService {
  // Enviar ticket por correo
  static async sendTicketEmail(ticketData, recipientEmail) {
    try {
      // Obtener configuración de correo de la empresa
      const emailConfig = await EmailConfigService.getEmailConfig();
      if (!emailConfig) {
        throw new Error('No hay configuración de correo configurada');
      }

      // Generar el HTML del ticket
      const ticketHTML = this.generateTicketHTML(ticketData);

      // Enviar correo usando la configuración de la empresa
      const result = await this.sendEmail({
        to: recipientEmail,
        subject: `Tu ticket para ${ticketData.eventName}`,
        html: ticketHTML,
        emailConfig,
      });

      return result;
    } catch (error) {
      console.error('Error enviando ticket por correo:', error);
      throw error;
    }
  }

  // Enviar correo usando configuración SMTP
  static async sendEmail({ to, subject, html, emailConfig }) {
    try {
      // Aquí implementarías la lógica real de envío usando nodemailer o similar
      // Por ahora simulamos el envío
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 2000));

      // En el futuro, aquí usarías nodemailer:
      /*
      const transporter = nodemailer.createTransporter({
        host: emailConfig.smtp_host,
        port: emailConfig.smtp_port,
        secure: emailConfig.smtp_secure,
        auth: {
          user: emailConfig.smtp_user,
          pass: emailConfig.smtp_password
        }
      });

      const mailOptions = {
        from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
        to: to,
        subject: subject,
        html: html,
        replyTo: emailConfig.reply_to_email || emailConfig.from_email
      };

      const result = await transporter.sendMail(mailOptions);
      */

      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        message: 'Correo enviado correctamente',
      };
    } catch (error) {
      console.error('Error enviando correo:', error);
      throw error;
    }
  }

  // Generar HTML del ticket
  static generateTicketHTML(ticketData) {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket - ${ticketData.eventName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .ticket-container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .event-name {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
          }
          .ticket-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .qr-code {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          .important-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="header">
            <div class="event-name">${ticketData.eventName}</div>
            <div style="font-size: 18px; color: #666;">Tu ticket está listo</div>
          </div>

          <div class="ticket-details">
            <div class="detail-row">
              <span class="detail-label">Evento:</span>
              <span class="detail-value">${ticketData.eventName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">${ticketData.eventDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hora:</span>
              <span class="detail-value">${ticketData.eventTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lugar:</span>
              <span class="detail-value">${ticketData.venueName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Dirección:</span>
              <span class="detail-value">${ticketData.venueAddress}</span>
            </div>
          </div>

          <div class="ticket-details">
            <div class="detail-row">
              <span class="detail-label">Número de Ticket:</span>
              <span class="detail-value">${ticketData.ticketNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Asiento:</span>
              <span class="detail-value">${ticketData.seatInfo || 'General'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Zona:</span>
              <span class="detail-value">${ticketData.zoneName || 'General'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Precio:</span>
              <span class="detail-value">$${ticketData.price}</span>
            </div>
          </div>

          <div class="qr-code">
            <div style="font-weight: bold; margin-bottom: 10px;">Código QR del Ticket</div>
            <div style="background-color: #333; color: white; padding: 20px; border-radius: 5px; display: inline-block;">
              [QR Code: ${ticketData.ticketNumber}]
            </div>
            <div style="font-size: 12px; margin-top: 10px; color: #666;">
              Escanea este código en la entrada del evento
            </div>
          </div>

          <div class="important-note">
            <strong>Importante:</strong> Lleva este ticket impreso o muéstralo en tu dispositivo móvil en la entrada del evento.
          </div>

          <div class="footer">
            <p>Gracias por tu compra</p>
            <p>${ticketData.companyName || 'Tu Empresa'}</p>
            <p>Para soporte: ${ticketData.supportEmail || 'soporte@tuempresa.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Enviar múltiples tickets en un solo correo
  static async sendMultipleTicketsEmail(ticketsData, recipientEmail) {
    try {
      const emailConfig = await EmailConfigService.getEmailConfig();
      if (!emailConfig) {
        throw new Error('No hay configuración de correo configurada');
      }

      const ticketsHTML = this.generateMultipleTicketsHTML(ticketsData);

      const result = await this.sendEmail({
        to: recipientEmail,
        subject: `Tus tickets para ${ticketsData.eventName}`,
        html: ticketsHTML,
        emailConfig,
      });

      return result;
    } catch (error) {
      console.error('Error enviando múltiples tickets por correo:', error);
      throw error;
    }
  }

  // Generar HTML para múltiples tickets
  static generateMultipleTicketsHTML(ticketsData) {
    const ticketsList = ticketsData.tickets
      .map(
        ticket => `
      <div class="ticket-item" style="border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px;">
        <div class="detail-row">
          <span class="detail-label">Ticket #${ticket.ticketNumber}:</span>
          <span class="detail-value">${ticket.seatInfo || 'General'} - ${ticket.zoneName || 'General'}</span>
        </div>
      </div>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Múltiples Tickets - ${ticketsData.eventName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .ticket-container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .event-name {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
          }
          .tickets-summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .ticket-item {
            border: 1px solid #ddd;
            margin: 15px 0;
            padding: 15px;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="header">
            <div class="event-name">${ticketsData.eventName}</div>
            <div style="font-size: 18px; color: #666;">Tus tickets están listos</div>
          </div>

          <div class="tickets-summary">
            <div class="detail-row">
              <span class="detail-label">Evento:</span>
              <span class="detail-value">${ticketsData.eventName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">${ticketsData.eventDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hora:</span>
              <span class="detail-value">${ticketsData.eventTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lugar:</span>
              <span class="detail-value">${ticketsData.venueName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total de tickets:</span>
              <span class="detail-value">${ticketsData.tickets.length}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Precio total:</span>
              <span class="detail-value">$${ticketsData.totalPrice}</span>
            </div>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #007bff; margin-bottom: 15px;">Detalle de Tickets:</h3>
            ${ticketsList}
          </div>

          <div class="footer">
            <p>Gracias por tu compra</p>
            <p>${ticketsData.companyName || 'Tu Empresa'}</p>
            <p>Para soporte: ${ticketsData.supportEmail || 'soporte@tuempresa.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Verificar si hay configuración de correo activa
  static async hasEmailConfig() {
    try {
      const config = await EmailConfigService.getEmailConfig();
      return config && config.is_active;
    } catch (error) {
      return false;
    }
  }
}
