// Test rápido de endpoints principales
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

async function quickTest() {
  console.log(`${colors.bold}${colors.blue}⚡ Test Rápido de Endpoints Principales${colors.reset}\n`);

  const tests = [
    {
      name: '🏥 Health Check',
      url: `${API_BASE_URL}/api/health`,
      method: 'GET'
    },
    {
      name: '🎭 List Events',
      url: `${API_BASE_URL}/api/events/list?tenant_id=test&limit=5`,
      method: 'GET'
    },
    {
      name: '🎫 Grid Sale - Load Zonas',
      url: `${API_BASE_URL}/api/grid-sale/load-zonas`,
      method: 'POST',
      body: { evento: { recinto: 67, sala: 52 } }
    },
    {
      name: '🏢 SaaS Dashboard Stats',
      url: `${API_BASE_URL}/api/saas/dashboard-stats?tenant_id=test&period=7d`,
      method: 'GET'
    },
    {
      name: '📊 Sales Report',
      url: `${API_BASE_URL}/api/analytics/sales-report?tenant_id=test&start_date=2024-01-01&end_date=2024-01-31`,
      method: 'GET'
    },
    {
      name: '💳 Test Stripe',
      url: `${API_BASE_URL}/api/payment/test-stripe-connection`,
      method: 'POST',
      body: { test: true }
    },
    {
      name: '👥 List Clients',
      url: `${API_BASE_URL}/api/clients/list?tenant_id=test&limit=5`,
      method: 'GET'
    },
    {
      name: '🏟️ List Venues',
      url: `${API_BASE_URL}/api/venues/list?tenant_id=test`,
      method: 'GET'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();

      if (response.ok) {
        console.log(`${colors.green}✅ ${test.name}${colors.reset} - Status: ${response.status}`);
        passed++;
      } else {
        console.log(`${colors.red}❌ ${test.name}${colors.reset} - Status: ${response.status} - ${data.message || 'Error'}`);
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}❌ ${test.name}${colors.reset} - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${colors.bold}${colors.blue}📊 Resumen:${colors.reset}`);
  console.log(`${colors.green}✅ Exitosos: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Fallidos: ${failed}${colors.reset}`);
  console.log(`${colors.bold}Total: ${passed + failed}${colors.reset}`);

  if (failed > 0) {
    console.log(`\n${colors.yellow}💡 Consejos:${colors.reset}`);
    console.log('• Asegúrate de que el servidor esté corriendo: npm run dev');
    console.log('• Verifica las variables de entorno');
    console.log('• Revisa los logs del servidor');
    console.log('• Algunos endpoints pueden fallar si no hay datos en la BD');
  }

  console.log(`\n${colors.bold}${colors.blue}🔗 URLs para probar manualmente:${colors.reset}`);
  console.log('• http://localhost:3000/dashboard');
  console.log('• http://localhost:3000/store');
  console.log('• http://localhost:3000/boleteria');
  console.log('• http://localhost:3000/saas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  quickTest().catch(console.error);
}

module.exports = { quickTest };
