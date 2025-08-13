#!/usr/bin/env node

/**
 * Script para verificar que las políticas RLS de zonas estén funcionando correctamente
 * Ejecutar con: node scripts/verify-zonas-rls.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  console.error('❌ Faltan variables de entorno necesarias:');
  console.error('  - REACT_APP_SUPABASE_URL o SUPABASE_URL');
  console.error('  - REACT_APP_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY');
  console.error('  - REACT_APP_SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear clientes
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Verificando políticas RLS para tabla zonas...\n');

async function checkZonasRLS() {
  try {
    // 1. Verificar que RLS esté habilitado
    console.log('1️⃣ Verificando que RLS esté habilitado...');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('is_security_barrier')
      .eq('table_name', 'zonas')
      .eq('table_schema', 'public')
      .single();

    if (rlsError) {
      console.error('❌ Error al verificar RLS:', rlsError.message);
      return false;
    }

    if (rlsStatus?.is_security_barrier === 'YES') {
      console.log('✅ RLS está habilitado en la tabla zonas');
    } else {
      console.log('❌ RLS NO está habilitado en la tabla zonas');
      return false;
    }

    // 2. Verificar políticas existentes
    console.log('\n2️⃣ Verificando políticas RLS existentes...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, permissive, cmd')
      .eq('tablename', 'zonas')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.error('❌ Error al verificar políticas:', policiesError.message);
      return false;
    }

    if (policies && policies.length > 0) {
      console.log(`✅ Se encontraron ${policies.length} políticas:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    } else {
      console.log('❌ No se encontraron políticas RLS para zonas');
      return false;
    }

    // 3. Verificar que la tabla tenga columna tenant_id
    console.log('\n3️⃣ Verificando estructura de la tabla zonas...');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'zonas')
      .eq('table_schema', 'public')
      .in('column_name', ['id', 'nombre', 'color', 'aforo', 'numerada', 'sala_id', 'tenant_id', 'created_at', 'updated_at']);

    if (columnsError) {
      console.error('❌ Error al verificar columnas:', columnsError.message);
      return false;
    }

    console.log('✅ Columnas encontradas en la tabla zonas:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });

    const hasTenantId = columns.some(col => col.column_name === 'tenant_id');
    if (!hasTenantId) {
      console.log('❌ La tabla zonas NO tiene columna tenant_id');
      return false;
    }

    // 4. Verificar que existan zonas con tenant_id
    console.log('\n4️⃣ Verificando datos de zonas...');
    const { data: zonas, error: zonasError } = await supabaseAdmin
      .from('zonas')
      .select('id, nombre, tenant_id, sala_id')
      .limit(5);

    if (zonasError) {
      console.error('❌ Error al verificar zonas:', zonasError.message);
      return false;
    }

    if (zonas && zonas.length > 0) {
      console.log(`✅ Se encontraron ${zonas.length} zonas:`);
      zonas.forEach(zona => {
        console.log(`   - ${zona.nombre} (ID: ${zona.id}, Tenant: ${zona.tenant_id}, Sala: ${zona.sala_id})`);
      });

      // Verificar que todas tengan tenant_id
      const zonasSinTenant = zonas.filter(z => !z.tenant_id);
      if (zonasSinTenant.length > 0) {
        console.log(`⚠️  ${zonasSinTenant.length} zonas no tienen tenant_id asignado`);
      } else {
        console.log('✅ Todas las zonas tienen tenant_id asignado');
      }
    } else {
      console.log('ℹ️  No hay zonas en la base de datos');
    }

    // 5. Probar acceso con usuario anónimo (debería fallar)
    console.log('\n5️⃣ Probando acceso con usuario anónimo...');
    const { data: zonasAnon, error: anonError } = await supabase
      .from('zonas')
      .select('id, nombre')
      .limit(1);

    if (anonError) {
      console.log('✅ Acceso anónimo correctamente bloqueado:', anonError.message);
    } else if (zonasAnon && zonasAnon.length > 0) {
      console.log('❌ Acceso anónimo NO está bloqueado - las zonas son visibles');
      return false;
    } else {
      console.log('✅ Acceso anónimo correctamente bloqueado - no se devolvieron zonas');
    }

    // 6. Verificar índices
    console.log('\n6️⃣ Verificando índices de la tabla zonas...');
    const { data: indexes, error: indexesError } = await supabaseAdmin
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'zonas')
      .eq('schemaname', 'public');

    if (indexesError) {
      console.error('❌ Error al verificar índices:', indexesError.message);
    } else if (indexes && indexes.length > 0) {
      console.log(`✅ Se encontraron ${indexes.length} índices:`);
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname}: ${idx.indexdef}`);
      });
    } else {
      console.log('ℹ️  No se encontraron índices específicos para zonas');
    }

    console.log('\n🎉 Verificación completada exitosamente!');
    return true;

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando verificación de RLS para zonas...\n');
  
  const success = await checkZonasRLS();
  
  if (success) {
    console.log('\n✅ Todas las verificaciones pasaron correctamente');
    console.log('🔒 Las políticas RLS están funcionando como se esperaba');
    process.exit(0);
  } else {
    console.log('\n❌ Algunas verificaciones fallaron');
    console.log('🔧 Revisa los errores anteriores y ejecuta el script fix_zonas_rls.sql');
    process.exit(1);
  }
}

// Ejecutar el script
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
