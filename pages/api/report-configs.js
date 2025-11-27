import { supabase, supabaseAdmin } from '../../src/supabaseClient';

export default async function handler(req, res) {
  const { method } = req;
  const client = supabaseAdmin || supabase;

  try {
    if (method === 'GET') {
      const { tenant_id: tenantId, user_id: userId } = req.query;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'tenant_id y user_id son requeridos'
        });
      }

      const { data, error } = await client
        .from('report_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    }

    if (method === 'POST') {
      const {
        tenant_id: tenantId,
        user_id: userId,
        name,
        selected_report: selectedReport,
        filters,
        schedule,
        date_mode: dateMode,
        language
      } = req.body || {};

      if (!tenantId || !userId || !name) {
        return res.status(400).json({
          success: false,
          message: 'tenant_id, user_id y name son requeridos'
        });
      }

      const payload = {
        tenant_id: tenantId,
        user_id: userId,
        name,
        selected_report: selectedReport || 'sales',
        filters: filters || {},
        schedule: schedule || null,
        date_mode: dateMode || 'fixed',
        language: language || 'es_MX'
      };

      const { data, error } = await client
        .from('report_configs')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ success: true, data });
    }

    if (method === 'DELETE') {
      const configId = req.query.id || req.body?.id;
      const tenantId = req.query.tenant_id || req.body?.tenant_id;
      const userId = req.query.user_id || req.body?.user_id;

      if (!configId || !tenantId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'id, tenant_id y user_id son requeridos'
        });
      }

      const { error } = await client
        .from('report_configs')
        .delete()
        .eq('id', configId)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Error en /api/report-configs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la configuración de reportes',
      error: error.message
    });
  }
}
