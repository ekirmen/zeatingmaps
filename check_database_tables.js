// Script para verificar qué tablas existen en la base de datos
// Ejecutar en la consola del navegador

console.log('🔍 Verificando tablas de la base de datos...');

// Lista de tablas que la aplicación está intentando usar
const tablesToCheck = [
  'funciones',
  'eventos', 
  'salas',
  'recintos',
  'plantillas_comisiones',
  'plantillas_productos_template',
  'plantillas_entradas',
  'plantillas_cupos',
  'profiles',
  'tenants'
];

// Función para probar si una tabla existe
async function testTableExists(tableName) {
  try {
    console.log(`🔍 Probando tabla: ${tableName}`);
    
    const { data, error } = await window.supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`❌ Tabla '${tableName}' no existe (404)`);
        return false;
      } else {
        console.log(`⚠️ Tabla '${tableName}' existe pero hay error:`, error.message);
        return true;
      }
    } else {
      console.log(`✅ Tabla '${tableName}' existe y es accesible`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Error probando tabla '${tableName}':`, err.message);
    return false;
  }
}

// Función para buscar tablas con nombres similares
async function findSimilarTables(baseName) {
  const variations = [
    baseName,
    baseName + 's', // plural
    baseName.slice(0, -1), // singular si termina en s
    baseName.replace('_', ''), // sin guiones bajos
    baseName.replace('_', '-'), // con guiones
    'tbl_' + baseName, // con prefijo tbl_
    'tab_' + baseName, // con prefijo tab_
  ];
  
  console.log(`🔍 Buscando variaciones de '${baseName}':`);
  
  for (const variation of variations) {
    if (variation !== baseName) {
      try {
        const { data, error } = await window.supabase
          .from(variation)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Encontrada variación: '${variation}'`);
        }
      } catch (err) {
        // Ignorar errores de tablas que no existen
      }
    }
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 Iniciando verificación de tablas...');
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of tablesToCheck) {
    const exists = await testTableExists(table);
    if (exists) {
      existingTables.push(table);
    } else {
      missingTables.push(table);
    }
  }
  
  console.log('\n📊 RESUMEN:');
  console.log('✅ Tablas existentes:', existingTables);
  console.log('❌ Tablas faltantes:', missingTables);
  
  // Buscar variaciones para las tablas faltantes
  for (const missingTable of missingTables) {
    await findSimilarTables(missingTable);
  }
  
  console.log('\n💡 RECOMENDACIONES:');
  if (missingTables.length > 0) {
    console.log('1. Verificar los nombres correctos de las tablas en la base de datos');
    console.log('2. Crear las tablas faltantes si es necesario');
    console.log('3. Actualizar las consultas para usar los nombres correctos');
  } else {
    console.log('✅ Todas las tablas necesarias existen');
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);
