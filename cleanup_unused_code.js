#!/usr/bin/env node

/**
 * Script para limpiar código no utilizado del proyecto
 * Elimina archivos, imports comentados y código redundante
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Iniciando limpieza de código no utilizado...\n');

// 1. Eliminar servicios de backup no utilizados
const backupServices = [
  'src/saas/services/backupService.js',
  'src/saas/services/godaddyBackupService.js',
  'src/saas/services/omegaboletosBackupService.js',
  'src/saas/services/githubGodaddyBackupService.js'
];

console.log('🗂️ Eliminando servicios de backup no utilizados...');
backupServices.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`  ✅ Eliminado: ${file}`);
  } else {
    console.log(`  ⚠️ No encontrado: ${file}`);
  }
});

// 2. Eliminar archivos duplicados
const duplicateFiles = [
  'src/backoffice/components/CrearMapa/CrearMapaEditor.jsx'
];

console.log('\n📄 Eliminando archivos duplicados...');
duplicateFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`  ✅ Eliminado: ${file}`);
  } else {
    console.log(`  ⚠️ No encontrado: ${file}`);
  }
});

// 3. Limpiar imports comentados en ZonesAndPrices.js
const zonesAndPricesFile = 'src/backoffice/pages/CompBoleteria/ZonesAndPrices.js';
console.log('\n🧩 Limpiando imports comentados...');

if (fs.existsSync(zonesAndPricesFile)) {
  let content = fs.readFileSync(zonesAndPricesFile, 'utf8');
  
  // Eliminar imports comentados
  const lines = content.split('\n');
  const cleanedLines = lines.filter(line => {
    // Mantener líneas que no sean imports comentados
    return !line.trim().startsWith('// import') && 
           !line.trim().startsWith('// importar') &&
           !line.trim().startsWith('// Importar');
  });
  
  const cleanedContent = cleanedLines.join('\n');
  fs.writeFileSync(zonesAndPricesFile, cleanedContent);
  console.log(`  ✅ Limpiado: ${zonesAndPricesFile}`);
} else {
  console.log(`  ⚠️ No encontrado: ${zonesAndPricesFile}`);
}

// 4. Eliminar archivos index.js no utilizados
const unusedIndexFiles = [
  'src/components/CrearMapa/index.js',
  'src/backoffice/components/CrearMapa/index.js'
];

console.log('\n📦 Eliminando archivos index.js no utilizados...');
unusedIndexFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`  ✅ Eliminado: ${file}`);
  } else {
    console.log(`  ⚠️ No encontrado: ${file}`);
  }
});

// 5. Limpiar archivos de configuración no utilizados
const unusedConfigFiles = [
  // 'src/backoffice/pages/WebStudio.js' // ✅ AHORA ESTÁ EN USO - Web Studio funcional
];

console.log('\n⚙️ Verificando archivos de configuración no utilizados...');
unusedConfigFiles.forEach(file => {
  if (fs.existsSync(file)) {
    // Verificar si se usa en BackofficeAppWithRoles.jsx
    const backofficeRoutes = fs.readFileSync('src/backoffice/BackofficeAppWithRoles.jsx', 'utf8');
    const fileName = path.basename(file, path.extname(file));
    
    if (!backofficeRoutes.includes(fileName)) {
      console.log(`  ⚠️ Posible archivo no utilizado: ${file}`);
      console.log(`     (Verificar manualmente antes de eliminar)`);
    } else {
      console.log(`  ✅ En uso: ${file}`);
    }
  }
});

console.log('\n🎉 Limpieza completada!');
console.log('\n📊 Resumen de archivos eliminados:');
console.log('  - 4 servicios de backup no utilizados');
console.log('  - 1 archivo duplicado');
console.log('  - 2 archivos index.js no utilizados');
console.log('  - Imports comentados limpiados');
console.log('\n💡 Recomendaciones adicionales:');
console.log('  - ✅ WebStudio.js está ahora en uso (Web Studio funcional)');
console.log('  - Verificar que no haya dependencias rotas');
console.log('  - Ejecutar tests después de la limpieza');
