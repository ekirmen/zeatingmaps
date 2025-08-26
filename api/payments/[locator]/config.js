// Archivo de configuración para verificar variables de entorno
export function getConfig() {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    apiUrl: process.env.API_URL || process.env.REACT_APP_API_URL
  };

  console.log('🔧 [CONFIG] Configuración del servidor:');
  console.log('- NODE_ENV:', config.nodeEnv);
  console.log('- VERCEL_ENV:', config.vercelEnv);
  console.log('- VERCEL_URL:', config.vercelUrl);
  console.log('- API_URL:', config.apiUrl ? '✅ definido' : '❌ faltante');
  console.log('- SUPABASE_URL:', config.supabaseUrl ? '✅ definido' : '❌ faltante');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', config.supabaseServiceKey ? '✅ definido' : '❌ faltante');

  // Log de longitud de las claves para debug (sin mostrar el contenido)
  if (config.supabaseUrl) {
    console.log('- SUPABASE_URL length:', config.supabaseUrl.length);
  }
  if (config.supabaseServiceKey) {
    console.log('- SUPABASE_SERVICE_ROLE_KEY length:', config.supabaseServiceKey.length);
  }

  return config;
}

export function validateConfig() {
  const config = getConfig();
  
  const missingVars = [];
  
  if (!config.supabaseUrl) {
    missingVars.push('SUPABASE_URL o REACT_APP_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!config.supabaseServiceKey) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY o REACT_APP_SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  }
  
  if (missingVars.length > 0) {
    console.error('❌ [CONFIG] Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.error(`- ${varName}: ❌`);
    });
    console.error('❌ [CONFIG] Configuración inválida');
    return false;
  }
  
  // Validar que las URLs tengan formato correcto
  try {
    if (config.supabaseUrl) {
      new URL(config.supabaseUrl);
    }
  } catch (error) {
    console.error('❌ [CONFIG] SUPABASE_URL tiene formato inválido:', config.supabaseUrl);
    return false;
  }
  
  console.log('✅ [CONFIG] Todas las variables de entorno están configuradas correctamente');
  return true;
}

export function getSupabaseConfig() {
  const config = getConfig();
  
  if (!validateConfig()) {
    throw new Error('Configuración de Supabase inválida');
  }
  
  return {
    url: config.supabaseUrl,
    serviceKey: config.supabaseServiceKey
  };
}
