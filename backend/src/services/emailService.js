import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateTicketPDF } from '../utils/pdfGenerator.js';
import EmailTemplate from '../models/EmailTemplate.js';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const applyTemplate = (body, replacements) => {
  let result = body;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
};

const getTemplateContent = async (type, replacements, defaults) => {
  const template = await EmailTemplate.findOne({ type });
  const subject = template?.subject || defaults.subject;
  const htmlTemplate = template?.body || defaults.body;
  const body = applyTemplate(htmlTemplate, replacements);
  return { subject, body };
};

export const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured');
  }
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    ...options
  });
};

export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  const defaults = {
    subject: 'Restablecer contrase\u00f1a',
    body: 'Para restablecer tu contrase\u00f1a, haz clic en el siguiente enlace: {{resetUrl}}'
  };
  const { subject, body } = await getTemplateContent(
    'resetPassword',
    { resetUrl, email: user.email },
    defaults
  );
  await sendEmail({
    to: user.email,
    subject,
    html: body
  });
};

export const sendTicketEmail = async (payment, to) => {
  const doc = await generateTicketPDF(payment);
  const buffers = [];
  await new Promise((resolve, reject) => {
    doc.on('data', b => buffers.push(b));
    doc.on('end', resolve);
    doc.on('error', reject);
    doc.end();
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const defaults = { subject: 'Tus entradas', body: 'Adjunto se encuentran tus tickets en PDF.' };
  const { subject, body } = await getTemplateContent(
    'paid',
    {
      locator: payment.locator,
      date: new Date(payment.createdAt).toLocaleString(),
      link: `${frontendUrl}/payment-success?locator=${payment.locator}`
    },
    defaults
  );

  await sendEmail({
    to,
    subject,
    html: body,
    attachments: [{ filename: `ticket_${payment.locator}.pdf`, content: Buffer.concat(buffers) }]
  });
};

export const sendReservationEmail = async (payment, to) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 64px; color: #22c55e;">&#10004;</div>
          <h2 style="margin: 16px 0 8px; font-size: 24px; color: #111827;">¡Reserva Exitosa!</h2>
          <p style="font-size: 16px; color: #4b5563;">Tu reserva ha sido registrada con éxito.</p>
        </div>
        <div style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0; margin: 24px 0;">
          <p style="margin: 0; color: #4b5563;">Localizador:</p>
          <p style="font-family: monospace; font-weight: bold; font-size: 20px; margin: 4px 0;">{{locator}}</p>
          <p style="margin: 0; color: #4b5563;">Fecha: {{date}}</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{link}}" style="display:inline-block; padding:12px 24px; background-color:#3b82f6; color:#ffffff; border-radius:4px; text-decoration:none;">Ver detalles</a>
        </div>
        <p style="margin-top:24px; font-size:12px; color:#6b7280; text-align:center;">Guarda tu localizador para futuras referencias.</p>
      </div>
    </div>
  `;
  const defaults = { subject: 'Reserva realizada', body: defaultHtml };
  const { subject, body: html } = await getTemplateContent(
    'reservation',
    {
      locator: payment.locator,
      date: new Date(payment.createdAt).toLocaleString(),
      link: `${frontendUrl}/payment-success?locator=${payment.locator}`
    },
    defaults
  );
  await sendEmail({
    to,
    subject,
    html
  });
};
