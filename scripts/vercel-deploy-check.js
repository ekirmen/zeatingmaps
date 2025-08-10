#!/usr/bin/env node

/**
 * Script de verificación pre-despliegue para Vercel
 * Verifica que la aplicación esté lista para ser desplegada
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando preparación para Vercel...\n');

let allChecksPassed = true;

// 1. Verificar que no existe server.js
console.log('1️⃣ Verificando que no existe server.js...');
if (fs.existsSync('server.js')) {
  console.log('   ❌ server.js aún existe - debe ser eliminado');
  allChecksPassed = false;
} else {
  console.log('   ✅ server.js eliminado correctamente');
}

// 2. Verificar que existen las API routes necesarias
console.log('\n2️⃣ Verificando API routes...');
const requiredApiRoutes = [
  'api/mapas/[salaId]/index.js',
  'api/mapas/[salaId]/save.js',
  'api/zonas/index.js'
];

requiredApiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    console.log(`   ✅ ${route} existe`);
  } else {
    console.log(`   ❌ ${route} no existe`);
    allChecksPassed = false;
  }
});

// 3. Verificar vercel.json
console.log('\n3️⃣ Verificando vercel.json...');
if (fs.existsSync('vercel.json')) {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.functions && vercelConfig.functions['api/**/*.js']) {
    console.log('   ✅ vercel.json configurado para API routes');
  } else {
    console.log('   ❌ vercel.json no tiene configuración de API routes');
    allChecksPassed = false;
  }
} else {
  console.log('   ❌ vercel.json no existe');
  allChecksPassed = false;
}

// 4. Verificar package.json
console.log('\n4️⃣ Verificando package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Verificar que no hay dependencias del servidor
const serverDeps = ['express', 'cors', 'dotenv'];
const hasServerDeps = serverDeps.some(dep => packageJson.dependencies[dep] || packageJson.devDependencies[dep]);

if (hasServerDeps) {
  console.log('   ❌ Aún hay dependencias del servidor:', serverDeps.filter(dep => packageJson.dependencies[dep] || packageJson.devDependencies[dep]));
  allChecksPassed = false;
} else {
  console.log('   ✅ No hay dependencias del servidor');
}

// Verificar que no hay script "server"
if (packageJson.scripts.server) {
  console.log('   ❌ Script "server" aún existe en package.json');
  allChecksPassed = false;
} else {
  console.log('   ✅ Script "server" eliminado');
}

// 5. Verificar archivos de configuración
console.log('\n5️⃣ Verificando archivos de configuración...');
const configFiles = [
  'VERCEL_ENV_SETUP.md',
  'docs/SUPABASE_CONFIG.md'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} existe`);
  } else {
    console.log(`   ❌ ${file} no existe`);
    allChecksPassed = false;
  }
});

// 6. Verificar estructura de directorios
console.log('\n6️⃣ Verificando estructura de directorios...');
const requiredDirs = ['src', 'api', 'build'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir}/ existe`);
  } else {
    console.log(`   ❌ ${dir}/ no existe`);
    allChecksPassed = false;
  }
});

// Resultado final
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('🎉 ¡APLICACIÓN LISTA PARA VERCEL!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Configurar variables de entorno en Vercel Dashboard');
  console.log('2. Hacer commit y push de los cambios');
  console.log('3. Desplegar en Vercel');
  console.log('4. Verificar que las API routes funcionen');
} else {
  console.log('❌ La aplicación NO está lista para Vercel');
  console.log('\n🔧 Corrige los problemas identificados arriba');
}
console.log('='.repeat(50));

process.exit(allChecksPassed ? 0 : 1);
