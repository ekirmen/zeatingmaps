import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateTicketPDF } from '../utils/pdfGenerator.js';

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
  const message = `Para restablecer tu contrase\u00f1a, haz clic en el siguiente enlace: ${resetUrl}`;
  await sendEmail({
    to: user.email,
    subject: 'Restablecer contrase\u00f1a',
    text: message
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

  await sendEmail({
    to,
    subject: 'Tus entradas',
    text: 'Adjunto se encuentran tus tickets en PDF.',
    attachments: [{ filename: `ticket_${payment.locator}.pdf`, content: Buffer.concat(buffers) }]
  });
};

export const sendReservationEmail = async (payment, to) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 64px; color: #22c55e;">&#10004;</div>
          <h2 style="margin: 16px 0 8px; font-size: 24px; color: #111827;">¡Reserva Exitosa!</h2>
          <p style="font-size: 16px; color: #4b5563;">Tu reserva ha sido registrada con éxito.</p>
        </div>
        <div style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0; margin: 24px 0;">
          <p style="margin: 0; color: #4b5563;">Localizador:</p>
          <p style="font-family: monospace; font-weight: bold; font-size: 20px; margin: 4px 0;">${payment.locator}</p>
          <p style="margin: 0; color: #4b5563;">Fecha: ${new Date(payment.createdAt).toLocaleString()}</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${frontendUrl}/payment-success?locator=${payment.locator}" style="display:inline-block; padding:12px 24px; background-color:#3b82f6; color:#ffffff; border-radius:4px; text-decoration:none;">Ver detalles</a>
        </div>
        <p style="margin-top:24px; font-size:12px; color:#6b7280; text-align:center;">Guarda tu localizador para futuras referencias.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Reserva realizada',
    html
  });
};
