#!/usr/bin/env node

/**
 * Script automatizado para limpiar código no utilizado
 * Reduce el tamaño del proyecto eliminando archivos innecesarios
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Iniciando limpieza de código...\n');

// Archivos a eliminar de forma segura
const filesToDelete = [
  // Archivos backup
  'src/backoffice/components/CrearMapa/CrearMapaMain.jsx.backup',
  
  // Scripts de limpieza (ya no necesarios después de ejecutar)
  'cleanup_unused_code.js',
  'scripts/cleanup-crear-mapa-editor.js',
  'scripts/analyze-crear-mapa-editor.js',
  
  // Archivos .cleaned si existen
  'src/components/CrearMapa/CrearMapaEditor.jsx.cleaned',
];

let deletedCount = 0;
let notFoundCount = 0;

console.log('📁 Eliminando archivos innecesarios...\n');
filesToDelete.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`  ✅ Eliminado: ${file}`);
      deletedCount++;
    } catch (error) {
      console.log(`  ⚠️ Error eliminando ${file}: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️ No encontrado: ${file}`);
    notFoundCount++;
  }
});

// Limpiar imports comentados en archivos específicos
const filesToClean = [
  'src/backoffice/pages/CompBoleteria/ZonesAndPrices.js',
];

console.log('\n🧩 Limpiando imports comentados...\n');
let cleanedCount = 0;

filesToClean.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalLength = content.length;
      
      // Eliminar imports comentados
      const lines = content.split('\n');
      const cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        // Eliminar líneas que sean solo comentarios de imports
        if (trimmed.startsWith('// import') || 
            trimmed.startsWith('// importar') || 
            trimmed.startsWith('// Importar') ||
            (trimmed.startsWith('//') && trimmed.includes('import'))) {
          return false;
        }
        // Eliminar bloques de imports comentados
        if (trimmed === '//' && lines[lines.indexOf(line) + 1]?.trim().startsWith('// import')) {
          return false;
        }
        return true;
      });
      
      const cleanedContent = cleanedLines.join('\n');
      
      if (cleanedContent.length < originalLength) {
        fs.writeFileSync(fullPath, cleanedContent);
        const saved = originalLength - cleanedContent.length;
        console.log(`  ✅ Limpiado: ${file} (${saved} caracteres eliminados)`);
        cleanedCount++;
      } else {
        console.log(`  ℹ️  Sin cambios: ${file}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Error limpiando ${file}: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️ No encontrado: ${file}`);
  }
});

// Buscar y reportar console.logs excesivos
console.log('\n📊 Buscando console.logs excesivos...\n');
const filesWithManyLogs = [];
const srcDir = path.join(process.cwd(), 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const logMatches = content.match(/console\.(log|warn|error|debug)\(/g);
        if (logMatches && logMatches.length > 10) {
          filesWithManyLogs.push({
            file: filePath.replace(process.cwd(), ''),
            count: logMatches.length
          });
        }
      } catch (error) {
        // Ignorar errores de lectura
      }
    }
  });
  return fileList;
}

findFiles(srcDir);

if (filesWithManyLogs.length > 0) {
  console.log('  Archivos con más de 10 console.logs:');
  filesWithManyLogs
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .forEach(({ file, count }) => {
      console.log(`    ${file}: ${count} logs`);
    });
  console.log('\n  💡 Recomendación: Reemplazar console.logs con logger utility');
} else {
  console.log('  ✅ No se encontraron archivos con logs excesivos');
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE LIMPIEZA');
console.log('='.repeat(50));
console.log(`✅ Archivos eliminados: ${deletedCount}`);
console.log(`⚠️  Archivos no encontrados: ${notFoundCount}`);
console.log(`🧩 Archivos limpiados: ${cleanedCount}`);
console.log(`📝 Archivos con logs excesivos: ${filesWithManyLogs.length}`);
console.log('\n💡 Próximos pasos:');
console.log('  1. Revisar cambios en git');
console.log('  2. Ejecutar tests');
console.log('  3. Verificar que la aplicación funciona correctamente');
console.log('\n🎉 Limpieza completada!');

