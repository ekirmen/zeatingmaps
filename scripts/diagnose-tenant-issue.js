#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de tenant
 * Uso: node scripts/diagnose-tenant-issue.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Asegúrate de tener un archivo .env con:');
  console.log('REACT_APP_SUPABASE_URL=tu_url_de_supabase');
  console.log('REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseTenantIssue() {
  console.log('🔍 Diagnóstico de Problemas de Tenant');
  console.log('=====================================\n');

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError.message);
      return;
    }
    console.log('✅ Conexión a Supabase exitosa\n');

    // 2. Verificar si existe la tabla tenants
    console.log('2️⃣ Verificando estructura de la tabla tenants...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'tenants' });
    
    if (tableError) {
      console.log('⚠️ No se pudo obtener info de la tabla, verificando de otra manera...');
      
      // Intentar hacer un select simple
      const { data: simpleCheck, error: simpleError } = await supabase
        .from('tenants')
        .select('*')
        .limit(1);
      
      if (simpleError) {
        console.error('❌ La tabla tenants no existe o no es accesible');
        console.log('Error:', simpleError.message);
        console.log('\n💡 Solución: Ejecuta el script create_test_tenant.sql en Supabase');
        return;
      }
    }
    console.log('✅ Tabla tenants existe y es accesible\n');

    // 3. Verificar tenants existentes
    console.log('3️⃣ Verificando tenants existentes...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsError) {
      console.error('❌ Error al obtener tenants:', tenantsError.message);
      return;
    }

    if (!tenants || tenants.length === 0) {
      console.log('⚠️ No hay tenants en la base de datos');
      console.log('💡 Solución: Ejecuta el script create_test_tenant.sql en Supabase');
    } else {
      console.log(`✅ Se encontraron ${tenants.length} tenant(s):`);
      tenants.forEach((tenant, index) => {
        console.log(`   ${index + 1}. ${tenant.name || 'Sin nombre'} (${tenant.subdomain}) - ${tenant.status || 'Sin estado'}`);
      });
    }
    console.log('');

    // 4. Verificar tenant específico para zeatingmaps
    console.log('4️⃣ Verificando tenant para subdominio "zeatingmaps"...');
    const { data: zeatingmapsTenant, error: zeatingmapsError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'zeatingmaps')
      .single();

    if (zeatingmapsError) {
      if (zeatingmapsError.code === 'PGRST116') {
        console.log('❌ No se encontró tenant para subdominio "zeatingmaps"');
        console.log('💡 Solución: Ejecuta el script create_test_tenant.sql en Supabase');
      } else {
        console.error('❌ Error al buscar tenant zeatingmaps:', zeatingmapsError.message);
      }
    } else {
      console.log('✅ Tenant zeatingmaps encontrado:');
      console.log(`   Nombre: ${zeatingmapsTenant.name}`);
      console.log(`   Estado: ${zeatingmapsTenant.status}`);
      console.log(`   Email: ${zeatingmapsTenant.contact_email}`);
      console.log(`   Creado: ${zeatingmapsTenant.created_at}`);
    }
    console.log('');

    // 5. Verificar permisos RLS
    console.log('5️⃣ Verificando políticas RLS...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies', { table_name: 'tenants' });
      
      if (policiesError) {
        console.log('⚠️ No se pudieron verificar las políticas RLS');
      } else {
        console.log('✅ Políticas RLS verificadas');
      }
    } catch (e) {
      console.log('⚠️ No se pudieron verificar las políticas RLS (esto es normal)');
    }
    console.log('');

    // 6. Verificar estructura de otras tablas relacionadas
    console.log('6️⃣ Verificando tablas relacionadas...');
    const relatedTables = ['recintos', 'salas', 'eventos', 'funciones', 'mapas', 'zonas'];
    
    for (const tableName of relatedTables) {
      try {
        const { data: tableData, error: tableDataError } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (tableDataError) {
          console.log(`   ❌ Tabla ${tableName}: No accesible`);
        } else {
          console.log(`   ✅ Tabla ${tableName}: Accesible`);
        }
      } catch (e) {
        console.log(`   ❌ Tabla ${tableName}: Error de conexión`);
      }
    }
    console.log('');

    // 7. Resumen y recomendaciones
    console.log('📋 RESUMEN Y RECOMENDACIONES');
    console.log('=============================');
    
    if (!tenants || tenants.length === 0) {
      console.log('🚨 PROBLEMA CRÍTICO: No hay tenants en la base de datos');
      console.log('💡 ACCIÓN REQUERIDA:');
      console.log('   1. Ve a Supabase Dashboard > SQL Editor');
      console.log('   2. Ejecuta el script: create_test_tenant.sql');
      console.log('   3. Verifica que se haya creado el tenant');
    } else if (!tenants.find(t => t.subdomain === 'zeatingmaps')) {
      console.log('⚠️ PROBLEMA: No existe tenant para subdominio "zeatingmaps"');
      console.log('💡 ACCIÓN REQUERIDA:');
      console.log('   1. Ejecuta el script create_test_tenant.sql en Supabase');
      console.log('   2. O crea manualmente un tenant con subdomain = "zeatingmaps"');
    } else {
      console.log('✅ SITUACIÓN NORMAL: Tenant zeatingmaps existe');
      console.log('💡 VERIFICACIÓN:');
      console.log('   1. Recarga la página https://zeatingmaps-ekirmens-projects.vercel.app/');
      console.log('   2. Verifica que no aparezcan errores en la consola');
    }

    console.log('\n🔧 COMANDOS ÚTILES:');
    console.log('   - Ver tenant: SELECT * FROM tenants WHERE subdomain = \'zeatingmaps\';');
    console.log('   - Ver estructura: \\d tenants');
    console.log('   - Ver políticas: SELECT * FROM pg_policies WHERE tablename = \'tenants\';');

  } catch (error) {
    console.error('❌ Error general en el diagnóstico:', error.message);
    console.log('\n💡 Verifica:');
    console.log('   1. Que las variables de entorno estén correctas');
    console.log('   2. Que tengas acceso a la base de datos');
    console.log('   3. Que la tabla tenants exista');
  }
}

// Ejecutar diagnóstico
diagnoseTenantIssue().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
