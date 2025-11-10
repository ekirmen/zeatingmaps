import nodemailer from 'nodemailer';
import { getConfig, validateConfig, getSupabaseAdmin } from './config.js';
import { createTicketPdfBuffer } from './download.js';
import { generatePkpass, getEventDataForPkpass } from './pkpass-generator.js';
import crypto from 'crypto';

// Funciones de tokenUtils inlined para evitar problemas de empaquetado en Vercel
// Usar la misma clave secreta que Supabase Service Role Key para mayor seguridad
const TOKEN_SECRET_KEY = process.env.TICKET_DOWNLOAD_SECRET || 
                         process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         'default-secret-key-change-in-production';

/**
 * Genera un token permanente para descarga de tickets desde correo
 * El token NO expira, pero está firmado y vinculado al usuario y pago
 * Inlined desde tokenUtils.js para evitar problemas de empaquetado en Vercel
 * 
 * @param {string} locator - Localizador del pago
 * @param {string} userId - ID del usuario
 * @param {string} paymentId - ID del pago
 * @returns {string} Token firmado
 */
function generateDownloadToken(locator, userId, paymentId) {
  const payload = {
    locator,
    userId,
    paymentId,
    source: 'email',
    createdAt: Date.now() // Para tracking, no para expiración
  };
  
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET_KEY)
    .update(payloadString)
    .digest('hex');
  
  // Codificar el payload en base64url (seguro para URLs)
  const token = Buffer.from(payloadString).toString('base64url') + '.' + signature;
  
  console.log('🔑 [TOKEN] Token generado para locator:', locator);
  console.log('🔑 [TOKEN] Token length:', token.length);
  
  return token;
}

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

