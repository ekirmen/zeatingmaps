import { createClient } from '@supabase/supabase-js';

let cachedClient = null;
let cachedSignature = null;

export function getConfig() {
  // Las funciones serverless de Vercel NO tienen acceso a variables con prefijo REACT_APP_
  // Por lo tanto, priorizamos las variables sin prefijo
  const config = {
    supabaseUrl: 
      process.env.SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL, // Fallback (no funcionará en serverless)
    supabaseServiceKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY, // Fallback (no funcionará en serverless)
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
  
  // Verificar qué variables están disponibles en process.env
  console.log('🔍 [CONFIG] Variables disponibles en process.env:');
  console.log('- process.env.SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ presente' : '❌ faltante');
  console.log('- process.env.NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ presente' : '❌ faltante');
  console.log('- process.env.REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ presente (no disponible en serverless)' : '❌ faltante');
  console.log('- process.env.SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ presente' : '❌ faltante');
  console.log('- process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? '✅ presente' : '❌ faltante');
  console.log('- process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY:', process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ? '✅ presente (no disponible en serverless)' : '❌ faltante');
  
  // Mostrar qué variable se está usando
  if (config.supabaseUrl) {
    if (process.env.SUPABASE_URL) {
      console.log('- ✅ Usando SUPABASE_URL (sin prefijo)');
    } else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('- ⚠️ Usando NEXT_PUBLIC_SUPABASE_URL (funciona pero no recomendado)');
    } else if (process.env.REACT_APP_SUPABASE_URL) {
      console.log('- ❌ Usando REACT_APP_SUPABASE_URL (NO funcionará en serverless)');
    }
    console.log('- SUPABASE_URL length:', config.supabaseUrl.length);
    console.log('- SUPABASE_URL value (first 20 chars):', config.supabaseUrl.substring(0, 20) + '...');
  }
  
  if (config.supabaseServiceKey) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('- ✅ Usando SUPABASE_SERVICE_ROLE_KEY (sin prefijo)');
    } else if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
      console.log('- ⚠️ Usando NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (funciona pero no recomendado)');
    } else if (process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY) {
      console.log('- ❌ Usando REACT_APP_SUPABASE_SERVICE_ROLE_KEY (NO funcionará en serverless)');
    }
    console.log('- SUPABASE_SERVICE_ROLE_KEY length:', config.supabaseServiceKey.length);
    console.log('- SUPABASE_SERVICE_ROLE_KEY value (first 20 chars):', config.supabaseServiceKey.substring(0, 20) + '...');
  }

  return config;
}

export function validateConfig(config = getConfig()) {
  const missingVars = [];

  if (!config.supabaseUrl) {
    missingVars.push('SUPABASE_URL (sin prefijo REACT_APP_ - requerido para funciones serverless)');
  }

  if (!config.supabaseServiceKey) {
    missingVars.push(
      'SUPABASE_SERVICE_ROLE_KEY (sin prefijo REACT_APP_ - requerido para funciones serverless)'
    );
  }

  if (missingVars.length > 0) {
    console.error('❌ [CONFIG] Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.error(`- ${varName}: ❌`);
    });
    console.error('❌ [CONFIG] Configuración inválida');
    return false;
  }

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

export function getSupabaseAdmin(config = getConfig()) {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.error('❌ [CONFIG] No se puede crear cliente Supabase - variables faltantes');
    return null;
  }

  const signature = `${config.supabaseUrl}|${config.supabaseServiceKey}`;

  if (!cachedClient || cachedSignature !== signature) {
    cachedClient = createClient(config.supabaseUrl, config.supabaseServiceKey);
    cachedSignature = signature;
    console.log('✅ [CONFIG] Cliente Supabase creado correctamente');
  }

  return cachedClient;
}
