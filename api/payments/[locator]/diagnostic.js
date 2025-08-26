import { getConfig, validateConfig } from './config';

export default async function handler(req, res) {
  console.log('🔍 [DIAGNOSTIC] Endpoint de diagnóstico llamado');
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener configuración actual
    const config = getConfig();
    const isValid = validateConfig();
    
    // Información del entorno
    const environmentInfo = {
      nodeEnv: config.nodeEnv,
      vercelEnv: config.vercelEnv,
      vercelUrl: config.vercelUrl,
      timestamp: new Date().toISOString()
    };
    
    // Estado de las variables de entorno
    const envStatus = {
      supabaseUrl: {
        present: !!config.supabaseUrl,
        length: config.supabaseUrl ? config.supabaseUrl.length : 0,
        value: config.supabaseUrl ? `${config.supabaseUrl.substring(0, 20)}...` : 'undefined'
      },
      supabaseServiceKey: {
        present: !!config.supabaseServiceKey,
        length: config.supabaseServiceKey ? config.supabaseServiceKey.length : 0,
        value: config.supabaseServiceKey ? '***' + config.supabaseServiceKey.slice(-4) : 'undefined'
      },
      apiUrl: {
        present: !!config.apiUrl,
        value: config.apiUrl || 'undefined'
      }
    };
    
    // Verificaciones adicionales
    const checks = {
      configValid: isValid,
      supabaseUrlFormat: false,
      hasRequiredVars: false
    };
    
    // Verificar formato de URL de Supabase
    try {
      if (config.supabaseUrl) {
        new URL(config.supabaseUrl);
        checks.supabaseUrlFormat = true;
      }
    } catch (error) {
      checks.supabaseUrlFormat = false;
    }
    
    // Verificar variables requeridas
    checks.hasRequiredVars = !!(config.supabaseUrl && config.supabaseServiceKey);
    
    // Recomendaciones
    const recommendations = [];
    
    if (!config.supabaseUrl) {
      recommendations.push('Configurar SUPABASE_URL en las variables de entorno de Vercel');
    }
    
    if (!config.supabaseServiceKey) {
      recommendations.push('Configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel');
    }
    
    if (!checks.supabaseUrlFormat) {
      recommendations.push('Verificar que SUPABASE_URL tenga un formato válido de URL');
    }
    
    if (!checks.hasRequiredVars) {
      recommendations.push('Todas las variables requeridas deben estar configuradas para que funcione la descarga de tickets');
    }
    
    // Respuesta del diagnóstico
    const diagnostic = {
      status: isValid ? 'healthy' : 'unhealthy',
      environment: environmentInfo,
      environmentVariables: envStatus,
      checks,
      recommendations,
      nextSteps: isValid ? [
        'Las variables de entorno están configuradas correctamente',
        'Puedes probar la descarga de tickets',
        'Si persisten problemas, verifica los logs del servidor'
      ] : [
        'Configura las variables de entorno faltantes en Vercel',
        'Redespliega la aplicación después de configurar las variables',
        'Verifica que las credenciales de Supabase sean correctas'
      ]
    };
    
    console.log('🔍 [DIAGNOSTIC] Diagnóstico completado:', {
      status: diagnostic.status,
      hasRequiredVars: checks.hasRequiredVars,
      recommendations: recommendations.length
    });
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(diagnostic);
    
  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Error en diagnóstico:', error);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Error ejecutando diagnóstico',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
