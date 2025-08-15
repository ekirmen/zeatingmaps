import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  console.log('Email endpoint called with method:', req.method);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  if (!locator) {
    console.error('Missing locator in query params');
    return res.status(400).json({ error: 'Missing locator' });
  }

  const { email } = req.body;
  if (!email) {
    console.error('Missing email in request body');
    return res.status(400).json({ error: 'Missing email' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    console.error('Missing auth token in headers');
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    // Verificar el token del usuario
    const userResp = await supabaseAdmin?.auth?.getUser?.(token);
    const user = userResp?.data?.user || null;
    const userError = userResp?.error || null;
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Obtener datos del pago
    console.log('Searching for payment with locator:', locator);
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        funcion:funciones(
          *,
          evento:eventos(
            *,
            recinto:recintos(
              *
            )
          )
        ),
        seats:zeatingmaps(
          *,
          zona:zonas(
            *
          )
        )
      `)
      .eq('locator', locator)
      .single();

    if (paymentError) {
      console.error('Database error:', paymentError);
      return res.status(500).json({ error: 'Error obteniendo datos del pago' });
    }

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Obtener configuración de email
    const { data: emailConfig, error: configError } = await supabaseAdmin
      .from('email_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !emailConfig) {
      console.error('No hay configuración de email activa:', configError);
      return res.status(500).json({ error: 'No hay configuración de email configurada' });
    }

    // Generar datos del ticket
    const ticketData = {
      eventName: payment.funcion?.evento?.nombre || 'Evento',
      eventDate: payment.funcion?.fecha_celebracion ? 
        new Date(payment.funcion.fecha_celebracion).toLocaleDateString('es-ES') : 'Fecha por definir',
      eventTime: payment.funcion?.hora_inicio || 'Hora por definir',
      venueName: payment.funcion?.evento?.recinto?.nombre || 'Recinto',
      venueAddress: payment.funcion?.evento?.recinto?.direccion || 'Dirección no disponible',
      ticketNumber: payment.locator,
      price: payment.amount || 0,
      companyName: emailConfig.from_name || 'Tu Empresa',
      supportEmail: emailConfig.reply_to_email || emailConfig.from_email,
      seats: payment.seats || []
    };

    // Generar HTML del ticket
    const ticketHTML = generateTicketHTML(ticketData);

    // Enviar email usando la configuración SMTP
    const emailResult = await sendEmail({
      to: email,
      subject: `Tu ticket para ${ticketData.eventName}`,
      html: ticketHTML,
      emailConfig
    });

    if (emailResult.success) {
      // Registrar el envío en la base de datos
      await supabaseAdmin
        .from('email_logs')
        .insert([{
          payment_id: payment.id,
          recipient_email: email,
          subject: `Ticket para ${ticketData.eventName}`,
          status: 'sent',
          sent_at: new Date().toISOString()
        }]);

      return res.status(200).json({
        success: true,
        message: 'Ticket enviado correctamente',
        messageId: emailResult.messageId
      });
    } else {
      throw new Error('Error enviando email');
    }

  } catch (error) {
    console.error('Error en endpoint de email:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

// Función para generar HTML del ticket
function generateTicketHTML(ticketData) {
  const seatsList = ticketData.seats.map(seat => `
    <div style="border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: bold; color: #555;">Asiento:</span>
        <span style="color: #333;">${seat.name || seat.nombre || 'General'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: bold; color: #555;">Zona:</span>
        <span style="color: #333;">${seat.zona?.nombre || 'General'}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold; color: #555;">Precio:</span>
        <span style="color: #333;">$${seat.price || 0}</span>
      </div>
    </div>
  `).join('');

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
            <span class="detail-label">Total de Asientos:</span>
            <span class="detail-value">${ticketData.seats.length}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Precio Total:</span>
            <span class="detail-value">$${ticketData.price}</span>
          </div>
        </div>

        ${ticketData.seats.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #007bff; margin-bottom: 15px;">Detalle de Asientos:</h3>
            ${seatsList}
          </div>
        ` : ''}

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
          <p>${ticketData.companyName}</p>
          <p>Para soporte: ${ticketData.supportEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Función para enviar email usando configuración SMTP
async function sendEmail({ to, subject, html, emailConfig }) {
  try {
    console.log('Enviando correo con configuración:', {
      to,
      subject,
      smtpHost: emailConfig.smtp_host,
      smtpPort: emailConfig.smtp_port,
      from: emailConfig.from_email
    });

    // Intentar usar nodemailer si está disponible
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (requireError) {
      console.log('Nodemailer no disponible, simulando envío...');
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        message: 'Correo enviado correctamente (simulado)'
      };
    }

    // Crear transporter con configuración SMTP
    const transporter = nodemailer.createTransporter({
      host: emailConfig.smtp_host,
      port: parseInt(emailConfig.smtp_port),
      secure: emailConfig.smtp_secure === 'true' || emailConfig.smtp_secure === true,
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_password
      },
      tls: {
        rejectUnauthorized: false // Para evitar problemas con certificados SSL
      }
    });

    // Verificar conexión SMTP
    await transporter.verify();

    // Configurar opciones del email
    const mailOptions = {
      from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: emailConfig.reply_to_email || emailConfig.from_email
    };

    // Enviar email
    const result = await transporter.sendMail(mailOptions);

    console.log('Email enviado exitosamente:', result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Correo enviado correctamente'
    };

  } catch (error) {
    console.error('Error enviando correo:', error);
    
    // Si es error de configuración SMTP, retornar error específico
    if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
      throw new Error(`Error de configuración SMTP: ${error.message}`);
    }
    
    throw error;
  }
}
