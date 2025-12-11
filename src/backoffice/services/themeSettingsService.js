import { supabase } from '../../supabaseClient';


  if (!tenantId) return null;
  const { data, error } = await supabase
    .from('tenant_theme_settings')
    .select('theme')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) {
    return null;
  }
  return data?.theme || null;
}

export async function upsertTenantThemeSettings(tenantId, theme) {
  if (!tenantId) throw new Error('tenantId requerido');
  const payload = { tenant_id: tenantId, theme };
  const { error } = await supabase
    .from('tenant_theme_settings')
    .upsert(payload, { onConflict: 'tenant_id' });
  if (error) throw error;
  return true;
}


