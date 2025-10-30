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

  return handlerFn(req, res);
}
