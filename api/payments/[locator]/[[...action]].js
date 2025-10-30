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
  const { action: actionParam } = req.query;
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
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    return await handlerFn(req, res);
  } catch (err) {
    console.error('[PAYMENTS] Unhandled action error:', {
      locator: req?.query?.locator,
      action,
      method: req.method,
      message: err?.message,
    });

    const status = Number(err?.statusCode || err?.status) || 500;
    const responsePayload = {
      error: 'Internal server error',
      details: err?.message || 'Unexpected error executing action',
    };

    if (process.env.NODE_ENV === 'development' && err?.stack) {
      responsePayload.stack = err.stack;
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(status).json(responsePayload);
  }
}
