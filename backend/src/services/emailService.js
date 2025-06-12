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
