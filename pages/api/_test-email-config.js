import net from 'net';
import tls from 'tls';

const sanitizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

const sanitizePort = (value) => {
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : 587;
};

const waitForResponse = (socket, timeoutMs = 15000) => {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;

      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^(\d{3})([\s-])(.*)$/);
      if (!match) return;
      const [, code, separator] = match;
      if (separator === '-') {
        return;
      }

      cleanup();
      resolve({
        code: Number(code),
        message: lines.join('\n')
      });
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error('Tiempo de espera agotado al comunicarse con el servidor SMTP'));
    };

    const onClose = () => {
      cleanup();
      reject(new Error('La conexión SMTP se cerró inesperadamente'));
    };

    const onEnd = () => {
      cleanup();
      reject(new Error('La conexión SMTP finalizó inesperadamente'));
    };

    const cleanup = () => {
      socket.removeListener('data', onData);
      socket.removeListener('error', onError);
      socket.removeListener('timeout', onTimeout);
      socket.removeListener('close', onClose);
      socket.removeListener('end', onEnd);
      socket.setTimeout(0);
    };

    socket.on('data', onData);
    socket.once('error', onError);
    socket.setTimeout(timeoutMs, onTimeout);
    socket.once('close', onClose);
    socket.once('end', onEnd);
  });
};

const sendCommand = async (socket, command) => {
  if (command) {
    socket.write(`${command}\r\n`);
  }
  return waitForResponse(socket);
};

const sendMessageData = async (socket, payload) => {
  socket.write(payload.endsWith('\r\n') ? payload : `${payload}\r\n`);
  socket.write('.\r\n');
  return waitForResponse(socket);
};

const encodeBase64 = (value) => Buffer.from(value || '').toString('base64');

const connectSmtp = ({ host, port, secure }) => {
  return new Promise((resolve, reject) => {
    const connectionOptions = {
      host,
      port,
      servername: host,
      rejectUnauthorized: false
    };

    const onError = (error) => {
      reject(error);
    };

    const onConnect = (socketInstance) => {
      socketInstance.removeListener('error', onError);
      socketInstance.setEncoding('utf8');
      resolve(socketInstance);
    };

    const socket = secure
      ? tls.connect(connectionOptions, () => onConnect(socket))
      : net.connect(connectionOptions, () => onConnect(socket));

    socket.once('error', onError);
  });
};

const createSmtpError = (step, response) => {
  const baseMessage = response?.message || 'Respuesta desconocida del servidor SMTP';
  const code = response?.code;
  const error = new Error(
    code ? `Error en ${step} (${code}): ${baseMessage}` : `Error en ${step}: ${baseMessage}`
  );

  error.step = step;
  error.smtpCode = code;
  error.smtpResponse = response;
  error.statusCode = code >= 500 ? 502 : 400;
  error.handled = true;
  return error;
};

