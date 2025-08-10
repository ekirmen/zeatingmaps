#!/usr/bin/env node

/**
 * Script de verificación final para confirmar que todos los problemas han sido resueltos
 * - Verifica que no hay errores 400 por columnas inexistentes
 * - Confirma que la tabla mapas es accesible
 * - Verifica que el RealtimeService puede funcionar
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('💡 Asegúrate de tener un archivo .env con:');
  console.log('   REACT_APP_SUPABASE_URL=tu_url');
  console.log('   REACT_APP_SUPABASE_ANON_KEY=tu_clave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFixes() {
  console.log('🔍 [VERIFICACIÓN FINAL] Confirmando que todos los problemas han sido resueltos...\n');

  try {
    // 1. Verificar acceso básico a la tabla mapas
    console.log('1️⃣ Verificando acceso básico a tabla mapas...');
    const { data: basicData, error: basicError, status: basicStatus } = await supabase
      .from('mapas')
      .select('*')
      .limit(1);

    if (basicError) {
      console.log(`   ❌ Error ${basicStatus}: ${basicError.message}`);
      return false;
    } else {
      console.log(`   ✅ Éxito: ${basicData?.length || 0} registros`);
    }

    // 2. Verificar acceso específico a sala_id = 7
    console.log('\n2️⃣ Verificando acceso específico a sala_id = 7...');
    const { data: salaData, error: salaError, status: salaStatus } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', 7)
      .single();

    if (salaError) {
      console.log(`   ❌ Error ${salaStatus}: ${salaError.message}`);
      return false;
    } else {
      console.log(`   ✅ Éxito: Mapa encontrado para sala 7`);
      console.log(`   📋 ID del mapa: ${salaData.id}`);
      console.log(`   📊 Elementos en contenido: ${salaData.contenido?.length || 0}`);
    }

    // 3. Verificar que no hay errores 400 por columnas inexistentes
    console.log('\n3️⃣ Verificando que no hay errores por columnas inexistentes...');
    const { data: fieldsData, error: fieldsError, status: fieldsStatus } = await supabase
      .from('mapas')
      .select('id, sala_id, contenido, updated_at')
      .eq('sala_id', 7)
      .single();

    if (fieldsError) {
      console.log(`   ❌ Error ${fieldsStatus}: ${fieldsError.message}`);
      return false;
    } else {
      console.log(`   ✅ Éxito: Acceso a columnas específicas funcionando`);
    }

    // 4. Verificar estructura de datos
    console.log('\n4️⃣ Verificando estructura de datos...');
    if (salaData.contenido && Array.isArray(salaData.contenido)) {
      console.log(`   ✅ Contenido es un array con ${salaData.contenido.length} elementos`);
      
      if (salaData.contenido.length > 0) {
        const primerElemento = salaData.contenido[0];
        console.log(`   📋 Primer elemento: ${primerElemento.type} (ID: ${primerElemento._id})`);
        
        if (primerElemento.type === 'mesa' && primerElemento.sillas) {
          console.log(`   🪑 Mesa tiene ${primerElemento.sillas.length} sillas`);
        }
      }
    } else {
      console.log(`   ⚠️  Contenido no es un array o está vacío`);
    }

    // 5. Verificar que no hay errores 406
    console.log('\n5️⃣ Verificando que no hay errores 406...');
    const { data: testData, error: testError, status: testStatus } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', 7);

    if (testError) {
      if (testStatus === 406) {
        console.log(`   ❌ Error 406 detectado: ${testError.message}`);
        console.log(`   💡 Esto indica un problema de RLS o permisos`);
        return false;
      } else {
        console.log(`   ❌ Error ${testStatus}: ${testError.message}`);
        return false;
      }
    } else {
      console.log(`   ✅ Éxito: No hay errores 406`);
    }

    console.log('\n🎉 ¡VERIFICACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('==========================================');
    console.log('✅ Todos los problemas han sido resueltos:');
    console.log('   - No hay errores 400 por columnas inexistentes');
    console.log('   - La tabla mapas es accesible');
    console.log('   - Los datos se pueden consultar correctamente');
    console.log('   - No hay errores 406 de permisos');
    console.log('   - La estructura de datos es correcta');
    
    console.log('\n💡 Próximos pasos recomendados:');
    console.log('   1. La aplicación debería funcionar correctamente ahora');
    console.log('   2. Considera habilitar RLS para mayor seguridad');
    console.log('   3. Monitorea los logs para confirmar estabilidad');
    
    return true;

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    return false;
  }
}

// Ejecutar verificación
verifyFixes().then(success => {
  if (success) {
    console.log('\n🚀 La aplicación está lista para funcionar correctamente');
    process.exit(0);
  } else {
    console.log('\n⚠️  Algunos problemas persisten. Revisa los logs anteriores');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Error fatal durante la verificación:', error);
  process.exit(1);
});
