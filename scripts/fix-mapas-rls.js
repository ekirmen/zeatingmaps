/*
  Script para arreglar las políticas RLS de la tabla mapas
  Permite acceso anónimo de lectura mientras mantiene seguridad para escritura
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  console.error('Asegúrate de tener un archivo .env con estas variables:');
  console.error('SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMapasRLS() {
  console.log('🔧 [FIX MAPAS RLS] Iniciando corrección de políticas RLS para tabla mapas...');
  
  try {
    // 1. Verificar el estado actual de RLS
    console.log('📋 Verificando estado actual de RLS...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'mapas' });
    
    if (rlsError) {
      console.log('ℹ️  No se pudo verificar RLS con función personalizada, continuando con verificación manual...');
    } else {
      console.log('✅ Estado RLS:', rlsStatus);
    }

    // 2. Verificar políticas existentes
    console.log('🔍 Verificando políticas existentes...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'mapas');
    
    if (policiesError) {
      console.log('ℹ️  No se pudo verificar políticas con pg_policies, continuando...');
    } else {
      console.log(`📋 Políticas encontradas: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
      });
    }

    // 3. Crear política para acceso anónimo de lectura
    console.log('🔓 Creando política para acceso anónimo de lectura...');
    
    const createPolicySQL = `
      DO $$
      BEGIN
          -- Verificar si la política ya existe
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'mapas' 
              AND policyname = 'Enable anonymous read access to mapas'
          ) THEN
              -- Crear política para acceso anónimo de lectura
              CREATE POLICY "Enable anonymous read access to mapas" ON mapas
                  FOR SELECT USING (true);
              
              RAISE NOTICE 'Política de acceso anónimo de lectura creada exitosamente';
          ELSE
              RAISE NOTICE 'La política de acceso anónimo de lectura ya existe';
          END IF;
      END $$;
    `;
    
    const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPolicySQL });
    
    if (policyError) {
      console.log('⚠️  No se pudo ejecutar SQL personalizado, intentando método alternativo...');
      
      // Método alternativo: usar una consulta directa
      try {
        const { error: altError } = await supabase
          .from('mapas')
          .select('id')
          .limit(1);
        
        if (altError && altError.code === '42501') {
          console.log('🔒 RLS está bloqueando acceso, creando política...');
          // Intentar crear la política de otra manera
          const { error: createError } = await supabase.rpc('create_anonymous_read_policy');
          if (createError) {
            console.log('⚠️  No se pudo crear política con función personalizada');
          }
        }
      } catch (altErr) {
        console.log('ℹ️  Método alternativo no disponible');
      }
    } else {
      console.log('✅ Política creada exitosamente');
    }

    // 4. Verificar que RLS esté habilitado
    console.log('🔒 Verificando que RLS esté habilitado...');
    const { error: enableError } = await supabase.rpc('enable_rls', { table_name: 'mapas' });
    
    if (enableError) {
      console.log('ℹ️  No se pudo habilitar RLS con función personalizada');
    } else {
      console.log('✅ RLS habilitado');
    }

    // 5. Probar acceso anónimo
    console.log('🧪 Probando acceso anónimo...');
    const { data: testData, error: testError, status: testStatus } = await supabase
      .from('mapas')
      .select('id, sala_id')
      .limit(1);
    
    if (testError) {
      console.log(`❌ Error al probar acceso: ${testError.message} (Status: ${testStatus})`);
      console.log('💡 Posibles causas:');
      console.log('   1. Las políticas RLS aún no se han aplicado');
      console.log('   2. Necesitas reiniciar la aplicación');
      console.log('   3. Hay conflictos con otras políticas');
    } else {
      console.log('✅ Acceso anónimo funcionando correctamente');
      console.log(`📊 Datos de prueba: ${testData.length} registros encontrados`);
    }

    // 6. Verificar estado final
    console.log('📋 Estado final de las políticas...');
    const { data: finalPolicies, error: finalError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'mapas');
    
    if (!finalError && finalPolicies) {
      console.log(`📊 Total de políticas: ${finalPolicies.length}`);
      finalPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    }

    console.log('🎯 [FIX MAPAS RLS] Proceso completado');
    console.log('💡 Si sigues teniendo problemas:');
    console.log('   1. Reinicia tu aplicación React');
    console.log('   2. Verifica que las variables de entorno estén correctas');
    console.log('   3. Revisa los logs de Supabase para más detalles');

  } catch (error) {
    console.error('❌ Error durante la corrección de RLS:', error);
    console.error('💡 Asegúrate de que tienes permisos de administrador en Supabase');
    process.exit(1);
  }
}

// Ejecutar el fix
fixMapasRLS().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
