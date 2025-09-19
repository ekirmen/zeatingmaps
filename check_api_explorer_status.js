/**
 * Script para verificar el estado del API Explorer y políticas RLS
 * Ejecutar en la consola del navegador en tu aplicación
 */

console.log('🔍 VERIFICANDO ESTADO DEL API EXPLORER Y RLS');
console.log('==============================================');

// 1. Verificar URL del proyecto
const projectUrl = 'https://szmyqodwwdwzdodzebcp.supabase.co';
console.log('📍 URL del Proyecto:', projectUrl);

// 2. Verificar API Explorer
const apiExplorerUrl = `${projectUrl}/api/explorer`;
console.log('🔧 API Explorer URL:', apiExplorerUrl);

// 3. Verificar endpoints principales
const endpoints = [
  '/rest/v1/tenants',
  '/rest/v1/profiles', 
  '/rest/v1/eventos',
  '/rest/v1/funciones',
  '/rest/v1/recintos',
  '/rest/v1/salas',
  '/rest/v1/mapas',
  '/rest/v1/zonas',
  '/rest/v1/seat_locks'
];

console.log('\n📋 ENDPOINTS A VERIFICAR:');
endpoints.forEach(endpoint => {
  console.log(`  • ${projectUrl}${endpoint}`);
});

// 4. Función para probar endpoint
async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${projectUrl}${endpoint}?select=*&limit=1`, {
      headers: {
        'apikey': 'tu-anon-key-aqui', // Reemplazar con tu anon key
        'Authorization': 'Bearer tu-anon-key-aqui' // Reemplazar con tu anon key
      }
    });
    
    console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
    return { endpoint, status: response.status, success: response.ok };
  } catch (error) {
    console.log(`❌ ${endpoint}: Error - ${error.message}`);
    return { endpoint, status: 'ERROR', success: false, error: error.message };
  }
}

// 5. Función para verificar políticas RLS
async function checkRLSPolicies() {
  console.log('\n🔒 VERIFICANDO POLÍTICAS RLS:');
  
  const tables = ['tenants', 'profiles', 'eventos', 'funciones', 'recintos'];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${projectUrl}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': 'tu-anon-key-aqui', // Reemplazar
          'Authorization': 'Bearer tu-anon-key-aqui' // Reemplazar
        }
      });
      
      if (response.ok) {
        console.log(`✅ ${table}: Acceso permitido (${response.status})`);
      } else if (response.status === 403) {
        console.log(`🔒 ${table}: Acceso denegado - RLS activo (${response.status})`);
      } else if (response.status === 500) {
        console.log(`⚠️ ${table}: Error interno - Revisar políticas (${response.status})`);
      } else {
        console.log(`❓ ${table}: Estado inesperado (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Error de conexión - ${error.message}`);
    }
  }
}

// 6. Instrucciones de uso
console.log('\n📖 INSTRUCCIONES DE USO:');
console.log('1. Abre tu aplicación en el navegador');
console.log('2. Abre las herramientas de desarrollador (F12)');
console.log('3. Ve a la pestaña Console');
console.log('4. Copia y pega este script');
console.log('5. Reemplaza "tu-anon-key-aqui" con tu anon key real');
console.log('6. Ejecuta: testEndpoint("/rest/v1/tenants")');
console.log('7. Ejecuta: checkRLSPolicies()');

// 7. Función de prueba rápida
window.testAPI = async function() {
  console.log('\n🧪 INICIANDO PRUEBAS DE API...');
  
  const results = [];
  for (const endpoint of endpoints.slice(0, 3)) { // Probar solo los primeros 3
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('\n📊 RESULTADOS:');
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.endpoint}: ${result.status}`);
  });
  
  return results;
};

console.log('\n🚀 Para ejecutar pruebas rápidas, usa: testAPI()');
console.log('🔍 Para verificar RLS, usa: checkRLSPolicies()');
