import nodemailer from 'nodemailer';
import { getConfig, validateConfig, getSupabaseAdmin } from './config.js';
import { createTicketPdfBuffer } from './download.js';
// tokenUtils solo usa módulos nativos de Node.js (crypto), así que puede importarse estáticamente
import { generateDownloadToken } from './tokenUtils.js';

const TABLE_MISSING_CODES = new Set(['42P01', 'PGRST116', 'PGRST301']);

function isTableMissing(error) {
  if (!error) return false;
  if (TABLE_MISSING_CODES.has(String(error.code).toUpperCase())) return true;
  const message = String(error.message || '').toLowerCase();
  return message.includes('does not exist') || message.includes('not found');
}

function mapEmailConfig(row) {
  if (!row) return null;
  return {
    host: row.smtp_host,
    port: Number(row.smtp_port) || (row.smtp_secure ? 465 : 587),
    secure: Boolean(row.smtp_secure),
    user: row.smtp_user,
    pass: row.smtp_pass,
    fromEmail: row.from_email,
    fromName: row.from_name,
    replyTo: row.reply_to || row.from_email,
  };
}

async function getTenantEmailConfig(supabaseAdmin, tenantId) {
  if (!tenantId || !supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('tenant_email_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      if (isTableMissing(error)) return null;
      console.warn('[EMAIL] Error fetching tenant email config:', error);
      return null;
    }

    return mapEmailConfig(data);
  } catch (err) {
    console.warn('[EMAIL] Unexpected error fetching tenant email config:', err);
    return null;
  }
}

async function getGlobalEmailConfig(supabaseAdmin) {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('global_email_config')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      if (isTableMissing(error)) return null;
      console.warn('[EMAIL] Error fetching global email config:', error);
      return null;
    }

    return mapEmailConfig(data);
  } catch (err) {
    console.warn('[EMAIL] Unexpected error fetching global email config:', err);
    return null;
  }
}

function getEnvEmailConfig() {
  const host = process.env.EMAIL_SMTP_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_SMTP_PORT || process.env.SMTP_PORT);
  const secureEnv = process.env.EMAIL_SMTP_SECURE || process.env.SMTP_SECURE;
  const secure = secureEnv ? secureEnv === 'true' : (port === 465);
  const user = process.env.EMAIL_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS || process.env.SMTP_PASS;
  const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || process.env.FROM_NAME;
  const replyTo = process.env.EMAIL_REPLY_TO || fromEmail;

  if (!host || !fromEmail) return null;

  return {
    host,
    port: port || (secure ? 465 : 587),
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    replyTo,
  };
}

async function resolveEmailConfig(supabaseAdmin, tenantId) {
  const tenantConfig = await getTenantEmailConfig(supabaseAdmin, tenantId);
  if (tenantConfig) return tenantConfig;

  const globalConfig = await getGlobalEmailConfig(supabaseAdmin);
  if (globalConfig) return globalConfig;

  return getEnvEmailConfig();
}

function createTransporter(config) {
  const auth = config.user && config.pass ? { user: config.user, pass: config.pass } : undefined;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
  });
}

function buildEmailContent({ locator, eventTitle, recipient, downloadUrl, emailType = 'payment_complete' }) {
  // Determinar el tipo de correo (reserva o pago completo)
  const isReservation = emailType === 'reservation';
  
  const subject = isReservation
    ? (eventTitle ? `Reserva confirmada para ${eventTitle}` : 'Reserva confirmada')
    : (eventTitle ? `Tus tickets para ${eventTitle}` : 'Tus tickets están listos');

  const bodyEvent = eventTitle ? `<p><strong>Evento:</strong> ${eventTitle}</p>` : '';

  // Contenido diferente según el tipo de correo
  let mainContent = '';
  if (isReservation) {
    mainContent = `
      <p>Tu reserva ha sido confirmada exitosamente.</p>
      <p><strong>Localizador:</strong> ${locator}</p>
      <p style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <strong>⚠️ Importante:</strong> Esta es una reserva temporal. Completa el pago para confirmar tus asientos.
        Te notificaremos cuando tu pago sea procesado y recibirás tus tickets.
      </p>
    `;
  } else {
    mainContent = `
      <p>¡Gracias por tu compra! Tu pago ha sido procesado exitosamente.</p>
      <p><strong>Localizador:</strong> ${locator}</p>
      <p>Adjuntamos tus tickets en formato PDF.</p>
    `;
  }

  // Botón de descarga solo para pagos completos
  const downloadButton = (!isReservation && downloadUrl) ? `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${downloadUrl}" style="display: inline-block; padding: 12px 30px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Descargar Tickets
      </a>
    </div>
    <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Importante:</p>
      <p style="margin: 5px 0 0 0; color: #856404;">
        Este enlace es personal e intransferible. Fue enviado directamente a tu correo electrónico.
        <strong>No compartas este enlace</strong> con otras personas.
      </p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">${isReservation ? '¡Reserva Confirmada!' : '¡Gracias por tu compra!'}</h2>
      ${bodyEvent}
      ${mainContent}
      ${downloadButton}
      <p style="margin-top: 30px;">Si tienes alguna pregunta, responde a este correo.</p>
    </div>
  `;

  const textLines = [
    isReservation ? '¡Reserva Confirmada!' : '¡Gracias por tu compra!',
    eventTitle ? `Evento: ${eventTitle}` : null,
    `Localizador: ${locator}`,
    isReservation 
      ? 'Tu reserva ha sido confirmada. Completa el pago para recibir tus tickets.'
      : 'Adjuntamos tus tickets en formato PDF.',
    (!isReservation && downloadUrl) ? `Descargar tickets: ${downloadUrl}` : null,
    (!isReservation && downloadUrl) ? '⚠️ IMPORTANTE: Este enlace es personal e intransferible. No compartas este enlace con otras personas.' : null,
    'Si tienes alguna pregunta, responde a este correo.'
  ].filter(Boolean);

  const text = textLines.join('\n');

  return { subject, html, text };
}

