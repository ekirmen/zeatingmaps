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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { config, from, to, subject, html } = req.body || {};

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'La configuración SMTP es requerida'
      });
    }

    if (!config.host || !config.auth?.user || !config.auth?.pass) {
      return res.status(400).json({
        success: false,
        message: 'Los datos del servidor SMTP están incompletos'
      });
    }

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Los correos de origen y destino son requeridos'
      });
    }

    const port = sanitizePort(config.port);
    const secure = sanitizeBoolean(config.secure) || port === 465;

    let socket;
    try {
      socket = await connectSmtp({ host: config.host, port, secure });

      const responses = [];

      let response = await waitForResponse(socket);
      responses.push({ step: 'banner', ...response });
      if (response.code >= 400) {
        throw new Error(`Error inicial SMTP (${response.code}): ${response.message}`);
      }

      response = await sendCommand(socket, `EHLO zeatingmaps.local`);
      responses.push({ step: 'ehlo', ...response });
      if (response.code >= 400) {
        throw new Error(`Error en EHLO (${response.code}): ${response.message}`);
      }

      response = await sendCommand(socket, 'AUTH LOGIN');
      responses.push({ step: 'auth-login', ...response });
      if (response.code >= 400 && response.code !== 334) {
        throw new Error(`Error al iniciar autenticación (${response.code}): ${response.message}`);
      }

      response = await sendCommand(socket, encodeBase64(config.auth.user));
      responses.push({ step: 'auth-user', ...response });
      if (response.code >= 400 && response.code !== 334) {
        throw new Error(`Error al enviar usuario SMTP (${response.code}): ${response.message}`);
      }

      response = await sendCommand(socket, encodeBase64(config.auth.pass));
      responses.push({ step: 'auth-pass', ...response });
      if (response.code >= 400) {
        throw new Error(`Error al enviar contraseña SMTP (${response.code}): ${response.message}`);
      }

      response = await sendCommand(socket, `MAIL FROM:<${from}>`);
      responses.push({ step: 'mail-from', ...response });
      if (response.code >= 400) {
        throw new Error(`Error en MAIL FROM (${response.code}): ${response.message}`);
      }

      response = await sendCommand(socket, `RCPT TO:<${to}>`);
      responses.push({ step: 'rcpt-to', ...response });
      if (response.code >= 400) {
        throw new Error(`Error en RCPT TO (${response.code}): ${response.message}`);
      }

      response = await sendCommand(socket, 'DATA');
      responses.push({ step: 'data-start', ...response });
      if (response.code >= 400 && response.code !== 354) {
        throw new Error(`Error al iniciar DATA (${response.code}): ${response.message}`);
      }

      const message = [
        `Subject: ${subject || 'Prueba de configuración SMTP'}`,
        `From: ${from}`,
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        html || '<p>Este es un correo de prueba para verificar la configuración SMTP.</p>'
      ].join('\r\n');

      response = await sendMessageData(socket, message);
      responses.push({ step: 'data-end', ...response });
      if (response.code >= 400) {
        throw new Error(`Error al enviar mensaje (${response.code}): ${response.message}`);
      }

      await sendCommand(socket, 'QUIT');

      res.status(200).json({
        success: true,
        message: 'Correo de prueba enviado correctamente',
        debug: responses
      });
    } finally {
      if (socket && !socket.destroyed) {
        try {
          if (!socket.writableEnded) {
            socket.end();
          }
        } catch (endError) {
          console.error('Error cerrando conexión SMTP:', endError);
        } finally {
          if (!socket.destroyed) {
            socket.destroy();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error enviando correo de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el correo de prueba',
      error: error?.message || 'Error desconocido'
    });
  }
}
