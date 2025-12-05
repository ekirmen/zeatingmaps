// Server endpoint to accept audit logs from authenticated clients and insert
// them using the Supabase admin client (service role). This avoids clients
// calling Supabase directly and reduces 401s/spam in the browser.

import { getSupabaseAdminClient } from '../../../src/config/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured on server' });
  }

  try {
    const { logs } = req.body || {};
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'No logs provided' });
    }

    // Optional: Basic authentication/verification step
    // If client sent an Authorization bearer token, attempt to validate user
    // so anonymous callers cannot spam this endpoint. If validation fails,
    // reject with 401.
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: missing bearer token' });
    }

    const token = authHeader.split(' ')[1];

    // Try to get user from token. If verification fails, reject.
    try {
      // Note: supabaseAdmin.auth.getUser accepts the access token in newer SDKs
      // using { access_token } or the token directly depending on version.
      // Try both shapes for compatibility.
      let userResp = null;
      if (typeof supabaseAdmin.auth.getUser === 'function') {
        try {
          userResp = await supabaseAdmin.auth.getUser(token);
        } catch (e) {
          // try alternate signature
          userResp = await supabaseAdmin.auth.getUser({ access_token: token });
        }
      }

      const user = userResp && (userResp.data ? userResp.data.user : userResp.user);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: invalid token' });
      }

      // Attach user_id to logs if omitted
      const enriched = logs.map((l) => ({
        tenant_id: l.tenant_id || null,
        user_id: l.user_id || user.id,
        action: l.action || 'unknown',
        details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}),
        resource_id: l.resource_id || null,
        ip_address: l.ip_address || (req.headers['x-forwarded-for'] || req.socket.remoteAddress || null),
        user_agent: l.user_agent || req.headers['user-agent'] || null,
        created_at: l.created_at || new Date().toISOString()
      }));

      const { data, error } = await supabaseAdmin.from('audit_logs').insert(enriched);
      if (error) {
        console.error('Error inserting audit logs via admin client:', error);
        return res.status(500).json({ error: error.message || error });
      }

      return res.status(200).json({ inserted: data.length || data });
    } catch (authErr) {
      console.error('Auth verification failed for audit create:', authErr);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (err) {
    console.error('Exception in audit create handler:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