export async function handleEmail(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  const { email: providedEmail, type } = req.body || {};

  if (!locator) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing locator' });
  }

  // Si no se proporciona email, intentar obtenerlo del pago
  let email = providedEmail;

  const config = getConfig();
  const isValidConfig = validateConfig(config);
  const supabaseAdmin = getSupabaseAdmin(config);

  if (!isValidConfig || !supabaseAdmin) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing Supabase environment variables',
      config: {
        supabaseUrl: !!config.supabaseUrl,
        supabaseServiceKey: !!config.supabaseServiceKey,
        nodeEnv: config.nodeEnv,
        vercelEnv: config.vercelEnv
      }
    });
  }

  try {
    let payment = null;

    const { data: locatorMatches, error: locatorError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('locator', locator)
      .order('created_at', { ascending: false })
      .limit(5);

    if (locatorError) {
      console.warn('[EMAIL] Error fetching payment by locator:', locatorError);
    }

    if (Array.isArray(locatorMatches) && locatorMatches.length > 0) {
      payment = locatorMatches[0];
      if (locatorMatches.length > 1) {
        console.warn('[EMAIL] Multiple payments found for locator, using most recent.', {
          locator,
          total: locatorMatches.length,
        });
      }
    }

    if (!payment) {
      const { data: orderMatches, error: orderError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('order_id', locator)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orderError) {
        console.warn('[EMAIL] Error fetching payment by order_id:', orderError);
      }

      if (Array.isArray(orderMatches) && orderMatches.length > 0) {
        payment = orderMatches[0];
      }
    }

    if (!payment) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Si no se proporcionó email, obtenerlo del usuario del pago
    if (!email && payment.user_id) {
      try {
        // Intentar obtener desde auth.users usando admin
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(payment.user_id);
        if (!userError && userData?.user?.email) {
          email = userData.user.email;
          console.log('📧 [EMAIL] Email obtenido desde auth.users:', email);
        } else {
          // Fallback: obtener desde profiles
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('email, login')
            .eq('id', payment.user_id)
            .maybeSingle();
          
          if (!profileError && profile) {
            email = profile.email || profile.login;
            console.log('📧 [EMAIL] Email obtenido desde profiles:', email);
          }
        }
      } catch (emailError) {
        console.warn('⚠️ [EMAIL] Error obteniendo email del usuario:', emailError);
      }
    }

    // Si aún no hay email, retornar error
    if (!email) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Missing email - No se pudo obtener el email del usuario' });
    }

    let seats = [];
    try {
      if (Array.isArray(payment.seats)) seats = payment.seats;
      else if (typeof payment.seats === 'string') {
        try {
          seats = JSON.parse(payment.seats);
        } catch {
          seats = JSON.parse(JSON.parse(payment.seats));
        }
      }
    } catch (parseErr) {
      console.warn('[EMAIL] Error parsing seats info:', parseErr);
      seats = [];
    }
    payment.seats = seats;

    let funcionData = null;
    let eventData = null;
    let venueData = null;

    try {
      if (payment.funcion_id) {
        const { data: func, error: funcError } = await supabaseAdmin
          .from('funciones')
          .select('id, fecha_celebracion, evento:eventos(id, nombre, imagenes, recinto_id)')
          .eq('id', payment.funcion_id)
          .maybeSingle();

        if (!funcError && func) {
          funcionData = func;
          eventData = func.event || null;
          if (!payment.event && eventData) payment.event = eventData;
          if (eventData?.recinto_id) {
            const { data: rec, error: recError } = await supabaseAdmin
              .from('recintos')
              .select('id, nombre, direccion, ciudad, pais')
              .eq('id', eventData.recinto_id)
              .maybeSingle();
            if (!recError && rec) venueData = rec;
          }
        }
      }
    } catch (extraErr) {
      console.warn('[EMAIL] Error enriching payment data:', extraErr);
    }

    // Determinar el tipo de correo desde el body o desde el status del pago
    const paymentStatus = payment.status || 'completed';
    const emailType = type || (paymentStatus === 'completed' || paymentStatus === 'pagado' ? 'payment_complete' : 'reservation');
    const isReservation = emailType === 'reservation' || paymentStatus === 'reservado' || paymentStatus === 'reserved' || paymentStatus === 'pending';
    
    // Solo generar PDF y token si es pago completo (no para reservas)
    let buffer = null;
    let filename = null;
    let eventTitle = null;
    let downloadUrl = null;
    
    if (!isReservation) {
      // Generar PDF solo para pagos completos
      try {
        console.log('📄 [EMAIL] Generando PDF para correo...');
        const pdfResult = await createTicketPdfBuffer(payment, locator, {
          funcionData,
          eventData,
          venueData,
          supabaseAdmin,
          downloadSource: 'email', // Indicar que el PDF se genera para correo
        });
        
        if (!pdfResult || !pdfResult.buffer) {
          throw new Error('PDF generation returned invalid result - no buffer');
        }
        
        buffer = pdfResult.buffer;
        filename = pdfResult.filename;
        eventTitle = pdfResult.eventTitle;
        console.log('✅ [EMAIL] PDF generado exitosamente para correo');
      } catch (pdfError) {
        console.error('❌ [EMAIL] Error generando PDF para correo:', pdfError);
        console.error('❌ [EMAIL] PDF Error name:', pdfError?.name);
        console.error('❌ [EMAIL] PDF Error message:', pdfError?.message);
        console.error('❌ [EMAIL] PDF Error stack:', pdfError?.stack);
        // Continuar sin PDF - el correo se enviará sin adjunto
        buffer = null;
        filename = null;
        console.warn('⚠️ [EMAIL] Continuando sin PDF adjunto debido a error');
      }

      // Generar token de descarga para el enlace en el correo
      if (payment.user_id && payment.id) {
        try {
          const downloadToken = generateDownloadToken(locator, payment.user_id, payment.id);
          
          // Obtener base URL desde variables de entorno o desde req
          const baseUrl = process.env.BASE_URL || 
                         process.env.REACT_APP_BASE_URL || 
                         process.env.API_URL ||
                         (req.headers.origin || req.headers.host ? `https://${req.headers.host}` : 'https://sistema.veneventos.com');
          
          // Construir URL de descarga con token
          downloadUrl = `${baseUrl}/api/payments/${locator}/download?token=${encodeURIComponent(downloadToken)}&source=email`;
          
          console.log('🔑 [EMAIL] Token de descarga generado para locator:', locator);
          console.log('🔗 [EMAIL] URL de descarga:', downloadUrl);
        } catch (tokenError) {
          console.warn('⚠️ [EMAIL] Error generando token de descarga:', tokenError.message);
          console.warn('⚠️ [EMAIL] Token error stack:', tokenError.stack);
          // Continuar sin token, el usuario aún puede descargar desde el PDF adjunto
        }
      }
    } else {
      // Para reservas, obtener solo el título del evento
      if (eventData) {
        eventTitle = eventData.nombre;
      }
    }

    const emailConfig = await resolveEmailConfig(supabaseAdmin, payment.tenant_id);
    if (!emailConfig || !emailConfig.host || !emailConfig.fromEmail) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Email configuration not available',
        details: 'Configure SMTP credentials or tenant/global email settings',
      });
    }

    const transporter = createTransporter(emailConfig);

    const { subject, html, text } = buildEmailContent({
      locator,
      eventTitle,
      recipient: email,
      downloadUrl,
      emailType,
    });

    const mailOptions = {
      from: emailConfig.fromName
        ? `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`
        : emailConfig.fromEmail,
      to: email,
      subject,
      html,
      text,
      replyTo: emailConfig.replyTo,
      attachments: buffer && filename ? [
        {
          filename,
          content: buffer,
          contentType: 'application/pdf',
        },
      ] : [], // Solo adjuntar PDF si es pago completo
    };

    const result = await transporter.sendMail(mailOptions);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: 'Email sent', id: result.messageId });
  } catch (err) {
    console.error('[EMAIL] Error sending ticket email:', err);
    console.error('[EMAIL] Error name:', err?.name);
    console.error('[EMAIL] Error message:', err?.message);
    console.error('[EMAIL] Error stack:', err?.stack);
    console.error('[EMAIL] Error code:', err?.code);
    console.error('[EMAIL] Error details:', err?.details);
    
    res.setHeader('Content-Type', 'application/json');
    const errorMessage = err?.message || 'Failed to send email';
    const responsePayload = {
      error: {
        code: '500',
        message: typeof errorMessage === 'string' ? errorMessage : 'Failed to send email'
      }
    };

    // Agregar detalles en desarrollo
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
      responsePayload.details = err?.stack;
      responsePayload.errorName = err?.name;
      responsePayload.errorCode = err?.code;
      responsePayload.errorDetails = err?.details;
    }

    return res.status(500).json(responsePayload);
  }
}
