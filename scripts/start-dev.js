// Script para arrancar el servidor de desarrollo y testear endpoints
const { spawn } = require('child_process');
const path = require('path');

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}🚀 Iniciando VeeEventos en modo desarrollo${colors.reset}\n`);

// Verificar si Next.js está instalado
const fs = require('fs');
const packageJsonPath = path.join(process.cwd(), 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.log(`${colors.red}❌ No se encontró package.json. Asegúrate de estar en el directorio correcto.${colors.reset}`);
  process.exit(1);
}

// Leer package.json para verificar scripts
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts || !packageJson.scripts.dev) {
  console.log(`${colors.red}❌ No se encontró script 'dev' en package.json${colors.reset}`);
  console.log(`${colors.yellow}💡 Agrega este script a tu package.json:${colors.reset}`);
  console.log(`${colors.blue}"dev": "next dev"${colors.reset}`);
  process.exit(1);
}

// Función para mostrar URLs útiles
function showUsefulUrls() {
  console.log(`\n${colors.bold}${colors.green}🌐 URLs Útiles:${colors.reset}`);
  console.log('─'.repeat(50));
  console.log(`${colors.blue}• Aplicación principal:${colors.reset} http://localhost:3000`);
  console.log(`${colors.blue}• Dashboard:${colors.reset} http://localhost:3000/dashboard`);
  console.log(`${colors.blue}• Store:${colors.reset} http://localhost:3000/store`);
  console.log(`${colors.blue}• Boletería:${colors.reset} http://localhost:3000/boleteria`);
  console.log(`${colors.blue}• SaaS:${colors.reset} http://localhost:3000/saas`);
  console.log(`\n${colors.bold}${colors.yellow}🔗 Endpoints de API:${colors.reset}`);
  console.log('─'.repeat(50));
  console.log(`${colors.blue}• Grid Sale:${colors.reset} http://localhost:3000/api/grid-sale/`);
  console.log(`${colors.blue}• Events:${colors.reset} http://localhost:3000/api/events/`);
  console.log(`${colors.blue}• SaaS:${colors.reset} http://localhost:3000/api/saas/`);
  console.log(`${colors.blue}• Analytics:${colors.reset} http://localhost:3000/api/analytics/`);
  console.log(`${colors.blue}• Payment:${colors.reset} http://localhost:3000/api/payment/`);
  console.log(`\n${colors.bold}${colors.yellow}🧪 Comandos de Testing:${colors.reset}`);
  console.log('─'.repeat(50));
  console.log(`${colors.blue}• Test endpoints:${colors.reset} node scripts/test-endpoints.js`);
  console.log(`${colors.blue}• Test específico:${colors.reset} curl http://localhost:3000/api/events/list?tenant_id=test`);
  console.log(`${colors.blue}• Logs de Vercel:${colors.reset} vercel logs`);
  console.log(`\n${colors.bold}${colors.yellow}📋 Próximos pasos:${colors.reset}`);
  console.log('─'.repeat(50));
  console.log('1. Verifica que el servidor esté funcionando');
  console.log('2. Ejecuta: node scripts/test-endpoints.js');
  console.log('3. Revisa los logs para errores');
  console.log('4. Configura las variables de entorno si es necesario');
  console.log(`\n${colors.bold}${colors.green}✅ Servidor iniciado correctamente!${colors.reset}\n`);
}

// Función para testear endpoints básicos
async function testBasicEndpoints() {
  console.log(`${colors.bold}${colors.yellow}🧪 Testeando endpoints básicos...${colors.reset}`);
  
  try {
    // Esperar un poco para que el servidor arranque
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const { testEndpoint } = require('./test-endpoints');
    
    // Test básico de salud
    const healthTest = await testEndpoint(
      'Health Check',
      'GET',
      'http://localhost:3000/api/health'
    );
    
    if (healthTest.success) {
      console.log(`${colors.green}✅ Servidor respondiendo correctamente${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Servidor iniciado pero algunos endpoints pueden no estar listos${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.yellow}⚠️  No se pudo testear endpoints automáticamente: ${error.message}${colors.reset}`);
  }
}

// Iniciar el servidor de desarrollo
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true,
  cwd: process.cwd()
});

// Mostrar output del servidor
devProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Mostrar output importante
  if (output.includes('ready') || output.includes('started')) {
    console.log(`${colors.green}${output}${colors.reset}`);
    showUsefulUrls();
    
    // Testear endpoints después de que el servidor esté listo
    setTimeout(testBasicEndpoints, 2000);
  } else if (output.includes('error') || output.includes('Error')) {
    console.log(`${colors.red}${output}${colors.reset}`);
  } else {
    console.log(output);
  }
});

devProcess.stderr.on('data', (data) => {
  console.log(`${colors.red}${data}${colors.reset}`);
});

// Manejar cierre del proceso
devProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`${colors.red}❌ El servidor se cerró con código ${code}${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ Servidor cerrado correctamente${colors.reset}`);
  }
});

// Manejar interrupciones
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}🛑 Cerrando servidor...${colors.reset}`);
  devProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}🛑 Cerrando servidor...${colors.reset}`);
  devProcess.kill('SIGTERM');
  process.exit(0);
});

// Mostrar mensaje inicial
console.log(`${colors.bold}${colors.blue}🔧 Configurando servidor de desarrollo...${colors.reset}`);
console.log(`${colors.yellow}💡 Presiona Ctrl+C para detener el servidor${colors.reset}\n`);
