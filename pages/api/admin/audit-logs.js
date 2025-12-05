// Server API to fetch audit logs using Supabase admin client.
// Protect this route by setting `INTERNAL_ADMIN_TOKEN` in environment variables
// and sending the same token in header `x-internal-admin-token` from trusted callers.

import { getSupabaseAdminClient } from '../../../src/config/supabase';

export default async function handler(req, res) {
  // Simple protection: require admin token header
  const token = req.headers['x-internal-admin-token'] || req.headers['x-internal-token'];
  const expected = process.env.INTERNAL_ADMIN_TOKEN || process.env.INTERNAL_ADMIN_SECRET;

  if (!expected || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured on server' });
  }

  try {
    const { limit = 100, tenant_id, severity, action } = req.query;
    let query = supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(Math.min(parseInt(limit, 10) || 100, 1000));

    // Optional filters
    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (severity) query = query.eq('severity', severity);
    if (action) query = query.ilike('action', `%${action}%`);

    const { data, error } = await query;
    if (error) {
      console.error('Error querying audit_logs:', error);
      return res.status(500).json({ error });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Exception in audit-logs handler:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
