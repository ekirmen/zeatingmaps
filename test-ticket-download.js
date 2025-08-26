#!/usr/bin/env node

/**
 * Script de prueba para verificar la funcionalidad de descarga de tickets
 * 
 * Uso:
 * node test-ticket-download.js [URL_BASE] [LOCATOR]
 * 
 * Ejemplo:
 * node test-ticket-download.js https://tu-app.vercel.app TEST123
 */

const https = require('https');
const fs = require('fs');

// Configuración por defecto
const DEFAULT_BASE_URL = 'https://tu-app.vercel.app';
const DEFAULT_LOCATOR = 'TEST123';

// Obtener parámetros de línea de comandos
const baseUrl = process.argv[2] || DEFAULT_BASE_URL;
const locator = process.argv[3] || DEFAULT_LOCATOR;

console.log('🧪 Probando funcionalidad de descarga de tickets...');
console.log(`📍 URL Base: ${baseUrl}`);
console.log(`🔑 Localizador: ${locator}`);
console.log('');

// Función para hacer peticiones HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función para probar endpoint de diagnóstico
async function testDiagnostic() {
  console.log('🔍 Probando endpoint de diagnóstico...');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/payments/${locator}/diagnostic`);
    
    if (response.statusCode === 200) {
      console.log('✅ Endpoint de diagnóstico funcionando');
      const diagnostic = JSON.parse(response.data);
      
      if (diagnostic.status === 'healthy') {
        console.log('✅ Configuración saludable');
        console.log(`   - Supabase URL: ${diagnostic.environmentVariables.supabaseUrl.present ? '✅' : '❌'}`);
        console.log(`   - Service Key: ${diagnostic.environmentVariables.supabaseServiceKey.present ? '✅' : '❌'}`);
      } else {
        console.log('❌ Configuración con problemas');
        console.log('   Recomendaciones:');
        diagnostic.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
    } else {
      console.log(`❌ Error en diagnóstico: ${response.statusCode}`);
      console.log(response.data);
    }
  } catch (error) {
    console.log(`❌ Error conectando al endpoint de diagnóstico: ${error.message}`);
  }
  
  console.log('');
}

// Función para probar descarga simple
async function testSimpleDownload() {
  console.log('📄 Probando descarga simple (sin autenticación)...');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/payments/${locator}/download?mode=simple`);
    
    if (response.statusCode === 200) {
      console.log('✅ Descarga simple funcionando');
      console.log(`   - Content-Type: ${response.headers['content-type']}`);
      console.log(`   - Content-Length: ${response.headers['content-length']} bytes`);
      console.log(`   - Filename: ${response.headers['content-disposition']}`);
      
      // Verificar que sea un PDF
      if (response.data.startsWith('%PDF')) {
        console.log('✅ Archivo PDF válido generado');
        
        // Guardar archivo de prueba
        const filename = `ticket-prueba-${locator}.pdf`;
        fs.writeFileSync(filename, response.data);
        console.log(`💾 PDF guardado como: ${filename}`);
      } else {
        console.log('❌ El archivo no parece ser un PDF válido');
        console.log(`   Primeros bytes: ${response.data.substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ Error en descarga simple: ${response.statusCode}`);
      console.log(response.data);
    }
  } catch (error) {
    console.log(`❌ Error en descarga simple: ${error.message}`);
  }
  
  console.log('');
}

// Función para probar descarga completa (sin token)
async function testFullDownload() {
  console.log('🎫 Probando descarga completa (sin token - debería fallar)...');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/payments/${locator}/download`);
    
    if (response.statusCode === 401) {
      console.log('✅ Seguridad funcionando correctamente (401 Unauthorized)');
    } else if (response.statusCode === 200) {
      console.log('⚠️  Descarga completa funcionó sin autenticación (posible problema de seguridad)');
    } else {
      console.log(`ℹ️  Respuesta inesperada: ${response.statusCode}`);
      console.log(response.data);
    }
  } catch (error) {
    console.log(`❌ Error en descarga completa: ${error.message}`);
  }
  
  console.log('');
}

// Función para probar endpoint de prueba
async function testTestEndpoint() {
  console.log('🧪 Probando endpoint de prueba...');
  
  try {
    const response = await makeRequest(`${baseUrl}/api/payments/${locator}/test`);
    
    if (response.statusCode === 200) {
      console.log('✅ Endpoint de prueba funcionando');
      const testData = JSON.parse(response.data);
      console.log(`   - Estado: ${testData.healthCheck?.server || 'N/A'}`);
      console.log(`   - Entorno: ${testData.healthCheck?.environment || 'N/A'}`);
    } else {
      console.log(`❌ Error en endpoint de prueba: ${response.statusCode}`);
      console.log(response.data);
    }
  } catch (error) {
    console.log(`❌ Error en endpoint de prueba: ${error.message}`);
  }
  
  console.log('');
}

// Función principal
async function runTests() {
  console.log('🚀 Iniciando pruebas de funcionalidad...\n');
  
  // Ejecutar pruebas en secuencia
  await testDiagnostic();
  await testTestEndpoint();
  await testSimpleDownload();
  await testFullDownload();
  
  console.log('✨ Pruebas completadas');
  console.log('');
  console.log('📋 Resumen:');
  console.log('   - Si todas las pruebas pasan, la funcionalidad está funcionando correctamente');
  console.log('   - Si hay errores, verifica la configuración en Vercel');
  console.log('   - Usa el endpoint de diagnóstico para más detalles');
  console.log('');
  console.log('🔗 URLs probadas:');
  console.log(`   - Diagnóstico: ${baseUrl}/api/payments/${locator}/diagnostic`);
  console.log(`   - Prueba: ${baseUrl}/api/payments/${locator}/test`);
  console.log(`   - Descarga simple: ${baseUrl}/api/payments/${locator}/download?mode=simple`);
  console.log(`   - Descarga completa: ${baseUrl}/api/payments/${locator}/download`);
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error);
  process.exit(1);
});
