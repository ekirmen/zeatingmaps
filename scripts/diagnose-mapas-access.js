/*
  Script de diagnóstico para problemas de acceso a la tabla mapas
  Ayuda a identificar problemas de RLS, permisos y configuración
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseMapasAccess() {
  console.log('🔍 [DIAGNÓSTICO MAPAS] Iniciando diagnóstico completo...\n');
  
  const diagnosis = {
    timestamp: new Date().toISOString(),
    supabaseClient: !!supabase,
    tableExists: false,
    rlsEnabled: false,
    policies: [],
    currentPolicies: [],
    accessTest: null,
    recommendations: []
  };

  try {
    // 1. Verificar cliente Supabase
    console.log('1️⃣ Verificando cliente Supabase...');
    if (!supabase) {
      diagnosis.recommendations.push('Cliente Supabase no disponible');
      console.log('❌ Cliente Supabase no disponible');
    } else {
      console.log('✅ Cliente Supabase disponible');
    }

    // 2. Verificar si la tabla mapas existe
    console.log('\n2️⃣ Verificando existencia de tabla mapas...');
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('mapas')
        .select('count')
        .limit(1);
      
      if (tableError) {
        if (tableError.code === '42P01') {
          console.log('❌ Tabla mapas no existe');
          diagnosis.recommendations.push('Crear tabla mapas');
        } else {
          console.log('⚠️  Error al verificar tabla:', tableError.message);
          diagnosis.recommendations.push(`Error de tabla: ${tableError.message}`);
        }
      } else {
        console.log('✅ Tabla mapas existe');
        diagnosis.tableExists = true;
      }
    } catch (err) {
      console.log('❌ Error al verificar tabla:', err.message);
    }

    // 3. Verificar estado de RLS
    console.log('\n3️⃣ Verificando estado de RLS...');
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .from('pg_tables')
        .select('rowsecurity')
        .eq('tablename', 'mapas')
        .single();
      
      if (rlsError) {
        console.log('⚠️  No se pudo verificar RLS:', rlsError.message);
      } else {
        diagnosis.rlsEnabled = rlsData.rowsecurity;
        console.log(`📋 RLS ${rlsData.rowsecurity ? 'habilitado' : 'deshabilitado'}`);
      }
    } catch (err) {
      console.log('❌ Error al verificar RLS:', err.message);
    }

    // 4. Verificar políticas existentes
    console.log('\n4️⃣ Verificando políticas RLS existentes...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'mapas');
      
      if (policiesError) {
        console.log('⚠️  No se pudo verificar políticas:', policiesError.message);
      } else {
        diagnosis.policies = policies;
        console.log(`📋 Políticas encontradas: ${policies.length}`);
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
          console.log(`     Condición: ${policy.qual || 'N/A'}`);
        });
      }
    } catch (err) {
      console.log('❌ Error al verificar políticas:', err.message);
    }

    // 5. Probar acceso con diferentes métodos
    console.log('\n5️⃣ Probando acceso a la tabla...');
    const accessTests = [
      { name: 'Acceso básico', query: () => supabase.from('mapas').select('id').limit(1) },
      { name: 'Acceso con filtro sala_id', query: () => supabase.from('mapas').select('*').eq('sala_id', 7) },
      { name: 'Acceso con count', query: () => supabase.from('mapas').select('count') },
      { name: 'Acceso con columnas específicas', query: () => supabase.from('mapas').select('id, sala_id, contenido') }
    ];

    for (const test of accessTests) {
      try {
        console.log(`   🧪 ${test.name}...`);
        const { data, error, status } = await test.query();
        
        if (error) {
          console.log(`      ❌ Error ${status}: ${error.message}`);
          if (status === 406) {
            console.log('         💡 Error 406: Políticas RLS bloqueando acceso');
          } else if (status === 42501) {
            console.log('         💡 Error 42501: Permisos insuficientes');
          }
        } else {
          console.log(`      ✅ Éxito: ${data?.length || 0} registros`);
        }
      } catch (err) {
        console.log(`      ❌ Error: ${err.message}`);
      }
    }

    // 6. Verificar configuración de autenticación
    console.log('\n6️⃣ Verificando configuración de autenticación...');
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.log('⚠️  Error de autenticación:', authError.message);
      } else {
        console.log(`📋 Sesión: ${session ? 'Activa' : 'No activa'}`);
        if (session) {
          console.log(`   Usuario: ${session.user.email}`);
        }
      }
    } catch (err) {
      console.log('❌ Error al verificar autenticación:', err.message);
    }

    // 7. Generar recomendaciones
    console.log('\n7️⃣ Generando recomendaciones...');
    
    if (!diagnosis.tableExists) {
      diagnosis.recommendations.push('Crear tabla mapas si no existe');
    }
    
    if (!diagnosis.rlsEnabled) {
      diagnosis.recommendations.push('Habilitar RLS en tabla mapas');
    }
    
    if (diagnosis.policies.length === 0) {
      diagnosis.recommendations.push('Crear políticas RLS para tabla mapas');
    }
    
    const hasAnonymousPolicy = diagnosis.policies.some(p => 
      p.policyname.includes('anonymous') || p.policyname.includes('anon')
    );
    
    if (!hasAnonymousPolicy) {
      diagnosis.recommendations.push('Crear política para acceso anónimo de lectura');
    }

    // 8. Mostrar resumen
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log('========================');
    console.log(`⏰ Timestamp: ${diagnosis.timestamp}`);
    console.log(`🔧 Cliente Supabase: ${diagnosis.supabaseClient ? '✅' : '❌'}`);
    console.log(`📋 Tabla mapas: ${diagnosis.tableExists ? '✅' : '❌'}`);
    console.log(`🔒 RLS habilitado: ${diagnosis.rlsEnabled ? '✅' : '❌'}`);
    console.log(`📜 Políticas: ${diagnosis.policies.length}`);
    
    if (diagnosis.recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:');
      diagnosis.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n🎯 Para resolver el problema:');
    console.log('   1. Ejecuta: node scripts/fix-mapas-rls.js');
    console.log('   2. O ejecuta el SQL: fix_mapas_rls_simple.sql en Supabase');
    console.log('   3. Reinicia tu aplicación React');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    diagnosis.recommendations.push(`Error: ${error.message}`);
  }
}

// Ejecutar diagnóstico
diagnoseMapasAccess().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
