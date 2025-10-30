import { getConfig, validateConfig, getSupabaseAdmin } from './config.js';

export async function handleDebug(req, res) {
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

  const config = getConfig();
  const isValid = validateConfig(config);
  const supabaseAdmin = getSupabaseAdmin(config);

  if (!isValid || !supabaseAdmin) {
    console.error('❌ [DEBUG] Configuración inválida');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing Supabase environment variables',
      config: {
        supabaseUrl: !!config.supabaseUrl,
        supabaseServiceKey: !!config.supabaseServiceKey,
        nodeEnv: config.nodeEnv,
        vercelEnv: config.vercelEnv
      }
    });
  }

  try {
    console.log('🔍 [DEBUG] Debugging localizador:', locator);

    console.log('✅ [DEBUG] Configuración validada correctamente');

    console.log('🔍 [DEBUG] Verificando estructura de la tabla payment_transactions...');
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ [DEBUG] Error accediendo a tabla payment_transactions:', tableError);
      return res.status(500).json({
        error: 'Database table access error',
        details: tableError.message,
        code: tableError.code
      });
    }

    console.log('✅ [DEBUG] Tabla payment_transactions accesible');

    console.log('🔍 [DEBUG] Buscando pago por locator:', locator);
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('locator', locator)
      .maybeSingle();

    if (paymentError) {
      console.error('❌ [DEBUG] Error buscando pago por locator:', paymentError);
      return res.status(500).json({
        error: 'Database query error',
        details: paymentError.message,
        code: paymentError.code
      });
    }

    if (!payment) {
      console.log('❌ [DEBUG] Pago no encontrado por locator');

      console.log('🔍 [DEBUG] Buscando pagos similares...');
      const { data: similarPayments, error: similarError } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, locator, created_at, status, funcion_id, evento_id')
        .limit(10)
        .order('created_at', { ascending: false });

      if (similarError) {
        console.error('❌ [DEBUG] Error buscando pagos similares:', similarError);
      }

      console.log('🔍 [DEBUG] Buscando por locator parcial...');
      const { data: partialMatches, error: partialError } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, locator, created_at, status')
        .ilike('locator', `%${locator}%`)
        .limit(5);

      if (partialError) {
        console.error('❌ [DEBUG] Error buscando coincidencias parciales:', partialError);
      }

      console.log('🔍 [DEBUG] Verificando pagos sin locator...');
      const { data: noLocatorPayments, error: noLocatorError } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, locator, created_at, status')
        .is('locator', null)
        .limit(5);

      if (noLocatorError) {
        console.error('❌ [DEBUG] Error verificando pagos sin locator:', noLocatorError);
      }

      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({
        error: 'Payment not found',
        debug: {
          searchedLocator: locator,
          totalPayments: similarPayments?.length || 0,
          recentPayments: similarPayments || [],
          partialMatches: partialMatches || [],
          noLocatorPayments: noLocatorPayments || [],
          message: 'El pago con este localizador no existe en la base de datos',
          recommendations: [
            'Verificar que el localizador esté escrito correctamente',
            'Verificar que el pago realmente existe',
            'Considerar crear un índice en el campo locator',
            'Verificar que no haya pagos sin localizador'
          ]
        }
      });
    }

    console.log('✅ [DEBUG] Pago encontrado:', payment.id);

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

    const debugInfo = {
      payment: {
        id: payment.id,
        locator: payment.locator,
        status: payment.status,
        created_at: payment.created_at,
        funcion_id: payment.funcion_id,
        evento_id: payment.evento_id,
        amount: payment.amount,
        tenant_id: payment.tenant_id
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
        url: config.supabaseUrl ? `${config.supabaseUrl.substring(0, 20)}...` : 'No configurado',
        serviceKey: config.supabaseServiceKey ? '✅ Configurado' : '❌ No configurado'
      }
    };

    console.log('✅ [DEBUG] Debug completado exitosamente');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      debug: debugInfo
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error ejecutando debug:', error);

    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
