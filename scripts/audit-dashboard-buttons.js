// Script para auditar todos los botones del dashboard
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

// Lista de todas las rutas del dashboard para verificar
const dashboardRoutes = [
  // Actividad
  { name: '🏠 Dashboard Principal', path: '/dashboard', category: 'Actividad' },
  
  // Administración
  { name: '🏢 Recintos', path: '/dashboard/recintos', category: 'Administración' },
  { name: '🗺️ Plano', path: '/dashboard/plano', category: 'Administración' },
  { name: '👥 Usuarios', path: '/dashboard/usuarios', category: 'Administración' },
  { name: '💰 Liquidaciones', path: '/dashboard/liquidaciones', category: 'Administración' },
  
  // Programación
  { name: '🎫 Entradas', path: '/dashboard/entradas', category: 'Programación' },
  { name: '📦 Productos', path: '/dashboard/productos', category: 'Programación' },
  { name: '📋 Plantillas Productos', path: '/dashboard/plantillas-productos', category: 'Programación' },
  { name: '💝 Donaciones', path: '/dashboard/donaciones', category: 'Programación' },
  { name: '📊 Comisiones', path: '/dashboard/comisiones', category: 'Programación' },
  { name: '🛡️ Seguros', path: '/dashboard/seguros', category: 'Programación' },
  { name: '📦 Envío', path: '/dashboard/envio', category: 'Programación' },
  { name: '🎭 Eventos', path: '/dashboard/eventos', category: 'Programación' },
  { name: '💰 Plantillas Precios', path: '/dashboard/plantillas-precios', category: 'Programación' },
  { name: '🎪 Funciones', path: '/dashboard/funciones', category: 'Programación' },
  { name: '🎫 Cupos', path: '/dashboard/cupos', category: 'Programación' },
  { name: '📋 Plantillas Cupos', path: '/dashboard/plantillas-cupos', category: 'Programación' },
  { name: '🔄 Filas Virtuales', path: '/dashboard/filas-virtuales', category: 'Programación' },
  { name: '📦 Paquetes', path: '/dashboard/paquetes', category: 'Programación' },
  { name: '🎫 Multipase', path: '/dashboard/multipase', category: 'Programación' },
  { name: '💳 Abonos', path: '/dashboard/abonos', category: 'Programación' },
  { name: '📊 IVA', path: '/dashboard/iva', category: 'Programación' },
  { name: '🎟️ Descuentos', path: '/dashboard/descuentos', category: 'Programación' },
  
  // CRM
  { name: '📧 Mailchimp', path: '/dashboard/mailchimp', category: 'CRM' },
  { name: '📝 Formularios', path: '/dashboard/formularios', category: 'CRM' },
  { name: '🔔 Notificaciones', path: '/dashboard/notificaciones', category: 'CRM' },
  { name: '👤 FanID', path: '/dashboard/fanid', category: 'CRM' },
  { name: '📊 Encuestas', path: '/dashboard/encuestas', category: 'CRM' },
  { name: '📧 Email Campaigns', path: '/dashboard/email-campaigns', category: 'CRM' },
  { name: '🏷️ Tags', path: '/dashboard/tags', category: 'CRM' },
  
  // Acreditaciones
  { name: '🎖️ Accreditation Management', path: '/dashboard/accreditation-management', category: 'Acreditaciones' },
  { name: '🎖️ Accreditations', path: '/dashboard/accreditations', category: 'Acreditaciones' },
  
  // Promociones
  { name: '🎉 Promos', path: '/dashboard/promos', category: 'Promociones' },
  { name: '🎁 Gift Cards', path: '/dashboard/gift-cards', category: 'Promociones' },
  { name: '📧 Invitations', path: '/dashboard/invitations', category: 'Promociones' },
  { name: '👑 Loyalty Clubs', path: '/dashboard/loyalty-clubs', category: 'Promociones' },
  { name: '👥 Group Promotions', path: '/dashboard/group-promotions', category: 'Promociones' },
  
  // Informes
  { name: '📊 Reports', path: '/dashboard/reports', category: 'Informes' },
  { name: '⏰ Scheduled Reports', path: '/dashboard/scheduled-reports', category: 'Informes' },
  { name: '📧 Email Templates', path: '/dashboard/email-templates', category: 'Informes' },
  
  // Personalización
  { name: '🌐 Sites', path: '/dashboard/sites', category: 'Personalización' },
  { name: '🎫 Formato Entrada', path: '/dashboard/formato-entrada', category: 'Personalización' },
  { name: '📢 Banner Ads', path: '/dashboard/banner-ads', category: 'Personalización' },
  { name: '📄 Legal Texts', path: '/dashboard/legal-texts', category: 'Personalización' },
  { name: '🎨 Web Studio', path: '/dashboard/webstudio', category: 'Personalización' },
  { name: '📄 Pages', path: '/dashboard/pages', category: 'Personalización' },
  { name: '🖼️ Galería', path: '/dashboard/galeria', category: 'Personalización' },
  { name: '🎨 Web Colors', path: '/dashboard/webcolors', category: 'Personalización' },
  
  // Boletería
  { name: '🎫 Boletería', path: '/dashboard/boleteria', category: 'Boletería' },
  
  // Panel SaaS
  { name: '🏢 Dashboard SaaS', path: '/dashboard/saas', category: 'Panel SaaS' },
  { name: '⚙️ SaaS Settings', path: '/dashboard/saas/settings', category: 'Panel SaaS' },
  { name: '💳 SaaS Billing', path: '/dashboard/saas/billing', category: 'Panel SaaS' },
  { name: '💳 SaaS Payment Gateways', path: '/dashboard/saas/payment-gateways', category: 'Panel SaaS' },
  { name: '👥 SaaS Roles', path: '/dashboard/saas/roles', category: 'Panel SaaS' },
  { name: '🧪 API Explorer', path: '/dashboard/saas/api-explorer', category: 'Panel SaaS' },
  
  // Configuración
  { name: '⚙️ Settings', path: '/dashboard/settings', category: 'Configuración' },
  { name: '🪑 Seat Settings', path: '/dashboard/seat-settings', category: 'Configuración' },
  { name: '🖨️ Printer Settings', path: '/dashboard/printer-settings', category: 'Configuración' },
  { name: '📧 Email Config', path: '/dashboard/email-config', category: 'Configuración' },
  { name: '📋 Audit Logs', path: '/dashboard/audit-logs', category: 'Configuración' },
  { name: '💸 Refund Management', path: '/dashboard/refund-management', category: 'Configuración' },
  { name: '📊 Payment Analytics', path: '/dashboard/payment-analytics', category: 'Configuración' },
  { name: '💳 Payment Gateways', path: '/dashboard/payment-gateways', category: 'Configuración' }
];

