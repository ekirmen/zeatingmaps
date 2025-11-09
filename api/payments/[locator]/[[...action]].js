// Importar handlers usando ES modules estáticos
// Las importaciones deben ser estáticas para Vercel serverless functions
import { handleDebug } from '../../../api-lib/payments/debug.js';
import { handleDiagnostic } from '../../../api-lib/payments/diagnostic.js';
import { handleDownload } from '../../../api-lib/payments/download.js';
import { handleEmail } from '../../../api-lib/payments/email.js';

const ACTION_HANDLERS = {
  debug: handleDebug,
  diagnostic: handleDiagnostic,
  download: handleDownload,
  email: handleEmail
};

export default async function handler(req, res) {
  // Manejar errores de CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Validar que los handlers estén disponibles
  if (!handleDownload || typeof handleDownload !== 'function') {
    console.error('[PAYMENTS] handleDownload no está disponible');
    console.error('[PAYMENTS] handleDownload type:', typeof handleDownload);
    console.error('[PAYMENTS] Available handlers:', Object.keys(ACTION_HANDLERS).filter(key => ACTION_HANDLERS[key]));
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: {
          code: '500',
          message: 'Server configuration error - Download handler not available',
          details: 'Handler not loaded correctly'
        }
      });
    }
    return;
  }

  try {
    const { action: actionParam, locator } = req.query;
    
    // Si no hay locator en query, intentar extraerlo de la URL
    if (!locator && req.url) {
      const urlParts = req.url.split('/').filter(Boolean);
      const paymentsIndex = urlParts.indexOf('payments');
      if (paymentsIndex >= 0 && urlParts[paymentsIndex + 1]) {
        req.query.locator = urlParts[paymentsIndex + 1];
      }
    }

    // Determinar la acción a ejecutar
    const actionSegment = Array.isArray(actionParam) ? actionParam[0] : actionParam;
    const fallbackAction = req.method === 'GET' ? 'download' : req.method === 'POST' ? 'email' : undefined;
    const action =
      typeof actionSegment === 'string' && ACTION_HANDLERS[actionSegment]
        ? actionSegment
        : actionSegment === undefined
          ? fallbackAction
          : undefined;

    const handlerFn = action ? ACTION_HANDLERS[action] : null;

    if (!handlerFn) {
      console.error('[PAYMENTS] Handler not found for action:', action, 'method:', req.method);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ 
        error: {
          code: '404',
          message: `No handler found for action: ${action || 'undefined'}`
        }
      });
    }

    console.log('[PAYMENTS] Executing handler:', {
      action,
      locator: req.query.locator,
      method: req.method,
      url: req.url
    });

    // Ejecutar handler
    return await handlerFn(req, res);
  } catch (err) {
    console.error('[PAYMENTS] Unhandled error:', {
      locator: req?.query?.locator,
      action: req?.query?.action,
      method: req.method,
      message: err?.message,
      stack: err?.stack,
      name: err?.name
    });

    // Asegurar que la respuesta no se haya enviado ya
    if (!res.headersSent) {
      const status = Number(err?.statusCode || err?.status) || 500;
      const responsePayload = {
        error: {
          code: String(status),
          message: err?.message || 'A server error has occurred'
        }
      };

      // Agregar detalles en desarrollo
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
        responsePayload.details = err?.stack;
      }

      res.setHeader('Content-Type', 'application/json');
      return res.status(status).json(responsePayload);
    } else {
      console.error('[PAYMENTS] Response already sent, cannot send error response');
    }
  }
}
