import { supabase } from '../config/supabase';

/**
 * Sistema de diagnóstico mejorado para el Store
 * Verifica múltiples aspectos críticos del sistema
 */

export const diagnoseMapaAccess = async (salaId) => {
  console.log('🔍 [DIAGNÓSTICO] Iniciando diagnóstico completo para salaId:', salaId || 'SISTEMA GENERAL');
  
  const results = {
    salaId,
    timestamp: new Date().toISOString(),
    supabaseClient: !!supabase,
    authentication: null,
    tableAccess: null,
    salaExists: null,
    mapaExists: null,
    rlsPolicies: null,
    tenantAccess: null,
    functionAccess: null,
    plantillaAccess: null,
    realtimeStatus: null,
    performanceMetrics: null,
    systemHealth: null,
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    // 1. Verificar cliente Supabase
    if (!supabase) {
      results.errors.push('Cliente Supabase no disponible');
      return results;
    }

    // 2. Verificar autenticación y permisos
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        results.authentication = { error: authError.message };
        results.errors.push(`Error de autenticación: ${authError.message}`);
      } else {
        results.authentication = {
          hasSession: !!session,
          userId: session?.user?.id || null,
          email: session?.user?.email || null,
          isAnonymous: !session?.user?.id
        };
        
        // Verificar si es usuario anónimo y dar recomendaciones
        if (!session?.user?.id) {
          results.warnings.push('Usuario no autenticado - puede tener limitaciones de acceso');
          results.recommendations.push('Considerar autenticación para acceso completo');
        }
      }
    } catch (authErr) {
      results.authentication = { error: authErr.message };
      results.errors.push(`Error al verificar autenticación: ${authErr.message}`);
    }

    // 3. Verificar acceso a tablas críticas
    const criticalTables = ['mapas', 'salas', 'funciones', 'plantillas', 'eventos', 'seats', 'seat_locks'];
    results.tableAccess = {};
    
    for (const table of criticalTables) {
      try {
        const startTime = performance.now();
        const { data, error, status } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        results.tableAccess[table] = {
          canAccess: !error,
          error: error?.message || null,
          status,
          hasData: !!data,
          responseTime: Math.round(responseTime)
        };
        
        if (error) {
          results.errors.push(`Error de acceso a tabla ${table}: ${error.message} (Status: ${status})`);
        }
        
        // Advertencias por tiempo de respuesta lento
        if (responseTime > 1000) {
          results.warnings.push(`Tabla ${table} responde lento: ${Math.round(responseTime)}ms`);
        }
      } catch (tableErr) {
        results.tableAccess[table] = { error: tableErr.message };
        results.errors.push(`Error al verificar acceso a tabla ${table}: ${tableErr.message}`);
      }
    }

    // 4. Verificar estado general del sistema
    try {
      const { data: systemData, error: systemError } = await supabase
        .from('eventos')
        .select('count')
        .limit(1);
      
      results.systemHealth = {
        canAccessEventos: !systemError,
        error: systemError?.message || null,
        hasEventos: !!systemData
      };
      
      if (systemError) {
        results.warnings.push(`Problemas de acceso a eventos: ${systemError.message}`);
      }
    } catch (systemErr) {
      results.systemHealth = { error: systemErr.message };
      results.warnings.push(`Error al verificar salud del sistema: ${systemErr.message}`);
    }

    // 5. Si se proporciona salaId, hacer diagnóstico específico
    if (salaId) {
      // Verificar si la sala existe y sus propiedades
      try {
        const { data: salaData, error: salaError } = await supabase
          .from('salas')
          .select('id, nombre, tenant_id, recinto_id, capacidad, estado')
          .eq('id', salaId)
          .single();
        
        if (salaError) {
          results.salaExists = { error: salaError.message, code: salaError.code };
          results.errors.push(`Error al verificar sala: ${salaError.message}`);
        } else {
          results.salaExists = {
            exists: true,
            data: salaData,
            hasTenantId: !!salaData.tenant_id,
            hasRecintoId: !!salaData.recinto_id,
            isActive: salaData.estado !== 'inactiva'
          };
          
          // Verificar si la sala tiene tenant_id configurado
          if (!salaData.tenant_id) {
            results.warnings.push('Sala sin tenant_id configurado - puede causar problemas de acceso');
            results.recommendations.push('Configurar tenant_id en la sala');
          }
        }
      } catch (salaErr) {
        results.salaExists = { error: salaErr.message };
        results.errors.push(`Error al verificar sala: ${salaErr.message}`);
      }

      // Verificar si existe un mapa para la sala
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
          data: mapaData ? {
            id: mapaData.id,
            hasContent: !!mapaData.contenido,
            contentType: typeof mapaData.contenido,
            contentLength: mapaData.contenido ? 
              (typeof mapaData.contenido === 'string' ? mapaData.contenido.length : JSON.stringify(mapaData.contenido).length) : 0,
            hasTenantId: !!mapaData.tenant_id,
            lastUpdated: mapaData.updated_at
          } : null
        };
        
        if (mapaError) {
          results.errors.push(`Error al verificar mapa: ${mapaError.message} (Status: ${mapaStatus})`);
        } else if (mapaData) {
          // Verificar contenido del mapa
          if (!mapaData.contenido) {
            results.warnings.push('Mapa sin contenido configurado');
            results.recommendations.push('Configurar contenido del mapa en Crear Mapa');
          }
          
          if (!mapaData.tenant_id) {
            results.warnings.push('Mapa sin tenant_id configurado');
            results.recommendations.push('Configurar tenant_id en el mapa');
          }
          
          // Verificar tamaño del contenido
          const contentSize = JSON.stringify(mapaData.contenido).length;
          if (contentSize > 100000) { // 100KB
            results.warnings.push(`Mapa muy grande: ${Math.round(contentSize/1024)}KB - puede afectar rendimiento`);
          }
        }
      } catch (mapaErr) {
        results.mapaExists = { error: mapaErr.message };
        results.errors.push(`Error al verificar mapa: ${mapaErr.message}`);
      }

      // Verificar acceso a tenant
      if (results.salaExists?.data?.tenant_id) {
        try {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('id, subdomain, company_name, status')
            .eq('id', results.salaExists.data.tenant_id)
            .single();
          
          results.tenantAccess = {
            canAccess: !tenantError,
            error: tenantError?.message || null,
            data: tenantData,
            isActive: tenantData?.status === 'active'
          };
          
          if (tenantError) {
            results.errors.push(`Error al acceder a tenant: ${tenantError.message}`);
          } else if (tenantData?.status !== 'active') {
            results.warnings.push(`Tenant inactivo: ${tenantData.status}`);
          }
        } catch (tenantErr) {
          results.tenantAccess = { error: tenantErr.message };
          results.errors.push(`Error al verificar tenant: ${tenantErr.message}`);
        }
      }
    }

    // 6. Verificar estado de realtime
    try {
      const channels = supabase.getChannels();
      results.realtimeStatus = {
        hasChannels: channels.length > 0,
        channelCount: channels.length,
        channels: channels.map(ch => ({
          topic: ch.topic,
          state: ch.state
        }))
      };
      
      if (channels.length === 0) {
        results.warnings.push('No hay canales de realtime activos');
        results.recommendations.push('Verificar configuración de realtime');
      }
    } catch (realtimeErr) {
      results.realtimeStatus = { error: realtimeErr.message };
      results.warnings.push(`Error al verificar realtime: ${realtimeErr.message}`);
    }

    // 7. Métricas de rendimiento
    results.performanceMetrics = {
      totalTables: Object.keys(results.tableAccess || {}).length,
      accessibleTables: Object.values(results.tableAccess || {}).filter(t => t.canAccess).length,
      averageResponseTime: Object.values(results.tableAccess || {})
        .filter(t => t.responseTime)
        .reduce((sum, t) => sum + t.responseTime, 0) / 
        Object.values(results.tableAccess || {}).filter(t => t.responseTime).length || 0
    };

    // 8. Generar recomendaciones automáticas
    if (results.errors.length > 0) {
      results.recommendations.push('Revisar logs de consola para errores específicos');
      results.recommendations.push('Verificar configuración de Supabase y RLS');
    }
    
    if (results.warnings.length > 0) {
      results.recommendations.push('Revisar configuraciones de tenant_id y permisos');
      results.recommendations.push('Verificar que las tablas tengan datos válidos');
    }
    
    if (salaId && !results.mapaExists?.exists) {
      results.recommendations.push('Crear mapa para esta sala usando Crear Mapa');
    }
    
    if (results.performanceMetrics.averageResponseTime > 500) {
      results.recommendations.push('Considerar optimización de consultas o índices');
    }

    // Recomendaciones específicas para diagnóstico del sistema
    if (!salaId) {
      results.recommendations.push('Este es un diagnóstico general del sistema');
      results.recommendations.push('Para diagnóstico específico, selecciona una función');
    }

    console.log('✅ [DIAGNÓSTICO] Diagnóstico completado exitosamente');
    return results;
    
  } catch (error) {
    console.error('❌ [DIAGNÓSTICO] Error durante el diagnóstico:', error);
    results.errors.push(`Error general del diagnóstico: ${error.message}`);
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
  console.log('📊 [REPORTE] Generando reporte de diagnóstico...');
  
  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      hasErrors: diagnosis.errors.length > 0,
      hasWarnings: diagnosis.warnings.length > 0,
      errorCount: diagnosis.errors.length,
      warningCount: diagnosis.warnings.length,
      overallStatus: diagnosis.errors.length > 0 ? 'CRÍTICO' : 
                    diagnosis.warnings.length > 0 ? 'ADVERTENCIA' : 'OK',
      criticalIssues: [],
      recommendations: diagnosis.recommendations || []
    },
    details: {
      authentication: diagnosis.authentication,
      tableAccess: diagnosis.tableAccess,
      salaExists: diagnosis.salaExists,
      mapaExists: diagnosis.mapaExists,
      tenantAccess: diagnosis.tenantAccess,
      realtimeStatus: diagnosis.realtimeStatus,
      performanceMetrics: diagnosis.performanceMetrics
    },
    tests: tests || [],
    actions: []
  };

  // Analizar errores críticos
  if (diagnosis.errors.length > 0) {
    report.summary.criticalIssues = diagnosis.errors.map(error => ({
      type: 'ERROR',
      message: error,
      priority: 'HIGH'
    }));
  }

  // Analizar advertencias
  if (diagnosis.warnings.length > 0) {
    diagnosis.warnings.forEach(warning => {
      report.summary.criticalIssues.push({
        type: 'WARNING',
        message: warning,
        priority: 'MEDIUM'
      });
    });
  }

  // Generar acciones específicas basadas en problemas detectados
  if (!diagnosis.supabaseClient) {
    report.actions.push({
      action: 'Verificar configuración de Supabase',
      description: 'El cliente Supabase no está disponible',
      priority: 'CRÍTICA',
      steps: [
        'Verificar variables de entorno',
        'Revisar configuración en config/supabase.js',
        'Verificar conexión a internet'
      ]
    });
  }

  if (diagnosis.authentication?.error) {
    report.actions.push({
      action: 'Resolver problemas de autenticación',
      description: 'Error en la autenticación del usuario',
      priority: 'ALTA',
      steps: [
        'Verificar credenciales de Supabase',
        'Revisar políticas RLS',
        'Verificar configuración de auth en Supabase'
      ]
    });
  }

  if (diagnosis.tableAccess) {
    Object.entries(diagnosis.tableAccess).forEach(([tableName, access]) => {
      if (!access.canAccess) {
        report.actions.push({
          action: `Resolver acceso a tabla ${tableName}`,
          description: `No se puede acceder a la tabla ${tableName}`,
          priority: 'ALTA',
          steps: [
            'Verificar que la tabla existe',
            'Revisar políticas RLS para la tabla',
            'Verificar permisos del usuario',
            'Revisar logs de Supabase'
          ]
        });
      }
    });
  }

  if (!diagnosis.salaExists?.exists) {
    report.actions.push({
      action: 'Crear o configurar sala',
      description: 'La sala especificada no existe',
      priority: 'CRÍTICA',
      steps: [
        'Verificar que la sala existe en la base de datos',
        'Crear la sala si no existe',
        'Configurar tenant_id en la sala',
        'Asociar la sala con un recinto'
      ]
    });
  }

  if (!diagnosis.mapaExists?.exists) {
    report.actions.push({
      action: 'Crear mapa para la sala',
      description: 'No existe un mapa para esta sala',
      priority: 'ALTA',
      steps: [
        'Ir a Crear Mapa en el backoffice',
        'Seleccionar la sala correcta',
        'Diseñar el mapa con mesas y asientos',
        'Guardar el mapa'
      ]
    });
  }

  if (diagnosis.mapaExists?.exists && !diagnosis.mapaExists.data?.hasContent) {
    report.actions.push({
      action: 'Configurar contenido del mapa',
      description: 'El mapa existe pero no tiene contenido',
      priority: 'MEDIA',
      steps: [
        'Editar el mapa existente',
        'Agregar mesas y asientos',
        'Configurar posiciones y propiedades',
        'Guardar los cambios'
      ]
    });
  }

  if (diagnosis.performanceMetrics?.averageResponseTime > 1000) {
    report.actions.push({
      action: 'Optimizar rendimiento de consultas',
      description: 'Las consultas están respondiendo lentamente',
      priority: 'MEDIA',
      steps: [
        'Revisar índices de la base de datos',
        'Optimizar consultas complejas',
        'Considerar paginación de resultados',
        'Verificar recursos del servidor'
      ]
    });
  }

  if (diagnosis.realtimeStatus?.channelCount === 0) {
    report.actions.push({
      action: 'Configurar realtime',
      description: 'No hay canales de realtime activos',
      priority: 'MEDIA',
      steps: [
        'Verificar configuración de realtime en Supabase',
        'Habilitar realtime para las tablas necesarias',
        'Verificar suscripciones en el frontend'
      ]
    });
  }

  // Agregar acciones de mantenimiento general
  report.actions.push({
    action: 'Mantenimiento preventivo',
    description: 'Acciones recomendadas para mantener el sistema funcionando',
    priority: 'BAJA',
    steps: [
      'Revisar logs de Supabase regularmente',
      'Monitorear métricas de rendimiento',
      'Verificar que las políticas RLS estén actualizadas',
      'Mantener las dependencias actualizadas'
    ]
  });

  console.log('✅ [REPORTE] Reporte generado exitosamente');
  return report;
};
