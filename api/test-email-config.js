import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { config, from, to, subject, html } = req.body;

    // Validar datos requeridos
    if (!config || !from || !to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: config, from, to, subject, html' 
      });
    }

    // Validar configuración SMTP
    if (!config.host || !config.port || !config.auth?.user || !config.auth?.pass) {
      return res.status(400).json({ 
        error: 'Invalid SMTP configuration. Missing host, port, user, or password' 
      });
    }

    // Crear transporter con la configuración proporcionada
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure === true || config.secure === 'true',
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verificar conexión SMTP
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      return res.status(400).json({ 
        error: `SMTP connection failed: ${verifyError.message}`,
        details: verifyError.toString()
      });
    }

    // Configurar mensaje de prueba
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: html.replace(/<[^>]*>/g, ''),
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Test-Email': 'true'
      }
    };

    // Enviar email de prueba
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Test email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
      from: from,
      host: config.host,
      port: config.port
    });

    res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      response: info.response,
      message: 'Email de prueba enviado exitosamente',
      details: {
        to: to,
        from: from,
        subject: subject,
        host: config.host,
        port: config.port,
        secure: config.secure
      }
    });

  } catch (error) {
    console.error('❌ Test email error:', error);
    
    // Proporcionar mensajes de error más específicos
    let errorMessage = 'Error enviando email de prueba';
    let errorDetails = error.message;

    if (error.code === 'EAUTH') {
      errorMessage = 'Error de autenticación SMTP';
      errorDetails = 'Usuario o contraseña incorrectos';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Error de conexión SMTP';
      errorDetails = 'No se pudo conectar al servidor SMTP';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout de conexión SMTP';
      errorDetails = 'El servidor SMTP no respondió a tiempo';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      code: error.code,
      fullError: error.toString()
    });
  }
}