const categorizeError = (error = {}) => {
  const message = error?.message || '';
  const code = error?.code || error?.smtpCode;
  const step = error?.step || null;

  if (error?.code === 'ENOTFOUND' || /getaddrinfo ENOTFOUND/i.test(message)) {
    return {
      category: 'host',
      title: 'No se pudo resolver el servidor SMTP',
      hint: 'Verifica el dominio del servidor SMTP. Asegúrate de que el hosting y los registros DNS estén configurados correctamente.',
      step: step || 'connect',
      code
    };
  }

  if (error?.code === 'ECONNREFUSED' || /ECONNREFUSED|connection refused/i.test(message)) {
    return {
      category: 'puerto',
      title: 'El servidor rechazó la conexión',
      hint: 'Verifica el puerto configurado, el firewall del hosting y que el servicio SMTP esté escuchando en ese puerto.',
      step: step || 'connect',
      code
    };
  }

  if (error?.code === 'ETIMEDOUT' || /tiempo de espera|timed out|timeout/i.test(message)) {
    return {
      category: 'timeout',
      title: 'La conexión con el servidor tardó demasiado',
      hint: 'El servidor no respondió a tiempo. Revisa la conectividad, los puertos abiertos y si tu hosting permite conexiones SMTP externas.',
      step: step || 'connect',
      code
    };
  }

  if (step && step.startsWith('auth')) {
    return {
      category: 'credenciales',
      title: 'Error de autenticación SMTP',
      hint: 'El usuario o la contraseña SMTP no son válidos. Revisa las credenciales proporcionadas y si se requieren contraseñas de aplicación.',
      step,
      code
    };
  }

  if (step === 'mail-from' || step === 'rcpt-to') {
    return {
      category: 'correo',
      title: 'Error con las direcciones de correo',
      hint: 'Verifica que los correos del remitente y destinatario sean válidos y estén autorizados por tu proveedor SMTP.',
      step,
      code
    };
  }

  if (step === 'data-start' || step === 'data-end') {
    return {
      category: 'contenido',
      title: 'Error al enviar el contenido del correo',
      hint: 'El servidor SMTP rechazó el contenido. Revisa el tamaño del mensaje y el formato del correo de prueba.',
      step,
      code
    };
  }

  if (step === 'connect') {
    return {
      category: 'conexion',
      title: 'No fue posible establecer la conexión SMTP',
      hint: 'Revisa el host, puerto y opciones de seguridad configuradas. Asegúrate de que tu proveedor permita conexiones SMTP.',
      step,
      code
    };
  }

  return {
    category: 'desconocido',
    title: 'Error desconocido en la prueba SMTP',
    hint: 'Revisa el detalle técnico del error y los pasos registrados para identificar el problema.',
    step,
    code
  };
};

