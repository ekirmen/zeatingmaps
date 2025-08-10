/*
  Script para verificar la estructura real de la tabla mapas
  Ayuda a entender qué columnas existen y cuáles no
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

async function checkMapasStructure() {
  console.log('🔍 [ESTRUCTURA MAPAS] Verificando estructura de la tabla mapas...\n');
  
  try {
    // 1. Verificar acceso básico
    console.log('1️⃣ Verificando acceso básico...');
    const { data: basicData, error: basicError } = await supabase
      .from('mapas')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.log(`❌ Error de acceso básico: ${basicError.message}`);
      return;
    }
    
    console.log('✅ Acceso básico funcionando');
    console.log(`📊 Registros encontrados: ${basicData.length}`);
    
    if (basicData.length > 0) {
      console.log('📋 Columnas disponibles:');
      const columns = Object.keys(basicData[0]);
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof basicData[0][col]}`);
      });
    }

    // 2. Probar diferentes combinaciones de columnas
    console.log('\n2️⃣ Probando diferentes combinaciones de columnas...');
    
    const columnTests = [
      ['id'],
      ['id', 'sala_id'],
      ['id', 'sala_id', 'content'],
      ['id', 'sala_id', 'data'],
      ['id', 'sala_id', 'config'],
      ['id', 'sala_id', 'zonas'],
      ['id', 'sala_id', 'created_at'],
      ['id', 'sala_id', 'updated_at'],
      ['*']
    ];
    
    for (const columns of columnTests) {
      try {
        const columnList = columns.join(', ');
        console.log(`   🧪 Probando: ${columnList}`);
        
        const { data, error, status } = await supabase
          .from('mapas')
          .select(columnList)
          .limit(1);
        
        if (error) {
          console.log(`      ❌ Error ${status}: ${error.message}`);
        } else {
          console.log(`      ✅ Éxito: ${data?.length || 0} registros`);
        }
      } catch (err) {
        console.log(`      ❌ Error: ${err.message}`);
      }
    }

    // 3. Verificar estructura específica para sala_id = 7
    console.log('\n3️⃣ Verificando acceso específico para sala_id = 7...');
    
    try {
      const { data: sala7Data, error: sala7Error, status: sala7Status } = await supabase
        .from('mapas')
        .select('*')
        .eq('sala_id', 7);
      
      if (sala7Error) {
        console.log(`❌ Error al acceder a sala_id = 7: ${sala7Error.message} (Status: ${sala7Status})`);
        
        if (sala7Status === 406) {
          console.log('💡 Error 406: Problema de RLS o permisos');
        } else if (sala7Status === 400) {
          console.log('💡 Error 400: Problema de sintaxis o columna inexistente');
        }
      } else {
        console.log(`✅ Acceso a sala_id = 7 exitoso: ${sala7Data.length} registros`);
        if (sala7Data.length > 0) {
          console.log('📋 Datos encontrados:');
          console.log(JSON.stringify(sala7Data[0], null, 2));
        }
      }
    } catch (err) {
      console.log(`❌ Error al verificar sala_id = 7: ${err.message}`);
    }

    // 4. Verificar si hay datos en la tabla
    console.log('\n4️⃣ Verificando contenido de la tabla...');
    
    try {
      const { data: countData, error: countError } = await supabase
        .from('mapas')
        .select('id, sala_id')
        .limit(10);
      
      if (countError) {
        console.log(`❌ Error al contar registros: ${countError.message}`);
      } else {
        console.log(`📊 Total de registros disponibles: ${countData.length}`);
        if (countData.length > 0) {
          console.log('📋 Primeros registros:');
          countData.forEach((record, index) => {
            console.log(`   ${index + 1}. ID: ${record.id}, Sala: ${record.sala_id}`);
          });
        }
      }
    } catch (err) {
      console.log(`❌ Error al verificar contenido: ${err.message}`);
    }

    // 5. Generar recomendaciones
    console.log('\n5️⃣ Generando recomendaciones...');
    
    if (basicData.length > 0) {
      const sampleRecord = basicData[0];
      const hasRequiredColumns = sampleRecord.hasOwnProperty('id') && sampleRecord.hasOwnProperty('sala_id');
      
      if (!hasRequiredColumns) {
        console.log('⚠️  La tabla mapas no tiene las columnas requeridas (id, sala_id)');
        console.log('💡 Recomendación: Verificar la estructura de la tabla');
      } else {
        console.log('✅ La tabla mapas tiene las columnas básicas requeridas');
      }
      
      // Verificar si hay columnas de contenido
      const contentColumns = ['content', 'data', 'config', 'zonas'];
      const hasContent = contentColumns.some(col => sampleRecord.hasOwnProperty(col));
      
      if (!hasContent) {
        console.log('⚠️  No se encontraron columnas de contenido del mapa');
        console.log('💡 Recomendación: Verificar si la tabla tiene la estructura correcta');
      } else {
        console.log('✅ Se encontraron columnas de contenido del mapa');
      }
    }

    console.log('\n🎯 Resumen:');
    console.log('   - La tabla mapas existe y es accesible');
    console.log('   - El problema puede ser de estructura o permisos específicos');
    console.log('   - Revisa los logs de error para más detalles');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar verificación
checkMapasStructure().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
