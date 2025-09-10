// Script para desplegar a Vercel
const { execSync } = require('child_process');
const fs = require('fs');
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function installVercelCLI() {
  log('📦 Instalando Vercel CLI...', 'yellow');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    log('✅ Vercel CLI instalado correctamente', 'green');
    return true;
  } catch (error) {
    log('❌ Error instalando Vercel CLI', 'red');
    return false;
  }
}

function buildProject() {
  log('🔨 Construyendo proyecto...', 'yellow');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Proyecto construido correctamente', 'green');
    return true;
  } catch (error) {
    log('❌ Error construyendo el proyecto', 'red');
    return false;
  }
}

function deployToVercel() {
  log('🚀 Desplegando a Vercel...', 'yellow');
  try {
    // Verificar si ya está configurado
    const vercelConfig = path.join(process.cwd(), '.vercel');
    if (!fs.existsSync(vercelConfig)) {
      log('⚙️  Configurando Vercel por primera vez...', 'blue');
      execSync('vercel --yes', { stdio: 'inherit' });
    } else {
      log('🔄 Actualizando despliegue existente...', 'blue');
      execSync('vercel --prod', { stdio: 'inherit' });
    }
    log('✅ Despliegue completado', 'green');
    return true;
  } catch (error) {
    log('❌ Error en el despliegue', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function testEndpoints() {
  log('🧪 Testeando endpoints...', 'yellow');
  try {
    execSync('npm run test:production', { stdio: 'inherit' });
    return true;
  } catch (error) {
    log('⚠️  Algunos tests fallaron, pero el despliegue puede estar funcionando', 'yellow');
    return false;
  }
}

async function main() {
  log(`${colors.bold}${colors.blue}🚀 Deploy de VeeEventos a Vercel${colors.reset}`);
  log('─'.repeat(50));

  // 1. Verificar Vercel CLI
  log('1️⃣ Verificando Vercel CLI...', 'blue');
  if (!checkVercelCLI()) {
    log('Vercel CLI no está instalado', 'yellow');
    if (!installVercelCLI()) {
      log('❌ No se pudo instalar Vercel CLI. Instálalo manualmente:', 'red');
      log('npm install -g vercel', 'yellow');
      return;
    }
  } else {
    log('✅ Vercel CLI está disponible', 'green');
  }

  // 2. Construir proyecto
  log('\n2️⃣ Construyendo proyecto...', 'blue');
  if (!buildProject()) {
    log('❌ No se pudo construir el proyecto', 'red');
    return;
  }

  // 3. Desplegar
  log('\n3️⃣ Desplegando a Vercel...', 'blue');
  if (!deployToVercel()) {
    log('❌ No se pudo desplegar', 'red');
    return;
  }

  // 4. Testear endpoints
  log('\n4️⃣ Testeando endpoints...', 'blue');
  testEndpoints();

  log(`\n${colors.bold}${colors.green}🎉 Deploy completado!${colors.reset}`);
  log(`\n${colors.bold}🔗 URLs disponibles:${colors.reset}`);
  log('• Aplicación: https://sistema.veneventos.com');
  log('• Dashboard: https://sistema.veneventos.com/dashboard');
  log('• Store: https://sistema.veneventos.com/store');
  log('• Boletería: https://sistema.veneventos.com/boleteria');
  log('• SaaS: https://sistema.veneventos.com/saas');
  
  log(`\n${colors.bold}🧪 Para testear los endpoints:${colors.reset}`);
  log('npm run test:production');
  log('npm run check:production');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