function buildEmailContent({ locator, eventTitle, recipient, downloadUrl, emailType = 'payment_complete', seats = [], downloadToken = null, baseUrl = '' }) {
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

  // Botones de descarga individual por asiento (solo para pagos completos)
  let downloadButtons = '';
  if (!isReservation && seats && seats.length > 0 && downloadToken && baseUrl) {
    const seatButtons = seats.map((seat, index) => {
      const seatId = seat.seat_id || seat.id || seat._id || `Asiento ${index + 1}`;
      const seatDownloadUrl = `${baseUrl}/api/payments/${locator}/download?token=${encodeURIComponent(downloadToken)}&source=email&seatIndex=${index}`;
      return `
        <div style="margin: 10px 0;">
          <a href="${seatDownloadUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">
            Descargar Asiento ${index + 1}${seatId !== `Asiento ${index + 1}` ? ` (${seatId})` : ''}
          </a>
        </div>
      `;
    }).join('');
    
    downloadButtons = `
      <div style="margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Descargar Tickets Individuales:</h3>
        ${seatButtons}
      </div>
      <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Importante:</p>
        <p style="margin: 5px 0 0 0; color: #856404;">
          Estos enlaces son personales e intransferibles. Fueron enviados directamente a tu correo electrónico.
          <strong>No compartas estos enlaces</strong> con otras personas.
        </p>
      </div>
    `;
  } else if (!isReservation && downloadUrl) {
    // Fallback: botón de descarga general si no hay asientos o token
    downloadButtons = `
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
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">${isReservation ? '¡Reserva Confirmada!' : '¡Gracias por tu compra!'}</h2>
      ${bodyEvent}
      ${mainContent}
      ${downloadButtons}
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
    let pkpassBuffer = null;
    let pkpassFilename = null;
    
    // Verificar si el evento tiene habilitado el wallet
    let datosBoleto = null;
    if (eventData?.datosBoleto) {
      try {
        datosBoleto = typeof eventData.datosBoleto === 'string' 
          ? JSON.parse(eventData.datosBoleto) 
          : eventData.datosBoleto;
      } catch (e) {
        console.warn('⚠️ [EMAIL] Error parseando datosBoleto:', e);
        datosBoleto = {};
      }
    }
    
    const walletEnabled = datosBoleto?.habilitarWallet || false;
    
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
      
      // Generar .pkpass si el wallet está habilitado
      if (walletEnabled) {
        try {
          console.log('🎫 [EMAIL] Wallet habilitado, generando .pkpass para correo...');
          
          // Obtener datos completos del evento si no los tenemos
          if (!eventData || !funcionData || !venueData) {
            const eventDataResult = await getEventDataForPkpass(
              supabaseAdmin,
              payment.evento_id,
              payment.funcion_id
            );
            
            if (eventDataResult) {
              if (!eventData) eventData = eventDataResult.evento;
              if (!funcionData) funcionData = eventDataResult.funcion;
              if (!venueData) venueData = eventDataResult.recinto;
            }
          }
          
          // Parsear asientos
          let seats = [];
          try {
            if (typeof payment.seats === 'string') {
              seats = JSON.parse(payment.seats);
            } else if (Array.isArray(payment.seats)) {
              seats = payment.seats;
            }
          } catch (e) {
            console.warn('⚠️ [EMAIL] Error parseando asientos para pkpass:', e);
          }
          
          if (seats.length > 0) {
            // Generar .pkpass para el primer asiento
            const seat = seats[0];
            const ticketData = {
              locator: payment.locator,
              orderId: payment.order_id,
              seatId: seat.id || seat._id || seat.seatId || seat.seat_id,
              zonaNombre: seat.zonaNombre || seat.nombreZona || seat.zona?.nombre || seat.zona,
              mesa: seat.mesa || seat.table || seat.mesaNombre || seat.mesa?.nombre,
              fila: seat.fila || seat.row || seat.filaNombre || seat.fila?.nombre,
              asiento: seat.asiento || seat.seat || seat.asientoNombre || seat.nombre || seat.name,
              price: seat.price || seat.precio
            };
            
            // Obtener imágenes del evento si están disponibles
            let images = null;
            if (eventData?.imagenes) {
              try {
                const imagenesData = typeof eventData.imagenes === 'string' 
                  ? JSON.parse(eventData.imagenes) 
                  : eventData.imagenes;
                
                images = {};
                if (imagenesData.logoHorizontal) {
                  images.logo = imagenesData.logoHorizontal;
                }
                if (imagenesData.logoCuadrado) {
                  images.icon = imagenesData.logoCuadrado;
                }
              } catch (e) {
                console.warn('⚠️ [EMAIL] Error parseando imágenes para pkpass:', e);
              }
            }
            
            // Opciones para generar el pkpass
            const pkpassOptions = {
              organizationName: 'Veneventos',
              passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.com.veneventos.ticket',
              teamIdentifier: process.env.TEAM_IDENTIFIER || 'TEAM123456',
              images: images,
              // Certificados (si están disponibles)
              certificate: process.env.APPLE_CERTIFICATE ? Buffer.from(process.env.APPLE_CERTIFICATE, 'base64') : null,
              privateKey: process.env.APPLE_PRIVATE_KEY ? Buffer.from(process.env.APPLE_PRIVATE_KEY, 'base64') : null,
              wwdrCertificate: process.env.APPLE_WWDR_CERTIFICATE ? Buffer.from(process.env.APPLE_WWDR_CERTIFICATE, 'base64') : null
            };
            
            // Generar el archivo .pkpass
            pkpassBuffer = await generatePkpass(
              ticketData,
              eventData,
              funcionData,
              venueData,
              pkpassOptions
            );
            
            pkpassFilename = `ticket-${payment.locator}-${ticketData.seatId || 'ticket'}.pkpass`;
            console.log('✅ [EMAIL] Archivo .pkpass generado exitosamente para correo');
          } else {
            console.warn('⚠️ [EMAIL] No se encontraron asientos para generar .pkpass');
          }
        } catch (pkpassError) {
          console.error('❌ [EMAIL] Error generando .pkpass para correo:', pkpassError);
          console.error('❌ [EMAIL] PKPASS Error message:', pkpassError?.message);
          console.error('❌ [EMAIL] PKPASS Error stack:', pkpassError?.stack);
          // Continuar sin .pkpass - el correo se enviará sin este adjunto
          pkpassBuffer = null;
          pkpassFilename = null;
          console.warn('⚠️ [EMAIL] Continuando sin .pkpass adjunto debido a error');
        }
      }

      // Generar token de descarga para el enlace en el correo
      let downloadToken = null;
      let baseUrl = '';
      if (payment.user_id && payment.id) {
        try {
          downloadToken = generateDownloadToken(locator, payment.user_id, payment.id);
          
          // Obtener base URL desde variables de entorno o desde req
          baseUrl = process.env.BASE_URL || 
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

    // Parsear asientos para incluir en el correo
    let parsedSeats = [];
    if (payment.seats) {
      try {
        if (Array.isArray(payment.seats)) {
          parsedSeats = payment.seats;
        } else if (typeof payment.seats === 'string') {
          parsedSeats = JSON.parse(payment.seats);
        }
      } catch (e) {
        console.warn('⚠️ [EMAIL] Error parseando asientos para correo:', e);
      }
    }
    
    const { subject, html, text } = buildEmailContent({
      locator,
      eventTitle,
      recipient: email,
      downloadUrl,
      emailType,
      seats: parsedSeats,
      downloadToken: downloadToken || null,
      baseUrl: baseUrl || ''
    });

    // Preparar adjuntos (PDF y .pkpass si están disponibles)
    const attachments = [];
    
    if (buffer && filename) {
      attachments.push({
        filename,
        content: buffer,
        contentType: 'application/pdf',
      });
    }
    
    if (pkpassBuffer && pkpassFilename) {
      attachments.push({
        filename: pkpassFilename,
        content: pkpassBuffer,
        contentType: 'application/vnd.apple.pkpass',
      });
      console.log('📎 [EMAIL] Archivo .pkpass agregado como adjunto:', pkpassFilename);
    }
    
    const mailOptions = {
      from: emailConfig.fromName
        ? `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`
        : emailConfig.fromEmail,
      to: email,
      subject,
      html,
      text,
      replyTo: emailConfig.replyTo,
      attachments, // Adjuntar PDF y .pkpass si están disponibles
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