async function testRoute(route) {
  try {
    const url = `${API_BASE_URL}${route.path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'VeeEventos-Dashboard-Audit/1.0'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    const isJson = contentType.includes('application/json');

    return {
      ...route,
      status: response.status,
      success: response.ok,
      contentType: contentType,
      isHtml: isHtml,
      isJson: isJson,
      working: response.ok && isHtml
    };
  } catch (error) {
    return {
      ...route,
      status: 0,
      success: false,
      contentType: 'error',
      isHtml: false,
      isJson: false,
      working: false,
      error: error.message
    };
  }
}

async function auditDashboardButtons() {
  log(`${colors.bold}${colors.blue}🔍 Auditoría de Botones del Dashboard${colors.reset}`);
  log('─'.repeat(60));
  log(`🌐 URL Base: ${API_BASE_URL}`);
  log(`📊 Total de rutas a verificar: ${dashboardRoutes.length}\n`);

  const results = {
    total: 0,
    working: 0,
    notWorking: 0,
    byCategory: {},
    errors: []
  };

  // Agrupar por categoría
  const categories = [...new Set(dashboardRoutes.map(route => route.category))];
  
  for (const category of categories) {
    const categoryRoutes = dashboardRoutes.filter(route => route.category === category);
    results.byCategory[category] = {
      total: categoryRoutes.length,
      working: 0,
      notWorking: 0,
      routes: []
    };

    log(`${colors.bold}${colors.yellow}📂 ${category}${colors.reset}`);
    log('─'.repeat(40));

    for (const route of categoryRoutes) {
      results.total++;
      const result = await testRoute(route);
      results.byCategory[category].routes.push(result);

      if (result.working) {
        results.working++;
        results.byCategory[category].working++;
        log(`✅ ${result.name} - Status: ${result.status}`, 'green');
      } else {
        results.notWorking++;
        results.byCategory[category].notWorking++;
        if (result.error) {
          log(`❌ ${result.name} - Error: ${result.error}`, 'red');
          results.errors.push({ route: result.name, error: result.error });
        } else {
          log(`❌ ${result.name} - Status: ${result.status} - ${result.contentType}`, 'red');
          results.errors.push({ route: result.name, status: result.status, contentType: result.contentType });
        }
      }

      // Pequeña pausa para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    log('');
  }

  // Resumen por categoría
  log(`${colors.bold}${colors.blue}📊 RESUMEN POR CATEGORÍA${colors.reset}`);
  log('═'.repeat(60));

  for (const [category, data] of Object.entries(results.byCategory)) {
    const successRate = ((data.working / data.total) * 100).toFixed(1);
    const statusColor = successRate >= 80 ? 'green' : successRate >= 50 ? 'yellow' : 'red';
    
    log(`${colors.bold}${category}:${colors.reset}`);
    log(`  Total: ${data.total} | ${colors.green}✅ Funcionando: ${data.working}${colors.reset} | ${colors.red}❌ No funcionando: ${data.notWorking}${colors.reset} | ${colors[statusColor]}📈 Tasa de éxito: ${successRate}%${colors.reset}`);
    
    // Mostrar rutas que no funcionan
    const brokenRoutes = data.routes.filter(route => !route.working);
    if (brokenRoutes.length > 0) {
      log(`  ${colors.red}❌ Rutas problemáticas:${colors.reset}`);
      brokenRoutes.forEach(route => {
        log(`    • ${route.name} (${route.path}) - Status: ${route.status}`);
      });
    }
    log('');
  }

  // Resumen general
  log(`${colors.bold}${colors.blue}📊 RESUMEN GENERAL${colors.reset}`);
  log('═'.repeat(60));
  log(`Total de rutas verificadas: ${results.total}`);
  log(`${colors.green}✅ Funcionando: ${results.working}${colors.reset}`);
  log(`${colors.red}❌ No funcionando: ${results.notWorking}${colors.reset}`);
  
  const overallSuccessRate = ((results.working / results.total) * 100).toFixed(1);
  log(`${colors.bold}📈 Tasa de éxito general: ${overallSuccessRate}%${colors.reset}`);

  // Top 10 rutas problemáticas
  if (results.errors.length > 0) {
    log(`\n${colors.bold}${colors.red}🚨 TOP 10 RUTAS PROBLEMÁTICAS${colors.reset}`);
    log('─'.repeat(60));
    
    const topErrors = results.errors.slice(0, 10);
    topErrors.forEach((error, index) => {
      log(`${index + 1}. ${error.route}`);
      if (error.error) {
        log(`   Error: ${error.error}`);
      } else {
        log(`   Status: ${error.status} - Content-Type: ${error.contentType}`);
      }
      log('');
    });
  }

  // Recomendaciones
  log(`${colors.bold}${colors.yellow}💡 RECOMENDACIONES${colors.reset}`);
  log('─'.repeat(60));
  
  if (results.notWorking > 0) {
    log('1. Revisa las rutas que devuelven 404 (no encontradas)');
    log('2. Verifica las rutas que devuelven 500 (error interno)');
    log('3. Comprueba que los componentes estén correctamente importados');
    log('4. Revisa las rutas en BackofficeApp.jsx');
    log('5. Verifica que los archivos de componentes existan');
  } else {
    log('🎉 ¡Todas las rutas están funcionando correctamente!');
  }

  log(`\n${colors.bold}🔗 Dashboard disponible en: ${API_BASE_URL}/dashboard${colors.reset}`);
  
  return results;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  auditDashboardButtons().catch(console.error);
}

module.exports = { auditDashboardButtons };
