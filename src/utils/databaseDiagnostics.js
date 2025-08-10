import { supabase } from '../config/supabase';

/**
 * Utilidades para diagnosticar problemas de base de datos
 */

export const diagnoseMapaAccess = async (salaId) => {
  console.log('🔍 [DIAGNÓSTICO] Iniciando diagnóstico para salaId:', salaId);
  
  const results = {
    salaId,
    timestamp: new Date().toISOString(),
    supabaseClient: !!supabase,
    authentication: null,
    tableAccess: null,
    salaExists: null,
    mapaExists: null,
    rlsPolicies: null,
    errors: []
  };

  try {
    // 1. Verificar cliente Supabase
    if (!supabase) {
      results.errors.push('Cliente Supabase no disponible');
      return results;
    }

    // 2. Verificar autenticación
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        results.authentication = { error: authError.message };
        results.errors.push(`Error de autenticación: ${authError.message}`);
      } else {
        results.authentication = {
          hasSession: !!session,
          userId: session?.user?.id || null,
          email: session?.user?.email || null
        };
      }
    } catch (authErr) {
      results.authentication = { error: authErr.message };
      results.errors.push(`Error al verificar autenticación: ${authErr.message}`);
    }

    // 3. Verificar acceso básico a la tabla mapas
    try {
      const { data: testData, error: testError, status: testStatus } = await supabase
        .from('mapas')
        .select('count')
        .limit(1);
      
      results.tableAccess = {
        canAccess: !testError,
        error: testError?.message || null,
        status: testStatus,
        hasData: !!testData
      };
      
      if (testError) {
        results.errors.push(`Error de acceso a tabla mapas: ${testError.message} (Status: ${testStatus})`);
      }
    } catch (tableErr) {
      results.tableAccess = { error: tableErr.message };
      results.errors.push(`Error al verificar acceso a tabla: ${tableErr.message}`);
    }

    // 4. Verificar si la sala existe
    try {
      const { data: salaData, error: salaError } = await supabase
        .from('salas')
        .select('id, nombre, tenant_id')
        .eq('id', salaId)
        .single();
      
      if (salaError) {
        results.salaExists = { error: salaError.message, code: salaError.code };
        results.errors.push(`Error al verificar sala: ${salaError.message}`);
      } else {
        results.salaExists = {
          exists: true,
          data: salaData
        };
      }
    } catch (salaErr) {
      results.salaExists = { error: salaErr.message };
      results.errors.push(`Error al verificar sala: ${salaErr.message}`);
    }

    // 5. Verificar si existe un mapa para la sala
    try {
      const { data: mapaData, error: mapaError, status: mapaStatus } = await supabase
        .from('mapas')
        .select('*')
        .eq('sala_id', salaId)
        .single();
      
      results.mapaExists = {
        exists: !mapaError,
        error: mapaError?.message || null,
        status: mapaStatus,
        data: mapaData
      };
      
      if (mapaError) {
        results.errors.push(`Error al verificar mapa: ${mapaError.message} (Status: ${mapaStatus})`);
      }
    } catch (mapaErr) {
      results.mapaExists = { error: mapaErr.message };
      results.errors.push(`Error al verificar mapa: ${mapaErr.message}`);
    }

    // 6. Intentar obtener información sobre políticas RLS
    try {
      // Esto puede fallar si el usuario no tiene permisos para ver las políticas
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('get_policies_info', { table_name: 'mapas' })
        .catch(() => ({ data: null, error: 'Función RPC no disponible' }));
      
      results.rlsPolicies = {
        canCheck: !policiesError,
        error: policiesError?.message || null,
        data: policiesData
      };
    } catch (policiesErr) {
      results.rlsPolicies = { error: policiesErr.message };
    }

    console.log('🔍 [DIAGNÓSTICO] Resultados:', results);
    return results;

  } catch (error) {
    console.error('🔍 [DIAGNÓSTICO] Error durante el diagnóstico:', error);
    results.errors.push(`Error general: ${error.message}`);
    return results;
  }
};

export const testMapaQuery = async (salaId) => {
  console.log('🧪 [TEST] Probando query de mapa para salaId:', salaId);
  
  const tests = [];
  
  try {
    // Test 1: Query básica
    const { data: basicData, error: basicError, status: basicStatus } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId);
    
    tests.push({
      name: 'Query básica',
      success: !basicError,
      error: basicError?.message || null,
      status: basicStatus,
      data: basicData
    });

    // Test 2: Query con single()
    const { data: singleData, error: singleError, status: singleStatus } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .single();
    
    tests.push({
      name: 'Query con single()',
      success: !singleError,
      error: singleError?.message || null,
      status: singleStatus,
      data: singleData
    });

    // Test 3: Query con maybeSingle()
    const { data: maybeData, error: maybeError, status: maybeStatus } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();
    
    tests.push({
      name: 'Query con maybeSingle()',
      success: !maybeError,
      error: maybeError?.message || null,
      status: maybeStatus,
      data: maybeData
    });

    // Test 4: Query con campos específicos
    const { data: fieldsData, error: fieldsError, status: fieldsStatus } = await supabase
      .from('mapas')
      .select('id, sala_id, contenido')
      .eq('sala_id', salaId)
      .single();
    
    tests.push({
      name: 'Query con campos específicos',
      success: !fieldsError,
      error: fieldsError?.message || null,
      status: fieldsStatus,
      data: fieldsData
    });

    console.log('🧪 [TEST] Resultados de las pruebas:', tests);
    return tests;

  } catch (error) {
    console.error('🧪 [TEST] Error durante las pruebas:', error);
    tests.push({
      name: 'Error general',
      success: false,
      error: error.message,
      status: null,
      data: null
    });
    return tests;
  }
};

export const generateDiagnosticReport = (diagnosis, tests) => {
  const report = {
    summary: {
      hasErrors: diagnosis.errors.length > 0,
      errorCount: diagnosis.errors.length,
      canAccessTable: diagnosis.tableAccess?.canAccess || false,
      salaExists: diagnosis.salaExists?.exists || false,
      mapaExists: diagnosis.mapaExists?.exists || false,
      isAuthenticated: diagnosis.authentication?.hasSession || false
    },
    recommendations: [],
    diagnosis,
    tests
  };

  // Generar recomendaciones basadas en los resultados
  if (!diagnosis.authentication?.hasSession) {
    report.recommendations.push('El usuario no está autenticado. Verificar el flujo de login.');
  }

  if (!diagnosis.tableAccess?.canAccess) {
    report.recommendations.push('No se puede acceder a la tabla mapas. Verificar permisos y RLS.');
  }

  if (!diagnosis.salaExists?.exists) {
    report.recommendations.push('La sala especificada no existe. Verificar el ID de la sala.');
  }

  if (!diagnosis.mapaExists?.exists) {
    report.recommendations.push('No existe un mapa para esta sala. Crear un mapa primero.');
  }

  if (diagnosis.errors.length > 0) {
    report.recommendations.push('Revisar los errores específicos listados arriba.');
  }

  return report;
};
