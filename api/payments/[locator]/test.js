import { getConfig, validateConfig } from './config';

export default async function handler(req, res) {
  console.log('🧪 [TEST] Endpoint de prueba llamado');
  
  // Asegurar que se envíe JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const config = getConfig();
    const isValid = validateConfig();
    
    const testResult = {
      message: 'Endpoint de prueba funcionando correctamente',
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
      testResult.validation.missingVariables.push('SUPABASE_URL o REACT_APP_SUPABASE_URL');
      testResult.recommendations.push('Configurar SUPABASE_URL en las variables de entorno de Vercel');
    }
    
    if (!config.supabaseServiceKey) {
      testResult.validation.missingVariables.push('SUPABASE_SERVICE_ROLE_KEY o REACT_APP_SUPABASE_SERVICE_ROLE_KEY');
      testResult.recommendations.push('Configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel');
    }
    
    if (testResult.validation.missingVariables.length === 0) {
      testResult.recommendations.push('Todas las variables están configuradas correctamente');
    } else {
      testResult.recommendations.push('Verificar configuración en dashboard de Vercel');
      testResult.recommendations.push('Revisar que las variables estén en el proyecto correcto');
    }
    
    console.log('🧪 [TEST] Prueba completada:', testResult);
    
    return res.status(200).json(testResult);
    
  } catch (error) {
    console.error('❌ [TEST] Error en endpoint de prueba:', error);
    return res.status(500).json({
      error: 'Error en endpoint de prueba',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
