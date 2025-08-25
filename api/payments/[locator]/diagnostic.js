import { getConfig, validateConfig } from './config';

export default async function handler(req, res) {
  console.log('🔍 [DIAGNOSTIC] Endpoint de diagnóstico llamado');
  
  // Asegurar que se envíe JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const config = getConfig();
    const isValid = validateConfig();
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      query: req.query,
      headers: Object.keys(req.headers),
      environment: {
        nodeEnv: config.nodeEnv,
        vercelEnv: config.vercelEnv,
        vercelUrl: config.vercelUrl
      },
      supabase: {
        url: config.supabaseUrl ? '✅ definido' : '❌ faltante',
        serviceKey: config.supabaseServiceKey ? '✅ definido' : '❌ faltante',
        urlLength: config.supabaseUrl ? config.supabaseUrl.length : 0,
        keyLength: config.supabaseServiceKey ? config.supabaseServiceKey.length : 0
      },
      validation: {
        isValid,
        missingVariables: []
      },
      recommendations: []
    };
    
    // Identificar variables faltantes
    if (!config.supabaseUrl) {
      diagnostic.validation.missingVariables.push('SUPABASE_URL o REACT_APP_SUPABASE_URL');
      diagnostic.recommendations.push('Configurar SUPABASE_URL en las variables de entorno de Vercel');
    }
    
    if (!config.supabaseServiceKey) {
      diagnostic.validation.missingVariables.push('SUPABASE_SERVICE_ROLE_KEY o REACT_APP_SUPABASE_SERVICE_ROLE_KEY');
      diagnostic.recommendations.push('Configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel');
    }
    
    if (diagnostic.validation.missingVariables.length === 0) {
      diagnostic.recommendations.push('Todas las variables están configuradas correctamente');
    } else {
      diagnostic.recommendations.push('Verificar configuración en dashboard de Vercel');
      diagnostic.recommendations.push('Revisar que las variables estén en el proyecto correcto');
    }
    
    console.log('🔍 [DIAGNOSTIC] Diagnóstico completado:', diagnostic);
    
    return res.status(200).json(diagnostic);
    
  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Error en diagnóstico:', error);
    return res.status(500).json({
      error: 'Error en diagnóstico',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
