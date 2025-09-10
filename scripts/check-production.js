// Script para verificar qué está disponible en producción
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

async function checkProduction() {
  console.log(`${colors.bold}${colors.blue}🔍 Verificando Estado de Producción${colors.reset}`);
  console.log(`${colors.blue}🌐 URL Base: ${API_BASE_URL}${colors.reset}\n`);

  // URLs a verificar
  const urlsToCheck = [
    { name: '🏠 Página Principal', url: `${API_BASE_URL}/` },
    { name: '📊 Dashboard', url: `${API_BASE_URL}/dashboard` },
    { name: '🛒 Store', url: `${API_BASE_URL}/store` },
    { name: '🎫 Boletería', url: `${API_BASE_URL}/boleteria` },
    { name: '🏢 SaaS', url: `${API_BASE_URL}/saas` },
    { name: '🔧 API Health', url: `${API_BASE_URL}/api/health` },
    { name: '🎭 API Events', url: `${API_BASE_URL}/api/events/list` },
    { name: '🎫 API Grid Sale', url: `${API_BASE_URL}/api/grid-sale/load-zonas` },
    { name: '🏢 API SaaS', url: `${API_BASE_URL}/api/saas/dashboard-stats` }
  ];

  const results = {
    pages: { total: 0, working: 0, notWorking: 0 },
    apis: { total: 0, working: 0, notWorking: 0 }
  };

  for (const item of urlsToCheck) {
    try {
      const response = await fetch(item.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'VeeEventos-Check/1.0'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      const isApi = item.url.includes('/api/');
      const isJson = contentType.includes('application/json');
      const isHtml = contentType.includes('text/html');

      if (response.ok) {
        if (isApi) {
          results.apis.total++;
          if (isJson) {
            console.log(`${colors.green}✅ ${item.name}${colors.reset} - Status: ${response.status} - JSON API`);
            results.apis.working++;
          } else if (isHtml) {
            console.log(`${colors.yellow}⚠️  ${item.name}${colors.reset} - Status: ${response.status} - HTML (No es API)`);
            results.apis.notWorking++;
          } else {
            console.log(`${colors.yellow}⚠️  ${item.name}${colors.reset} - Status: ${response.status} - ${contentType}`);
            results.apis.notWorking++;
          }
        } else {
          results.pages.total++;
          if (isHtml) {
            console.log(`${colors.green}✅ ${item.name}${colors.reset} - Status: ${response.status} - Página HTML`);
            results.pages.working++;
          } else {
            console.log(`${colors.yellow}⚠️  ${item.name}${colors.reset} - Status: ${response.status} - ${contentType}`);
            results.pages.working++;
          }
        }
      } else {
        if (isApi) {
          results.apis.total++;
          results.apis.notWorking++;
        } else {
          results.pages.total++;
          results.pages.notWorking++;
        }
        console.log(`${colors.red}❌ ${item.name}${colors.reset} - Status: ${response.status}`);
      }
    } catch (error) {
      if (item.url.includes('/api/')) {
        results.apis.total++;
        results.apis.notWorking++;
      } else {
        results.pages.total++;
        results.pages.notWorking++;
      }
      console.log(`${colors.red}❌ ${item.name}${colors.reset} - Error: ${error.message}`);
    }
  }

  // Resumen
  console.log(`\n${colors.bold}${colors.blue}📊 RESUMEN${colors.reset}`);
  console.log('═'.repeat(50));
  
  console.log(`${colors.bold}📄 Páginas Web:${colors.reset}`);
  console.log(`  Total: ${results.pages.total}`);
  console.log(`  ${colors.green}✅ Funcionando: ${results.pages.working}${colors.reset}`);
  console.log(`  ${colors.red}❌ No funcionando: ${results.pages.notWorking}${colors.reset}`);
  
  console.log(`\n${colors.bold}🔧 APIs:${colors.reset}`);
  console.log(`  Total: ${results.apis.total}`);
  console.log(`  ${colors.green}✅ Funcionando: ${results.apis.working}${colors.reset}`);
  console.log(`  ${colors.red}❌ No funcionando: ${results.apis.notWorking}${colors.reset}`);

  // Diagnóstico
  console.log(`\n${colors.bold}${colors.yellow}🔍 DIAGNÓSTICO${colors.reset}`);
  console.log('─'.repeat(50));

  if (results.pages.working > 0) {
    console.log(`${colors.green}✅ Tu aplicación web está funcionando correctamente${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Tu aplicación web no está respondiendo${colors.reset}`);
  }

  if (results.apis.working > 0) {
    console.log(`${colors.green}✅ Algunos endpoints de API están funcionando${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Los endpoints de API no están implementados aún${colors.reset}`);
    console.log(`${colors.blue}💡 Necesitas desplegar los endpoints que creamos${colors.reset}`);
  }

  // Próximos pasos
  console.log(`\n${colors.bold}${colors.blue}🚀 PRÓXIMOS PASOS${colors.reset}`);
  console.log('─'.repeat(50));

  if (results.apis.working === 0) {
    console.log(`${colors.yellow}1. Desplegar los endpoints de API a Vercel${colors.reset}`);
    console.log(`${colors.yellow}2. Configurar las variables de entorno${colors.reset}`);
    console.log(`${colors.yellow}3. Verificar que la base de datos esté configurada${colors.reset}`);
    console.log(`${colors.yellow}4. Ejecutar: npm run deploy:prod${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ Los endpoints están funcionando${colors.reset}`);
    console.log(`${colors.blue}💡 Puedes empezar a usar la API${colors.reset}`);
  }

  console.log(`\n${colors.bold}🔗 URLs Disponibles:${colors.reset}`);
  console.log(`• Aplicación: ${API_BASE_URL}`);
  console.log(`• Dashboard: ${API_BASE_URL}/dashboard`);
  console.log(`• Store: ${API_BASE_URL}/store`);
  console.log(`• Boletería: ${API_BASE_URL}/boleteria`);
  console.log(`• SaaS: ${API_BASE_URL}/saas`);

  return results;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkProduction().catch(console.error);
}

module.exports = { checkProduction };
