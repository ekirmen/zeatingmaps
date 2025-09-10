// Script para testear la página API Explorer
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testApiExplorer() {
  log(`${colors.bold}${colors.blue}🧪 Testeando API Explorer${colors.reset}`);
  log('─'.repeat(50));

  // URLs a testear
  const urls = [
    {
      name: '🏠 Página Principal',
      url: `${API_BASE_URL}/`,
      expected: 'HTML'
    },
    {
      name: '📊 Dashboard',
      url: `${API_BASE_URL}/dashboard`,
      expected: 'HTML'
    },
    {
      name: '🔧 API Explorer',
      url: `${API_BASE_URL}/dashboard/saas/api-explorer`,
      expected: 'HTML'
    },
    {
      name: '🏢 Panel SaaS',
      url: `${API_BASE_URL}/dashboard/saas`,
      expected: 'HTML'
    }
  ];

  const results = {
    total: 0,
    working: 0,
    notWorking: 0
  };

  for (const item of urls) {
    try {
      results.total++;
      const response = await fetch(item.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'VeeEventos-Test/1.0'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      const isHtml = contentType.includes('text/html');

      if (response.ok) {
        if (isHtml) {
          log(`✅ ${item.name} - Status: ${response.status} - HTML`, 'green');
          results.working++;
        } else {
          log(`⚠️  ${item.name} - Status: ${response.status} - ${contentType}`, 'yellow');
          results.working++;
        }
      } else {
        log(`❌ ${item.name} - Status: ${response.status}`, 'red');
        results.notWorking++;
      }
    } catch (error) {
      log(`❌ ${item.name} - Error: ${error.message}`, 'red');
      results.notWorking++;
    }
  }

  // Resumen
  log(`\n${colors.bold}${colors.blue}📊 RESUMEN${colors.reset}`);
  log('═'.repeat(50));
  log(`Total de páginas testadas: ${results.total}`);
  log(`${colors.green}✅ Funcionando: ${results.working}${colors.reset}`);
  log(`${colors.red}❌ No funcionando: ${results.notWorking}${colors.reset}`);

  if (results.working > 0) {
    log(`\n${colors.green}🎉 La página API Explorer debería estar disponible en:${colors.reset}`);
    log(`${colors.blue}${API_BASE_URL}/dashboard/saas/api-explorer${colors.reset}`);
    log(`\n${colors.bold}📋 Para acceder:${colors.reset}`);
    log('1. Ve a tu aplicación: https://sistema.veneventos.com');
    log('2. Inicia sesión en el dashboard');
    log('3. Ve a Panel SaaS > API Explorer');
    log('4. Prueba los endpoints desde la interfaz');
  }

  return results;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testApiExplorer().catch(console.error);
}

module.exports = { testApiExplorer };
