import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { getConfig, validateConfig } from './config';
import { createTicketPdfBuffer } from './download';

const config = getConfig();
const supabaseUrl = config.supabaseUrl;
const supabaseServiceKey = config.supabaseServiceKey;

let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
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

async function getTenantEmailConfig(tenantId) {
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

async function getGlobalEmailConfig() {
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

async function resolveEmailConfig(tenantId) {
  const tenantConfig = await getTenantEmailConfig(tenantId);
  if (tenantConfig) return tenantConfig;

  const globalConfig = await getGlobalEmailConfig();
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

function buildEmailContent({ locator, eventTitle, recipient }) {
  const subject = eventTitle
    ? `Tus tickets para ${eventTitle}`
    : 'Tus tickets están listos';

  const bodyEvent = eventTitle ? `<p><strong>Evento:</strong> ${eventTitle}</p>` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #1a73e8;">¡Gracias por tu compra!</h2>
      ${bodyEvent}
      <p>Adjuntamos tus tickets en formato PDF.</p>
      <p><strong>Localizador:</strong> ${locator}</p>
      <p>Si tienes alguna pregunta, responde a este correo.</p>
    </div>
  `;

  const textLines = [
    '¡Gracias por tu compra!',
    eventTitle ? `Evento: ${eventTitle}` : null,
    `Localizador: ${locator}`,
    'Adjuntamos tus tickets en formato PDF.',
    'Si tienes alguna pregunta, responde a este correo.'
  ].filter(Boolean);

  const text = textLines.join('\n');

  return { subject, html, text };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  const { email } = req.body || {};

  if (!locator) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing locator' });
  }

  if (!email) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing email' });
  }

  if (!validateConfig()) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing Supabase environment variables',
    });
  }

  if (!supabaseAdmin) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Supabase client not initialized' });
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

    const { buffer, filename, eventTitle } = await createTicketPdfBuffer(payment, locator, {
      funcionData,
      eventData,
      venueData,
    });

    const emailConfig = await resolveEmailConfig(payment.tenant_id);
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
      attachments: [
        {
          filename,
          content: buffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: 'Email sent', id: result.messageId });
  } catch (err) {
    console.error('[EMAIL] Error sending ticket email:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
}