export default async function handler(req, res) {
  const diagnostics = [];
  const addDiagnosticStep = (step, status, extra = {}) => {
    diagnostics.push({
      step,
      status,
      timestamp: new Date().toISOString(),
      ...extra
    });
  };

  if (req.method !== 'POST') {
    addDiagnosticStep('request', 'error', {
      method: req.method,
      error: 'Método no permitido'
    });
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      diagnostics: {
        summary: {
          category: 'api',
          title: 'Método HTTP inválido',
          hint: 'Este endpoint solo acepta peticiones POST.'
        },
        steps: diagnostics
      }
    });
  }

  try {
    addDiagnosticStep('request', 'success', {
      method: req.method
    });

    const { config, from, to, subject, html } = req.body || {};

    if (!config) {
      addDiagnosticStep('validate-config', 'error', {
        error: 'Falta la configuración SMTP'
      });
      return res.status(400).json({
        success: false,
        message: 'La configuración SMTP es requerida',
        diagnostics: {
          summary: {
            category: 'config',
            title: 'Configuración SMTP incompleta',
            hint: 'Proporciona el host, puerto y credenciales del servidor SMTP antes de ejecutar la prueba.'
          },
          steps: diagnostics
        }
      });
    }

    if (!config.host || !config.auth?.user || !config.auth?.pass) {
      addDiagnosticStep('validate-config', 'error', {
        error: 'Host, usuario o contraseña SMTP faltantes'
      });
      return res.status(400).json({
        success: false,
        message: 'Los datos del servidor SMTP están incompletos',
        diagnostics: {
          summary: {
            category: 'config',
            title: 'Datos del servidor SMTP incompletos',
            hint: 'Asegúrate de ingresar el servidor, usuario y contraseña SMTP.'
          },
          steps: diagnostics
        }
      });
    }

    if (!from || !to) {
      addDiagnosticStep('validate-config', 'error', {
        error: 'Correos de origen/destino faltantes'
      });
      return res.status(400).json({
        success: false,
        message: 'Los correos de origen y destino son requeridos',
        diagnostics: {
          summary: {
            category: 'correo',
            title: 'Correos requeridos',
            hint: 'Indica los correos del remitente y destinatario para enviar la prueba.'
          },
          steps: diagnostics
        }
      });
    }

    addDiagnosticStep('validate-config', 'success', {
      host: config.host,
      port: config.port,
      secure: sanitizeBoolean(config.secure)
    });

    const port = sanitizePort(config.port);
    const secure = sanitizeBoolean(config.secure) || port === 465;

    addDiagnosticStep('prepare-connection', 'success', {
      host: config.host,
      port,
      secure
    });

    let socket;
    try {
      try {
        socket = await connectSmtp({ host: config.host, port, secure });
        addDiagnosticStep('connect', 'success', {
          host: config.host,
          port,
          secure
        });
      } catch (connectionError) {
        addDiagnosticStep('connect', 'error', {
          host: config.host,
          port,
          secure,
          error: connectionError.message,
          code: connectionError.code
        });
        connectionError.step = 'connect';
        throw connectionError;
      }

      const recordResponse = (step, response) => {
        const status = response.code < 400 ? 'success' : 'error';
        addDiagnosticStep(step, status, {
          code: response.code,
          message: response.message
        });

        if (status === 'error') {
          throw createSmtpError(step, response);
        }

        return response;
      };

      const runCommand = async (step, command, { allowedCodes = [] } = {}) => {
        try {
          const response = await sendCommand(socket, command);
          if (allowedCodes.includes(response.code)) {
            addDiagnosticStep(step, 'success', {
              code: response.code,
              message: response.message,
              note: 'Respuesta aceptada como válida'
            });
            return response;
          }
          return recordResponse(step, response);
        } catch (commandError) {
          if (!commandError.handled) {
            addDiagnosticStep(step, 'error', {
              error: commandError.message,
              code: commandError.code || commandError.smtpCode
            });
            commandError.handled = true;
          }
          if (!commandError.step) {
            commandError.step = step;
          }
          throw commandError;
        }
      };

      const runDataStep = async (step, payload) => {
        try {
          const response = await sendMessageData(socket, payload);
          return recordResponse(step, response);
        } catch (dataError) {
          if (!dataError.handled) {
            addDiagnosticStep(step, 'error', {
              error: dataError.message,
              code: dataError.code || dataError.smtpCode
            });
            dataError.handled = true;
          }
          if (!dataError.step) {
            dataError.step = step;
          }
          throw dataError;
        }
      };

      let response = await waitForResponse(socket);
      recordResponse('banner', response);

      await runCommand('ehlo', 'EHLO zeatingmaps.local');
      await runCommand('auth-login', 'AUTH LOGIN', { allowedCodes: [334] });
      await runCommand('auth-user', encodeBase64(config.auth.user), { allowedCodes: [334] });
      await runCommand('auth-pass', encodeBase64(config.auth.pass));
      await runCommand('mail-from', `MAIL FROM:<${from}>`);
      await runCommand('rcpt-to', `RCPT TO:<${to}>`);
      await runCommand('data-start', 'DATA', { allowedCodes: [354] });

      const message = [
        `Subject: ${subject || 'Prueba de configuración SMTP'}`,
        `From: ${from}`,
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        html || '<p>Este es un correo de prueba para verificar la configuración SMTP.</p>'
      ].join('\r\n');

      await runDataStep('data-end', message);
      await runCommand('quit', 'QUIT');

      res.status(200).json({
        success: true,
        message: 'Correo de prueba enviado correctamente',
        diagnostics: {
          summary: {
            category: 'ok',
            title: 'Conexión SMTP verificada',
            hint: 'La configuración proporcionada funcionó correctamente.'
          },
          steps: diagnostics
        }
      });
    } finally {
      if (socket && !socket.destroyed) {
        try {
          if (!socket.writableEnded) {
            socket.end();
          }
        } catch (endError) {
          console.error('Error cerrando conexión SMTP:', endError);
          addDiagnosticStep('cleanup', 'error', {
            error: endError.message
          });
        } finally {
          if (!socket.destroyed) {
            socket.destroy();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error enviando correo de prueba:', error);
    const summary = categorizeError(error);

    if (summary && !diagnostics.some((step) => step.step === summary.step && step.status === 'error')) {
      addDiagnosticStep(summary.step || 'error', 'error', {
        error: error?.message,
        code: error?.code || error?.smtpCode
      });
    }

    res.status(error?.statusCode || 500).json({
      success: false,
      message: 'Error al enviar el correo de prueba',
      error: error?.message || 'Error desconocido',
      diagnostics: {
        summary,
        steps: diagnostics
      }
    });
  }
}
