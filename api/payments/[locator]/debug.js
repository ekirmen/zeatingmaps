import { createClient } from '@supabase/supabase-js';
import { getConfig, validateConfig } from './config';

// Obtener configuración
const config = getConfig();
const supabaseUrl = config.supabaseUrl;
const supabaseServiceKey = config.supabaseServiceKey;

// Crear cliente Supabase solo si las variables están disponibles
let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ [DEBUG] Cliente Supabase creado correctamente');
} else {
  console.error('❌ [DEBUG] No se puede crear cliente Supabase - variables faltantes');
}

export default async function handler(req, res) {
  console.log('🔍 [DEBUG] Endpoint de debug llamado');
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  if (!locator) {
    console.error('❌ [DEBUG] Missing locator in query params');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing locator' });
  }

  try {
    console.log('🔍 [DEBUG] Debugging localizador:', locator);
    
    // Verificar configuración
    if (!validateConfig()) {
      console.error('❌ [DEBUG] Configuración inválida');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables',
        config: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceKey: !!supabaseServiceKey,
          nodeEnv: config.nodeEnv,
          vercelEnv: config.vercelEnv
        }
      });
    }
    
    console.log('✅ [DEBUG] Configuración validada correctamente');
    
    // 1. Verificar conectividad básica
    console.log('🔍 [DEBUG] Probando conectividad básica...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('payments')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ [DEBUG] Error de conectividad básica:', testError);
      return res.status(500).json({
        error: 'Database connectivity error',
        details: testError.message,
        code: testError.code
      });
    }
    
    console.log('✅ [DEBUG] Conectividad básica OK');
    
    // 2. Buscar el pago específico
    console.log('🔍 [DEBUG] Buscando pago específico...');
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('locator', locator)
      .maybeSingle();
    
    if (paymentError) {
      console.error('❌ [DEBUG] Error buscando pago:', paymentError);
      return res.status(500).json({
        error: 'Database query error',
        details: paymentError.message,
        code: paymentError.code
      });
    }
    
    if (!payment) {
      console.log('❌ [DEBUG] Pago no encontrado');
      
      // 3. Buscar pagos similares para debug
      console.log('🔍 [DEBUG] Buscando pagos similares...');
      const { data: similarPayments, error: similarError } = await supabaseAdmin
        .from('payments')
        .select('locator, created_at, status')
        .limit(5)
        .order('created_at', { ascending: false });
      
      if (similarError) {
        console.error('❌ [DEBUG] Error buscando pagos similares:', similarError);
      }
      
      return res.status(404).json({
        error: 'Payment not found',
        debug: {
          searchedLocator: locator,
          totalPayments: similarPayments?.length || 0,
          recentPayments: similarPayments || [],
          message: 'El pago con este localizador no existe en la base de datos'
        }
      });
    }
    
    console.log('✅ [DEBUG] Pago encontrado:', payment.id);
    
    // 4. Verificar relaciones
    console.log('🔍 [DEBUG] Verificando relaciones...');
    const { data: funcion, error: funcionError } = await supabaseAdmin
      .from('funciones')
      .select('*')
      .eq('id', payment.funcion_id)
      .maybeSingle();
    
    let seats = [];
    let seatsError = null;
    if (payment.funcion_id) {
      const { data: seatsData, error: seatsErr } = await supabaseAdmin
        .from('seats')
        .select('*')
        .eq('funcion_id', payment.funcion_id);
      
      seats = seatsData || [];
      seatsError = seatsErr;
    }
    
    // 5. Respuesta de debug completa
    const debugInfo = {
      payment: {
        id: payment.id,
        locator: payment.locator,
        status: payment.status,
        created_at: payment.created_at,
        funcion_id: payment.funcion_id
      },
      relationships: {
        funcion: funcion ? '✅ Encontrada' : '❌ No encontrada',
        seats: seats ? `${seats.length} asientos` : '❌ No encontrados'
      },
      errors: {
        funcion: funcionError?.message || null,
        seats: seatsError?.message || null
      },
      database: {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'No configurado',
        serviceKey: supabaseServiceKey ? '✅ Configurado' : '❌ No configurado'
      }
    };
    
    console.log('✅ [DEBUG] Debug completado exitosamente');
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      message: 'Debug completado',
      debug: debugInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ [DEBUG] Error en debug:', err);
    console.error('❌ [DEBUG] Stack trace:', err.stack);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Debug error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
