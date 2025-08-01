import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text, from, smtpConfig } = req.body;

    // Validar datos requeridos
    if (!to || !subject || !html || !from) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, html, from' 
      });
    }

    // Configuración SMTP para Gmail
    const transporter = nodemailer.createTransporter({
      host: smtpConfig?.host || process.env.REACT_APP_SMTP_HOST || 'smtp.gmail.com',
      port: smtpConfig?.port || process.env.REACT_APP_SMTP_PORT || 587,
      secure: smtpConfig?.secure || process.env.REACT_APP_SMTP_SECURE === 'true' || false,
      auth: {
        user: smtpConfig?.auth?.user || process.env.REACT_APP_SMTP_USER,
        pass: smtpConfig?.auth?.pass || process.env.REACT_APP_SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verificar configuración
    if (!transporter.options.auth.user || !transporter.options.auth.pass) {
      return res.status(400).json({ 
        error: 'SMTP credentials not configured. Please set REACT_APP_SMTP_USER and REACT_APP_SMTP_PASS' 
      });
    }

    // Configurar mensaje
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''),
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    });

  } catch (error) {
    console.error('SMTP sending error:', error);
    
    // Manejar errores específicos de Gmail
    let errorMessage = 'Error sending email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your Gmail credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your internet connection.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Please try again.';
    } else if (error.message.includes('Invalid login')) {
      errorMessage = 'Invalid Gmail credentials. Please check your username and password.';
    } else if (error.message.includes('Less secure app access')) {
      errorMessage = 'Gmail requires app-specific password. Please enable 2FA and generate an app password.';
    } else {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      error: errorMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 