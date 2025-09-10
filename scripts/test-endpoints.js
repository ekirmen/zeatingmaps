// Script para testear todos los endpoints
const API_BASE_URL = 'https://sistema.veneventos.com';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Función para hacer requests
async function testEndpoint(name, method, url, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`${colors.green}✅ ${name}${colors.reset} - Status: ${response.status}`);
      return { success: true, data };
    } else {
      console.log(`${colors.red}❌ ${name}${colors.reset} - Status: ${response.status} - Error: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${name}${colors.reset} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Función principal de testing
async function testAllEndpoints() {
  console.log(`${colors.bold}${colors.blue}🚀 Iniciando test de endpoints de VeeEventos${colors.reset}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // 1. Test de Grid Sale
  console.log(`${colors.bold}${colors.yellow}📋 1. Testing Grid Sale Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const gridLoad = await testEndpoint(
    'Load Zonas',
    'POST',
    `${API_BASE_URL}/api/grid-sale/load-zonas`,
    { evento: { recinto: 67, sala: 52 } }
  );
  if (gridLoad.success) results.passed++; else results.failed++;

  results.total++;
  const gridValidate = await testEndpoint(
    'Validate Sale',
    'POST',
    `${API_BASE_URL}/api/grid-sale/validate-sale`,
    {
      items: [{ zona_id: 22, precio: 10, cantidad: 2 }],
      evento: { id: 'test-event' },
      funcion: { id: 'test-function' }
    }
  );
  if (gridValidate.success) results.passed++; else results.failed++;

  // 2. Test de Events
  console.log(`\n${colors.bold}${colors.yellow}🎭 2. Testing Events Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const eventsList = await testEndpoint(
    'List Events',
    'GET',
    `${API_BASE_URL}/api/events/list?tenant_id=test&limit=10`
  );
  if (eventsList.success) results.passed++; else results.failed++;

  results.total++;
  const eventBySlug = await testEndpoint(
    'Get Event by Slug',
    'GET',
    `${API_BASE_URL}/api/events/get-by-slug?slug=test-event`
  );
  if (eventBySlug.success) results.passed++; else results.failed++;

  // 3. Test de SaaS
  console.log(`\n${colors.bold}${colors.yellow}🏢 3. Testing SaaS Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const dashboardStats = await testEndpoint(
    'Dashboard Stats',
    'GET',
    `${API_BASE_URL}/api/saas/dashboard-stats?tenant_id=test&period=30d`
  );
  if (dashboardStats.success) results.passed++; else results.failed++;

  results.total++;
  const userManagement = await testEndpoint(
    'User Management',
    'GET',
    `${API_BASE_URL}/api/saas/user-management?tenant_id=test&limit=10`
  );
  if (userManagement.success) results.passed++; else results.failed++;

  // 4. Test de Analytics
  console.log(`\n${colors.bold}${colors.yellow}📊 4. Testing Analytics Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const salesReport = await testEndpoint(
    'Sales Report',
    'GET',
    `${API_BASE_URL}/api/analytics/sales-report?tenant_id=test&start_date=2024-01-01&end_date=2024-01-31`
  );
  if (salesReport.success) results.passed++; else results.failed++;

  // 5. Test de Payment
  console.log(`\n${colors.bold}${colors.yellow}💳 5. Testing Payment Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const testStripe = await testEndpoint(
    'Test Stripe Connection',
    'POST',
    `${API_BASE_URL}/api/payment/test-stripe-connection`,
    { test: true }
  );
  if (testStripe.success) results.passed++; else results.failed++;

  results.total++;
  const testPayPal = await testEndpoint(
    'Test PayPal Connection',
    'POST',
    `${API_BASE_URL}/api/payment/test-paypal-connection`,
    { test: true }
  );
  if (testPayPal.success) results.passed++; else results.failed++;

  // 6. Test de Functions
  console.log(`\n${colors.bold}${colors.yellow}🎪 6. Testing Functions Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const functionsList = await testEndpoint(
    'List Functions',
    'GET',
    `${API_BASE_URL}/api/functions/list?evento_id=test`
  );
  if (functionsList.success) results.passed++; else results.failed++;

  // 7. Test de Zones
  console.log(`\n${colors.bold}${colors.yellow}🎯 7. Testing Zones Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const zonesList = await testEndpoint(
    'List Zones',
    'GET',
    `${API_BASE_URL}/api/zones/list?sala_id=52`
  );
  if (zonesList.success) results.passed++; else results.failed++;

  // 8. Test de Sales
  console.log(`\n${colors.bold}${colors.yellow}💰 8. Testing Sales Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const salesList = await testEndpoint(
    'List Sales',
    'GET',
    `${API_BASE_URL}/api/sales/list?tenant_id=test&limit=10`
  );
  if (salesList.success) results.passed++; else results.failed++;

  // 9. Test de Clients
  console.log(`\n${colors.bold}${colors.yellow}👥 9. Testing Clients Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const clientsList = await testEndpoint(
    'List Clients',
    'GET',
    `${API_BASE_URL}/api/clients/list?tenant_id=test&limit=10`
  );
  if (clientsList.success) results.passed++; else results.failed++;

  results.total++;
  const clientsSearch = await testEndpoint(
    'Search Clients',
    'GET',
    `${API_BASE_URL}/api/clients/search?q=test&tenant_id=test`
  );
  if (clientsSearch.success) results.passed++; else results.failed++;

  // 10. Test de Venues
  console.log(`\n${colors.bold}${colors.yellow}🏟️ 10. Testing Venues Endpoints${colors.reset}`);
  console.log('─'.repeat(50));

  results.total++;
  const venuesList = await testEndpoint(
    'List Venues',
    'GET',
    `${API_BASE_URL}/api/venues/list?tenant_id=test`
  );
  if (venuesList.success) results.passed++; else results.failed++;

  // Resumen final
  console.log(`\n${colors.bold}${colors.blue}📊 RESUMEN DE TESTS${colors.reset}`);
  console.log('═'.repeat(50));
  console.log(`${colors.bold}Total de endpoints testados: ${results.total}${colors.reset}`);
  console.log(`${colors.green}✅ Exitosos: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Fallidos: ${results.failed}${colors.reset}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`${colors.bold}Tasa de éxito: ${successRate}%${colors.reset}`);

  if (results.failed > 0) {
    console.log(`\n${colors.yellow}⚠️  Algunos endpoints fallaron. Esto puede ser normal si:${colors.reset}`);
    console.log('• No hay datos en la base de datos');
    console.log('• Las tablas no existen aún');
    console.log('• Los endpoints están en desarrollo');
    console.log('• Hay problemas de configuración');
  }

  console.log(`\n${colors.bold}${colors.blue}🎉 Test completado!${colors.reset}`);
  console.log(`\nPara más detalles, revisa los logs de Vercel:`);
  console.log(`${colors.blue}vercel logs${colors.reset}`);
  
  return results;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAllEndpoints().catch(console.error);
}

module.exports = { testAllEndpoints, testEndpoint };
